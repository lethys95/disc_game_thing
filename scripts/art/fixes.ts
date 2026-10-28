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
  /** The picked image, a file in `dir` with an entry in its manifest: the prompt comes from it. */
  readonly pick: string;
  /** The image repainted, when it isn't the pick itself (a sheet rearranged from it). */
  readonly source?: string;
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
    pick: "psychopomp-short-turnaround-1002.png",
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
    pick: "chosen-battered-turnaround-1002.png",
    mask: "masks/chosen-battered-1002-all.png",
    edits: [
      ["battered, chipped and scorched, no sculpted muscles.", "battered, chipped and scorched, half of them enamelled blood red, his left shoulder and arm far heavier than his right, layered high, no sculpted muscles."],
      ["materials: blackened shell plates, chipped bone-white enamel, heat-scorched metal.", "materials: blackened shell plates, chipped bone-white and blood-red enamel, heat-scorched metal."],
    ],
    seed: 1002,
    denoise: [0.55, 0.7, 0.85],
  },
  // The user (2026-10-14): Tripo can't make out her face, maybe for want of an angle. The hair hides it from the front
  // and in the only side view, so the back view's slot holds that side view mirrored, its head and pauldron repainted:
  // her left side, the face clear in profile, no emblem on that shoulder.
  "paragon-runes-1001-left": {
    dir: "art/candidates/units/jilliath/angels",
    pick: "paragon-runes-turnaround-1001.png",
    source: "paragon-runes-1001-left-source.png",
    mask: "masks/paragon-runes-1001-left.png",
    edits: [
      ["in a front view, a side view from the left, and a back view,", "in a front view, a side view from her right, and a side view from her left,"],
      ["Blazing red hair falls over the right side of her face, hiding it.", "Blazing red hair falls over the right side of her face, hiding it; seen from her left, her face is clear in profile, her pale left cheek, eye and ear uncovered, the hair falling behind them."],
      ["palm forward.", "palm forward; her left pauldron is plain blackened iron with tarnished gold trim."],
    ],
    seed: 1001,
    denoise: [0.75, 0.9, 1],
  },
  // Round one kept the hair over the face and the emblem: the prompt still said both. Here neither is said.
  "paragon-runes-1001-left-2": {
    dir: "art/candidates/units/jilliath/angels",
    pick: "paragon-runes-turnaround-1001.png",
    source: "paragon-runes-1001-left-source.png",
    mask: "masks/paragon-runes-1001-left.png",
    edits: [
      ["in a front view, a side view from the left, and a back view,", "in a front view, a side view from her right, and a side view from her left,"],
      ["An angel woman with a calm face. Blazing red hair falls over the right side of her face, hiding it.", "An angel woman, her calm face clear in profile: pale cheek, eye, nose and lips, her blazing red hair swept back behind her ear and down her back."],
      ["On her right pauldron an emblem of a burning open hand, palm forward.", "Plain pauldrons of blackened iron with tarnished gold trim."],
    ],
    seed: 1001,
    denoise: [0.8, 0.9, 1],
  },
  // The user (2026-10-28), picking it: "Remove charges from back."
  "maelstrom-robe-1000-uncharged": {
    dir: "art/candidates/units/nexus/looks",
    pick: "maelstrom-robe-turnaround-1000.png",
    mask: "masks/maelstrom-robe-1000-uncharged.png",
    edits: [
      ["Two tall glass charge canisters capped in gold, teal lightning inside, rise from his back between the shoulders in a ridge of gold. ", ""],
      [", clear glass holding teal lightning.", "."],
    ],
    seed: 1000,
    denoise: [0.7, 0.85, 1],
  },
};

const id = process.argv[2] ?? "";
const fix = FIXES[id];
if (!fix) throw new Error(`unknown fix "${id}"; known: ${Object.keys(FIXES).join(", ")}`);
const manifest: Candidate[] = JSON.parse(await readFile(`${fix.dir}/manifest.json`, "utf8"));
const picked = manifest.find((entry) => entry.file === fix.pick);
if (!picked) throw new Error(`${fix.pick} has no entry in ${fix.dir}/manifest.json`);
const source = fix.source ?? fix.pick;
const prompt = fix.edits.reduce((text, [from, to]) => {
  if (!text.includes(from)) throw new Error(`the prompt of ${fix.pick} has no "${from}"`);
  return text.replace(from, to);
}, picked.prompt);
const made: Candidate[] = [];
for (const denoise of fix.denoise) {
  const file = `${id}-d${Math.round(denoise * 100)}.png`;
  const started = Date.now();
  await writeFile(`${fix.dir}/${file}`, await inpaint({ prompt, seed: fix.seed, source: `${fix.dir}/${source}`, mask: `${fix.dir}/${fix.mask}`, denoise }, `disc/${id}`));
  console.log(`${fix.dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  made.push({ file, id, seed: fix.seed, prompt, model: KREA2_TURBO.diffusionModel, source, mask: fix.mask, denoise });
  await record(fix.dir, made);
}
