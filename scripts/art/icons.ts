import { runBatch } from "#scripts/art/batch";

/**
 * Ability icons in the recipe of the four the user liked (`assets/art/provenance.json`: flail, defend, lay_on_hands,
 * plus_burst): a gothic reliquary emblem on black, one saturated accent by faction. The subjects are Claude's
 * readings of each ability, for the user to judge. `pnpm tsx scripts/art/icons.ts [id…] [seed…]`
 */

const RECIPE = (subject: string, accent: string) =>
  `A single emblem for a game ability icon: ${subject}. One centered subject with a bold, readable silhouette that fills the frame, on a plain black background, with no border and no frame. ` +
  "Dark painterly fantasy illustration with a gothic reliquary mood: sacred things worn thin by use, tarnished metal, bone, old lacquer, cracked stone and heavy aged cloth. " +
  `A desaturated palette of umber, ash, bone and oxidized iron, with a single saturated accent of ${accent} where there is magic or devotion. ` +
  "Chiaroscuro lighting with deep shadows and a hard rim light. Solemn, tragic and oppressive rather than gory. No text, no letters, no watermark.";

const ACCENT = { jilliath: "deep blood red", nexus: "electric teal", grove: "deep moss green", neutral: "dull ember orange" } as const;

const ICONS: readonly { readonly id: string; readonly faction: keyof typeof ACCENT; readonly subject: string }[] = [
  { id: "attack", faction: "neutral", subject: "a notched longsword held point down" },
  { id: "shoot", faction: "neutral", subject: "a drawn bow with an arrow nocked" },
  { id: "retreat", faction: "neutral", subject: "a tattered banner lowered and dragged backwards" },
  { id: "wait", faction: "neutral", subject: "an old brass hourglass half run" },
  { id: "holy_water", faction: "jilliath", subject: "a small glass vial of glowing water sealed with a wax cross" },
  { id: "throw_hatchet", faction: "neutral", subject: "a hatchet spinning through the air" },
  { id: "mend", faction: "jilliath", subject: "two hands wrapping a bandage around a wound, a faint glow" },
  { id: "condemn", faction: "jilliath", subject: "a pointing gauntlet casting a burning brand" },
  { id: "congregation", faction: "jilliath", subject: "three hooded figures standing shoulder to shoulder" },
  { id: "devotion_aura", faction: "jilliath", subject: "a ring of candles around a kneeling figure's silhouette" },
  { id: "guardian_spirit", faction: "jilliath", subject: "a spectral winged guardian spreading its wings over a fallen knight" },
  { id: "must_attack", faction: "jilliath", subject: "a chained blade that cannot be sheathed" },
  { id: "zeal", faction: "jilliath", subject: "a burning heart pierced by a sword" },
  { id: "fanaticism", faction: "jilliath", subject: "a self-flagellation scourge dripping red" },
  { id: "hysteria", faction: "jilliath", subject: "a screaming masked face with wide black eyes" },
  { id: "fanaticism_aura", faction: "jilliath", subject: "a burning sun of blades radiating outward" },
  { id: "punishment", faction: "jilliath", subject: "an iron shackle closing on a wrist" },
  { id: "domination", faction: "jilliath", subject: "a gauntlet crushing a bleeding heart" },
  { id: "hook", faction: "jilliath", subject: "a barbed iron hook on a taut chain" },
  { id: "bolt", faction: "nexus", subject: "a crackling bolt of lightning striking down" },
  { id: "restore_shield", faction: "nexus", subject: "a brass wrench before a glowing hexagonal shield" },
  { id: "counter", faction: "nexus", subject: "a closed eye inside a brass gear, a secret mark" },
  { id: "negate", faction: "nexus", subject: "a crossed-out rune circle, reversed arrows" },
  { id: "absorb", faction: "nexus", subject: "a vortex of energy drawn into an open brass palm" },
  { id: "combustion", faction: "nexus", subject: "a brass sphere cracking open with fire inside" },
  { id: "homing_lightning", faction: "nexus", subject: "a forked lightning bolt curving to seek its target" },
  { id: "equalize", faction: "nexus", subject: "a brass balance scale with two glowing shields" },
  { id: "mutate", faction: "nexus", subject: "a swollen mutated arm bursting through armor plates" },
  { id: "regrowth", faction: "grove", subject: "a gnarled root sprouting a fresh green shoot" },
  { id: "decay", faction: "grove", subject: "a rotting log crawling with fungus" },
  { id: "withering", faction: "grove", subject: "a hand withering into dry bark and dead leaves" },
  { id: "lash_out", faction: "grove", subject: "thorned rotting vines lashing outward like whips" },
  { id: "bloom", faction: "grove", subject: "a dark flower slowly opening" },
  { id: "corpse_growth", faction: "grove", subject: "mushrooms and moss growing from a skull" },
  { id: "corpse_explosion", faction: "grove", subject: "a skull bursting into a cloud of fungal spores" },
  { id: "cycle", faction: "grove", subject: "a serpent of vines and bone eating its own tail" },
  { id: "spirit_bloom", faction: "grove", subject: "a ghostly flower glowing among dark leaves" },
  { id: "burst_mend", faction: "grove", subject: "a seed pod bursting open in a flash of green light" },
  { id: "spiritwalk", faction: "grove", subject: "a faint spectral figure stepping out of its own body" },
  { id: "grove_mend", faction: "grove", subject: "vines knitting a wound closed" },
  { id: "area_2x2", faction: "neutral", subject: "a burst of fire scattering across four stones" },
  { id: "stun_front", faction: "neutral", subject: "a club striking a helm, stars of pain" },
  { id: "anti_armor", faction: "neutral", subject: "a heavy pick punching through a breastplate" },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const chosen = args.filter((a) => Number.isNaN(Number(a)));
const jobs = ICONS.filter((i) => chosen.length === 0 || chosen.includes(i.id)).map((i) => ({ id: `icon_${i.id}`, prompt: RECIPE(i.subject, ACCENT[i.faction]), width: 1024, height: 1024 }));
await runBatch("art/candidates/icons/abilities", jobs, seeds.length > 0 ? seeds : [1000, 1001]);
