import { execFileSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";
import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";
import { inpaint, KREA2_TURBO } from "#scripts/art/comfy";
import { record } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * Step 3 of the HUD kit (`docs/design/hud-kit.md`): a screen's greybox painted as one picture, so every piece cut
 * from it shares one stone, one light and one level of detail.
 * - `render` shoots the greybox in layers: its stone and iron alone (the source), their mask, the live content
 *   (text, portraits, icons, states) and the field behind.
 * - `paint` repaints the stone and iron through the mask, nothing else, once per probe, strength and seed.
 * - `composite` lays each painting back into the screen between the field and the content, for judging.
 *
 *     pnpm tsx scripts/art/hud-paint.ts render battle
 *     pnpm tsx scripts/art/hud-paint.ts paint battle [probe…] [seed…]
 *     pnpm tsx scripts/art/hud-paint.ts composite battle
 */

const WIDTH = 1536;
const HEIGHT = 864;
/** What fills everything outside the mask in the source; the model sees it as the empty middle. */
const GROUND = "#151413";
/** Masked image-to-image strengths: how far the painting may move from the greybox's flat shapes. */
const STRENGTHS = [0.65, 0.85] as const;

interface Screen {
  readonly route: string;
  /** What is in the picture, piece by piece, with Jilliath's skin (provisional #76). */
  readonly subject: string;
}

const SCREENS: Readonly<Record<string, Screen>> = {
  battle: {
    route: "/?fight&steps=2",
    subject:
      "The interface frame of a dark fantasy strategy game, seen straight on, painted as one carved structure around an empty middle: " +
      "a band of carved black stone along the top edge with a round iron medallion hanging from it and a row of small arched niches; " +
      "a heavy stone sill along the bottom edge with a row of square recessed iron sockets, its top edge lined with small gothic tracery pinnacles; " +
      "on the left a tall stone tablet crowned by a hooded stone angel, humble, head bowed, whose folded wings arch around an empty arched window, her stone hands holding a pale marble name plate; " +
      "on the right a shorter stone tablet; two small marble plaques hanging on iron chains at the top right; " +
      "thin bands of red stained glass along the seams between the pieces. " +
      "Lit by one soft light from the upper left. The middle is plain dark. No text, no letters, no numbers.",
  },
};

/** Material framings to compare. The first is the user's own gothic line (`props.ts`); the others are Claude's. */
const PROBES: readonly { readonly id: string; readonly look: string }[] = [
  {
    id: "gothic",
    look: "Dark gothic fantasy in the manner of Disciples II's art: rich, brooding and ornate, desaturated colors with dark accents, dramatic and grim materials. Serious, adult, not cartoonish.",
  },
  {
    id: "cathedral",
    look: "Soot-darkened cathedral stonework and black wrought iron, carved like the inside of a gothic church. Desaturated, grim and solemn.",
  },
  {
    id: "reliquary",
    look: "Black wrought iron and dark stone like an old reliquary, worn smooth, with tarnished silver edges and deep shadows. Desaturated, grim and solemn.",
  },
];

/** The greybox's layers, as page styles: each hides what its layer isn't. */
const HIDE_FIELD = "#stage{visibility:hidden!important} html,body{background:transparent!important} #battlehud::before{display:none!important}";
const LAYERS = {
  chrome:
    `${HIDE_FIELD} #battlehud *{color:transparent!important;text-shadow:none!important} ` +
    "#battlehud .art,#battlehud .fill,#battlehud .channel .shield,#battlehud .band,#battlehud .bead,#battlehud .cell,#battlehud .shield-seal,#card .abilities>*,#log>*{visibility:hidden!important}",
  content:
    `${HIDE_FIELD} #battlehud *:not(.art):not(.fill):not(.shield):not(.band):not(.bead):not(.cell):not(.shield-seal),#battlehud *::before,#battlehud *::after` +
    "{background:transparent!important;border-color:transparent!important;box-shadow:none!important}",
  field: "#battlehud>*{visibility:hidden!important}",
} as const;

const magick = (...args: string[]) => execFileSync("magick", args, { stdio: "inherit" });

async function render(name: string, screen: Screen, dir: string): Promise<void> {
  const server = await createServer({ logLevel: "error", server: { port: 0 } });
  await server.listen();
  const address = server.resolvedUrls?.local[0];
  if (!address) throw new Error("vite did not report a local URL");
  const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.goto(new URL(screen.route, address).href);
  await page.waitForSelector("body[data-ready=true]", { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/greybox.png` });
  for (const [layer, css] of Object.entries(LAYERS)) {
    const style = await page.addStyleTag({ content: css });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${dir}/${layer}-layer.png`, omitBackground: layer !== "field" });
    await style.evaluate((node) => node.parentNode?.removeChild(node));
  }
  await browser.close();
  await server.close();
  // The source: the stone and iron on a plain dark ground. The mask: wherever they are, a little wider.
  magick(`${dir}/chrome-layer.png`, "-background", GROUND, "-flatten", `${dir}/chrome.png`);
  magick(`${dir}/chrome-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:2", `${dir}/mask.png`);
  console.log(`${name}: layers in ${dir}`);
}

async function paint(name: string, screen: Screen, dir: string, probeIds: readonly string[], seeds: readonly number[]): Promise<void> {
  const probes = probeIds.length > 0 ? PROBES.filter((p) => probeIds.includes(p.id)) : PROBES;
  const manifest: Candidate[] = [];
  for (const probe of probes) {
    for (const denoise of STRENGTHS) {
      for (const seed of seeds) {
        const id = `${probe.id}-${Math.round(denoise * 100)}`;
        const file = `${id}-${seed}.png`;
        const prompt = `${screen.subject} ${probe.look}`;
        const started = Date.now();
        await writeFile(`${dir}/${file}`, await inpaint({ prompt, seed, source: `${dir}/chrome.png`, mask: `${dir}/mask.png`, denoise }, `disc/hud-${name}`));
        console.log(`${dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
        manifest.push({ file, id, seed, prompt, model: KREA2_TURBO.diffusionModel, source: "chrome.png", mask: "mask.png", denoise });
        await record(dir, manifest);
      }
    }
  }
}

async function composite(name: string, dir: string): Promise<void> {
  await mkdir(`${dir}/preview`, { recursive: true });
  const layers = new Set(["greybox.png", "chrome.png", "mask.png", "chrome-layer.png", "content-layer.png", "field-layer.png"]);
  const paintings = (await readdir(dir)).filter((f) => f.endsWith(".png") && !layers.has(f) && f !== "contact-sheet.png");
  for (const file of paintings) {
    magick(
      `${dir}/field-layer.png`,
      "(", `${dir}/${file}`, `${dir}/mask.png`, "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")",
      "-compose", "Over", "-composite",
      `${dir}/content-layer.png`, "-compose", "Over", "-composite",
      `${dir}/preview/${file}`,
    );
  }
  console.log(`${name}: ${paintings.length} previews in ${dir}/preview`);
}

const [mode, name = "battle", ...rest] = process.argv.slice(2);
const screen = SCREENS[name];
if (!screen) throw new Error(`no screen "${name}"; known: ${Object.keys(SCREENS).join(", ")}`);
const dir = `art/candidates/ui/paint/${name}`;
await mkdir(dir, { recursive: true });
if (mode === "render") await render(name, screen, dir);
else if (mode === "paint") {
  const seeds = rest.map(Number).filter((n) => !Number.isNaN(n));
  await paint(name, screen, dir, rest.filter((a) => Number.isNaN(Number(a))), seeds.length > 0 ? seeds : [1, 2, 3]);
} else if (mode === "composite") await composite(name, dir);
else throw new Error("usage: hud-paint.ts render|paint|composite <screen> [probe…] [seed…]");
