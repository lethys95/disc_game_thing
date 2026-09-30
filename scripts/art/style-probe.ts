import { runBatch } from "#scripts/art/batch";

/**
 * A style probe for the map's props (2026-09-29): the user wants a mature game for adults, matching the dark,
 * ornate HUD; the old framing ("stylized, hand-painted, chunky") was Claude's, never the user's, and read as
 * cheerful. The same props under three framings, for the user to choose from. All framings keep what image-to-3D
 * needs (one object, plain background, no mist, bold forms: `design/asset-pipeline.md`).
 */

const FOR_3D = "A single object, isolated and centered, the whole of it in frame with margin, three-quarter view from slightly above, plain flat light grey background, even light, no ground, no cast shadow, no mist or smoke, no text.";

const FRAMINGS: readonly { readonly id: string; readonly style: string }[] = [
  {
    id: "grounded",
    style: "Grounded dark fantasy, realistic proportions and materials: real stone, timber, iron and slate, muted natural colors, somber and heavy, like a detailed historical scale model. Serious, adult, not cartoonish.",
  },
  {
    id: "gothic",
    style: "Dark gothic fantasy in the manner of Disciples II's art: rich, brooding and ornate, deep shadows in its recesses, desaturated colors with dark accents, dramatic and grim. Serious, adult, not cartoonish.",
  },
  {
    id: "painterly",
    style: "Painterly dark fantasy, like a detailed oil painting made solid: rich textures, sober earthy palette, strong sculpted forms, a sense of age and weight. Serious, adult, not cartoonish.",
  },
];

const SUBJECTS: readonly { readonly id: string; readonly look: string }[] = [
  { id: "capitol-jilliath", look: "The capitol fortress of a zealous human inquisition: a compact walled cathedral-keep with slate spires, blood red banners, a great rose window, heavy buttresses and a gatehouse." },
  { id: "city", look: "A small walled medieval town: a few stone houses with slate roofs huddled together, a squat watchtower and a wooden gate." },
  { id: "blacksmith", look: "A blacksmith's forge: a small stone smithy with a glowing furnace, a heavy anvil in front, a water barrel, tongs and hammers on the wall." },
];

/** `pnpm tsx scripts/art/style-probe.ts [seed…]` */
const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch(
  "art/candidates/models/style-probe",
  FRAMINGS.flatMap((f) => SUBJECTS.map((s) => ({ id: `${f.id}-${s.id}`, prompt: `${s.look} ${f.style} ${FOR_3D}`, width: 1024, height: 1024 }))),
  seeds.length > 0 ? seeds : [1, 2],
);
