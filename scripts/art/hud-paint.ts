import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";
import { inpaint, KREA2_TURBO } from "#scripts/art/comfy";
import { record } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * Step 3 of the HUD kit (`docs/design/hud-kit.md`): a screen's greybox painted as one picture, so every piece cut
 * from it shares one stone, one light and one level of detail.
 * - `render` shoots the greybox in layers: its stone and iron alone (the source); the structure (everything with a
 *   layout edge) and the sculpture (figures and objects) apart; the live content (text, portraits, icons, states); the
 *   field behind; and what goes in front of the content (the figure's hands and the frame she holds).
 * - `paint` repaints the stone and iron, once per probe, strength and seed. The structure keeps its exact edges; the
 *   sculpture gets room around it to finish its own shape (the user, round 1: "All angel wings are cut off").
 * - `composite` cuts the sculpture out along what was painted, with Photon's subject segmentation (the user's tool
 *   for it), and lays everything back into the screen between the field and the content, for judging.
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
/** Room around the sculpture, in source pixels, for the painting to finish its outline in. */
const ZONE = 36;
/** The sculpted pieces, cut by segmentation from a crop around each (their zone included). */
const SCULPTURE = [
  { name: "figure", selector: "#card .niche" },
  { name: "objects", selector: "#beamhang" },
] as const;
const PHOTON = `${homedir()}/.photon/bin/photon`;

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
// Darker than the greybox shows it: the painting keeps the source's values (the user, round 1: "something darker").
const CHROME =
  `${HIDE_FIELD} #battlehud{filter:brightness(0.72)} #battlehud *{color:transparent!important;text-shadow:none!important} ` +
  "#battlehud .art,#battlehud .fill,#battlehud .channel .shield,#battlehud .band,#battlehud .bead,#battlehud .cell,#battlehud .shield-seal,#card .abilities>*,#log>*{visibility:hidden!important}";
const SCULPTED = "#card .niche .figure,#card .niche .window,#card .niche .hands,#beamhang";
const LAYERS = {
  chrome: CHROME,
  structure: `${CHROME} ${SCULPTED}{visibility:hidden!important}`,
  sculpture: `${CHROME} #battlehud *{visibility:hidden!important} ${SCULPTED.split(",").map((s) => `${s},${s} *`).join(",")}{visibility:visible!important}`,
  content:
    `${HIDE_FIELD} #battlehud *:not(.art):not(.fill):not(.shield):not(.band):not(.bead):not(.cell):not(.shield-seal),#battlehud *::before,#battlehud *::after` +
    "{background:transparent!important;border-color:transparent!important;box-shadow:none!important}",
  field: "#battlehud>*{visibility:hidden!important}",
  // In front of the live portrait: the frame the figure holds (its rim, not its opening) and her hands over it.
  front:
    `${HIDE_FIELD} #battlehud *{visibility:hidden!important} #card .niche .hands,#card .niche .window{visibility:visible!important} ` +
    "#card .niche .window{background:transparent!important} #card .niche .window *{visibility:hidden!important}",
} as const;

interface Box {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isBox = (value: unknown): value is Box =>
  isRecord(value) && typeof value["name"] === "string" && ["x", "y", "width", "height"].every((k) => typeof value[k] === "number");

const magick = (...args: string[]) => execFileSync("magick", args, { stdio: "inherit" });

/** One Photon CLI call (`photon-edit` skill), its JSON reply when it succeeded. */
function photon(args: readonly string[]): Record<string, unknown> {
  const reply: unknown = JSON.parse(execFileSync(PHOTON, [...args], { encoding: "utf8" }));
  if (!isRecord(reply) || reply["ok"] !== true) throw new Error(`photon ${args.slice(0, 2).join(" ")}: ${JSON.stringify(reply)}`);
  return reply;
}

/**
 * The subject of `source` (a PNG), cut along its painted outline by Photon's local segmentation model (Layer ▸ Remove
 * Background), into `target` with alpha. Headless, and the document is closed without saving.
 */
function cutSubject(source: string, target: string): void {
  const opened = photon(["execute", "session.open", "--params", JSON.stringify({ path: resolve(source), mode: "headless" })]);
  const result = opened["result"];
  if (!isRecord(result)) throw new Error("photon session.open: no document");
  const at = { session: String(result["sessionId"]), document: String(result["documentId"]), revision: Number(opened["revision"]) };
  const edit = (operation: string, params: Record<string, unknown>) => {
    const reply = photon(["execute", operation, "--session", at.session, "--document", at.document, "--revision", String(at.revision), "--params", JSON.stringify(params)]);
    if (typeof reply["revision"] === "number") at.revision = reply["revision"];
  };
  try {
    edit("layer.background.unlock", { name: "piece" });
    const inspected = photon(["inspect", "--session", at.session, "--document", at.document])["result"];
    const layers = isRecord(inspected) ? inspected["layers"] : undefined;
    const first: unknown = Array.isArray(layers) ? layers[0] : undefined;
    if (!isRecord(first) || typeof first["id"] !== "string") throw new Error("photon inspect: no layer");
    edit("layer.removeBackground", { layerId: first["id"] });
    edit("document.save", { path: resolve(target), format: "png", asCopy: true });
  } finally {
    edit("session.close", { disposition: "discard" });
  }
}

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
  // Where each sculpted piece is, with its zone around it: what segmentation gets to cut it from.
  const boxes: Box[] = [];
  for (const piece of SCULPTURE) {
    const box = await page.locator(piece.selector).boundingBox();
    if (!box) continue;
    const x = Math.max(0, Math.floor(box.x - ZONE));
    const y = Math.max(0, Math.floor(box.y - ZONE));
    boxes.push({ name: piece.name, x, y, width: Math.min(WIDTH, Math.ceil(box.x + box.width + ZONE)) - x, height: Math.min(HEIGHT, Math.ceil(box.y + box.height + ZONE)) - y });
  }
  await writeFile(`${dir}/pieces.json`, JSON.stringify(boxes, null, 2));
  await browser.close();
  await server.close();
  // The source: the stone and iron on a plain dark ground.
  magick(`${dir}/chrome-layer.png`, "-background", GROUND, "-flatten", `${dir}/chrome.png`);
  // The structure keeps its edges; the sculpture gets its zone; the paint mask is both.
  magick(`${dir}/structure-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:2", `${dir}/structure-mask.png`);
  magick(`${dir}/sculpture-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", `Disk:${ZONE}`, `${dir}/zone-mask.png`);
  magick(`${dir}/structure-mask.png`, `${dir}/zone-mask.png`, "-compose", "Lighten", "-composite", `${dir}/mask.png`);
  // In front of the portrait, a little wider so the painted rim covers the portrait's edge.
  magick(`${dir}/front-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:3", `${dir}/front-mask.png`);
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

async function paintings(dir: string): Promise<Candidate[]> {
  return JSON.parse(await readFile(`${dir}/manifest.json`, "utf8"));
}

async function composite(name: string, dir: string): Promise<void> {
  await mkdir(`${dir}/preview`, { recursive: true });
  await mkdir(`${dir}/cut`, { recursive: true });
  const read: unknown = JSON.parse(await readFile(`${dir}/pieces.json`, "utf8"));
  const pieces = Array.isArray(read) ? read.filter(isBox) : [];
  const done = await paintings(dir);
  for (const { file } of done) {
    const stem = file.replace(/\.png$/, "");
    const cuts: string[] = [];
    for (const piece of pieces) {
      const crop = `${dir}/cut/${stem}-${piece.name}-crop.png`;
      const cut = `${dir}/cut/${stem}-${piece.name}.png`;
      magick(`${dir}/${file}`, "-crop", `${piece.width}x${piece.height}+${piece.x}+${piece.y}`, "+repage", crop);
      cutSubject(crop, cut);
      cuts.push(cut, "-geometry", `+${piece.x}+${piece.y}`, "-compose", "Over", "-composite");
    }
    magick(
      `${dir}/field-layer.png`,
      "(", `${dir}/${file}`, `${dir}/structure-mask.png`, "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")",
      "-compose", "Over", "-composite",
      ...cuts,
      `${dir}/content-layer.png`, "-geometry", "+0+0", "-compose", "Over", "-composite",
      "(", `${dir}/${file}`, `${dir}/front-mask.png`, "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")",
      "-compose", "Over", "-composite",
      `${dir}/preview/${file}`,
    );
  }
  console.log(`${name}: ${done.length} previews in ${dir}/preview`);
}

/** The review page (`shots/hud-paint-<screen>.html`): per probe its full prompt as sent, then its previews by strength. */
async function page(name: string, dir: string): Promise<void> {
  const manifest = await paintings(dir);
  const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const sections = PROBES.filter((p) => manifest.some((m) => m.id.startsWith(`${p.id}-`))).map((probe) => {
    const rows = STRENGTHS.map((denoise) => {
      const id = `${probe.id}-${Math.round(denoise * 100)}`;
      const shots = manifest.filter((m) => m.id === id).sort((a, b) => a.seed - b.seed);
      const cells = shots.map((m) => `<figure><a href="/${dir}/${m.file}" target="_blank"><img loading="lazy" src="/${dir}/preview/${m.file}"></a><figcaption>${m.file}: <a href="/${dir}/${m.file}" target="_blank">the painting</a> · <a href="/${dir}/cut/${m.file.replace(/\.png$/, "")}-figure.png" target="_blank">the figure as Photon cut it</a></figcaption></figure>`).join("");
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
<p>Each picture repaints the greybox's stone and iron. The structure keeps its layout edges; the figure and the hanging objects had room to finish their own outlines and were cut out along what was painted, by Photon. Everything then sits between the live field and the live text and portraits, as it would in the game, with the frame the figure holds and her hands back in front of the portrait. Pick a light and a strength.</p>
<div class="row"><figure><img src="/${dir}/greybox.png"><figcaption>The greybox</figcaption></figure><figure><img src="/${dir}/chrome.png"><figcaption>What was painted over: its stone and iron alone</figcaption></figure><figure><img src="/${dir}/mask.png"><figcaption>Where the painting may go: the structure exactly, the sculpture with room</figcaption></figure></div>
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
