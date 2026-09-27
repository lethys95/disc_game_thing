import { runBatch } from "#scripts/art/batch";

/**
 * Concept images for map props, framed for image-to-3D (docs/design/asset-pipeline.md): one whole object, a
 * three-quarter view from slightly above, centered on a plain light background with soft even light, so the mesh
 * generator sees the full silhouette and no cast shadows. `pnpm tsx scripts/art/props.ts [seeds…]`
 */

const FRAMING =
  "A single game miniature, isolated and centered, the whole object in frame with margin around it, three-quarter view from slightly above, " +
  "plain flat light grey background, soft even studio lighting, no ground, no cast shadow, no text. Stylized dark fantasy, hand-painted textures, chunky readable shapes.";

const PROPS = [
  {
    id: "capitol-jilliath",
    look: "The capitol fortress of a zealous human inquisition: a compact walled cathedral-keep of pale weathered stone with dark slate spires, blood red banners, a great rose window, heavy buttresses and a gatehouse.",
  },
  {
    id: "mage",
    look: "A mage merchant's tower: a slender, slightly crooked stone tower with a pointed dark roof, a glowing violet crystal floating above the top, small arched windows lit from inside, a wooden door with a hanging lantern.",
  },
];

const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch(
  "art/candidates/props",
  PROPS.map((p) => ({ id: p.id, prompt: `${p.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3, 4],
);
