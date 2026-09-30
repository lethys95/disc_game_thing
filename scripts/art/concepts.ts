import { runBatch } from "#scripts/art/batch";

/**
 * Unit concept probes (2026-09-30): the user liked the Custodian's portrait (the painterly "anchor" recipe) and asked
 * for non-ink tries of the Zealot and the Psychopomp, and a Custodian concept to take to 3D. The subjects are the
 * user's own looks; two framings each, for the user to pick. `pnpm tsx scripts/art/concepts.ts [id…] [seed…]`
 */

/** The recipe behind the Custodian and Punisher portraits the user kept, by faction accent. */
const ANCHOR = (accent: string) =>
  "Dark painterly fantasy illustration with a gothic reliquary mood: sacred things worn thin by use, tarnished metal, bone, old lacquer, cracked stone and heavy aged cloth. " +
  `A desaturated palette of umber, ash, bone and oxidized iron, with a single saturated accent of ${accent} where there is magic or devotion. ` +
  "Chiaroscuro lighting with deep shadows and a hard rim light. Solemn, tragic and oppressive rather than gory. No text, no letters, no watermark.";

/** The same painterly hand without the reliquary mood words (the user: not everything has to be gothic). */
const PLAIN = (accent: string) =>
  "Dark fantasy character concept art, painted, detailed, with visible brushwork. " +
  `Muted natural colors with ${accent} as the strongest color. Soft, even studio light. No text, no letters, no watermark.`;

const FIGURE = "A full-body character concept of a single figure, the whole figure visible from head to feet, on a plain flat dark grey background.";

const ZEALOT =
  "A zealot whose whole head is covered by a smooth, completely featureless mask: no mouth, no nose, no expression, only two wide, staring round eye holes with pure black behind them. " +
  "Painted on the forehead of the mask is a burning outstretched hand with spread fingers. The mask is ominous, strange and inhuman, deranged and wrong. " +
  "He wears spiked, tattered armor and holds a huge serrated two-handed sword, in a menacing stance.";

const PSYCHOPOMP =
  "A woman, an elf with pointed ears: a shamanistic druid. Psychedelic, sprawling with life, confusing. Hypnotic eyes. Several spectral, blurry shapes, barely visible, brush out from her face. " +
  "Trinkets and baubles in her rough hair. Greens, roots and vines, with purple for pulses of spirit.";

/** For image-to-3D: facing the viewer, limbs clear of the body, so the mesh and a later rig see every part. */
const CUSTODIAN_3D =
  // The first pass (hooded, robed men) lost the golem: its body is stone and brass, not a person in a robe.
  "A hulking golem guardian, not a person: a massive body of cracked grey stone blocks bound with dark brass bands, a blank stone head, thick stone arms and legs, " +
  "a crackling protective shield of electric energy around it, a scrap of old cloth at its waist. " +
  "Front view, facing the viewer, standing straight with arms held slightly away from the body and legs apart, every limb clearly separated.";

const JOBS = [
  { id: "custodian-front", prompt: `${FIGURE} ${CUSTODIAN_3D} ${ANCHOR("electric teal, like lightning")}` },
  { id: "zealot-anchor", prompt: `${FIGURE} ${ZEALOT} ${ANCHOR("vivid blood red")}` },
  { id: "zealot-plain", prompt: `${FIGURE} ${ZEALOT} ${PLAIN("vivid blood red")}` },
  { id: "psychopomp-anchor", prompt: `${FIGURE} ${PSYCHOPOMP} ${ANCHOR("deep moss green")}` },
  { id: "psychopomp-plain", prompt: `${FIGURE} ${PSYCHOPOMP} ${PLAIN("deep moss green and spectral purple")}` },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
await runBatch(
  "art/candidates/concepts",
  JOBS.filter((j) => ids.length === 0 || ids.includes(j.id)).map((j) => ({ ...j, width: 896, height: 1152 })),
  seeds.length > 0 ? seeds : [1000, 1001, 1002, 1003],
);
