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
  // Swamp, tundra, haunted woods (the user, 2026-10-12: "Add swamp, tundra, haunted woods"); evenly spread, as the desert's.
  { id: "swamp-plain", look: "Ground texture of dark sodden marsh: black mud, flattened brown reeds, small murky puddles and duckweed, evenly spread across the frame with no darker corners or edges." },
  { id: "swamp-forest", look: "Ground texture of a swamp forest floor: wet black mud, rotting leaves, twisted mangrove roots and green moss, evenly spread across the frame with no darker corners or edges." },
  { id: "swamp-hills", look: "Ground texture of boggy tussocks of coarse sedge grass in dark peat and standing water, evenly spread across the frame with no darker corners or edges." },
  { id: "swamp-mountain", look: "Ground texture of wet dark slate rock slick with green algae and moss, with cracks full of mud, evenly spread across the frame with no darker corners or edges." },
  { id: "tundra-plain", look: "Ground texture of frozen tundra: thin patchy snow over dull brown frost-bitten grass and grey lichen, evenly spread across the frame with no darker corners or edges." },
  { id: "tundra-forest", look: "Ground texture of a snowy pine forest floor: trampled snow, scattered dark pine needles, cones and twigs, evenly spread across the frame with no darker corners or edges." },
  { id: "tundra-hills", look: "Ground texture of wind-scoured snow crust over frozen gravel and tufts of dead grass, evenly spread across the frame with no darker corners or edges." },
  { id: "tundra-mountain", look: "Ground texture of grey granite rock half buried in hard packed snow and blue-white ice, evenly spread across the frame with no darker corners or edges." },
  { id: "haunted-plain", look: "Ground texture of dead grey grass and pale withered weeds on dark ashen soil, a few small bones, evenly spread across the frame with no darker corners or edges." },
  { id: "haunted-forest", look: "Ground texture of a dead forest floor: black rotting leaves, grey fungus, pale twisted roots and dark moss, evenly spread across the frame with no darker corners or edges." },
  { id: "haunted-hills", look: "Ground texture of cold grey earth with sparse dead thistles, crumbling stones and patches of pale ash, evenly spread across the frame with no darker corners or edges." },
  { id: "haunted-mountain", look: "Ground texture of dark weathered stone with pale grey lichen, cracks and scattered old bones, evenly spread across the frame with no darker corners or edges." },
];

/** `pnpm tsx scripts/art/ground.ts [id…] [seed…]`: the named grounds (all by default), each at the given seeds. */
const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
await runBatch(
  "art/candidates/terrain/ground",
  GROUNDS.filter((g) => ids.length === 0 || ids.includes(g.id)).map((g) => ({ id: g.id, prompt: `${g.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3],
);
