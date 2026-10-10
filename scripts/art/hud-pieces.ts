import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { runBatch } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * The HUD's pieces, each made on its own from a short prompt (`docs/design/hud-pieces.md`): the object, its form, its
 * material, at most two accent colours, one phrase of finish and one of ornament; no mood words, no similes.
 * Content-bearing pieces are asked for straight on. The user cuts and cleans the picks.
 *
 *     pnpm tsx scripts/art/hud-pieces.ts <piece…> [seed…]   (a round of candidates into art/candidates/ui/pieces/<piece>/)
 *     pnpm tsx scripts/art/hud-pieces.ts page              (shots/hud-pieces.html: the kit sheet, every prompt as sent)
 *     pnpm tsx scripts/art/hud-pieces.ts install           (the user's cuts, art/cut/ui/<piece>.png, into assets/ui/pieces/)
 */

/** Dark pieces on white and light pieces on black, so the user's cut finds the edge. */
type Ground = "white" | "black";

interface Piece {
  readonly id: string;
  /** Where it goes in the game, for the review page. */
  readonly job: string;
  /** Its width in the game, in rem, so the kit sheet shows the picks side by side at their real sizes. */
  readonly shown: number;
  readonly prompt: string;
  readonly size: readonly [number, number];
  readonly ground: Ground;
  /** The candidate Claude would cut, by file name; the user's cut overrules it. */
  readonly pick?: string;
}

const PIECES: readonly Piece[] = [
  { id: "plate", pick: "plate-r4-2.png", job: "the unit card's name, the map's turn, the Capitol's facts, the title menu", shown: 18, size: [1536, 512], ground: "black", prompt: "A long name plate of cream marble, its face smooth and evenly pale with a few faint grey veins, its edges chipped and yellowed with age, set in a rim of blackened cast iron with a small leaf scroll at each end holding a faceted amber stud. Seen straight on, the face blank." },
  { id: "frame", pick: "frame-painted-r1-4.png", job: "the edge of every panel: warband and city panels, menus, the garrison", shown: 16, size: [1024, 1024], ground: "white", prompt: "A rectangular frame of blackened cast iron, worn smooth on its raised edges, a narrow moulded border with small brass rivets along it and a small leaf scroll at each corner holding a faceted amber stud. The inside is empty and flat black. Seen straight on." },
  { id: "button", pick: "button-painted-r1-1.png", job: "End turn's label, Auto-battle, Resolve now, menu entries", shown: 12, size: [1536, 512], ground: "white", prompt: "A wide flat button of dark oak, its bevelled face worn smooth and scratched, capped at both ends with bands of blackened iron held by brass rivets. Seen straight on, the face blank." },
  { id: "socket", pick: "socket-r3-2.png", job: "the battle's ability row, equipment", shown: 3.5, size: [1024, 1024], ground: "white", prompt: "A small square picture frame of blackened iron with a deep bevelled rim worn bright on its edge and a brass rivet at each corner, set into a square of dark scratched oak. The inside is a plain flat black square. Seen straight on." },
  { id: "rail", pick: "rail-r2-3.png", job: "the battle's turn order along the top", shown: 40, size: [1536, 384], ground: "white", prompt: "A long horizontal band of blackened cast iron, as tall as a hand, with a moulded rim along its top and bottom edges worn bright, brass rivets at even intervals and a small leaf scroll at each end. Seen straight on." },
  { id: "parchment", pick: "parchment-r4-2.png", job: "the right-click explanations, the battle log, the card's facts, save slots, codex pages", shown: 16, size: [1024, 1024], ground: "black", prompt: "A sheet of tan parchment, smooth and unfolded, its deckled edges darkened and a little torn, faint brown foxing near the edges and the middle plain, lying flat and square to the viewer, blank." },
  { id: "roller", pick: "roller-r2-3.png", job: "the rod the unit card and the log hang from", shown: 16, size: [1536, 512], ground: "white", prompt: "A long slim scroll rod of dark turned walnut, thin as a curtain rod, its varnish worn through where it is handled, with a small acorn finial of tarnished brass at each end, lying horizontal. Seen straight on." },
  { id: "seal", pick: "seal-painted-r3-4.png", job: "confirm and cancel inside documents", shown: 3.5, size: [1024, 1024], ground: "black", prompt: "A round seal of dull crimson wax with a thick uneven rim, a little cracked and worn, its face smooth and blank. Seen straight on." },
  { id: "ribbon", pick: "ribbon-painted-r1-2.png", job: "tabs: the codex's kinds, the Capitol's tabs", shown: 2.5, size: [768, 1536], ground: "black", prompt: "A bookmark ribbon of deep red silk, frayed a little at its swallowtail end, with gold edge stitching, hanging straight down. Seen straight on." },
  { id: "book", pick: "book-painted-r1-2.png", job: "the codex and the credits, lying square", shown: 44, size: [1536, 1024], ground: "black", prompt: "An open book lying flat on a dark wooden table, seen from directly above and square to the viewer: two blank pages of cream parchment, foxed at the edges, a cover of scuffed oxblood leather showing around them, tarnished brass corner pieces." },
  { id: "bell", pick: "bell-painted-r3-2.png", job: "End turn on the map", shown: 5, size: [1024, 1024], ground: "white", prompt: "A small hand bell of tarnished dark bronze with a band of engraved leaves around its waist and a turned black wooden handle worn pale where it is held, standing upright. Seen straight on." },
  { id: "closed-book", pick: "closed-book-painted-r1-4.png", job: "Menu on the map and in battle", shown: 3.5, size: [1024, 1024], ground: "white", prompt: "A small closed book bound in scuffed oxblood leather with blind-tooled lines on its cover, tarnished brass corner pieces and a brass clasp, standing upright. Seen straight on." },
  { id: "vial", pick: "vial-r2-4.png", job: "mana beside the turn", shown: 3, size: [1024, 1024], ground: "white", prompt: "A small reliquary vial of red glass between two caps of tarnished silver, a tiny silver rose on the upper cap and a band of engraved leaves on the lower, standing upright. Seen straight on." },
  { id: "coins", pick: "coins-r3-4.png", job: "gold beside the turn", shown: 3, size: [1024, 1024], ground: "white", prompt: "A small heap of worn gold coins, each stamped with a small crown, their rims nicked and their faces rubbed by handling. Seen straight on." },
  { id: "candle", pick: "candle-painted-r1-4.png", job: "the battle's round", shown: 4, size: [1024, 1024], ground: "black", prompt: "A white wax candle half burned down in a small blackened iron holder with a ring handle, lit, wax run down its side. Seen straight on." },
  { id: "gem", pick: "gem-r2-4.png", job: "a settings toggle; lit (on) and dark (off) in CSS: a piece lights up, it doesn't change", shown: 2, size: [1024, 1024], ground: "white", prompt: "A small oval cabochon of amber glass in a bezel of blackened iron with a beaded rim. Seen straight on." },
  { id: "portrait-arch", pick: "portrait-arch-painted-r1-1.png", job: "every Jilliath face: card, turn order, warband, codex", shown: 5, size: [1024, 1536], ground: "white", prompt: "A tall portrait frame shaped as a pointed lancet arch of blackened cast iron, worn bright on its edges, a thin band of red stained glass in lead around the opening, the opening empty and black. Seen straight on." },
  { id: "rose-window", pick: "rose-window-painted-r1-1.png", job: "the empty mark: an empty cell or socket", shown: 3, size: [1024, 1024], ground: "white", prompt: "A small round rose window of blackened iron tracery, its six petals filled with dull red glass, one pane cracked. Seen straight on." },
  { id: "sealed-band", pick: "sealed-band-r3-2.png", job: "locked: research not yet open", shown: 12, size: [1536, 512], ground: "white", prompt: "A flat band of blackened cast iron worn smooth, a domed brass rivet head at each end, with a crimson wax seal pressed over its middle. Seen straight on." },
  { id: "angel-corbel", pick: "angel-corbel-r1-1.png", job: "the one small angel: under the map's turn plate, holding it up", shown: 5, size: [1024, 1024], ground: "black", prompt: "A small stone corbel carved as an angel's head with folded wings spread flat beneath a square ledge it holds up, pale weathered limestone with traces of old gilding in the feathers. Seen straight on." },
  { id: "still-life", pick: "still-life-r2-4.png", job: "the title screen", shown: 60, size: [1536, 864], ground: "black", prompt: "A still life on a scarred dark wooden table at night, seen straight on: a tarnished bronze hand bell, a closed book bound in scuffed oxblood leather, a letter sealed with crimson wax, a half-burned candle in an iron holder, a small vial of red glass. The objects are gathered at the right of the table; its left half is bare and in deep shadow." },
];

const DIR = "art/candidates/ui/pieces";

/**
 * The technique, the user's pick of round 2 (2026-10-10: "r3 seems to be the best"), and one light for every piece:
 * pieces made one at a time otherwise drift apart in their lighting.
 */
const TECHNIQUE = "Painted as game interface art, lit from the upper left.";

/** What every prompt ends with: the technique, the ground for the cut, and no lettering on a piece text will sit on. */
const sent = (piece: Piece): string =>
  piece.id === "still-life" ? `${piece.prompt} ${TECHNIQUE}` : `${piece.prompt} ${TECHNIQUE} On a plain ${piece.ground} background. No text, no letters.`;

/** 1rem at 1080p (`rootFontSize`). */
const REM_PX = 21.6;

async function page(): Promise<void> {
  const rows = await Promise.all(
    PIECES.map(async (piece) => {
      const made: Candidate[] = JSON.parse(await readFile(`${DIR}/${piece.id}/manifest.json`, "utf8").catch(() => "[]"));
      const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      // One row per prompt as sent, newest first: earlier rounds stay on the page with their own words.
      const groups = (all: readonly Candidate[]) => {
        if (all.length === 0) return `<p class="prompt">${escape(sent(piece))}</p><p class="muted">Not generated yet.</p>`;
        const prompts = [...new Set(all.map((m) => m.prompt))].reverse();
        return prompts.map((prompt) => {
          const cells = all.filter((m) => m.prompt === prompt).map((m) => `<figure><a href="/${DIR}/${piece.id}/${m.file}" target="_blank"><img loading="lazy" src="/${DIR}/${piece.id}/${m.file}"></a><figcaption>${m.file}</figcaption></figure>`).join("");
          return `<p class="prompt">${escape(prompt)}</p><div class="row">${cells}</div>`;
        }).join("");
      };
      return `<section><h2>${piece.id}</h2><p class="muted">${escape(piece.job)}</p>${groups(made)}</section>`;
    }),
  );
  // The drift check (hud-pieces.md, plan step 3): every pick at its width in the game, side by side.
  const picked = PIECES.filter((p) => p.pick !== undefined);
  const kit = picked.map((p) => `<figure class="kit"><img src="/${DIR}/${p.id}/${p.pick}" style="width:${Math.round(p.shown * REM_PX)}px"><figcaption>${p.id}: ${p.pick}</figcaption></figure>`).join("");
  const waiting = PIECES.filter((p) => p.pick === undefined).map((p) => p.id).join(", ");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HUD pieces</title><style>
body{margin:0;background:#0d0b0b;color:#e6ddcc;font:15px/1.5 Georgia,serif}main{max-width:1500px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:28px;margin:0 0 6px}h2{font-size:20px;margin:30px 0 6px;border-bottom:1px solid #2a2420;padding-bottom:4px}
.prompt{font:13px/1.5 ui-monospace,monospace;color:#cbbfa9;background:#171312;padding:8px 10px}.muted{color:#8a7f70}
.row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{margin:0}img{width:100%;display:block;border:1px solid #2a2420;background:#222}
figcaption{color:#9a8f80;font-size:12px}.kits{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px;background:#0b0a0c;padding:14px;border:1px solid #2a2420}.kit img{max-width:100%;border:0}@media(max-width:900px){.row{grid-template-columns:1fr 1fr}}</style></head><body><main>
<h1>HUD pieces, one at a time</h1><p class="muted">Each piece from its own short prompt, shown exactly as sent (<code>scripts/art/hud-pieces.ts</code>; the plan: <code>docs/design/hud-pieces.md</code>). Uncut; the picks are yours to cut.</p>
<h2>The kit sheet</h2><p class="muted">Claude's pick of each piece so far, at its width in the game at 1080p, uncut: do they belong together? Not picked yet: ${waiting}.</p><div class="kits">${kit}</div>
${rows.join("")}</main></body></html>`;
  await writeFile("shots/hud-pieces.html", html);
  console.log("shots/hud-pieces.html");
}

/** 1rem at the largest automatic scale (`rootFontSize`'s 2.5 × 16px), so a piece is never upscaled. */
const REM_PX_MAX = 40;

/** Installs every cut that exists, as `--ui-pieces-<piece>` (the `assets/ui` glob), and prints its size for the slices. */
async function install(): Promise<void> {
  await mkdir("assets/ui/pieces", { recursive: true });
  for (const piece of PIECES) {
    const cut = `art/cut/ui/${piece.id}.png`;
    if (!(await access(cut).then(() => true, () => false))) continue;
    const out = `assets/ui/pieces/${piece.id}.webp`;
    const info = await sharp(cut).resize({ width: Math.round(piece.shown * REM_PX_MAX), withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toFile(out);
    console.log(`${out}: ${info.width}x${info.height}`);
  }
}

const args = process.argv.slice(2);
if (args[0] === "page") await page();
else if (args[0] === "install") await install();
else {
  const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
  const ids = args.filter((a) => Number.isNaN(Number(a)));
  const chosen = PIECES.filter((p) => ids.includes(p.id));
  if (chosen.length === 0) throw new Error(`name pieces: ${PIECES.map((p) => p.id).join(", ")}`);
  for (const piece of chosen) {
    // Each round its own file names, so an earlier round's candidates stay beside the new ones.
    const round = (await readFile(`${DIR}/${piece.id}/manifest.json`, "utf8").then((t): Candidate[] => JSON.parse(t), () => [])).reduce((n, m) => Math.max(n, Number(/-r(\d+)-/.exec(m.file)?.[1] ?? 1)), 0) + 1;
    await runBatch(`${DIR}/${piece.id}`, [{ id: `${piece.id}-r${round}`, prompt: sent(piece), width: piece.size[0], height: piece.size[1] }], seeds.length > 0 ? seeds : [1, 2, 3, 4]);
  }
}
