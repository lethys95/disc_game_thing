import { readFile, writeFile } from "node:fs/promises";
import { runBatch } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * The HUD's pieces, each made on its own from a short prompt (`docs/design/hud-pieces.md`): the object, its form, its
 * material and at most two accent colours; no mood or style words, no similes. Content-bearing pieces are asked for
 * straight on. The user cuts and cleans the picks.
 *
 *     pnpm tsx scripts/art/hud-pieces.ts <piece…> [painted] [seed…]   (a round of candidates into art/candidates/ui/pieces/<piece>/)
 *     pnpm tsx scripts/art/hud-pieces.ts page                 (shots/hud-pieces.html: every prompt as sent, its candidates)
 */

/** Dark pieces on white and light pieces on black, so the user's cut finds the edge. */
type Ground = "white" | "black";

interface Piece {
  readonly id: string;
  readonly prompt: string;
  readonly size: readonly [number, number];
  readonly ground: Ground;
}

const PIECES: readonly Piece[] = [
  { id: "plate", size: [1536, 512], ground: "black", prompt: "A long name plate of cream marble with grey veins, its edges chipped and yellowed with age, set in a rim of blackened cast iron with a small leaf scroll at each end holding a faceted amber stud. Seen straight on, the face blank." },
  { id: "frame", size: [1024, 1024], ground: "white", prompt: "A rectangular frame of blackened iron with a narrow moulded edge, small brass rivets along it and a faceted amber stud at each corner. The inside is empty and flat black. Seen straight on." },
  { id: "button", size: [1536, 512], ground: "white", prompt: "A wide flat button of dark oak with a bevelled face, capped at both ends with bands of blackened iron and brass rivets. Seen straight on, the face blank." },
  { id: "socket", size: [1024, 1024], ground: "white", prompt: "A square socket of blackened iron set into dark oak, a deep bevelled rim with a brass rivet at each corner, the inside empty and black. Seen straight on." },
  { id: "rail", size: [1536, 384], ground: "white", prompt: "A long horizontal bar of blackened iron with a slim moulded profile and brass rivets at even intervals. Seen straight on." },
  { id: "parchment", size: [1024, 1024], ground: "black", prompt: "A sheet of tan parchment, creased and handled, with deckled darkened edges, faint brown foxing and a small tear at one edge, lying flat and square to the viewer, blank." },
  { id: "roller", size: [1536, 512], ground: "white", prompt: "A turned scroll roller of honey-coloured wood with a round knob at each end, lying horizontal. Seen straight on." },
  { id: "seal", size: [1024, 1024], ground: "black", prompt: "A round seal of dull crimson wax with a thick uneven rim, a little cracked and worn, its face smooth and blank. Seen straight on." },
  { id: "ribbon", size: [768, 1536], ground: "black", prompt: "A bookmark ribbon of deep red silk with gold edge stitching and a swallowtail end, hanging straight down. Seen straight on." },
  { id: "book", size: [1536, 1024], ground: "black", prompt: "An open book lying flat on a dark wooden table, seen from directly above and square to the viewer: two blank pages of cream parchment, a cover of oxblood leather showing around them, brass corner pieces." },
  { id: "bell", size: [1024, 1024], ground: "white", prompt: "A small hand bell of tarnished dark bronze with a band of engraved leaves around its waist and a turned black wooden handle worn pale where it is held, standing upright. Seen straight on." },
  { id: "closed-book", size: [1024, 1024], ground: "white", prompt: "A small closed book bound in oxblood leather with brass corner pieces and a brass clasp, standing upright. Seen straight on." },
  { id: "vial", size: [1024, 1024], ground: "white", prompt: "A small reliquary vial of red glass between two silver caps, a tiny silver rose on the upper cap, standing upright. Seen straight on." },
  { id: "coins", size: [1024, 1024], ground: "white", prompt: "A small heap of worn gold coins. Seen straight on." },
  { id: "candle", size: [1024, 1024], ground: "black", prompt: "A white wax candle in a small blackened iron holder, lit, a drip of wax down its side. Seen straight on." },
  { id: "gem-lit", size: [1024, 1024], ground: "white", prompt: "A small oval cabochon of red glass in a blackened iron bezel, glowing from inside. Seen straight on." },
  { id: "gem-unlit", size: [1024, 1024], ground: "white", prompt: "A small oval cabochon of red glass in a blackened iron bezel, dark and unlit. Seen straight on." },
  { id: "portrait-arch", size: [1024, 1536], ground: "white", prompt: "A tall portrait frame shaped as a pointed lancet arch of blackened iron, a thin band of red stained glass in lead around the opening, the opening empty and black. Seen straight on." },
  { id: "rose-window", size: [1024, 1024], ground: "white", prompt: "A small round rose window of blackened iron tracery filled with dull red glass. Seen straight on." },
  { id: "sealed-band", size: [1536, 512], ground: "white", prompt: "A flat band of blackened iron with a crimson wax seal pressed over its middle. Seen straight on." },
  { id: "still-life", size: [1536, 864], ground: "black", prompt: "A still life on a dark wooden table at night, seen straight on: a bronze hand bell, a closed book bound in oxblood leather, a letter sealed with crimson wax, a lit candle in an iron holder, a small vial of red glass." },
];

const DIR = "art/candidates/ui/pieces";

/**
 * A style probe, the user's call (memory: no-silent-style): the same piece with and without this line. Short prompts
 * alone came out as studio photographs (test 1, 2026-10-10).
 */
const PAINTED = "Painted as game interface art.";

/** What every prompt ends with: the ground for the cut, and no lettering on a piece text will sit on. */
const sent = (piece: Piece, painted: boolean): string => {
  const body = painted ? `${piece.prompt} ${PAINTED}` : piece.prompt;
  return piece.id === "still-life" ? body : `${body} On a plain ${piece.ground} background. No text, no letters.`;
};

async function page(): Promise<void> {
  const rows = await Promise.all(
    PIECES.map(async (piece) => {
      const made: Candidate[] = JSON.parse(await readFile(`${DIR}/${piece.id}/manifest.json`, "utf8").catch(() => "[]"));
      const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      // One row per prompt as sent, newest first: earlier rounds stay on the page with their own words.
      const groups = (all: readonly Candidate[]) => {
        if (all.length === 0) return `<p class="prompt">${escape(sent(piece, false))}</p><p class="muted">Not generated yet.</p>`;
        const prompts = [...new Set(all.map((m) => m.prompt))].reverse();
        return prompts.map((prompt) => {
          const cells = all.filter((m) => m.prompt === prompt).map((m) => `<figure><a href="/${DIR}/${piece.id}/${m.file}" target="_blank"><img loading="lazy" src="/${DIR}/${piece.id}/${m.file}"></a><figcaption>${m.file}</figcaption></figure>`).join("");
          return `<p class="prompt">${escape(prompt)}</p><div class="row">${cells}</div>`;
        }).join("");
      };
      return `<section><h2>${piece.id}</h2>${groups(made)}</section>`;
    }),
  );
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HUD pieces</title><style>
body{margin:0;background:#0d0b0b;color:#e6ddcc;font:15px/1.5 Georgia,serif}main{max-width:1500px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:28px;margin:0 0 6px}h2{font-size:20px;margin:30px 0 6px;border-bottom:1px solid #2a2420;padding-bottom:4px}
.prompt{font:13px/1.5 ui-monospace,monospace;color:#cbbfa9;background:#171312;padding:8px 10px}.muted{color:#8a7f70}
.row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{margin:0}img{width:100%;display:block;border:1px solid #2a2420;background:#222}
figcaption{color:#9a8f80;font-size:12px}@media(max-width:900px){.row{grid-template-columns:1fr 1fr}}</style></head><body><main>
<h1>HUD pieces, one at a time</h1><p class="muted">Each piece from its own short prompt, shown exactly as sent (<code>scripts/art/hud-pieces.ts</code>; the plan: <code>docs/design/hud-pieces.md</code>). Uncut; the picks are yours to cut.</p>
${rows.join("")}</main></body></html>`;
  await writeFile("shots/hud-pieces.html", html);
  console.log("shots/hud-pieces.html");
}

const args = process.argv.slice(2);
if (args[0] === "page") await page();
else {
  const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
  const painted = args.includes("painted");
  const ids = args.filter((a) => Number.isNaN(Number(a)) && a !== "painted");
  const chosen = PIECES.filter((p) => ids.includes(p.id));
  if (chosen.length === 0) throw new Error(`name pieces: ${PIECES.map((p) => p.id).join(", ")}`);
  for (const piece of chosen) {
    // Each round its own file names, so an earlier round's candidates stay beside the new ones.
    const round = (await readFile(`${DIR}/${piece.id}/manifest.json`, "utf8").then((t): Candidate[] => JSON.parse(t), () => [])).reduce((n, m) => Math.max(n, Number(/-r(\d+)-/.exec(m.file)?.[1] ?? 1)), 0) + 1;
    const id = `${piece.id}${painted ? "-painted" : ""}-r${round}`;
    await runBatch(`${DIR}/${piece.id}`, [{ id, prompt: sent(piece, painted), width: piece.size[0], height: piece.size[1] }], seeds.length > 0 ? seeds : [1, 2, 3, 4]);
  }
}
