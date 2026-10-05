import { readFile } from "node:fs/promises";
import { basename } from "node:path";

/**
 * A minimal client for a local ComfyUI's HTTP API: queue a graph, wait for it, fetch the image or audio it saved. The
 * image graph mirrors ComfyUI's own "Text to Image (Krea-2 Turbo)" blueprint (8 steps, cfg 1, euler/simple, zeroed
 * negative). At cfg 1 the sampler ignores the negative; a job with a negative prompt must also raise `cfg` for it to
 * have any effect.
 */

export const COMFY_URL = process.env["COMFY_URL"] ?? "http://127.0.0.1:8188";

export const KREA2_TURBO = {
  diffusionModel: "krea2_turbo_fp8_scaled.safetensors",
  textEncoder: "qwen3vl_4b_fp8_scaled.safetensors",
  vae: "qwen_image_vae.safetensors",
  steps: 8,
  cfg: 1,
} as const;

export interface Job {
  readonly prompt: string;
  readonly seed: number;
  readonly width: number;
  readonly height: number;
  readonly negative?: string;
  readonly cfg?: number;
}

/** Repaints the white of `mask` in `source` (both PNG paths, the same size); every other pixel is kept exactly. */
export interface InpaintJob {
  readonly prompt: string;
  readonly seed: number;
  readonly source: string;
  readonly mask: string;
  /** How much of the masked area is redrawn: 1 paints it fresh, lower keeps more of what was there. */
  readonly denoise: number;
}

/** Repaints all of `source` (a PNG path, already at the output size) toward the prompt; lower denoise keeps more. */
export interface Img2ImgJob {
  readonly prompt: string;
  readonly seed: number;
  readonly source: string;
  readonly denoise: number;
}

type Input = string | number | boolean | readonly [string, number];
type Graph = Record<string, { class_type: string; inputs: Record<string, Input> }>;

const loaders = (prompt: string): Graph => ({
  unet: { class_type: "UNETLoader", inputs: { unet_name: KREA2_TURBO.diffusionModel, weight_dtype: "default" } },
  clip: { class_type: "CLIPLoader", inputs: { clip_name: KREA2_TURBO.textEncoder, type: "krea2", device: "default" } },
  vae: { class_type: "VAELoader", inputs: { vae_name: KREA2_TURBO.vae } },
  positive: { class_type: "CLIPTextEncode", inputs: { clip: ["clip", 0], text: prompt } },
});

function krea2Graph(job: Job, prefix: string): Graph {
  return {
    ...loaders(job.prompt),
    negative: job.negative
      ? { class_type: "CLIPTextEncode", inputs: { clip: ["clip", 0], text: job.negative } }
      : { class_type: "ConditioningZeroOut", inputs: { conditioning: ["positive", 0] } },
    latent: { class_type: "EmptyLatentImage", inputs: { width: job.width, height: job.height, batch_size: 1 } },
    sample: {
      class_type: "KSampler",
      inputs: {
        model: ["unet", 0], positive: ["positive", 0], negative: ["negative", 0], latent_image: ["latent", 0],
        seed: job.seed, steps: KREA2_TURBO.steps, cfg: job.cfg ?? KREA2_TURBO.cfg, sampler_name: "euler", scheduler: "simple", denoise: 1,
      },
    },
    decode: { class_type: "VAEDecode", inputs: { samples: ["sample", 0], vae: ["vae", 0] } },
    save: { class_type: "SaveImage", inputs: { images: ["decode", 0], filename_prefix: prefix } },
  };
}

/**
 * Krea-2 Turbo has no inpainting model, so this is a masked image-to-image: the source is encoded, noise goes only
 * into the mask (`SetLatentNoiseMask`), and the decoded result is pasted back through the mask, since a VAE round trip
 * would otherwise shift every pixel of the image slightly.
 */
function inpaintGraph(job: InpaintJob, source: string, mask: string, prefix: string): Graph {
  return {
    ...loaders(job.prompt),
    negative: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["positive", 0] } },
    image: { class_type: "LoadImage", inputs: { image: source } },
    mask: { class_type: "LoadImageMask", inputs: { image: mask, channel: "red" } },
    encode: { class_type: "VAEEncode", inputs: { pixels: ["image", 0], vae: ["vae", 0] } },
    latent: { class_type: "SetLatentNoiseMask", inputs: { samples: ["encode", 0], mask: ["mask", 0] } },
    sample: {
      class_type: "KSampler",
      inputs: {
        model: ["unet", 0], positive: ["positive", 0], negative: ["negative", 0], latent_image: ["latent", 0],
        seed: job.seed, steps: KREA2_TURBO.steps, cfg: KREA2_TURBO.cfg, sampler_name: "euler", scheduler: "simple", denoise: job.denoise,
      },
    },
    decode: { class_type: "VAEDecode", inputs: { samples: ["sample", 0], vae: ["vae", 0] } },
    composite: {
      class_type: "ImageCompositeMasked",
      inputs: { destination: ["image", 0], source: ["decode", 0], x: 0, y: 0, resize_source: false, mask: ["mask", 0] },
    },
    save: { class_type: "SaveImage", inputs: { images: ["composite", 0], filename_prefix: prefix } },
  };
}

function img2imgGraph(job: Img2ImgJob, source: string, prefix: string): Graph {
  return {
    ...loaders(job.prompt),
    negative: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["positive", 0] } },
    image: { class_type: "LoadImage", inputs: { image: source } },
    encode: { class_type: "VAEEncode", inputs: { pixels: ["image", 0], vae: ["vae", 0] } },
    sample: {
      class_type: "KSampler",
      inputs: {
        model: ["unet", 0], positive: ["positive", 0], negative: ["negative", 0], latent_image: ["encode", 0],
        seed: job.seed, steps: KREA2_TURBO.steps, cfg: KREA2_TURBO.cfg, sampler_name: "euler", scheduler: "simple", denoise: job.denoise,
      },
    },
    decode: { class_type: "VAEDecode", inputs: { samples: ["sample", 0], vae: ["vae", 0] } },
    save: { class_type: "SaveImage", inputs: { images: ["decode", 0], filename_prefix: prefix } },
  };
}

interface OutputFile {
  readonly filename: string;
  readonly subfolder: string;
  readonly type: string;
}

interface HistoryEntry {
  readonly status?: { readonly completed?: boolean; readonly status_str?: string };
  readonly outputs?: Record<string, { readonly images?: readonly OutputFile[]; readonly audio?: readonly OutputFile[] }>;
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`ComfyUI ${response.status}: ${await response.text()}`);
  const body: T = await response.json();
  return body;
}

/** Puts a local file into ComfyUI's input folder and returns the name its graphs load it by. */
async function upload(path: string): Promise<string> {
  const form = new FormData();
  form.append("image", new Blob([await readFile(path)], { type: "image/png" }), basename(path));
  form.append("overwrite", "true");
  const uploaded = await json<{ name: string }>(await fetch(`${COMFY_URL}/upload/image`, { method: "POST", body: form }));
  return uploaded.name;
}

/**
 * MiniMax Music 3 (ComfyUI's "Text to Music (MiniMax Music 3)" blueprint; the user, 2026-10-05: it replaces ACE-Step
 * as the local music model). A caption for style and instruments, lyrics with section tags; the model may end before
 * `seconds`. 32 kHz stereo, returned as FLAC.
 */
export interface MusicJob {
  readonly caption: string;
  readonly lyrics: string;
  readonly seed: number;
  readonly seconds: number;
}

export const MUSIC3 = {
  diffusionModel: "minimax_music3_dit_fp16.safetensors",
  textEncoder: "minimax_music3_text_encoder_pruned_int8_convrot.safetensors",
  vae: "minimax_music3_dav.safetensors",
  steps: 30,
  cfg: 1.7,
  topK: 50,
} as const;

function music3Graph(job: MusicJob, prefix: string): Graph {
  return {
    unet: { class_type: "UNETLoader", inputs: { unet_name: MUSIC3.diffusionModel, weight_dtype: "default" } },
    clip: { class_type: "CLIPLoader", inputs: { clip_name: MUSIC3.textEncoder, type: "minimax", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: MUSIC3.vae } },
    encode: {
      class_type: "MiniMaxMusic3TextEncode",
      inputs: { clip: ["clip", 0], caption: job.caption, lyrics: job.lyrics, seed: job.seed, max_duration: job.seconds, cfg_scale: MUSIC3.cfg, top_k: MUSIC3.topK },
    },
    negative: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["encode", 0] } },
    latent: { class_type: "EmptyMiniMaxMusic3LatentAudio", inputs: { seconds: ["encode", 1], batch_size: 1 } },
    sample: {
      class_type: "KSampler",
      inputs: {
        model: ["unet", 0], positive: ["encode", 0], negative: ["negative", 0], latent_image: ["latent", 0],
        seed: job.seed, steps: MUSIC3.steps, cfg: MUSIC3.cfg, sampler_name: "euler", scheduler: "simple", denoise: 1,
      },
    },
    // The tiled decoder keeps a long song's decode within one card's memory.
    decode: { class_type: "VAEDecodeAudioTiled", inputs: { samples: ["sample", 0], vae: ["vae", 0], tile_size: 1536, overlap: 64 } },
    save: { class_type: "SaveAudio", inputs: { audio: ["decode", 0], filename_prefix: prefix } },
  };
}

/** Runs one song and returns the FLAC bytes. */
export async function music3(job: MusicJob, prefix: string): Promise<Uint8Array> {
  return run(music3Graph(job, prefix));
}

/** Runs one generation and returns the PNG bytes. */
export async function generate(job: Job, prefix: string): Promise<Uint8Array> {
  return run(krea2Graph(job, prefix));
}

/** Runs one inpainting and returns the PNG bytes. */
export async function inpaint(job: InpaintJob, prefix: string): Promise<Uint8Array> {
  return run(inpaintGraph(job, await upload(job.source), await upload(job.mask), prefix));
}

/** Runs one image-to-image and returns the PNG bytes. */
export async function img2img(job: Img2ImgJob, prefix: string): Promise<Uint8Array> {
  return run(img2imgGraph(job, await upload(job.source), prefix));
}

async function run(graph: Graph): Promise<Uint8Array> {
  const queued = await json<{ prompt_id: string }>(
    await fetch(`${COMFY_URL}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: graph }) }),
  );
  for (;;) {
    const history = await json<Record<string, HistoryEntry>>(await fetch(`${COMFY_URL}/history/${queued.prompt_id}`));
    const entry = history[queued.prompt_id];
    if (entry?.status?.status_str === "error") throw new Error(`generation failed: ${JSON.stringify(entry.status)}`);
    const file = entry?.status?.completed ? Object.values(entry.outputs ?? {}).flatMap((o) => [...(o.images ?? []), ...(o.audio ?? [])])[0] : undefined;
    if (file) {
      const query = new URLSearchParams({ filename: file.filename, subfolder: file.subfolder, type: file.type });
      const response = await fetch(`${COMFY_URL}/view?${query}`);
      if (!response.ok) throw new Error(`ComfyUI ${response.status} fetching ${file.filename}`);
      return new Uint8Array(await response.arrayBuffer());
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
