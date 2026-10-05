import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { img2img, KREA2_TURBO } from "#scripts/art/comfy";
import { record } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * Portraits from picked concepts (questions #13), so the card on the field, the icon and the 3D model are the same
 * creature: image-to-image from the picked concept's front view, the figure on a card for the card and a head crop for
 * the bust; the icon is cut from the bust, zoomed in on the face, so it is the same painting (three framings: `Frame`
 * in `src/view/art-slots.ts`). Learned on the Punisher and the Bog Giant (2026-10-05, `docs/design/art.md`): a T-pose
 * needs 0.75+ to be re-posed; a body that already stands needs 0.3–0.4, or its details drift. ComfyUI's Krea-2
 * reference blueprint, tried without its style LoRA, gave a dotted halftone mess and was dropped.
 *
 *     pnpm exec tsx scripts/art/portraits.ts <unit…> [--sources]           test images (--sources: only their sources)
 *     pnpm exec tsx scripts/art/portraits.ts --install <unit> <card> <bust>  picked files (in its dir) into the game
 */

// The first batch's portraits the user liked were painted with chiaroscuro and a rim light on dark grey. "Ornate" in
// a painting turned the Bog Giant's bark into gold filigree; *plain* is the same line without it (the user: "try
// things out"), to compare.
type Style = "ornate" | "plain";
const PAINTED: Readonly<Record<Style, string>> = {
  ornate:
    "Dark gothic fantasy in the manner of Disciples II's art: rich, brooding and ornate, desaturated colors with dark accents, dramatic and grim materials, weathered and worn. Serious, adult, not cartoonish. " +
    "A painted fantasy illustration with chiaroscuro lighting, deep shadows and a hard rim light, on a plain flat dark grey background. No text.",
  plain:
    "Dark gothic fantasy in the manner of Disciples II's art: rich and brooding, desaturated colors with dark accents, dramatic and grim materials, weathered and worn. Serious, adult, not cartoonish. " +
    "A painted fantasy illustration with chiaroscuro lighting, deep shadows and a hard rim light, on a plain flat dark grey background. No text.",
};

const BACKGROUND = { r: 58, g: 58, b: 60 };
const CARD = { width: 832, height: 1216 };
const ICON = 1024;

/** Strengths that worked: a T-pose re-posed on the card; a body that already stands, kept. */
const T_POSED = { card: [0.75, 0.9], bust: [0.45, 0.6] } as const;
const STANDING = { card: [0.3, 0.4], bust: [0.3, 0.4] } as const;

interface Square {
  readonly size: number;
  readonly x: number;
  readonly y: number;
}

interface Unit {
  /** The picked concept's front view, split from its turnaround sheet. */
  readonly front: string;
  /** Who it is, in a sentence, for every prompt. */
  readonly identity: string;
  /** How it stands on its card, and what it holds. */
  readonly pose: string;
  readonly strengths: { readonly card: readonly number[]; readonly bust: readonly number[] };
  readonly styles?: readonly Style[];
  /** The bust's square within the front view, as fractions of its side, when the head isn't on top of the figure. */
  readonly bust?: Square;
  /** The icon's square within the bust, as fractions of the bust's side, centred on the face (set after the test). */
  readonly icon?: Square;
}

const UNITS: Readonly<Record<string, Unit>> = {
  punisher: {
    front: "shots/tripo/punisher-front.png",
    identity:
      "a hooded executioner of a militant faith: a tall pointed hood with only black inside it, no face; a long cassock and a hooded mantle of dark iron-grey cloth; dented iron bracers, a heavy chain belt",
    pose: "he stands upright, a heavy multi-headed flail resting over his shoulder",
    strengths: T_POSED,
    icon: { size: 0.46, x: 0.515, y: 0.56 },
  },
  zealot: {
    front: "shots/tripo/zealot-front.png",
    identity:
      "a religious zealot, a tall gaunt man: his whole head covered by a smooth white mask with two wide round black eye holes and a small burning red handprint on its forehead; spiked, tattered armor scorched black, singed white robes in rags stained blood red, chains with small hooks at his belt",
    pose: "he stands tense and leaning forward, a huge serrated two-handed greatsword of blackened steel held low",
    strengths: T_POSED,
  },
  psychopomp: {
    front: "shots/tripo/psychopomp-earless-front.png",
    identity:
      "an elven shamaness of a wild forest people: pale greenish skin, dark green and black tribal tattoos across her face and body, dark hair in cornrows, a hood of a wolf's head pelt with its upper teeth over her brow, pale ghostly teal eyes staring through everything, short fingerless ivory gloves, boots of matted grey wolf fur, knotted ivory rags, a ragged fur mantle, leather wraps and bronze bangles on her arms",
    pose: "she stands still and absent, her arms lowered, her hands open",
    strengths: T_POSED,
  },
  custodian: {
    front: "art/candidates/units/nexus/custodian/custodian-3d-1002.png",
    identity:
      "a hulking golem guardian, not a person: a massive body of cracked grey stone blocks bound with dark brass bands, a blank stone head, thick stone arms and legs, faint electric teal lightning crackling in the cracks, a scrap of old cloth at its waist",
    pose: "it stands guard, its heavy arms lowered",
    strengths: T_POSED,
  },
  bonecracker: {
    front: "shots/tripo/bonecracker-front.png",
    identity:
      "a gnoll, a hyena-headed brute: heavy and broad with short legs, enormous forequarters and a thick neck, coarse spotted fur and a bristling mane, a massive jaw with iron-capped teeth, a heavy collar of bone plates and bronze rings, scarred bare arms, one fist in a spiked bronze gauntlet",
    pose: "it stands hunched forward, its fists ready",
    strengths: T_POSED,
  },
  cackler: {
    front: "shots/tripo/cackler-front.png",
    identity:
      "a gnoll, a scrawny hunched hyena-headed creature with spotted fur and a bristling mane, its mouth stretched in a wide manic grin, a ragged cloak of tattered cloth strips like rotten jester's motley, bone rattles and small bronze bells hanging from it",
    pose: "it stands hunched, holding a crooked staff topped with a hyena skull",
    strengths: T_POSED,
  },
  matriarch: {
    front: "shots/tripo/matriarch-front.png",
    identity:
      "a gnoll matriarch, the largest of the pack: a tall, upright, broad-shouldered female hyena-headed warrior with a great dark mane and a scarred muzzle, a mantle of bronze plates and trophy bones over her shoulders, a cloak of a great beast's hide, a crest of teeth and bronze on her brow",
    pose: "she stands tall, holding a heavy bronze glaive",
    strengths: T_POSED,
  },
  sproutling: {
    front: "shots/tripo/sproutling-front.png",
    identity:
      "a small treant, nothing human about it: a squat, gnarled young stump of dark bark on uneven root legs, one arm a long crooked branch and the other a short thick knot of wood, a face of knotholes with a ragged split in the bark for a mouth, pale new shoots and a few leaves sprouting from one side of its head",
    pose: "it stands on its root legs",
    strengths: STANDING,
    styles: ["ornate", "plain"],
  },
  moldling: {
    front: "shots/tripo/moldling-front.png",
    identity:
      "a skinny, hunched body of wet black rotting wood bound together by white threads of mycelium, leaning to one side, one arm longer and thinner than the other, a head like a split rotten log with a dark hollow face, small grey mushroom caps on one side, white mold furring one leg",
    pose: "it stands hunched, leaning to one side",
    // Its concept stands in a T-pose, but it is a creature whose details drift: between the two.
    strengths: { card: [0.6, 0.75], bust: [0.3, 0.45] },
    styles: ["ornate", "plain"],
  },
  deadwood: {
    front: "shots/tripo/deadwood-front.png",
    identity:
      "an animated dead tree, nothing humanoid about it: a lightning-split, charred grey trunk, one side burned black and the other bleached and peeling, dead branches clawing up from its top on one side, two massive arms of thick dead stumps, short root legs, a faint smoky ghostly face in the split of the trunk with a faint moss green glow",
    pose: "it stands leaning forward on its stump arms",
    strengths: STANDING,
    // Its face is the split in the trunk, under the branches on one side.
    bust: { size: 0.45, x: 0.5, y: 0.32 },
    styles: ["ornate", "plain"],
  },
  // Round one (0.75/0.9 card, 0.45–0.75 bust) lost its pale face and grew gold filigree; round two: the bust holds at
  // 0.3–0.4, the card turned to carved filigree at 0.5 and "bone-white" made the face a skull; round three: carved
  // roots even at 0.3. Round four: the plain style.
  bog_giant: {
    front: "shots/tripo/bog-giant-front.png",
    identity:
      "a massive hunched hulk with no human shape: a lump of black bark and sodden bog oak oozing swamp sludge, peat and mud, reeds, cattails and patches of moss; a small, pale grey-white sunken face low in the bark and a pale, cracked chest; its right arm an enormous club of bark, roots and mud, its left arm small and withered",
    pose: "it stands hunched, its huge right arm dragging on the ground",
    strengths: { card: [0.3, 0.4], bust: [0.3, 0.4] },
    styles: ["plain"],
    // Its face sits low in the bark, below the reeds on its top.
    bust: { size: 0.42, x: 0.557, y: 0.33 },
  },
  mulch_gorger: {
    front: "shots/tripo/mulch-gorger-front.png",
    identity:
      "a lurching heap of black rotting bark, mulch, bracket fungi, pale mold, wet leaves and roots with a human skull half sunk into its top, tipped back, its jaw gaping at the sky, moss and fungus growing from the skull's mouth and eye sockets; three uneven limbs of twisted roots, one a long grasping root",
    pose: "it lurches forward",
    strengths: STANDING,
    styles: ["ornate", "plain"],
  },
};

const dirOf = (id: string) => `art/candidates/portraits/${id}`;

/** The view's figure on a dark ground: the light grey connected to the edges becomes BACKGROUND. */
async function figure(path: string): Promise<{ data: Buffer; width: number; height: number; box: { top: number; bottom: number; left: number; right: number } }> {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (i: number) => [data[i * 3] ?? 0, data[i * 3 + 1] ?? 0, data[i * 3 + 2] ?? 0] as const;
  const [r0, g0, b0] = at(0);
  const isGround = (i: number) => {
    const [r, g, b] = at(i);
    return Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) <= 48;
  };
  const ground = new Uint8Array(width * height);
  const stack: number[] = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length > 0) {
    const i = stack.pop() ?? 0;
    if (ground[i] || !isGround(i)) continue;
    ground[i] = 1;
    const x = i % width;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (i >= width) stack.push(i - width);
    if (i < width * (height - 1)) stack.push(i + width);
  }
  const box = { top: height, bottom: 0, left: width, right: 0 };
  for (let i = 0; i < width * height; i++) {
    if (ground[i]) {
      data[i * 3] = BACKGROUND.r;
      data[i * 3 + 1] = BACKGROUND.g;
      data[i * 3 + 2] = BACKGROUND.b;
      continue;
    }
    const x = i % width;
    const y = Math.floor(i / width);
    box.top = Math.min(box.top, y);
    box.bottom = Math.max(box.bottom, y);
    box.left = Math.min(box.left, x);
    box.right = Math.max(box.right, x);
  }
  return { data, width, height, box };
}

/** The head and shoulders, square: where the unit says, or centred on the top of the figure. */
async function bustSource(front: string, out: string, square: Square | undefined): Promise<void> {
  const { data, width, height, box } = await figure(front);
  if (square) {
    const side = Math.round(width * square.size);
    const left = Math.max(0, Math.min(width - side, Math.round(width * square.x - side / 2)));
    const top = Math.max(0, Math.min(height - side, Math.round(height * square.y - side / 2)));
    await sharp(data, { raw: { width, height, channels: 3 } }).extract({ left, top, width: side, height: side }).resize(ICON, ICON).png().toFile(out);
    return;
  }
  const side = Math.round((box.bottom - box.top) * 0.46);
  const band = Math.round((box.bottom - box.top) * 0.08);
  let sum = 0;
  let count = 0;
  for (let y = box.top; y < box.top + band; y++) {
    for (let x = box.left; x <= box.right; x++) {
      const i = y * width + x;
      if (data[i * 3] !== BACKGROUND.r || data[i * 3 + 1] !== BACKGROUND.g || data[i * 3 + 2] !== BACKGROUND.b) {
        sum += x;
        count += 1;
      }
    }
  }
  const centre = Math.round(sum / Math.max(1, count));
  const left = Math.max(0, Math.min(width - side, centre - Math.round(side / 2)));
  const top = Math.max(0, box.top - Math.round(side * 0.06));
  await sharp(data, { raw: { width, height, channels: 3 } })
    .extract({ left, top, width: side, height: Math.min(side, height - top) })
    .resize(ICON, ICON, { fit: "contain", background: BACKGROUND })
    .png()
    .toFile(out);
}

/** The whole figure, fitted to a card. */
async function cardSource(front: string, out: string): Promise<void> {
  const { data, width, height, box } = await figure(front);
  const figureImage = await sharp(data, { raw: { width, height, channels: 3 } })
    .extract({ left: box.left, top: box.top, width: box.right - box.left + 1, height: box.bottom - box.top + 1 })
    .resize(Math.round(CARD.width * 0.92), Math.round(CARD.height * 0.9), { fit: "inside" })
    .png()
    .toBuffer();
  await sharp({ create: { ...CARD, channels: 3, background: BACKGROUND } }).composite([{ input: figureImage, gravity: "center" }]).png().toFile(out);
}

/** Sizes in the game: the card as the old portraits, the bust and icon square. */
const INSTALLED = { card: 384, bust: 384, icon: 192 };

async function install(id: string, card: string, bust: string): Promise<void> {
  const unit = UNITS[id];
  if (!unit) throw new Error(`unknown unit "${id}"`);
  const icon = unit.icon;
  if (!icon) throw new Error(`${id} has no icon square yet: measure the face in the bust first`);
  const dir = dirOf(id);
  await sharp(`${dir}/${card}`).resize({ width: INSTALLED.card }).webp({ quality: 88 }).toFile(`assets/art/portrait/${id}.webp`);
  await mkdir("assets/art/bust", { recursive: true });
  await sharp(`${dir}/${bust}`).resize(INSTALLED.bust, INSTALLED.bust).webp({ quality: 88 }).toFile(`assets/art/bust/${id}.webp`);
  const { width } = await sharp(`${dir}/${bust}`).metadata();
  const side = Math.round((width ?? ICON) * icon.size);
  const left = Math.round((width ?? ICON) * icon.x - side / 2);
  const top = Math.round((width ?? ICON) * icon.y - side / 2);
  await mkdir("assets/art/icon", { recursive: true });
  await sharp(`${dir}/${bust}`).extract({ left, top, width: side, height: side }).resize(INSTALLED.icon, INSTALLED.icon).webp({ quality: 88 }).toFile(`assets/art/icon/${id}.webp`);
  console.log(`installed assets/art/{portrait,bust,icon}/${id}.webp`);
}

type Run = { readonly file: string; readonly make: () => Promise<Uint8Array>; readonly entry: Omit<Candidate, "file" | "model"> };

async function test(id: string, sourcesOnly: boolean): Promise<void> {
  const unit = UNITS[id];
  if (!unit) throw new Error(`unknown unit "${id}"; known: ${Object.keys(UNITS).join(", ")}`);
  const dir = dirOf(id);
  await mkdir(dir, { recursive: true });
  const bustSrc = `${dir}/${id}-bust-source.png`;
  const cardSrc = `${dir}/${id}-card-source.png`;
  await bustSource(unit.front, bustSrc, unit.bust);
  await cardSource(unit.front, cardSrc);
  if (sourcesOnly) return;
  const runs: Run[] = (unit.styles ?? ["ornate"]).flatMap((style): Run[] => {
    const suffix = style === "ornate" ? "" : `-${style}`;
    const bustPrompt = `A painted head-and-shoulders portrait of ${unit.identity}. ${PAINTED[style]}`;
    const cardPrompt = `A painted full-body character card of ${unit.identity}; ${unit.pose}. ${PAINTED[style]}`;
    return [
      ...unit.strengths.bust.map((denoise): Run => ({
        file: `${id}-bust${suffix}-d${Math.round(denoise * 100)}.png`,
        make: () => img2img({ prompt: bustPrompt, seed: 1000, source: bustSrc, denoise }, `disc/${id}-bust`),
        entry: { id: `${id}-bust${suffix}`, seed: 1000, prompt: bustPrompt, source: bustSrc, denoise },
      })),
      ...unit.strengths.card.map((denoise): Run => ({
        file: `${id}-card${suffix}-d${Math.round(denoise * 100)}.png`,
        make: () => img2img({ prompt: cardPrompt, seed: 1000, source: cardSrc, denoise }, `disc/${id}-card`),
        entry: { id: `${id}-card${suffix}`, seed: 1000, prompt: cardPrompt, source: cardSrc, denoise },
      })),
    ];
  });
  const made: Candidate[] = [];
  for (const run of runs) {
    const started = Date.now();
    await writeFile(`${dir}/${run.file}`, await run.make());
    console.log(`${dir}/${run.file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    made.push({ file: run.file, model: KREA2_TURBO.diffusionModel, ...run.entry });
    await record(dir, made);
  }
}

const args = process.argv.slice(2);
if (args[0] === "--install") {
  const [, id, card, bust] = args;
  if (!id || !card || !bust) throw new Error("--install needs the unit, the card and the bust file names");
  await install(id, card, bust);
} else {
  const sourcesOnly = args.includes("--sources");
  for (const id of args.filter((a) => !a.startsWith("--"))) await test(id, sourcesOnly);
}
