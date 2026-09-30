import { runBatch } from "#scripts/art/batch";

/**
 * The terrain in the user's gothic style, for the user to compare with the current terrain before anything is
 * replaced (2026-09-29): the user liked the mountains and the lighter trees, and the current terrain's framing
 * ("stylized, hand-painted") was Claude's. Ground textures seen from above, and terrain props framed for image-to-3D.
 */

const GOTHIC = "Dark gothic fantasy in the manner of Disciples II's art: rich and brooding, desaturated colors with dark accents, grim. Serious, adult, not cartoonish.";
const FLAT_LIGHT = "Flat, even, shadowless lighting, every surface showing its material's true color.";
const FOR_3D = `A single object, isolated and centered, the whole of it in frame with margin, three-quarter view from slightly above, plain flat light grey background, no ground, no mist or smoke, no text. ${FLAT_LIGHT}`;
const FOR_GROUND = `Seen from directly above, the texture fills the whole frame edge to edge, seamless, no objects standing up, no horizon, no text. ${FLAT_LIGHT}`;

const JOBS: readonly { readonly id: string; readonly prompt: string; readonly width: number; readonly height: number }[] = [
  { id: "ground-plain", prompt: `Ground texture of wild meadow grass, darker and duller green, with patches of bare earth and small stones. ${GOTHIC} ${FOR_GROUND}`, width: 1024, height: 1024 },
  { id: "ground-forest", prompt: `Ground texture of a forest floor: moss, dead leaves, pine needles and roots. ${GOTHIC} ${FOR_GROUND}`, width: 1024, height: 1024 },
  { id: "ground-hills", prompt: `Ground texture of rough dry grassland with pebbles, stones and pale dirt. ${GOTHIC} ${FOR_GROUND}`, width: 1024, height: 1024 },
  { id: "tree-oak", prompt: `A single broad old oak tree with a thick gnarled trunk, exposed roots and a full crown of deep green leaves. ${GOTHIC} ${FOR_3D}`, width: 1024, height: 1024 },
  { id: "tree-pine", prompt: `A single tall dark pine tree with layered drooping branches. ${GOTHIC} ${FOR_3D}`, width: 1024, height: 1024 },
  { id: "mountain", prompt: `A single steep rocky mountain peak of jagged grey stone with snow on its summit and scree at its base. ${GOTHIC} ${FOR_3D}`, width: 1024, height: 1024 },
  { id: "rock", prompt: `A cluster of three mossy grey boulders of different sizes. ${GOTHIC} ${FOR_3D}`, width: 1024, height: 1024 },
];

/** `pnpm tsx scripts/art/terrain-probe.ts [seed…]` */
const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch("art/candidates/terrain/terrain-probe", JOBS, seeds.length > 0 ? seeds : [1, 2]);
