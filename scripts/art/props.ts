import { runBatch } from "#scripts/art/batch";

/**
 * Concept images for map props, framed for image-to-3D (docs/design/asset-pipeline.md): one whole object, a
 * three-quarter view from slightly above, centered on a plain light background with soft even light, so the mesh
 * generator sees the full silhouette and no cast shadows.
 */

const FRAMING =
  "A single game miniature, isolated and centered, the whole object in frame with margin around it, three-quarter view from slightly above, " +
  "plain flat light grey background, soft even studio lighting, no ground, no cast shadow, no text. Stylized dark fantasy, hand-painted textures, chunky readable shapes.";

/** Keyed by the model slot each fills (`assets/models/<slot>.glb`, `src/view/models.ts`). */
const PROPS: readonly { readonly slot: string; readonly look: string }[] = [
  {
    slot: "site/capitol-jilliath",
    look: "The capitol fortress of a zealous human inquisition: a compact walled cathedral-keep of pale weathered stone with dark slate spires, blood red banners, a great rose window, heavy buttresses and a gatehouse.",
  },
  {
    slot: "site/capitol-nexus",
    // The user (2026-09-27): a haughty noble house of arcane inventors, high society, darker than high elves; not worn.
    look: "The capitol palace of a haughty arcane noble house: an elegant, towering citadel of polished dark marble and pale stone with gilded trim, slender soaring spires, grand arches and balconies, arcane inventions built into it (brass orreries, lightning rods), and a great teal lightning coil crackling at its peak. Opulent, immaculate and cold.",
  },
  {
    slot: "site/city",
    look: "A small walled medieval town: a few stone houses with dark slate roofs huddled together, a squat watchtower, a wooden gate, weathered, patched and repaired.",
  },
  {
    slot: "structure/mage",
    look: "A mage merchant's tower: a slender, slightly crooked stone tower with a pointed dark roof, a glowing violet crystal floating above the top, small arched windows lit from inside, a wooden door with a hanging lantern.",
  },
  {
    slot: "structure/merchant",
    look: "A travelling merchant's stall: a sturdy wooden cart and counter under a patched ochre canvas awning, stacked crates and barrels, hanging lanterns, wares on display.",
  },
  {
    slot: "structure/mercenaries",
    look: "A mercenary camp: two worn canvas tents, a weapon rack with spears and axes, a smouldering campfire, a tattered dark red banner on a pole, a short palisade of sharpened stakes.",
  },
  {
    slot: "node/gold",
    look: "A small gold mine: a timber-framed mine entrance cut into a rocky outcrop, a minecart heaped with glittering gold ore, a lantern on a post.",
  },
  {
    slot: "node/blacksmith",
    look: "A blacksmith's forge: a small stone smithy with a glowing orange furnace, a heavy anvil in front, a water barrel, tongs and hammers hanging on the wall.",
  },
  {
    slot: "node/mana",
    look: "A mana well: a ring of weathered, rune-carved standing stones around a cluster of tall glowing pale blue crystals.",
  },
  {
    slot: "node/cathedral",
    look: "A small chapel: a weathered stone chapel with a bell tower and a rose window, warm candlelight glowing inside, a few tilted gravestones beside it.",
  },
  {
    slot: "lair/dungeon",
    look: "A dungeon entrance: a dark cave mouth framed by an ancient carved stone archway set into a mossy rock mound, broken steps leading down into the dark, a skull on a pike.",
  },
];

/** `pnpm tsx scripts/art/props.ts [slot…] [seed…]`: the named slots (all by default), each at the given seeds. */
const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const slots = args.filter((a) => Number.isNaN(Number(a)));
const chosen = slots.length > 0 ? PROPS.filter((p) => slots.includes(p.slot)) : PROPS;
await runBatch(
  "art/candidates/props",
  chosen.map((p) => ({ id: p.slot.replace("/", "_"), prompt: `${p.look} ${FRAMING}`, width: 1024, height: 1024 })),
  seeds.length > 0 ? seeds : [1, 2, 3, 4],
);
