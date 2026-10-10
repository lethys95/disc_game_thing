import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { inpaint } from "#scripts/art/comfy";

/**
 * Repairs part of a painted HUD piece (the `hud-paint-in` skill, after judging): a masked image to image over the
 * named boxes; everything outside the mask is kept exactly. Boxes are in the layout's page px.
 *
 *     pnpm tsx scripts/art/hud-inpaint.ts <repair> [seed…]     (candidates into art/candidates/ui/inpaint/<repair>/)
 */

interface Repair {
  readonly source: string;
  readonly page: readonly [number, number];
  readonly boxes: readonly (readonly [number, number, number, number])[];
  readonly denoise: readonly number[];
  readonly prompt: string;
}

const REPAIRS: Readonly<Record<string, Repair>> = {
  /** The duel bar's figures: arms and hands came out malformed (the user, 2026-10-10). */
  "duel-hands": {
    source: "art/candidates/ui/paint-in/battle-bar-duel-dull-nostone/battle-bar-duel-dull-nostone-3.png",
    page: [1536, 200],
    boxes: [[0, 0, 200, 200], [1336, 0, 200, 200]],
    denoise: [0.55, 0.7],
    prompt:
      "Game interface art, a dark iron bar in soft even light. At the left end, carved in deep relief in old worn blackened iron, a grown veiled woman in long robes with a folded feathered wing, kneeling on a ledge, both hands laid flat and gently on a large sphere of deep red glass, her arms and hands well formed, each hand with five fingers. " +
      "At the right end, mirroring her, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, kneeling, both hands laid flat on another sphere of deep red glass, arms and hands well formed. No text, no letters.",
  },
};

const [name, ...rest] = process.argv.slice(2);
const repair = name === undefined ? undefined : REPAIRS[name];
if (name === undefined || repair === undefined) throw new Error(`name a repair: ${Object.keys(REPAIRS).join(", ")}`);
const seeds = rest.length > 0 ? rest.map(Number) : [1, 2, 3];
const out = `art/candidates/ui/inpaint/${name}`;
await mkdir(out, { recursive: true });
const { width = 0, height = 0 } = await sharp(repair.source).metadata();
const sx = width / repair.page[0];
const sy = height / repair.page[1];
const rects = repair.boxes.map(([x, y, w, h]) => `<rect x="${x * sx}" y="${y * sy}" width="${w * sx}" height="${h * sy}" fill="#fff"/>`).join("");
const mask = `${out}/mask.png`;
// A soft edge, so the repainted part blends into what is kept.
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/>${rects}</svg>`)).blur(6).png().toFile(mask);
for (const denoise of repair.denoise) {
  for (const seed of seeds) {
    const started = Date.now();
    const png = await inpaint({ prompt: repair.prompt, seed, source: repair.source, mask, denoise }, `disc/inpaint-${name}`);
    const file = `${out}/${name}-d${Math.round(denoise * 100)}-${seed}.png`;
    await writeFile(file, png);
    console.log(`${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  }
}
