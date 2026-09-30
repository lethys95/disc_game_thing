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
  // The desert biome (user, 2026-09-30: a desert, mostly cosmetic): the same five terrains in sand and stone.
  // One dull tan sand for plain and dunes, so they blend; evenly spread, since dark corners repeat as a pattern.
  { id: "desert-plain", look: "Ground texture of wind-rippled dull tan sand, darker than bright beach sand, with scattered small stones, evenly spread across the frame with no darker corners or edges." },
  { id: "desert-forest", look: "Ground texture of dry, dull brown sandy earth strewn evenly with fallen dry palm fronds, twigs and dead leaves, evenly spread across the frame with no darker corners or edges." },
  { id: "desert-hills", look: "Ground texture of coarse dull tan sand and gravel with deep wind ripples, darker grains in the troughs, evenly spread across the frame with no darker corners or edges." },
  { id: "desert-mountain", look: "Ground texture of weathered sandstone bedrock and scree, layered and cracked, in ochre and rust tones." },
];

/** `pnpm tsx scripts/art/ground.ts [id…] [seed…]`: the named grounds (all by default), each at the given seeds. */
const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
await runBatch(
  "art/candidates/ground",
  GROUNDS.filter((g) => ids.length === 0 || ids.includes(g.id)).map((g) => ({ id: g.id, prompt: `${g.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3],
);
