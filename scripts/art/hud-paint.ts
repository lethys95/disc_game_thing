import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
 * - `composite` lays each painting back into the screen between the field and the content (the figure's hands back
 *   in front of the portrait), for judging.
 *
 *     pnpm tsx scripts/art/hud-paint.ts render battle
 *     pnpm tsx scripts/art/hud-paint.ts paint battle [probe…] [seed…]
 *     pnpm tsx scripts/art/hud-paint.ts composite battle
 *     pnpm tsx scripts/art/hud-paint.ts page battle          (the review page in shots/)
 */

const WIDTH = 1536;
const HEIGHT = 864;
/** What fills everything outside the mask in the source; the model sees it as the empty middle. */
const GROUND = "#151413";
/** Masked image-to-image strengths: how far the painting may move from the greybox's flat shapes. */
const STRENGTHS = [0.7, 0.8] as const;

interface Screen {
  readonly route: string;
  /** What is in the picture, piece by piece, with Jilliath's skin (provisional #76). */
  readonly subject: string;
}

const SCREENS: Readonly<Record<string, Screen>> = {
  battle: {
    route: "/?fight&steps=2",
    subject:
      "The interface frame of a dark fantasy strategy game, seen straight on, carved as one piece of dark stonework around an empty middle: " +
      "a band of carved black stone along the top edge, an arcade of small arched niches with a single candle burning in one of them, and a round iron medallion hanging from the band; " +
      "from the band's right end two small objects hang on iron chains: an iron hourglass and a wooden puppeteer's cross with its strings; " +
      "a heavy stone sill along the bottom edge with a plain moulded top and a row of square recessed iron sockets, the stone between them plain; " +
      "on the left a tall stone stele crowned by a hooded angel carved in the same dark stone, humble, head bowed, her wings rising whole behind her, " +
      "both her hands holding an empty arched portrait frame against her chest, short arms; below her a pale marble name plate set into the stone, then a recessed dark panel; " +
      "on the right a shorter stone stele with a recessed dark panel; thin bands of dark red stained glass along the seams. No text, no letters, no numbers.",
  },
};

/**
 * Bump for a new round of probes: each round keeps its own folder (`<screen>-<round>`), its layers and paintings.
 * Round 2 (2026-10-09), after the user's notes on round 1: the angel holds the portrait, her wings whole, no ridge on
 * the sill, recessed panels behind text, the two controls as hanging objects, darker and candlelit.
 */
const ROUND = 2;

/**
 * Material and light to compare. Round 1 compared materials (the user's gothic line, cathedral, reliquary); the user
 * preferred reliquary and asked for darker light ("we generally need something darker to fit the rest of the theme"),
 * so round 2 keeps reliquary and compares how dark.
 */
const RELIQUARY = "Black wrought iron and dark stone like an old reliquary, worn smooth, with tarnished silver edges.";
const PROBES: readonly { readonly id: string; readonly look: string }[] = [
  {
    id: "candlelit",
    look: `${RELIQUARY} Lit only by a few candles set in the stone: dim warm candlelight, deep shadows, low-key, matte bare stone, no moss, no plants, nothing glossy. Grim and solemn.`,
  },
  {
    id: "darker",
    look: `${RELIQUARY} Almost dark: a few candles are the only light and most of the stone sits in shadow, matte bare stone, no moss, no plants, nothing glossy. Grim and solemn.`,
  },
];

/** The greybox's layers, as page styles: each hides what its layer isn't. */
const HIDE_FIELD = "#stage{visibility:hidden!important} html,body{background:transparent!important} #battlehud::before{display:none!important}";
const LAYERS = {
  // Darker than the greybox shows it: the painting keeps the source's values (the user, round 1: "something darker").
  chrome:
    `${HIDE_FIELD} #battlehud{filter:brightness(0.72)} #battlehud *{color:transparent!important;text-shadow:none!important} ` +
    "#battlehud .art,#battlehud .fill,#battlehud .channel .shield,#battlehud .band,#battlehud .bead,#battlehud .cell,#battlehud .shield-seal,#card .abilities>*,#log>*{visibility:hidden!important}",
  content:
    `${HIDE_FIELD} #battlehud *:not(.art):not(.fill):not(.shield):not(.band):not(.bead):not(.cell):not(.shield-seal),#battlehud *::before,#battlehud *::after` +
    "{background:transparent!important;border-color:transparent!important;box-shadow:none!important}",
  field: "#battlehud>*{visibility:hidden!important}",
  // What sits in front of the live content: the figure's hands over the portrait's frame.
  front: `${HIDE_FIELD} #battlehud *{visibility:hidden!important} #card .niche .hands{visibility:visible!important}`,
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
  magick(`${dir}/front-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:1", `${dir}/front-mask.png`);
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
  const layers = new Set(["greybox.png", "chrome.png", "mask.png", "front-mask.png", "chrome-layer.png", "content-layer.png", "field-layer.png", "front-layer.png"]);
  const paintings = (await readdir(dir)).filter((f) => f.endsWith(".png") && !layers.has(f) && f !== "contact-sheet.png");
  for (const file of paintings) {
    magick(
      `${dir}/field-layer.png`,
      "(", `${dir}/${file}`, `${dir}/mask.png`, "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")",
      "-compose", "Over", "-composite",
      `${dir}/content-layer.png`, "-compose", "Over", "-composite",
      "(", `${dir}/${file}`, `${dir}/front-mask.png`, "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")",
      "-compose", "Over", "-composite",
      `${dir}/preview/${file}`,
    );
  }
  console.log(`${name}: ${paintings.length} previews in ${dir}/preview`);
}

/** The review page (`shots/hud-paint-<screen>.html`): per probe its full prompt as sent, then its previews by strength. */
async function page(name: string, dir: string): Promise<void> {
  const manifest: Candidate[] = JSON.parse(await readFile(`${dir}/manifest.json`, "utf8"));
  const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const sections = PROBES.filter((p) => manifest.some((m) => m.id.startsWith(`${p.id}-`))).map((probe) => {
    const rows = STRENGTHS.map((denoise) => {
      const id = `${probe.id}-${Math.round(denoise * 100)}`;
      const shots = manifest.filter((m) => m.id === id).sort((a, b) => a.seed - b.seed);
      const cells = shots.map((m) => `<figure><a href="/${dir}/${m.file}" target="_blank"><img loading="lazy" src="/${dir}/preview/${m.file}"></a><figcaption>${m.file} (the painting alone: click)</figcaption></figure>`).join("");
      return `<h3>Strength ${denoise}</h3><div class="row">${cells}</div>`;
    }).join("");
    const prompt = manifest.find((m) => m.id.startsWith(`${probe.id}-`))?.prompt ?? "";
    return `<section><h2>${probe.id}</h2><p class="prompt">${escape(prompt)}</p>${rows}</section>`;
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HUD paint probes: ${name}</title><style>
body{margin:0;background:#0d0b0b;color:#e6ddcc;font:15px/1.5 Georgia,serif}main{max-width:1700px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:28px;margin:0 0 6px}h2{font-size:22px;margin:36px 0 6px;border-bottom:1px solid #2a2420;padding-bottom:4px}h3{font-size:15px;color:#9a8f80;margin:14px 0 6px}
.prompt{font:12px/1.5 ui-monospace,monospace;color:#b9ae9c;background:#171312;padding:8px 10px;max-width:none}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}figure{margin:0}img{width:100%;display:block;border:1px solid #2a2420}
figcaption{color:#9a8f80;font-size:12px}@media(max-width:900px){.row{grid-template-columns:1fr}}</style></head><body><main>
<h1>The ${name} screen painted over its greybox: probes, round ${ROUND}</h1>
<p>Each picture repaints only the stone and iron of the greybox (through its mask), then sits between the live field and the live text and portraits, as it would in the game; the figure's hands go back in front of the portrait. Pick a light and a strength; click any picture to see the painting alone.</p>
<div class="row"><figure><img src="/${dir}/greybox.png"><figcaption>The greybox</figcaption></figure><figure><img src="/${dir}/chrome.png"><figcaption>What was painted over: its stone and iron alone</figcaption></figure></div>
${sections}</main></body></html>`;
  await writeFile(`shots/hud-paint-${name}-${ROUND}.html`, html);
  console.log(`shots/hud-paint-${name}-${ROUND}.html`);
}

const [mode, name = "battle", ...rest] = process.argv.slice(2);
const screen = SCREENS[name];
if (!screen) throw new Error(`no screen "${name}"; known: ${Object.keys(SCREENS).join(", ")}`);
const dir = `art/candidates/ui/paint/${name}-${ROUND}`;
await mkdir(dir, { recursive: true });
if (mode === "render") await render(name, screen, dir);
else if (mode === "paint") {
  const seeds = rest.map(Number).filter((n) => !Number.isNaN(n));
  await paint(name, screen, dir, rest.filter((a) => Number.isNaN(Number(a))), seeds.length > 0 ? seeds : [1, 2, 3]);
} else if (mode === "composite") await composite(name, dir);
else if (mode === "page") await page(name, dir);
else throw new Error("usage: hud-paint.ts render|paint|composite|page <screen> [probe…] [seed…]");
