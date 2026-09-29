import { runBatch } from "#scripts/art/batch";

/**
 * Concepts for the Wastes' (Vexumphat) Capitol, after the user's reference (design/factions/vexumphat.md, 2026-09-29):
 * a pale, ghostly, ornate palace in the manner of Scorn's castle, read through the faction's canon. Framed for
 * image-to-3D like the other props. Three directions, so the user can pick one.
 */

const FRAMING =
  "A single game miniature, isolated and centered, the whole object in frame with margin around it, three-quarter view from slightly above, " +
  "plain flat light grey background, soft even studio lighting, no ground, no cast shadow, no text. Dark fantasy, eerie and solemn, muted colors, intricate detail.";

const DIRECTIONS: readonly { readonly id: string; readonly look: string }[] = [
  // For image-to-3D (2026-09-29): TRELLIS.2 turned the concepts' mist into solid sheets and their filigree into lumps.
  // No mist (the game adds its own fog), and bold, thick forms.
  {
    id: "solid",
    look: "The capitol of a ghostly faction: a towering, symmetrical cathedral-palace of pale bone-white stone and porcelain, ornate yet organic, with thick sculpted curves like vertebrae and ribs, a few bold tall spires, broad stairs sweeping up to a great sealed gate. Solid, bold, chunky forms, no thin details. No mist, no smoke, no fog. Unsettling, almost right but wrong.",
  },
  {
    id: "scorn",
    look: "The capitol of a ghostly faction: a towering, symmetrical cathedral-palace of pale bone-white stone and porcelain, ornate yet organic, its curves like vertebrae and ribs, crowned by tall slender spires, stairs sweeping up to a great sealed gate, wisps of pale mist clinging to it. Unsettling, almost right but wrong.",
  },
  {
    id: "desert",
    look: "The capitol of restless spirits in an ancient desert: a towering palace-tomb of pale weathered sandstone and cracked porcelain, ornate and organic like bone, built over the ruins of an ancient Egyptian temple with colossal statues and obelisks, tall spires, ghostly mist pouring from its gates.",
  },
  {
    id: "ethereal",
    look: "A haunted palace for ethereal spirits: a tall, pale, porcelain-white cathedral with ornate organic buttresses like ribs and bones, cracked and bleeding thin dark lines, hollow arched windows glowing faint pale yellow, spectral mist drifting around its spires.",
  },
];

/** `pnpm tsx scripts/art/wastes.ts [seed…]` */
const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch(
  "art/candidates/wastes",
  DIRECTIONS.map((d) => ({ id: `capitol-${d.id}`, prompt: `${d.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3, 4],
);
