/**
 * A minimal client for a local ComfyUI's HTTP API: queue a graph, wait for it, fetch the images. The graph mirrors
 * ComfyUI's own "Text to Image (Krea-2 Turbo)" blueprint (8 steps, cfg 1, euler/simple, zeroed negative). At cfg 1 the
 * sampler ignores the negative; a job with a negative prompt must also raise `cfg` for it to have any effect.
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

type Input = string | number | readonly [string, number];
type Graph = Record<string, { class_type: string; inputs: Record<string, Input> }>;

function krea2Graph(job: Job, prefix: string): Graph {
  return {
    unet: { class_type: "UNETLoader", inputs: { unet_name: KREA2_TURBO.diffusionModel, weight_dtype: "default" } },
    clip: { class_type: "CLIPLoader", inputs: { clip_name: KREA2_TURBO.textEncoder, type: "krea2", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: KREA2_TURBO.vae } },
    positive: { class_type: "CLIPTextEncode", inputs: { clip: ["clip", 0], text: job.prompt } },
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

interface HistoryEntry {
  readonly status?: { readonly completed?: boolean; readonly status_str?: string };
  readonly outputs?: Record<string, { readonly images?: readonly { filename: string; subfolder: string; type: string }[] }>;
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`ComfyUI ${response.status}: ${await response.text()}`);
  const body: T = await response.json();
  return body;
}

/** Runs one generation and returns the PNG bytes. */
export async function generate(job: Job, prefix: string): Promise<Uint8Array> {
  const queued = await json<{ prompt_id: string }>(
    await fetch(`${COMFY_URL}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: krea2Graph(job, prefix) }) }),
  );
  for (;;) {
    const history = await json<Record<string, HistoryEntry>>(await fetch(`${COMFY_URL}/history/${queued.prompt_id}`));
    const entry = history[queued.prompt_id];
    if (entry?.status?.status_str === "error") throw new Error(`generation failed: ${JSON.stringify(entry.status)}`);
    const image = entry?.status?.completed ? Object.values(entry.outputs ?? {}).flatMap((o) => o.images ?? [])[0] : undefined;
    if (image) {
      const query = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
      const response = await fetch(`${COMFY_URL}/view?${query}`);
      if (!response.ok) throw new Error(`ComfyUI ${response.status} fetching ${image.filename}`);
      return new Uint8Array(await response.arrayBuffer());
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
