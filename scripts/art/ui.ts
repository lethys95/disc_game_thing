import { runBatch } from "#scripts/art/batch";

/**
 * UI kit pieces (`assets/ui/`), after the user's reference (`docs/design/references/disciples2-city.png`): carved
 * dark metal and stone. Frames are drawn as a border around a flat empty center, so CSS `border-image` can stretch
 * them to any size. The screens painted as one picture have their pieces from `hud-paint.ts` instead.
 * `pnpm tsx scripts/art/ui.ts [id…] [seed…]`
 */

const FLAT = "Flat front view, perfectly symmetrical, centered, even lighting, plain flat mid grey background around it. Game interface art, no text, no letters.";

const PIECES = [
  {
    id: "button",
    look: "A wide horizontal game button: a slab of dark carved stone with a raised bevelled face and a thin tarnished iron rim with small rivets at the corners. The face is plain and blank.",
    size: [1536, 512],
  },
  // Surfaces that fill a screen's gaps (the user, 2026-09-27: "a lot of blind spots that aren't filled").
  {
    id: "backdrop",
    look: "A seamless texture of a dark carved stone wall seen straight on: large weathered blocks with faint gothic relief carvings and deep mortar lines, almost black, subtle and low contrast, even lighting, filling the whole frame.",
    size: [1024, 1024],
  },
  // Emblems for the city screen's tab niches: engraved silver.
  { id: "icon-city", look: "A single emblem in tarnished engraved silver relief: a gothic castle keep with three towers and a gate, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-garrison", look: "A single emblem in tarnished engraved silver relief: two crossed swords over a kite shield, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-research", look: "A single emblem in tarnished engraved silver relief: an open ancient book with a quill, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-spells", look: "A single emblem in tarnished engraved silver relief: a crescent moon cradling a four-pointed star, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  // The battle card's instruments, each value its own shape (`docs/design/hud-kit.md`), in the tab emblems' silver.
  { id: "icon-armor", look: "A single emblem in tarnished engraved silver relief: a plain heraldic shield with a pointed base, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-initiative", look: "A single emblem in tarnished engraved silver relief: an hourglass in a simple frame, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-power", look: "A single emblem in tarnished engraved silver relief: a round disc ringed with straight rays like a sun, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-hits", look: "A single emblem in tarnished engraved silver relief: a straight sword pointing up, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  // The health's seal at the channel's end: the current number sits on its dark centre.
  { id: "icon-seal", look: "A single emblem in tarnished engraved silver relief: a plain round ring with a raised rim, its centre a smooth flat disc of dark stone, blank, bold simple silhouette, filling the frame.", size: [1024, 1024] },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
const chosen = ids.length > 0 ? PIECES.filter((p) => ids.includes(p.id)) : PIECES;
await runBatch(
  "art/candidates/ui/kit",
  chosen.map((p) => ({ id: p.id, prompt: `${p.look} ${FLAT}`, width: p.size[0] ?? 1024, height: p.size[1] ?? 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3, 4],
);
