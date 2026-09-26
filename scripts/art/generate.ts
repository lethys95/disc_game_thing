import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { generate, KREA2_TURBO } from "#scripts/art/comfy";
import { BATCHES, promptFor } from "#scripts/art/prompts";

/**
 * `pnpm art <batch> [seeds]`: every asset of a batch, once per seed, into art/candidates/<batch>/, with a manifest
 * (prompt, seed, model) so any keeper can be regenerated, and a contact sheet to judge the batch at a glance.
 */
const [name = "", seedArg = "2"] = process.argv.slice(2);
const batch = BATCHES[name];
if (!batch) throw new Error(`unknown batch "${name}"; known: ${Object.keys(BATCHES).join(", ")}`);
const seeds = Array.from({ length: Number(seedArg) }, (_, i) => 1000 + i);
const dir = `art/candidates/${name}`;
await mkdir(dir, { recursive: true });

const manifest: { file: string; id: string; seed: number; prompt: string; model: string }[] = [];
for (const asset of batch) {
  const { prompt, width, height } = promptFor(asset);
  for (const seed of seeds) {
    const file = `${asset.id}-${seed}.png`;
    const started = Date.now();
    await writeFile(`${dir}/${file}`, await generate({ prompt, seed, width, height }, `disc/${name}/${asset.id}`));
    console.log(`${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    manifest.push({ file, id: asset.id, seed, prompt, model: KREA2_TURBO.diffusionModel });
  }
}
await writeFile(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));

const cells = manifest.map((m) => `<figure><img src="${m.file}"><figcaption>${m.id} · ${m.seed}</figcaption></figure>`).join("");
const html = `<!doctype html><meta charset="utf-8"><title>${name}</title><style>
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
