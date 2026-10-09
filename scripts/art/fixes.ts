import { readFile, writeFile } from "node:fs/promises";
import { inpaint, KREA2_TURBO } from "#scripts/art/comfy";
import { record } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * Repairs to picked concepts by inpainting: the white of a mask is repainted, every other pixel stays the pick's. The
 * prompt is the pick's own (from the folder's manifest) with edits, so the repainted patch matches the rest.
 *
 *     pnpm exec tsx scripts/art/fixes.ts <fix id>
 */

interface Fix {
  readonly dir: string;
  /** The picked image, a file in `dir` with an entry in its manifest. */
  readonly source: string;
  /** White where the image is repainted; the same size as the source. */
  readonly mask: string;
  /** Text replaced in the pick's prompt: what the repainted area should now show. */
  readonly edits: readonly (readonly [string, string])[];
  readonly seed: number;
  readonly denoise: readonly number[];
}

const FIXES: Readonly<Record<string, Fix>> = {
  // The user (2026-10-05): the ears stick out of the hood in the front view but not in the side view.
  "psychopomp-short-1002-earless": {
    dir: "art/candidates/units/grove/psychopomp",
    source: "psychopomp-short-turnaround-1002.png",
    mask: "masks/psychopomp-short-1002-ears.png",
    edits: [
      ["long pointed ears, ", ""],
      ["her face looks out under its upper teeth.", "her face looks out under its upper teeth, the hood's grey fur close around the sides of her face."],
    ],
    seed: 1002,
    denoise: [0.7, 0.85, 1],
  },
  // The user (2026-10-09): "if we can add red colors to chosen-battered-turnaround-1002 and maybe add some assymetry,
  // then maybe it could work." The whole figure repainted lightly, so his shape stays.
  "chosen-battered-1002-red": {
    dir: "art/candidates/units/jilliath/melee",
    source: "chosen-battered-turnaround-1002.png",
    mask: "masks/chosen-battered-1002-all.png",
    edits: [
      ["battered, chipped and scorched, no sculpted muscles.", "battered, chipped and scorched, half of them enamelled blood red, his left shoulder and arm far heavier than his right, layered high, no sculpted muscles."],
      ["materials: blackened shell plates, chipped bone-white enamel, heat-scorched metal.", "materials: blackened shell plates, chipped bone-white and blood-red enamel, heat-scorched metal."],
    ],
    seed: 1002,
    denoise: [0.55, 0.7, 0.85],
  },
};

const id = process.argv[2] ?? "";
const fix = FIXES[id];
if (!fix) throw new Error(`unknown fix "${id}"; known: ${Object.keys(FIXES).join(", ")}`);
const manifest: Candidate[] = JSON.parse(await readFile(`${fix.dir}/manifest.json`, "utf8"));
const picked = manifest.find((entry) => entry.file === fix.source);
if (!picked) throw new Error(`${fix.source} has no entry in ${fix.dir}/manifest.json`);
const prompt = fix.edits.reduce((text, [from, to]) => {
  if (!text.includes(from)) throw new Error(`the prompt of ${fix.source} has no "${from}"`);
  return text.replace(from, to);
}, picked.prompt);
const made: Candidate[] = [];
for (const denoise of fix.denoise) {
  const file = `${id}-d${Math.round(denoise * 100)}.png`;
  const started = Date.now();
  await writeFile(`${fix.dir}/${file}`, await inpaint({ prompt, seed: fix.seed, source: `${fix.dir}/${fix.source}`, mask: `${fix.dir}/${fix.mask}`, denoise }, `disc/${id}`));
  console.log(`${fix.dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  made.push({ file, id, seed: fix.seed, prompt, model: KREA2_TURBO.diffusionModel, source: fix.source, mask: fix.mask, denoise });
  await record(fix.dir, made);
}
