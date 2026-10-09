import { runBatch } from "#scripts/art/batch";

/**
 * UI kit pieces (`assets/ui/`), after the user's reference (`docs/design/references/disciples2-city.png`): carved
 * dark metal and stone, round buttons, pale marble plaques. Frames and plaques are drawn as a border around a flat
 * empty center, so CSS `border-image` can stretch them to any size. `pnpm tsx scripts/art/ui.ts [id…] [seed…]`
 */

const FLAT = "Flat front view, perfectly symmetrical, centered, even lighting, plain flat mid grey background around it. Game interface art, no text, no letters.";

const PIECES = [
  {
    id: "frame",
    look: "An ornate square picture frame border of dark carved iron and black stone, heavy gothic filigree, small riveted studs and a tiny carved skull at each corner. The inside of the frame is completely flat plain black, empty.",
    size: [1024, 1024],
  },
  {
    id: "plaque",
    look: "A wide horizontal name plaque: a smooth pale grey veined marble panel set in a thin dark carved iron rim with a small ornament at each end. The marble face is blank and smooth.",
    size: [1536, 512],
  },
  {
    id: "button",
    look: "A wide horizontal game button: a slab of dark carved stone with a raised bevelled face and a thin tarnished iron rim with small rivets at the corners. The face is plain and blank.",
    size: [1536, 512],
  },
  {
    id: "medallion",
    look: "A round game button: a heavy circular medallion of dark carved iron with a ring of small studs and a thin engraved border, the center a smooth dark polished stone disc, blank.",
    size: [1024, 1024],
  },
  // Surfaces that fill a screen's gaps (the user, 2026-09-27: "a lot of blind spots that aren't filled").
  {
    id: "backdrop",
    look: "A seamless texture of a dark carved stone wall seen straight on: large weathered blocks with faint gothic relief carvings and deep mortar lines, almost black, subtle and low contrast, even lighting, filling the whole frame.",
    size: [1024, 1024],
  },
  {
    id: "plate",
    look: "A seamless texture of a dark iron panel seen straight on: hammered black metal with faint engraved filigree and a few small rivets, subtle and low contrast, even lighting, filling the whole frame.",
    size: [1024, 1024],
  },
  // Emblems for the city screen's tab medallions: engraved silver on the medallion's dark stone.
  { id: "icon-city", look: "A single emblem in tarnished engraved silver relief: a gothic castle keep with three towers and a gate, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-garrison", look: "A single emblem in tarnished engraved silver relief: two crossed swords over a kite shield, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-research", look: "A single emblem in tarnished engraved silver relief: an open ancient book with a quill, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  { id: "icon-spells", look: "A single emblem in tarnished engraved silver relief: a crescent moon cradling a four-pointed star, bold simple silhouette, filling the frame.", size: [1024, 1024] },
  // A broader kit (the user, 2026-10-06: "Think 'grotesque'. Stone part of a building shaped like an angel, but built
  // into the hud instead"; `docs/design/art.md`): architectural sculpture grown into the panels, so they stop all
  // looking alike. The corner is drawn for the top-left and mirrored for the right; the end cap for the left end.
  {
    id: "corner-angel",
    look: "A gothic stone grotesque built into the top left corner of a dark carved iron frame: a hooded angel of weathered black stone crouches in the corner with its head bowed, its folded wings running along the top edge and down the left edge of the frame. Only the corner, the rest empty.",
    size: [1024, 1024],
  },
  {
    id: "endcap",
    look: "A carved end cap for the left end of a horizontal bar: a heavy bracket of dark carved iron and black stone with a small grotesque face in relief and gothic filigree, its right side cut straight where the bar continues.",
    size: [1024, 1024],
  },
  {
    id: "frame-tracery",
    look: "An ornate square frame border of black stone carved as gothic cathedral tracery: pointed arches, quatrefoils and crockets along all four sides, a small hooded stone angel at each corner. The inside of the frame is completely flat plain black, empty.",
    size: [1024, 1024],
  },
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
