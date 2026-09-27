import { runBatch } from "#scripts/art/batch";

/**
 * Ground textures for the tops of map hexes (`assets/art/ground/<terrain>-<n>.webp`): seen straight from above,
 * evenly lit, filling the frame, so a hex shows its terrain at a glance. `pnpm tsx scripts/art/ground.ts [seeds…]`
 */

const FRAMING = "Seen from directly above, flat and even lighting, no shadows, no horizon, no objects standing up, the texture fills the whole frame edge to edge. Stylized hand-painted game texture, no text.";

const GROUNDS = [
  { id: "plain", look: "Ground texture of lush short green grass with clover, a few tiny wildflowers and small patches of bare earth." },
  { id: "forest", look: "Ground texture of a dark forest floor: moss, fallen leaves, pine needles, small ferns and twisting roots." },
  { id: "hills", look: "Ground texture of rough dry grassland with scattered pebbles, stones and patches of pale dirt." },
  { id: "mountain", look: "Ground texture of grey mountain rock and gravel with cracks, lichen and small patches of snow." },
];

const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch(
  "art/candidates/ground",
  GROUNDS.map((g) => ({ id: g.id, prompt: `${g.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3],
);
