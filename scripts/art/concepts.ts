import { runBatch } from "#scripts/art/batch";

/**
 * Unit concept probes (2026-09-30): the user liked the Custodian's portrait (the painterly "anchor" recipe) and asked
 * for non-ink tries of the Zealot and the Psychopomp, and a Custodian concept to take to 3D. The subjects are the
 * user's own looks; two framings each, for the user to pick. The Grove's turnarounds (2026-10-04) below.
 * `pnpm tsx scripts/art/concepts.ts [id…] [seed…]`
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

/**
 * A unit's reference for image-to-3D and rigging (Tripo's advice and our prop lesson): flat, shadowless light so
 * the texture carries true colors, and a T-pose so every limb stands clear for the rig.
 */
const FOR_RIG =
  "Front view, facing the viewer, standing in a T-pose: arms straight out to the sides at shoulder height, legs slightly apart, every limb clearly separated from the body. " +
  "Flat, even, shadowless lighting from all sides, like a texture reference: no cast or painted shadows, no dark recesses, every surface showing its material's true color. " +
  "A plain flat light grey background, no ground, no mist, no smoke, no text.";

/** `scripts/art/props.ts` GOTHIC: the user's style for buildings, worded for materials rather than light. */
const GOTHIC_MATERIALS =
  "Dark gothic fantasy in the manner of Disciples II's art: rich, brooding and ornate, desaturated colors with dark accents, dramatic and grim materials, weathered and worn. Serious, adult, not cartoonish.";

/** GOTHIC_MATERIALS for a 3D render: the same mood, with physically based materials instead of a painting's hand. */
const GOTHIC_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: rough cracked stone, tarnished brass, frayed cloth. Serious, adult, not cartoonish.";

const GOLEM =
  "A hulking golem guardian, not a person: a massive body of cracked grey stone blocks bound with dark brass bands, a blank stone head, thick stone arms and legs, " +
  "faint electric teal lightning crackling in the cracks, a scrap of old cloth at its waist.";

/** Several angles in one image (the user, 2026-09-30), for multi-view 3D: painted together, the views agree. */
const T_POSE = "all standing in the same T-pose";
const turnaround = (subject: string, materials: string, pose = T_POSE) =>
  `A character turnaround sheet of a 3D game character model: the same figure shown three times side by side at the same size, in a front view, a side view from the left, and a back view, ${pose}, ` +
  `like a sculpted and textured asset shown in a modelling program, each view whole from head to feet and fingertip to fingertip. ${subject} ${materials} ` +
  "Flat, even, shadowless lighting from all sides, like a texture reference: no cast or painted shadows, no dark recesses. A plain flat light grey background, no ground, no text, no labels.";

const TURNAROUND = turnaround(GOLEM, GOTHIC_3D);

/**
 * The Custodian's turnaround recipe for the Grove's Sproutling and Decay line (the user, 2026-10-04): still the dark
 * gothic world. Round two, after the user's notes on round one (`docs/design/units/sylvan-decay-line.md`): not
 * humanoid by default, never symmetrical ("symmetry is pleasing; we're not trying to please"). Two readings per unit
 * of the user's own description; the subjects' details are Claude's.
 */
const GROVE_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: rough bark, wet moss, rotting wood, fungus. Serious, adult, not cartoonish, not cute.";

const UNEVEN =
  "Deliberately asymmetric and irregular: its left and right sides differ in size and shape, growths are scattered unevenly, nothing is mirrored. Unsettling, not pleasing.";

/** For bodies that aren't human: a T-pose means nothing to them, but the rig still needs every limb clear. */
const CLEAR_POSE = "all in the same neutral standing pose with every limb held clear of the body";

const GROVE: Readonly<Record<string, { readonly subject: string; readonly pose?: string }>> = {
  // Picked: seed 1002.
  "sproutling-stump": {
    subject:
      "A small treant, nothing human about it: a squat, gnarled young stump of dark bark walking on uneven root legs, one arm a long crooked branch and the other a short thick knot of wood, a face of knotholes with a ragged split in the bark for a mouth, pale new shoots and a few leaves sprouting from one side of its head and one shoulder, moss in its cracks. Feral and hostile, not childlike.",
    pose: CLEAR_POSE,
  },
  // The user liked round one's mycelium: "make it skinnier. The face is great, the shrooms are probably too large and too symmetrical."
  "moldling-mycelium-lean": {
    subject:
      "A skinny, lean body of wet black rotting wood bound together by thick white threads of mycelium like tendons and bandages, a head like a split rotten log with a dark hollow face, a few small grey mushroom caps in uneven clusters: a crowd of them on one shoulder, a scattered line down part of the spine, a patch on one forearm, none on the other side.",
  },
  "moldling-mycelium-hunched": {
    subject:
      "A skinny, hunched body of wet black rotting wood bound together by white threads of mycelium like tendons and bandages, leaning to one side, one arm longer and thinner than the other, a head like a split rotten log with a dark hollow face, small grey mushroom caps scattered unevenly, mostly on one side, white mold furring one leg.",
  },
  // Now tier 4: "a hunk of bark, asymmetric sludge and basically whatever you associate with a swamp", the right arm
  // huge. Fog later as VFX. Picked: seed 1002.
  "bog-giant-hulk": {
    subject:
      "A massive hunched hulk with no human shape: a lump of black bark and sodden bog oak with swamp sludge, peat and mud oozing down it unevenly, reeds, cattails and hanging sphagnum moss, duckweed stuck to it, a rotting log and roots grown into its back, a small sunken face low in the bark. Its right arm is enormous, a huge club-like mass of bark, roots and mud hanging down to the ground; its left arm is small and withered. Two thick stumpy legs. No fog, no mist.",
    pose: CLEAR_POSE,
  },
  // Now tier 3 (the user swapped Deadwood and Bog Giant): "an animated dead tree… strange and ghostly face… both arms
  // are massive stumps", moving more like a gorilla. Picked: seed 1002.
  "deadwood-blasted": {
    subject:
      "An animated dead tree, nothing humanoid about it: a lightning-split, charred grey trunk, one side burned black, the other bleached and peeling, a few dead branches clawing up from its top on one side only, two massive arms that are thick dead stumps of different lengths, short root legs. A ghostly face in the split of the trunk, smoky and faint, as if something trapped inside were looking out, with a faint deep moss green glow.",
    pose: "all in the same pose, hunched forward and leaning on its two massive arm stumps like a gorilla, every limb clear of the body",
  },
  // The user: "a corpse being possessed by the worst nature has to offer": mouth open, cranium lolling back. Round three
  // (after "it looks like a human… just say skull… I really don't need any flesh on this model at all"): only a skull
  // and plant matter. Picked: the turnaround, seed 1000.
  "mulch-gorger-heap": {
    subject:
      "A lurching heap of rot with a human skull half sunk into its top, tipped back so its jaw gapes open at the sky, moss and fungus growing from the mouth and eye sockets. The heap is black rotting bark, mulch, bracket fungi, pale mold, wet leaves, roots and briars, leaning to one side, with no flesh and no bones but the skull. Three uneven limbs of twisted roots and bark: two end in rotten wooden stumps it walks on, one is a long grasping root. Grotesque, not humanoid, not fat.",
    pose: CLEAR_POSE,
  },
};
const JOBS = [
  { id: "custodian-tpose", prompt: `A full-body character model reference of a single figure, the whole figure visible from head to feet. ${GOLEM} ${FOR_RIG}` },
  // The buildings' framing (the user's gothic, 2026-09-29), which survives flat light: the T-pose above drifted cartoonish.
  { id: "custodian-tpose-gothic", prompt: `A full-body character model reference of a single figure, the whole figure visible from head to feet. ${GOLEM} ${GOTHIC_MATERIALS} ${FOR_RIG}` },
  // The user liked the gothic one but it read as a 2D drawing (2026-09-30): lead with a 3D render in a T-pose, and keep
  // the gothic materials without "Disciples II's art", which pulls toward painting.
  { id: "custodian-3d", prompt: `A 3D render of a game character model in a T-pose, the whole figure visible from head to feet and fingertip to fingertip with a margin around it, like a sculpted and textured asset shown in a modelling program. ${GOLEM} ${GOTHIC_3D} ${FOR_RIG}` },
  // The user's check (2026-09-30): does "in the manner of Disciples II's art" alone turn the 3D render into a painting?
  { id: "custodian-3d-d2", prompt: `A 3D render of a game character model in a T-pose, the whole figure visible from head to feet and fingertip to fingertip with a margin around it, like a sculpted and textured asset shown in a modelling program. ${GOLEM} ${GOTHIC_3D.replace("Dark gothic fantasy,", "Dark gothic fantasy in the manner of Disciples II's art,")} ${FOR_RIG}` },
  // The user (2026-09-30): several angles in one image, for Tripo's multi-view input; painted together, the views
  // should agree with each other more than separate generations would.
  { id: "custodian-turnaround", prompt: TURNAROUND },
  // The user (2026-09-30): does a negative prompt keep the turnaround in a T-pose? Only at cfg above 1 (comfy.ts).
  ...[2, 3].map((cfg) => ({ id: `custodian-turnaround-neg-cfg${cfg}`, prompt: TURNAROUND, negative: "A-pose, arms hanging down, arms angled down, relaxed arms", cfg })),
  { id: "custodian-front", prompt: `${FIGURE} ${CUSTODIAN_3D} ${ANCHOR("electric teal, like lightning")}` },
  { id: "zealot-anchor", prompt: `${FIGURE} ${ZEALOT} ${ANCHOR("vivid blood red")}` },
  { id: "zealot-plain", prompt: `${FIGURE} ${ZEALOT} ${PLAIN("vivid blood red")}` },
  { id: "psychopomp-anchor", prompt: `${FIGURE} ${PSYCHOPOMP} ${ANCHOR("deep moss green")}` },
  { id: "psychopomp-plain", prompt: `${FIGURE} ${PSYCHOPOMP} ${PLAIN("deep moss green and spectral purple")}` },
];

/** The Grove's turnarounds get their own folder, so a concept run doesn't overwrite their manifest. */
const GROVE_JOBS = [
  ...Object.entries(GROVE).map(([id, { subject, pose }]) => ({ id: `${id}-turnaround`, prompt: turnaround(subject, `${GROVE_3D} ${UNEVEN}`, pose) })),
  // Claude's test (round three): one three-quarter view, in case the turnaround frame is what pulls figures upright and even.
  ...Object.entries(GROVE).map(([id, { subject }]) => ({
    id: `${id}-front`,
    prompt:
      "A 3D render of a game creature model in a three-quarter front view, the whole figure visible from head to feet with a margin around it, like a sculpted and textured asset shown in a modelling program. " +
      `${subject} ${GROVE_3D} ${UNEVEN} Flat, even, shadowless lighting from all sides, like a texture reference. A plain flat light grey background, no ground, no text.`,
  })),
];

/**
 * The gnolls (the user, 2026-10-04): the gothic theme on gnolls, and each one recognizable at a glance. One reading
 * per unit, each built around a silhouette feature of its own (Claude's, from the units' roles in
 * `faction-stuff/neutrals/gnolls.md`): a T-pose turnaround for the model and rig, and a single view in its typical
 * stance, since posture is where they'll differ most.
 */
const GNOLL =
  "A gnoll: a hyena-headed humanoid with a long muzzle full of teeth, coarse spotted and striped fur, a bristling mane down the neck and back, long arms and digitigrade hyena legs.";

const GNOLL_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: matted fur, cracked leather and rawhide, tarnished bronze, bone, frayed dark cloth. Serious, adult, not cartoonish.";

/**
 * Round two (the user, 2026-10-04): the Packstalker and Hamstringer "look too much alike", so clothing sets them apart;
 * and weapons are better as separate models than in the body's mesh. These two hold no weapon in the turnaround; the
 * stance view shows the weapon (`weapon`), and the weapons get prop sheets of their own (`GNOLL_WEAPONS`). Picked in
 * round one: the Bonecracker 1002, the Cackler's turnaround 1002, the Matriarch's turnaround 1001.
 */
const GNOLLS: Readonly<Record<string, { readonly subject: string; readonly stance: string; readonly weapon?: string }>> = {
  "packstalker-skullhelm": {
    subject:
      "The Packstalker, the pack's spearhead: lean and long-legged, built to run, a narrow chest and a long neck; on its head a helm made from a horned antelope skull, a brigandine harness of dark leather studded with bronze, strips of red-dyed cloth tied to its arms as tallies of its kills, bare clawed hands.",
    stance: "crouched low and forward with a spear levelled in both hands, about to sprint",
    weapon: "It holds a long barbed bronze hunting spear.",
  },
  "hamstringer-wraps": {
    subject:
      "The Hamstringer: small, wiry and quick, wrapped almost head to toe in dusty layered strips of dark cloth like a desert nomad, a deep cowl shading its muzzle so only its eyes and teeth show, a sash of bone bolas weights across its chest, rawhide-wrapped legs, bare clawed hands.",
    stance: "mid-throw, one arm drawn back with a javelin, its weight on one leg",
    weapon: "A bundle of short barbed javelins is slung on its back.",
  },
  bonecracker: {
    subject:
      "The Bonecracker: heavy and broad with short legs, enormous forequarters and a thick neck, a massive jaw with iron-capped teeth, a heavy collar of bone plates and bronze rings around its neck, scarred bare arms, one fist in a spiked bronze gauntlet.",
    stance: "hunched with its huge head thrust forward and its jaws wide open",
  },
  cackler: {
    subject:
      "The Cackler: scrawny and hunched, its mouth stretched in a wide manic grin, a ragged cloak of tattered cloth strips like a jester's motley gone to rot, bone rattles and small bronze bells hanging from it, a crooked staff topped with a hyena skull.",
    stance: "head thrown back, laughing, its arms spread mockingly",
  },
  matriarch: {
    subject:
      "The Matriarch, leader of the pack: the largest and tallest gnoll, a female, upright and broad-shouldered, a great dark mane, a scarred muzzle, a mantle of bronze plates and trophy bones over her shoulders, a cloak of a great beast's hide, a crest of teeth and bronze on her brow, a heavy bronze glaive.",
    stance: "standing tall with her glaive planted, chin raised, commanding",
  },
};

const GNOLL_WEAPONS: Readonly<Record<string, string>> = {
  "packstalker-spear": "a long barbed hunting spear with a bronze head, a shaft of dark wood bound with rawhide, a tuft of fur and a red cloth strip below the head; and a shorter spare spear head beside it.",
  "hamstringer-kit": "a bundle of four short barbed javelins with bronze heads tied with rawhide, and a bolas of three bone weights on braided leather cords.",
};

const GNOLL_JOBS = [
  ...Object.entries(GNOLLS).map(([id, { subject }]) => ({ id: `${id}-turnaround`, prompt: turnaround(`${GNOLL} ${subject}`, GNOLL_3D) })),
  ...Object.entries(GNOLLS).map(([id, { subject, stance, weapon }]) => ({
    id: `${id}-stance`,
    prompt:
      `A 3D render of a game character model in a three-quarter front view, ${stance}, the whole figure visible from head to feet with a margin around it, like a sculpted and textured asset shown in a modelling program. ` +
      `${GNOLL} ${subject}${weapon ? ` ${weapon}` : ""} ${GNOLL_3D} Flat, even, shadowless lighting from all sides, like a texture reference. A plain flat light grey background, no ground, no text.`,
  })),
  // Weapons as separate models (the user): one prop sheet each, wide so a spear fits.
  ...Object.entries(GNOLL_WEAPONS).map(([id, things]) => ({
    id: `${id}-props`,
    prompt:
      `A 3D render of game prop models laid out side by side, like textured assets shown in a modelling program: ${things} ${GNOLL_3D} ` +
      "Each object whole and separate, shown flat from the side. Flat, even, shadowless lighting from all sides, like a texture reference. A plain flat light grey background, no ground, no hands, no text.",
    width: 2048,
    height: 832,
  })),
];

/** Each group of jobs has its own folder, so one group's run doesn't mix into another's manifest. */
const GROUPS = [
  { dir: "art/candidates/units/grove", jobs: GROVE_JOBS },
  { dir: "art/candidates/units/gnolls", jobs: GNOLL_JOBS },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
const group = GROUPS.find((g) => ids.length > 0 && ids.every((id) => g.jobs.some((j) => j.id === id))) ?? { dir: "art/candidates/units/concepts", jobs: JOBS };
// A T-pose spans wider than it stands tall: the portrait frame cut the arms off.
const frame = (id: string) => (id.includes("turnaround") ? { width: 2048, height: 832 } : id.includes("tpose") || id.includes("-3d") ? { width: 1344, height: 1024 } : { width: 896, height: 1152 });
await runBatch(
  group.dir,
  group.jobs.filter((j) => ids.length === 0 || ids.includes(j.id)).map((j) => ({ ...frame(j.id), ...j })),
  seeds.length > 0 ? seeds : [1000, 1001, 1002, 1003],
);
