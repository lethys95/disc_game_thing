import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { generate, KREA2_TURBO } from "#scripts/art/comfy";
import type { Job } from "#scripts/art/comfy";

export interface Candidate {
  readonly file: string;
  readonly id: string;
  readonly seed: number;
  readonly prompt: string;
  readonly model: string;
  readonly negative?: string;
  readonly cfg?: number;
}

/**
 * Every job once per seed into `dir`, with a manifest (prompt, seed, model: enough to regenerate any image exactly)
 * and a contact sheet to judge the lot at a glance.
 */
export async function runBatch(dir: string, jobs: readonly (Omit<Job, "seed"> & { readonly id: string })[], seeds: readonly number[]): Promise<Candidate[]> {
  await mkdir(dir, { recursive: true });
  const manifest: Candidate[] = [];
  for (const job of jobs) {
    for (const seed of seeds) {
      const file = `${job.id}-${seed}.png`;
      const started = Date.now();
      await writeFile(`${dir}/${file}`, await generate({ ...job, seed }, `disc/${job.id}`));
      console.log(`${dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
      manifest.push({ file, id: job.id, seed, prompt: job.prompt, model: KREA2_TURBO.diffusionModel, ...(job.negative ? { negative: job.negative, cfg: job.cfg ?? KREA2_TURBO.cfg } : {}) });
    }
  }
  await writeFile(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
  const cells = manifest.map((m) => `<figure><img src="${m.file}"><figcaption>${m.id} · ${m.seed}</figcaption></figure>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><title>${dir}</title><style>
body{margin:0;padding:12px;background:#0b0a0c;color:#d9cfbd;font:12px sans-serif;display:grid;grid-template-columns:repeat(${Math.max(4, seeds.length * 2)},1fr);gap:8px}
figure{margin:0}img{width:100%;aspect-ratio:1;object-fit:contain;background:#000;display:block}figcaption{padding:2px 0}</style>${cells}`;
  await writeFile(`${dir}/index.html`, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`file://${process.cwd()}/${dir}/index.html`);
  await page.waitForLoadState("load");
  await page.screenshot({ path: `${dir}/contact-sheet.png`, fullPage: true });
  await browser.close();
  console.log(`${dir}/contact-sheet.png`);
  return manifest;
}
