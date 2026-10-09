import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";
import { img2img, inpaint, KREA2_TURBO } from "#scripts/art/comfy";
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
 *     pnpm tsx scripts/art/hud-paint.ts hires battle <picked.png>   (the pick repainted at 1440p)
 *     pnpm tsx scripts/art/hud-paint.ts composite battle hires
 *     pnpm tsx scripts/art/hud-paint.ts fix battle          (spot repairs on the 1440p pick, by inpainting)
 *     pnpm tsx scripts/art/hud-paint.ts graft battle        (pieces taken from a sibling painting of the same probe)
 *     pnpm tsx scripts/art/hud-paint.ts pieces battle [piece…]   (the game's pieces, into assets/ui/<screen>/)
 */

const WIDTH = 1536;
const HEIGHT = 864;
/**
 * The picked painting is repainted at 1440p from its own upscale, at a low strength: the composition stays, the detail
 * a 1440p screen needs is added (no upscale model is installed; `maybe/upscalers`). The layout scales with the window's
 * height, so the greybox rendered at this size is the same layout, larger.
 */
const HIRES_WIDTH = 2560;
const HIRES_HEIGHT = 1440;
const HIRES_DENOISE = 0.35;
/** What fills everything outside the mask in the source; the model sees it as the empty middle. */
const GROUND = "#151413";
/** Masked image-to-image strengths: how far the painting may move from the greybox's flat shapes. */
const STRENGTHS = [0.75, 0.85] as const;
/** Room around the sculpture, in source pixels, for the painting to finish its outline in. */
const ZONE = 36;
const PHOTON = `${homedir()}/.photon/bin/photon`;

/**
 * Material and light. Battle round 1 compared materials and the user preferred reliquary (85-3's light: "dimmed like
 * 85-3 reliquary works better", against 65-2's "distinct 'Ai Look'"); round 2 went too dark; round 3 is round 1's
 * reliquary line as sent, with candles, and the same with the contrast between lit stone and shadow named. Its pick
 * (reliquary 75-3) is the light every later screen matches.
 */
const RELIQUARY = "Black wrought iron and dark stone like an old reliquary, worn smooth, with tarnished silver edges and deep shadows. Desaturated, grim and solemn.";
const PROBES = {
  reliquary: `Lit by one soft light from the upper left and a few candles. ${RELIQUARY}`,
  contrast: `Lit by one soft warm light from the upper left and a few candles: lit stone against deep shadow, matte, no glare, no moss. ${RELIQUARY}`,
} as const;
type ProbeId = keyof typeof PROBES;

type Layer = "chrome" | "structure" | "sculpture" | "content" | "field" | "front";

interface Screen {
  readonly route: string;
  /** What is in the picture, piece by piece, with Jilliath's skin (provisional #76). */
  readonly subject: string;
  /** Each round of probes keeps its own folder, `<screen>-<round>`, its layers and paintings. */
  readonly round: number;
  readonly probes: readonly ProbeId[];
  /** The greybox's layers, as page styles: each hides what its layer isn't. */
  readonly layers: Readonly<Record<Layer, string>>;
  /** The sculpted pieces, cut by segmentation from a crop around each (their zone included). */
  readonly sculpture: readonly { readonly name: string; readonly selector: string }[];
  /** False where the structure is already painted (pieces of an earlier screen): only the sculpture is painted. */
  readonly paintStructure: boolean;
}

const HIDE_STAGE = "#stage{visibility:hidden!important} html,body{background:transparent!important}";

// The battle (the record of how its pieces were painted; its greybox is gone, replaced by them). Round 2 (after the
// user's notes on round 1): the angel holds the portrait, her wings whole, no ridge on the sill, recessed panels behind
// text, the two controls as hanging objects, darker and candlelit. Round 3 (after the user on round 2: "the darkness on
// each angel is now an overreaction […] there was contrast between dark and light"; "there are even more cuts now"):
// round 1's light and source values again; the angel stands on the stele's top, so no greybox stone sits behind her to
// leave a dark slab; the small instrument glyphs stay out of the painting (crisp pieces on top).
const BATTLE_HIDE = `${HIDE_STAGE} #battlehud::before{display:none!important}`;
const BATTLE_CHROME =
  `${BATTLE_HIDE} #battlehud *{color:transparent!important;text-shadow:none!important} ` +
  "#battlehud .art,#battlehud .fill,#battlehud .channel .shield,#battlehud .band,#battlehud .bead,#battlehud .cell,#battlehud .shield-seal,#card .abilities>*,#log>*,#battlehud .shape,#battlehud .seal,#battlehud .tier{visibility:hidden!important}";
const BATTLE_SCULPTED = "#card .niche .figure,#card .niche .window,#card .niche .hands,#beamhang";

// The map: its structure is the battle's pieces already; only the bell-bearer and the book are painted.
const MAP_CHROME =
  `${HIDE_STAGE} #maphud *{color:transparent!important;text-shadow:none!important} ` +
  "#maphud .fill,#maphud .coin,#maphud .gem,#maphud .xp,#mapbanner,#forkprompt,#peek,#maphud .screen{visibility:hidden!important}";
const MAP_SCULPTED = "#mapbottom .bearer,#mapmenu";

const SCREENS: Readonly<Record<string, Screen>> = {
  battle: {
    route: "/?fight&steps=2",
    subject:
      "The interface frame of a dark fantasy strategy game, seen straight on, carved as one piece of dark stonework around an empty middle: " +
      "a band of carved black stone along the top edge, an arcade of small arched niches with a single candle burning in one of them, and a round iron medallion hanging from the band; " +
      "from the band's right end two small objects hang on iron chains: an iron hourglass, and a wooden puppeteer's cross with a small puppet hanging from its strings; " +
      "a heavy stone sill along the bottom edge with a plain moulded top and, in its middle only, a short row of square recessed iron sockets, plain stone on either side; " +
      "on the left a tall stone stele with a hooded angel standing on its top, carved in the same dark stone, humble, head bowed, her wings rising whole behind her, " +
      "both her hands holding an empty arched portrait frame against her chest, short arms; set into the stele's face below her feet a pale marble name plate, then a recessed dark panel; " +
      "on the right a shorter stone stele with a recessed dark panel; thin bands of dark red stained glass along the seams. No text, no letters, no numbers.",
    round: 3,
    probes: ["reliquary", "contrast"],
    layers: {
      chrome: BATTLE_CHROME,
      structure: `${BATTLE_CHROME} ${BATTLE_SCULPTED}{visibility:hidden!important}`,
      sculpture: `${BATTLE_CHROME} #battlehud *{visibility:hidden!important} ${BATTLE_SCULPTED.split(",").map((s) => `${s},${s} *`).join(",")}{visibility:visible!important}`,
      content:
        `${BATTLE_HIDE} #battlehud *:not(.art):not(.fill):not(.shield):not(.band):not(.bead):not(.cell):not(.shield-seal):not(.shape):not(.seal):not(.tier),#battlehud *::before,#battlehud *::after` +
        "{background:transparent!important;border-color:transparent!important;box-shadow:none!important}",
      field: "#battlehud>*{visibility:hidden!important}",
      // In front of the live portrait: the frame the figure holds (its rim, not its opening) and her hands over it.
      front:
        `${BATTLE_HIDE} #battlehud *{visibility:hidden!important} #card .niche .hands,#card .niche .window{visibility:visible!important} ` +
        "#card .niche .window{background:transparent!important} #card .niche .window *{visibility:hidden!important}",
    },
    sculpture: [
      { name: "figure", selector: "#card .niche" },
      { name: "objects", selector: "#beamhang" },
    ],
    paintStructure: true,
  },
  map: {
    route: "/?map&seed=3",
    subject:
      "The interface of a dark fantasy strategy game seen straight on, carved dark stonework around an empty middle: a carved stone band along the top edge with an arcade of small arches and a round iron medallion; " +
      "two stone tablets with recessed panels hang from it on iron chains at the left and the right; from the band, on a short iron chain, hangs a small closed book bound in dark leather with iron corners and a clasp; " +
      "at the bottom centre, rising from the bottom edge and cut off by it below her waist, a hooded angel carved in the same dark stone, humble, head bowed, her wings folded close behind her, " +
      "both her hands holding up a small iron hand bell before her chest, short arms. No text, no letters, no numbers.",
    round: 1,
    probes: ["reliquary"],
    layers: {
      chrome: MAP_CHROME,
      structure: `${MAP_CHROME} ${MAP_SCULPTED}{visibility:hidden!important}`,
      sculpture: `${MAP_CHROME} #maphud *,#mapbeam::before,#mapbeam::after{visibility:hidden!important} ${MAP_SCULPTED.split(",").map((s) => `${s},${s} *`).join(",")},#mapbottom{visibility:visible!important} #mapbeam{background:none!important;filter:none!important}`,
      content:
        `${HIDE_STAGE} #mapbeam,#mapbeam::before,#mapbeam::after,#mapsquad,#mapcity,#mapturn .plaque,#mapsquad>.title,#mapcity>.title,#maphud button.warband,#mapbottom .bearer,#endturn,#mapmenu` +
        "{background:transparent!important;border-image:none!important;border-color:transparent!important;filter:none!important}",
      field: "#maphud>*{visibility:hidden!important}",
      front: `${HIDE_STAGE} #maphud,#maphud *{visibility:hidden!important}`,
    },
    sculpture: [
      { name: "bearer", selector: "#mapbottom .bearer" },
      { name: "book", selector: "#mapmenu" },
    ],
    paintStructure: false,
  },
};

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

/** One Photon CLI call (`photon-edit` skill), its JSON reply when it succeeded; a failed one throws Photon's reply. */
function photon(args: readonly string[]): Record<string, unknown> {
  let out = "";
  try {
    out = execFileSync(PHOTON, [...args], { encoding: "utf8" });
  } catch (error) {
    out = isRecord(error) && typeof error["stdout"] === "string" ? error["stdout"] : "";
  }
  const reply: unknown = out.trim().startsWith("{") ? JSON.parse(out) : out;
  if (!isRecord(reply) || reply["ok"] !== true) throw new Error(`photon ${args.slice(0, 2).join(" ")}: ${JSON.stringify(reply)}`);
  return reply;
}

/** Photon finishes writing a saved file after its reply: wait until the PNG is whole (it ends in its IEND chunk). */
async function whole(path: string): Promise<void> {
  for (let tries = 0; tries < 200; tries++) {
    const bytes = await readFile(path).catch(() => null);
    if (bytes && bytes.length > 12 && bytes.subarray(bytes.length - 8, bytes.length - 4).toString("latin1") === "IEND") return;
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`photon never finished writing ${path}`);
}

/**
 * The subject of `source` (a PNG), cut along its painted outline by Photon's local segmentation model (Layer ▸ Remove
 * Background), into `target` with alpha. Headless, and the document is closed without saving.
 */
async function cutSubject(source: string, target: string): Promise<void> {
  await rm(target, { force: true });
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
    // Photon's PNG writer can corrupt its deflate stream at higher levels ("invalid distance too far back", seen at 6
    // and 9 on 2026-10-09); level 1 decodes.
    edit("document.save", { path: resolve(target), format: "png", asCopy: true, options: { level: 1 } });
  } finally {
    edit("session.close", { disposition: "discard" });
  }
  await whole(target);
  // Fully decoded, not just its header read: a broken stream fails here, not in a composite later.
  execFileSync("magick", [target, "null:"], { stdio: "inherit" });
}

async function render(name: string, screen: Screen, dir: string, width = WIDTH, height = HEIGHT): Promise<void> {
  const zone = Math.round((ZONE * height) / HEIGHT);
  const server = await createServer({ logLevel: "error", server: { port: 0 } });
  await server.listen();
  const address = server.resolvedUrls?.local[0];
  if (!address) throw new Error("vite did not report a local URL");
  const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(new URL(screen.route, address).href);
  await page.waitForSelector("body[data-ready=true]", { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/greybox.png` });
  for (const [layer, css] of Object.entries(screen.layers)) {
    const style = await page.addStyleTag({ content: css });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${dir}/${layer}-layer.png`, omitBackground: layer !== "field" });
    await style.evaluate((node) => node.parentNode?.removeChild(node));
  }
  // Where each sculpted piece is, with its zone around it: what segmentation gets to cut it from.
  const boxes: Box[] = [];
  for (const piece of screen.sculpture) {
    const box = await page.locator(piece.selector).boundingBox();
    if (!box) continue;
    const x = Math.max(0, Math.floor(box.x - zone));
    const y = Math.max(0, Math.floor(box.y - zone));
    boxes.push({ name: piece.name, x, y, width: Math.min(width, Math.ceil(box.x + box.width + zone)) - x, height: Math.min(height, Math.ceil(box.y + box.height + zone)) - y });
  }
  await writeFile(`${dir}/pieces.json`, JSON.stringify(boxes, null, 2));
  await browser.close();
  await server.close();
  // The source: the stone and iron on a plain dark ground.
  magick(`${dir}/chrome-layer.png`, "-background", GROUND, "-flatten", `${dir}/chrome.png`);
  // The structure keeps its edges; the sculpture gets its zone; the paint mask is both.
  magick(`${dir}/structure-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:2", `${dir}/structure-mask.png`);
  magick(`${dir}/sculpture-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", `Disk:${zone}`, `${dir}/zone-mask.png`);
  if (screen.paintStructure) magick(`${dir}/structure-mask.png`, `${dir}/zone-mask.png`, "-compose", "Lighten", "-composite", `${dir}/mask.png`);
  else magick(`${dir}/zone-mask.png`, `${dir}/mask.png`);
  // In front of the portrait, a little wider so the painted rim covers the portrait's edge.
  magick(`${dir}/front-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:3", `${dir}/front-mask.png`);
  console.log(`${name}: layers in ${dir}`);
}

async function paint(name: string, screen: Screen, dir: string, probeIds: readonly string[], seeds: readonly number[]): Promise<void> {
  const probes = probeIds.length > 0 ? screen.probes.filter((p) => probeIds.includes(p)) : screen.probes;
  const manifest: Candidate[] = [];
  for (const probe of probes) {
    for (const denoise of STRENGTHS) {
      for (const seed of seeds) {
        const id = `${probe}-${Math.round(denoise * 100)}`;
        const file = `${id}-${seed}.png`;
        const prompt = `${screen.subject} ${PROBES[probe]}`;
        const started = Date.now();
        await writeFile(`${dir}/${file}`, await inpaint({ prompt, seed, source: `${dir}/chrome.png`, mask: `${dir}/mask.png`, denoise }, `disc/hud-${name}`));
        console.log(`${dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
        manifest.push({ file, id, seed, prompt, model: KREA2_TURBO.diffusionModel, source: "chrome.png", mask: "mask.png", denoise });
        await record(dir, manifest);
      }
    }
  }
}

/**
 * Spot repairs on the picked 1440p painting, by masked repaint of just that spot (the user, 2026-10-09: "Idk if
 * there's the option of inpainting to fix things too"). Rects are in its pixels; each fix starts from the last one's
 * result, and `from` names a fix whose result it starts from instead (a branch kept apart from the main line).
 */
interface Fix {
  readonly name: string;
  readonly rects: readonly (readonly [number, number, number, number])[];
  readonly prompt: string;
  readonly denoise: number;
  readonly from?: string;
  /** Seeds to try instead of the painting's own; each writes `fix-<name>-<seed>.png`. */
  readonly seeds?: readonly number[];
}

const FIXES: Readonly<Record<string, { readonly painting: string; readonly fixes: readonly Fix[] }>> = {
  battle: {
    painting: "reliquary-75-3.png",
    fixes: [
      {
        // The painted grille is not the sockets: the sill stays plain, and the sockets are pieces of their own.
        name: "sill",
        rects: [[905, 1318, 760, 112]],
        prompt: "The face of a heavy sill of dark carved stone seen straight on, plain matte stone with a moulded edge, no openings, no holes, no grille. Lit by one soft light from the upper left. Black wrought iron and dark stone like an old reliquary, worn smooth, deep shadows. Desaturated, grim and solemn.",
        denoise: 0.95,
      },
      {
        // The log needs a face to hold its text: a broad low stele with a recessed panel, where the block stood.
        name: "log",
        rects: [[2040, 1070, 500, 200]],
        prompt: "A low broad stele of dark carved stone seen straight on, its whole face a wide recessed dark panel with a thin carved border, standing on a stone sill. Lit by one soft light from the upper left and a candle. Black wrought iron and dark stone like an old reliquary, worn smooth, deep shadows. Desaturated, grim and solemn.",
        denoise: 0.85,
      },
      {
        // The first try at the log painted a candle on a block (the prompt named a candle): a plainer ask, and seeds.
        name: "tablet",
        rects: [[2040, 1080, 500, 196]],
        prompt: "A wide low rectangular tablet of dark carved stone standing on a stone sill, seen straight on, its face filled by one large recessed dark rectangular panel inside a thin carved stone border, plain and empty. Lit by one soft light from the upper left. Black wrought iron and dark stone like an old reliquary, worn smooth, deep shadows. Desaturated, grim and solemn.",
        denoise: 1,
        from: "sill",
        seeds: [11, 12, 13],
      },
      {
        // Sockets at the game's own size, for one to be cut as the frame every socket shares (not kept in the sill).
        name: "sockets",
        rects: [[910, 1274, 130, 130], [1063, 1274, 130, 130], [1216, 1274, 130, 130], [1369, 1274, 130, 130], [1522, 1274, 130, 130]],
        prompt: "Square sockets set into a dark stone sill seen straight on: each a deep square hole, dark inside, with a thick rim of black wrought iron and small rivets at its corners. Lit by one soft light from the upper left. Black wrought iron and dark stone like an old reliquary, worn smooth, deep shadows. Desaturated, grim and solemn.",
        denoise: 0.9,
        from: "sill",
      },
    ],
  },
};

/**
 * A piece taken from a sibling painting of the same probe (same prompt and light, another seed) where the pick's
 * own came out wrong and repairs didn't take: its area upscaled to the 1440p scale and repainted lightly, so it
 * matches the pick's detail. Written as `hires/graft-<name>.png`, the area alone.
 */
interface Graft {
  readonly name: string;
  readonly painting: string;
  /** In the sibling painting's own pixels (the 1536 render). */
  readonly rect: readonly [number, number, number, number];
  readonly prompt: string;
  readonly denoise: number;
}

const GRAFTS: Readonly<Record<string, readonly Graft[]>> = {
  battle: [
    {
      // The pick's log stele came out as a plain block, and three repaints didn't give it a panel; seed 1 has one.
      name: "log",
      painting: "reliquary-75-1.png",
      rect: [1336, 644, 200, 208],
      prompt: "A square block of dark carved stone seen straight on, its face one large recessed dark panel with chamfered corners inside a thick carved stone border. Lit by one soft light from the upper left. Black wrought iron and dark stone like an old reliquary, worn smooth, deep shadows. Desaturated, grim and solemn.",
      denoise: 0.35,
    },
  ],
};

async function graft(name: string, dir: string): Promise<void> {
  const target = `${dir}/hires`;
  const scale = HIRES_HEIGHT / HEIGHT;
  for (const piece of GRAFTS[name] ?? []) {
    const [x, y, w, h] = piece.rect;
    // Krea's latent wants sides in multiples of 16.
    const [sw, sh] = [Math.round((w * scale) / 16) * 16, Math.round((h * scale) / 16) * 16];
    const up = `${target}/graft-${piece.name}-up.png`;
    magick(`${dir}/${piece.painting}`, "-crop", `${w}x${h}+${x}+${y}`, "+repage", "-filter", "Lanczos", "-resize", `${sw}x${sh}!`, up);
    const sibling = (await paintings(dir)).find((m) => m.file === piece.painting);
    const started = Date.now();
    const out = `${target}/graft-${piece.name}.png`;
    await writeFile(out, await img2img({ prompt: piece.prompt, seed: sibling?.seed ?? 1, source: up, denoise: piece.denoise }, `disc/hud-${name}-graft`));
    console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  }
}

/** Applies the screen's fixes (or the named ones) to its picked 1440p painting: `hires/fix-<name>.png` each. */
async function fix(name: string, dir: string, only: readonly string[]): Promise<void> {
  const plan = FIXES[name];
  if (!plan) throw new Error(`no fixes for ${name}`);
  const target = `${dir}/hires`;
  const picked = (await paintings(target)).find((m) => m.file === plan.painting);
  if (!picked) throw new Error(`no hires ${plan.painting}`);
  let last = `${target}/${plan.painting}`;
  for (const repair of plan.fixes) {
    const out = (seed?: number) => `${target}/fix-${repair.name}${seed === undefined ? "" : `-${seed}`}.png`;
    if (only.length > 0 && !only.includes(repair.name)) {
      if (!repair.from) last = out();
      continue;
    }
    const source = repair.from ? `${target}/fix-${repair.from}.png` : last;
    const mask = `${target}/fix-${repair.name}-mask.png`;
    magick("-size", `${HIRES_WIDTH}x${HIRES_HEIGHT}`, "xc:black", "-fill", "white",
      ...repair.rects.flatMap(([x, y, w, h]) => ["-draw", `rectangle ${x},${y} ${x + w},${y + h}`]),
      "-blur", "0x6", mask);
    for (const seed of repair.seeds ?? [undefined]) {
      const started = Date.now();
      const file = out(seed);
      await writeFile(file, await inpaint({ prompt: repair.prompt, seed: seed ?? picked.seed, source, mask, denoise: repair.denoise }, `disc/hud-${name}-fix`));
      console.log(`${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    }
    if (!repair.from) last = out();
  }
}

/**
 * The pieces the game shows, cut from the repaired 1440p painting into `assets/ui/<screen>/` (step 4 of the HUD kit).
 * - `rect`: the area as it is (bands that span the screen).
 * - `segment`: cut along its painted outline by Photon, then trimmed to it.
 * - `hole`: also an opening cleared where live content shows through (the portrait in the frame the angel holds):
 *   an arch, `[x, y, width, height]` with a round top.
 * - `well`: a socket, its inside cleared for the live icon, `inset` pixels in from its edge.
 * Each piece's rect in the painting is printed in rem (the painting is 28.8 px a rem: 1440 / 50), for the stylesheet.
 */
interface Piece {
  readonly name: string;
  readonly from: string;
  readonly rect: readonly [number, number, number, number];
  /** `key`: the painting's flat ground flooded away from the crop's corners (for bright things, chains and metal). */
  readonly cut: "rect" | "segment" | "key" | "well";
  readonly hole?: readonly [number, number, number, number];
  readonly inset?: number;
  /** Segment a brightened copy (dark stone against the dark ground is otherwise lost), keeping the original's pixels. */
  readonly bright?: boolean;
  /** For `key`: how far from the ground's colour still floods away, in percent. */
  readonly fuzz?: number;
  /** For `key`: also drop whatever is darker than this, in percent (a dark painted backdrop the flood stops at). */
  readonly minLight?: number;
}

const PIECES_OF: Readonly<Record<string, readonly Piece[]>> = {
  battle: [
    { name: "beam", from: "reliquary-75-3.png", rect: [0, 0, 2560, 102], cut: "rect" },
    { name: "hourglass", from: "reliquary-75-3.png", rect: [2215, 102, 100, 200], cut: "key" },
    { name: "marionette", from: "reliquary-75-3.png", rect: [2330, 102, 220, 210], cut: "key", minLight: 13 },
    { name: "monument", from: "reliquary-75-3.png", rect: [30, 190, 630, 1150], cut: "segment", bright: true, hole: [242, 393, 103, 167] },
    { name: "sill", from: "fix-sill.png", rect: [0, 1253, 2560, 187], cut: "rect" },
    // The monument's recessed panel with its carved border: the frame every socket and panel of the battle shares.
    { name: "recess", from: "reliquary-75-3.png", rect: [140, 782, 283, 433], cut: "rect" },
    { name: "log", from: "graft-log.png", rect: [0, 0, 336, 352], cut: "segment", bright: true },
    // For the map (and later screens): the monument's marble plate in its iron rim, and a length of the hourglass's
    // chain, so what other screens hang and name is the same stone, iron and light.
    { name: "plaque", from: "reliquary-75-3.png", rect: [143, 593, 260, 96], cut: "rect" },
    { name: "chain", from: "reliquary-75-3.png", rect: [2254, 104, 24, 52], cut: "key", fuzz: 6 },
  ],
};

const REM = HIRES_HEIGHT / 50;

async function cutPieces(name: string, dir: string, only: readonly string[]): Promise<void> {
  const pieces = (PIECES_OF[name] ?? []).filter((p) => only.length === 0 || only.includes(p.name));
  const source = `${dir}/hires`;
  const work = `${source}/pieces`;
  const out = `assets/ui/${name}`;
  await mkdir(work, { recursive: true });
  await mkdir(out, { recursive: true });
  for (const piece of pieces) {
    const [x, y, w, h] = piece.rect;
    const crop = `${work}/${piece.name}-crop.png`;
    magick(`${source}/${piece.from}`, "-crop", `${w}x${h}+${x}+${y}`, "+repage", crop);
    let png = crop;
    let at = { x, y, w, h };
    if (piece.cut === "segment" || piece.cut === "key") {
      const cut = `${work}/${piece.name}-cut.png`;
      if (piece.cut === "key") {
        const corners = ["0,0", "%[fx:w-1],0", "0,%[fx:h-1]", "%[fx:w-1],%[fx:h-1]"];
        magick(crop, "-alpha", "set", "-fuzz", `${piece.fuzz ?? 4}%`, "-fill", "none", ...corners.flatMap((c) => ["-draw", `alpha ${c} floodfill`]), cut);
        if (piece.minLight !== undefined) {
          magick(cut, "(", "+clone", "-alpha", "extract", "(", crop, "-colorspace", "Gray", "-threshold", `${piece.minLight}%`, "-morphology", "Dilate", "Disk:1", "-blur", "0x0.7", ")",
            "-compose", "Multiply", "-composite", ")", "-alpha", "off", "-compose", "CopyOpacity", "-composite", cut);
        }
      } else if (piece.bright) {
        const bright = `${work}/${piece.name}-bright.png`;
        const brightCut = `${work}/${piece.name}-bright-cut.png`;
        magick(crop, "-level", "0%,35%,1.4", bright);
        await cutSubject(bright, brightCut);
        magick(crop, "(", brightCut, "-alpha", "extract", ")", "-alpha", "off", "-compose", "CopyOpacity", "-composite", cut);
      } else await cutSubject(crop, cut);
      // Trimmed to what was cut, and where that sits in the painting, for the stylesheet.
      const box = execFileSync("magick", [cut, "-alpha", "extract", "-threshold", "8%", "-format", "%@", "info:"], { encoding: "utf8" }).trim();
      const m = /^(\d+)x(\d+)\+(\d+)\+(\d+)$/.exec(box);
      if (!m) throw new Error(`no bounds for ${piece.name}: ${box}`);
      const [bw, bh, bx, by] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
      png = `${work}/${piece.name}-trim.png`;
      magick(cut, "-crop", `${bw}x${bh}+${bx}+${by}`, "+repage", png);
      at = { x: x + bx, y: y + by, w: bw, h: bh };
      if (piece.hole) {
        const [hx, hy, hw, hh] = piece.hole;
        const r = hw / 2;
        const lx = hx - at.x;
        const ly = hy - at.y;
        const holed = `${work}/${piece.name}-holed.png`;
        // The piece's own alpha times the opening's mask (black where the live portrait shows through).
        magick(png, "(", "+clone", "-alpha", "extract", "(", "-size", `${at.w}x${at.h}`, "xc:white", "-fill", "black",
          "-draw", `roundrectangle ${lx},${ly} ${lx + hw},${ly + hh} ${r},${r}`, "-draw", `rectangle ${lx},${ly + r} ${lx + hw},${ly + hh}`, "-blur", "0x1", ")",
          "-compose", "Multiply", "-composite", ")", "-alpha", "off", "-compose", "CopyOpacity", "-composite", holed);
        png = holed;
      }
    } else if (piece.cut === "well") {
      const inset = piece.inset ?? 0;
      const welled = `${work}/${piece.name}-well.png`;
      magick(crop, "(", "-size", `${w}x${h}`, "xc:white", "-fill", "black", "-draw", `rectangle ${inset},${inset} ${w - inset},${h - inset}`, "-blur", "0x1", ")",
        "-alpha", "off", "-compose", "CopyOpacity", "-composite", welled);
      png = welled;
    }
    magick(png, "-quality", "92", "-define", "webp:alpha-quality=100", `${out}/${piece.name}.webp`);
    const rem = (v: number) => Number((v / REM).toFixed(3));
    console.log(`${piece.name}: ${at.w}x${at.h}px; left ${rem(at.x)}rem, top ${rem(at.y)}rem, right ${rem(HIRES_WIDTH - at.x - at.w)}rem, bottom ${rem(HIRES_HEIGHT - at.y - at.h)}rem, width ${rem(at.w)}rem, height ${rem(at.h)}rem`);
  }
}

/** The picked painting at 1440p: its upscale repainted at a low strength through the 1440p greybox's mask. */
async function hires(name: string, screen: Screen, dir: string, file: string): Promise<void> {
  const picked = (await paintings(dir)).find((m) => m.file === file);
  if (!picked) throw new Error(`no painting ${file} in ${dir}`);
  const target = `${dir}/hires`;
  await mkdir(target, { recursive: true });
  await render(name, screen, target, HIRES_WIDTH, HIRES_HEIGHT);
  const up = `${target}/${file.replace(/\.png$/, "")}-up.png`;
  magick(`${dir}/${file}`, "-filter", "Lanczos", "-resize", `${HIRES_WIDTH}x${HIRES_HEIGHT}!`, up);
  const started = Date.now();
  await writeFile(`${target}/${file}`, await inpaint({ prompt: picked.prompt, seed: picked.seed, source: up, mask: `${target}/mask.png`, denoise: HIRES_DENOISE }, `disc/hud-${name}-hires`));
  console.log(`${target}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  await record(target, [{ ...picked, source: `${file} upscaled`, mask: "mask.png", denoise: HIRES_DENOISE }]);
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
  // Where segmentation finds no subject, the piece is cut by its greybox shape instead, and the page says so.
  magick(`${dir}/sculpture-layer.png`, "-alpha", "extract", "-threshold", "35%", "-morphology", "Dilate", "Disk:2", `${dir}/sculpture-mask.png`);
  const byShape: string[] = [];
  for (const { file } of done) {
    const stem = file.replace(/\.png$/, "");
    const cuts: string[] = [];
    for (const piece of pieces) {
      const crop = `${dir}/cut/${stem}-${piece.name}-crop.png`;
      const cut = `${dir}/cut/${stem}-${piece.name}.png`;
      const area = `${piece.width}x${piece.height}+${piece.x}+${piece.y}`;
      magick(`${dir}/${file}`, "-crop", area, "+repage", crop);
      try {
        await cutSubject(crop, cut);
      } catch (error) {
        if (!String(error).includes("SUBJECT_NOT_FOUND")) throw error;
        magick(crop, "(", `${dir}/sculpture-mask.png`, "-crop", area, "+repage", ")", "-alpha", "off", "-compose", "CopyOpacity", "-composite", cut);
        byShape.push(`${stem}-${piece.name}`);
      }
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
  await writeFile(`${dir}/cut-by-shape.json`, JSON.stringify(byShape, null, 2));
  console.log(`${name}: ${done.length} previews in ${dir}/preview${byShape.length > 0 ? `; cut by shape: ${byShape.join(", ")}` : ""}`);
}

/** The review page (`shots/hud-paint-<screen>.html`): per probe its full prompt as sent, then its previews by strength. */
async function page(name: string, screen: Screen, dir: string): Promise<void> {
  const manifest = await paintings(dir);
  const read: unknown = JSON.parse(await readFile(`${dir}/cut-by-shape.json`, "utf8").catch(() => "[]"));
  const byShape = new Set(Array.isArray(read) ? read.filter((x): x is string => typeof x === "string") : []);
  const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const sections = screen.probes.filter((p) => manifest.some((m) => m.id.startsWith(`${p}-`))).map((probe) => {
    const rows = STRENGTHS.map((denoise) => {
      const id = `${probe}-${Math.round(denoise * 100)}`;
      const shots = manifest.filter((m) => m.id === id).sort((a, b) => a.seed - b.seed);
      const cells = shots.map((m) => `<figure><a href="/${dir}/${m.file}" target="_blank"><img loading="lazy" src="/${dir}/preview/${m.file}"></a><figcaption>${m.file}: <a href="/${dir}/${m.file}" target="_blank">the painting</a> · <a href="/${dir}/cut/${m.file.replace(/\.png$/, "")}-figure.png" target="_blank">the figure as Photon cut it</a>${["figure", "objects"].filter((p) => byShape.has(`${m.file.replace(/\.png$/, "")}-${p}`)).map((p) => ` · Photon found no ${p === "figure" ? "figure" : "hanging objects"} here, cut by the greybox shape`).join("")}</figcaption></figure>`).join("");
      return `<h3>Strength ${denoise}</h3><div class="row">${cells}</div>`;
    }).join("");
    const prompt = manifest.find((m) => m.id.startsWith(`${probe}-`))?.prompt ?? "";
    return `<section><h2>${probe}</h2><p class="prompt">${escape(prompt)}</p>${rows}</section>`;
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HUD paint probes: ${name}</title><style>
body{margin:0;background:#0d0b0b;color:#e6ddcc;font:15px/1.5 Georgia,serif}main{max-width:1700px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:28px;margin:0 0 6px}h2{font-size:22px;margin:36px 0 6px;border-bottom:1px solid #2a2420;padding-bottom:4px}h3{font-size:15px;color:#9a8f80;margin:14px 0 6px}
.prompt{font:12px/1.5 ui-monospace,monospace;color:#b9ae9c;background:#171312;padding:8px 10px;max-width:none}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}figure{margin:0}img{width:100%;display:block;border:1px solid #2a2420}
figcaption{color:#9a8f80;font-size:12px}@media(max-width:900px){.row{grid-template-columns:1fr}}</style></head><body><main>
<h1>The ${name} screen painted over its greybox: probes, round ${screen.round}</h1>
<p>Each picture repaints the greybox's stone and iron. The structure keeps its layout edges; the figure and the hanging objects had room to finish their own outlines and were cut out along what was painted, by Photon. Everything then sits between the live field and the live text and portraits, as it would in the game, with the frame the figure holds and her hands back in front of the portrait. Pick a light and a strength.</p>
<div class="row"><figure><img src="/${dir}/greybox.png"><figcaption>The greybox</figcaption></figure><figure><img src="/${dir}/chrome.png"><figcaption>What was painted over: its stone and iron alone</figcaption></figure><figure><img src="/${dir}/mask.png"><figcaption>Where the painting may go: the structure exactly, the sculpture with room</figcaption></figure></div>
${sections}</main></body></html>`;
  await writeFile(`shots/hud-paint-${name}-${screen.round}.html`, html);
  console.log(`shots/hud-paint-${name}-${screen.round}.html`);
}

const [mode, name = "battle", ...rest] = process.argv.slice(2);
const screen = SCREENS[name];
if (!screen) throw new Error(`no screen "${name}"; known: ${Object.keys(SCREENS).join(", ")}`);
const dir = `art/candidates/ui/paint/${name}-${screen.round}`;
await mkdir(dir, { recursive: true });
if (mode === "render") await render(name, screen, dir);
else if (mode === "paint") {
  const seeds = rest.map(Number).filter((n) => !Number.isNaN(n));
  await paint(name, screen, dir, rest.filter((a) => Number.isNaN(Number(a))), seeds.length > 0 ? seeds : [1, 2, 3]);
} else if (mode === "composite") await composite(name, rest[0] === "hires" ? `${dir}/hires` : dir);
else if (mode === "page") await page(name, screen, dir);
else if (mode === "hires" && rest[0]) await hires(name, screen, dir, rest[0]);
else if (mode === "fix") await fix(name, dir, rest);
else if (mode === "graft") await graft(name, dir);
else if (mode === "pieces") await cutPieces(name, dir, rest);
else throw new Error("usage: hud-paint.ts render|paint|composite [hires]|page|hires <file> <screen> [probe…] [seed…]");
