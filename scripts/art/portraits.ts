import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { img2img, KREA2_TURBO } from "#scripts/art/comfy";
import { record } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * Portraits from picked concepts (questions #13; the user, 2026-10-05: "try out the workflow first and see if it works
 * to your liking"), so the card on the field, the icon and the 3D model are the same creature: image-to-image from the
 * picked concept's front view, a head crop for the icon and the figure on a card for the card. At 0.75 and above the
 * model re-poses the T-pose by itself (tested on the Punisher, 2026-10-05). ComfyUI's Krea-2 reference blueprint,
 * tried without its style LoRA, gave a dotted halftone mess and was dropped.
 *
 * Three framings per unit (`Frame` in `src/view/art-slots.ts`): the card and the bust are generated; the icon is cut
 * from the bust, zoomed in on the face, so it is the same painting.
 *
 *     pnpm exec tsx scripts/art/portraits.ts <unit> [--sources]          the test images (--sources: only their sources)
 *     pnpm exec tsx scripts/art/portraits.ts <unit> --install <card> <bust>   picked files (in the unit's dir) into the game
 */

// The first batch's portraits the user liked were painted with chiaroscuro and a rim light on dark grey.
const PAINTED =
  "Dark gothic fantasy in the manner of Disciples II's art: rich, brooding and ornate, desaturated colors with dark accents, dramatic and grim materials, weathered and worn. Serious, adult, not cartoonish. " +
  "A painted fantasy illustration with chiaroscuro lighting, deep shadows and a hard rim light, on a plain flat dark grey background. No text.";

const BACKGROUND = { r: 58, g: 58, b: 60 };
const CARD = { width: 832, height: 1216 };
const ICON = 1024;

interface Unit {
  readonly dir: string;
  /** The picked concept's front view, split from its turnaround sheet. */
  readonly front: string;
  /** Who it is, in a sentence, for every prompt. */
  readonly identity: string;
  /** How it stands on its card, and what it holds. */
  readonly pose: string;
  /** Strengths to try: the card's must be high enough to re-pose a T-pose; a body already standing needs less. */
  readonly strengths?: { readonly card: readonly number[]; readonly bust: readonly number[] };
  /** The bust's square within the front view, as fractions of its side, when the head isn't on top of the figure. */
  readonly bust?: { readonly size: number; readonly x: number; readonly y: number };
  /** The icon's square within the bust, as fractions of the bust's side: its size and centre (set after the test). */
  readonly icon?: { readonly size: number; readonly x: number; readonly y: number };
}

const UNITS: Readonly<Record<string, Unit>> = {
  punisher: {
    dir: "art/candidates/units/jilliath/punisher/portrait-test",
    front: "shots/tripo/punisher-front.png",
    identity:
      "a hooded executioner of a militant faith: a tall pointed hood with only black inside it, no face; a long cassock and a hooded mantle of dark iron-grey cloth; dented iron bracers, a heavy chain belt",
    pose: "he stands upright, a heavy multi-headed flail resting over his shoulder",
    icon: { size: 0.46, x: 0.515, y: 0.56 },
  },
  // Nothing human about it: does the card re-pose a body like this, and is there a face for the icon?
  bog_giant: {
    dir: "art/candidates/units/grove/portrait-test",
    front: "shots/tripo/bog-giant-front.png",
    identity:
      "a massive hunched hulk with no human shape: a lump of black bark and sodden bog oak oozing swamp sludge, peat and mud, reeds, cattails and patches of moss; a small, pale, bone-white sunken face low in the bark and a pale, cracked chest; its right arm an enormous club of bark, roots and mud, its left arm small and withered",
    pose: "it stands hunched, its huge right arm dragging on the ground",
    // Round one (0.75/0.9 card, 0.45–0.75 bust) lost its pale face and grew gold filigree: it already stands, so less.
    strengths: { card: [0.5, 0.6, 0.7], bust: [0.3, 0.4, 0.5] },
    // Its face sits low in the bark, below the reeds on its top.
    bust: { size: 0.42, x: 0.557, y: 0.33 },
  },
};

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
async function iconSource(front: string, out: string, square: Unit["bust"]): Promise<void> {
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

const unitId = process.argv[2] ?? "";
const unit = UNITS[unitId];
if (!unit) throw new Error(`unknown unit "${unitId}"; known: ${Object.keys(UNITS).join(", ")}`);

/** Sizes in the game: the card as the old portraits, the bust and icon square. */
const INSTALLED = { card: 384, bust: 384, icon: 192 };

async function install(unit: Unit, card: string, bust: string): Promise<void> {
  const icon = unit.icon;
  if (!icon) throw new Error(`${unitId} has no icon square yet: measure the face in the bust first`);
  await sharp(`${unit.dir}/${card}`).resize({ width: INSTALLED.card }).webp({ quality: 88 }).toFile(`assets/art/portrait/${unitId}.webp`);
  await mkdir("assets/art/bust", { recursive: true });
  await sharp(`${unit.dir}/${bust}`).resize(INSTALLED.bust, INSTALLED.bust).webp({ quality: 88 }).toFile(`assets/art/bust/${unitId}.webp`);
  const { width } = await sharp(`${unit.dir}/${bust}`).metadata();
  const side = Math.round((width ?? ICON) * icon.size);
  const left = Math.round((width ?? ICON) * icon.x - side / 2);
  const top = Math.round((width ?? ICON) * icon.y - side / 2);
  await mkdir("assets/art/icon", { recursive: true });
  await sharp(`${unit.dir}/${bust}`).extract({ left, top, width: side, height: side }).resize(INSTALLED.icon, INSTALLED.icon).webp({ quality: 88 }).toFile(`assets/art/icon/${unitId}.webp`);
}

const installAt = process.argv.indexOf("--install");
if (installAt >= 0) {
  const [card, bust] = process.argv.slice(installAt + 1);
  if (!card || !bust) throw new Error("--install needs the card and the bust file names");
  await install(unit, card, bust);
  console.log(`installed assets/art/{portrait,bust,icon}/${unitId}.webp`);
  process.exit(0);
}
await mkdir(unit.dir, { recursive: true });
const iconSrc = `${unit.dir}/${unitId}-icon-source.png`;
const cardSrc = `${unit.dir}/${unitId}-card-source.png`;
await iconSource(unit.front, iconSrc, unit.bust);
await cardSource(unit.front, cardSrc);
if (process.argv.includes("--sources")) process.exit(0);

const iconPrompt = `A painted head-and-shoulders portrait of ${unit.identity}. ${PAINTED}`;
const cardPrompt = `A painted full-body character card of ${unit.identity}; ${unit.pose}. ${PAINTED}`;

type Run = { readonly file: string; readonly make: () => Promise<Uint8Array>; readonly entry: Omit<Candidate, "file" | "model"> };
const runs: Run[] = [
  ...(unit.strengths?.bust ?? [0.45, 0.6, 0.75]).map((denoise): Run => ({
    file: `${unitId}-icon-img2img-d${Math.round(denoise * 100)}.png`,
    make: () => img2img({ prompt: iconPrompt, seed: 1000, source: iconSrc, denoise }, `disc/${unitId}-icon`),
    entry: { id: `${unitId}-icon-img2img`, seed: 1000, prompt: iconPrompt, source: iconSrc, denoise },
  })),
  ...(unit.strengths?.card ?? [0.75, 0.9]).map((denoise): Run => ({
    file: `${unitId}-card-img2img-d${Math.round(denoise * 100)}.png`,
    make: () => img2img({ prompt: cardPrompt, seed: 1000, source: cardSrc, denoise }, `disc/${unitId}-card`),
    entry: { id: `${unitId}-card-img2img`, seed: 1000, prompt: cardPrompt, source: cardSrc, denoise },
  })),
];
const made: Candidate[] = [];
for (const run of runs) {
  const started = Date.now();
  await writeFile(`${unit.dir}/${run.file}`, await run.make());
  console.log(`${unit.dir}/${run.file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  made.push({ file: run.file, model: KREA2_TURBO.diffusionModel, ...run.entry });
  await record(unit.dir, made);
}
