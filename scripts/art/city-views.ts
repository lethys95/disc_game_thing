import { runBatch } from "#scripts/art/batch";

/**
 * Placeholder city views (`assets/city/<slot>.webp`): a painting of the city from the inside, shown in the city
 * screen's frame until the montage the user wants exists (`docs/design/capitol-screen.md`).
 * `pnpm tsx scripts/art/city-views.ts [slot…] [seed…]`
 */

const FRAMING =
  "A wide establishing view from inside the city walls, painted like a fantasy strategy game's town screen: rich, detailed and atmospheric, dusk light, townsfolk small in the streets. No text, no letters, no frame.";

const VIEWS = [
  {
    slot: "capitol-jilliath",
    look: "The capitol of a zealous human inquisition: a steep street of pale stone houses with dark slate roofs climbing to a great cathedral-keep with a rose window and spires, blood red banners on every wall, braziers, a procession of hooded devotees.",
  },
  {
    slot: "capitol-nexus",
    look: "The capitol of a haughty arcane noble house of inventors: an elegant plaza of polished dark marble and pale stone with gilded trim, slender spires and balconies, brass orreries and lightning rods on the towers, a great teal lightning coil crackling above the palace, finely dressed nobles and servants.",
  },
  {
    slot: "city",
    look: "A small walled medieval town: a cobbled market square with stone houses and dark slate roofs, a squat watchtower, market stalls and a well.",
  },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const slots = args.filter((a) => Number.isNaN(Number(a)));
const chosen = slots.length > 0 ? VIEWS.filter((v) => slots.includes(v.slot)) : VIEWS;
await runBatch(
  "art/candidates/ui/city-views",
  chosen.map((v) => ({ id: v.slot, prompt: `${v.look} ${FRAMING}`, width: 1536, height: 864 })),
  seeds.length > 0 ? seeds : [1, 2, 3],
);
