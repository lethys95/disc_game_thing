import { runBatch } from "#scripts/art/batch";

/**
 * Ground textures for the tops of map hexes (`assets/ground/<terrain>-<n>.webp`): seen straight from above,
 * evenly lit, filling the frame, so a hex shows its terrain at a glance. `pnpm tsx scripts/art/ground.ts [seeds…]`
 */

// The user's gothic style (2026-09-29; `design/art.md`), shadowless so the scene does the lighting.
const FRAMING =
  "Seen from directly above, flat, even, shadowless lighting, no horizon, no objects standing up, the texture fills the whole frame edge to edge, seamless, no text. " +
  "Dark gothic fantasy in the manner of Disciples II's art: rich and brooding, desaturated colors with dark accents, grim. Serious, adult, not cartoonish.";

const GROUNDS = [
  { id: "plain", look: "Ground texture of wild meadow grass, darker and duller green, with patches of bare earth and small stones." },
  { id: "forest", look: "Ground texture of a forest floor: moss, dead leaves, pine needles and roots." },
  { id: "hills", look: "Ground texture of rough dry grassland with scattered pebbles, stones and patches of pale dirt." },
  { id: "mountain", look: "Ground texture of grey mountain rock and gravel with cracks, lichen and small patches of snow." },
];

const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch(
  "art/candidates/ground",
  GROUNDS.map((g) => ({ id: g.id, prompt: `${g.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3],
);
