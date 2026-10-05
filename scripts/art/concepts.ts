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

/**
 * The user's refined look (2026-09-30, `docs/design/units/sylvan-psychopomp.md`): closer to the ink portrait, wild, possessed.
 * Replaced the first look ("doesn't work very well", the user, 2026-10-05; it's in the git history and in the
 * manifests of the images it made).
 */
const PSYCHOPOMP =
  "A woman, an elf with pointed ears: a wild shamanistic druid, possessed or haunted. Her eyes glow blue, her mouth hangs open and a ghastly smoke pours out of it; " +
  "full-bodied, bluish, glitching ghostly figures skip out of her body as if trying to escape it. Trinkets and baubles in her rough hair; greens, roots and vines, with purple for pulses of spirit.";

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

/**
 * The Drawn (Claude's own tribe, 2026-10-04: the user invited a tribe of Claude's making, concept art included, with
 * as many tries as needed and every try kept). Moth-folk drawn to light: the gnolls' recipe (a turnaround for the
 * model, a stance view for posture), one silhouette per unit. `faction-stuff/neutrals/the-drawn.md`.
 */
const MOTH =
  "A moth-folk creature: large dusty moth wings, pale fur on the thorax, feathered antennae, large dark compound eyes, thin clawed limbs.";

const DRAWN_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: dusty wing scales, pale fur, old lace, velvet and wax-stiffened cloth, tarnished silver, smoked glass, candle wax. Serious, adult, not cartoonish, not cute.";

const DRAWN: Readonly<Record<string, { readonly subject: string; readonly stance: string; readonly pose?: string }>> = {
  dustwing: {
    subject:
      "The Dustwing: small and light, mostly wings, a slender body hunched between two broad tattered wings dusted grey and brown with a pair of staring eyespots, long thin legs with hooked claws, a scrap of grey lace at its throat, dust falling from its wings.",
    stance: "hovering just above the ground, wings beating wide, claws reaching forward to strike",
  },
  chrysalis: {
    subject:
      "The Chrysalis: a tall upright cocoon of grey silk, candle wax and wrapped burial cloth, bound with tarnished silver wire, the shape of a hunched figure pressing out from inside, one clawed limb and a crumpled wet wing breaking out through a split in its side, a faint light inside.",
    stance: "standing, the cocoon splitting open as something emerges",
    pose: "all in the same upright standing pose",
  },
  lightdrinker: {
    subject:
      "The Lightdrinker: gaunt and tall, a long coiled proboscis hanging from its face, its wings folded down its back like a tattered cloak, a collar of yellowed lace, thin hands with long fingers, small vials of faintly glowing light hung on a cord at its waist.",
    stance: "leaning forward with the proboscis uncoiled toward its prey, hands raised",
  },
  eyespot: {
    subject:
      "The Eyespot: wings far larger than its body, spread wide like a fan and covered in many staring eyespots that look like real eyes, a small veiled body in a high-collared velvet coat between them.",
    stance: "its wings raised and spread wide behind it, every eye on them staring",
  },
  "pale-mother": {
    subject:
      "The Pale Mother: large and tall, pale ivory fur and wings, her wings wrapped around her like a long veil and cloak, a lace veil over her compound eyes, a crown of melted candles with small flames on her head, tarnished silver jewelry; grief and command.",
    stance: "standing tall, her wings beginning to open like a cloak",
  },
};

/**
 * Round two (Claude's own direction after round one): every unit had the same fluffy round head, button eyes and grey
 * eyespot wings: too uniform, and cute. Each unit now has its own moth and body, and a gaunt insect face; the shared
 * `MOTH` line is dropped. The Pale Mother stays from round one.
 */
const INSECT_FACE = "a gaunt, elongated insect face with small mandibles and dark faceted eyes, not round, not fluffy, not cute";

const DRAWN_2: Readonly<Record<string, { readonly subject: string; readonly stance: string; readonly pose?: string }>> = {
  "dustwing-ragged": {
    subject:
      `The Dustwing, a moth-folk skirmisher: small and hunched, six thin hooked limbs, ${INSECT_FACE}, feathered antennae, narrow ragged wings of dull ash brown and grey like a clothes moth, eaten through with holes and frayed at the edges, a cloud of grey dust falling from them.`,
    stance: "lunging forward through the air, wings blurred, four claws reaching out",
  },
  "chrysalis-cocoon": {
    subject:
      "The Chrysalis: a tall upright cocoon of grey silk, old candle wax and wrapped burial cloth, bound with tarnished silver wire and hung with wax seals, no wings or face outside it; the silk is split open down one side and only a dark wet gap shows, something pressing out from inside, its shape bulging the cocoon. It stands on a short knot of silk roots.",
    stance: "standing, the split in its side widening",
    pose: "all in the same upright standing pose",
  },
  "lightdrinker-deathshead": {
    subject:
      `The Lightdrinker, a moth-folk like a death's-head hawkmoth: a heavy, furred dark body with a pale skull marking on its thorax, ${INSECT_FACE}, a very long coiled proboscis hanging from its mouth, narrow dark wings folded down its back like a coat, thin arms with long fingers, small vials of faintly glowing light on a cord at its waist.`,
    stance: "leaning forward with the long proboscis uncoiled toward its prey, hands raised",
  },
  "eyespot-eyes": {
    subject:
      `The Eyespot, a moth-folk: huge wings spread wide like a fan, far larger than its thin body, covered in dozens of eyes that look disturbingly real, with irises, wet lids and lashes, all staring; ${INSECT_FACE}, a high-collared dark velvet coat.`,
    stance: "its wings raised and spread wide behind it, every eye on them staring at the viewer",
  },
};

/**
 * Round three (Claude): the Eyespot failed twice (its eyes came out as plain moth spots, grey like the Pale Mother's
 * wings), so two new readings with human eyes set in coloured wings; and the Chrysalis, whose single views are a true
 * cocoon while its turnarounds keep growing a figure, as an object with no limbs at all.
 */
const DRAWN_3: Readonly<Record<string, { readonly subject: string; readonly stance?: string; readonly pose?: string }>> = {
  "eyespot-fan": {
    subject:
      "The Eyespot, a moth-folk: four huge wings raised behind it in a wide circle like a peacock's fan, the wing membrane dark wine red and set with dozens of human eyes, white eyeballs with irises and eyelids embedded in it, all staring; a thin body in a high-collared black velvet coat, its face hidden behind a black lace veil.",
    stance: "its four wings raised in a wide circle behind it, every eye on them staring at the viewer",
  },
  "eyespot-blind": {
    subject:
      "The Eyespot, a moth-folk: its own head is smooth and eyeless, with only small mandibles; the eyes it sees with are on its wings: two broad pale wings set with dozens of bloodshot human eyes with lids and lashes, open and staring; a thin body wrapped in grey velvet and old lace.",
    stance: "its wings spread wide and tilted toward the viewer, the eyeless head turned aside",
  },
  "chrysalis-object": {
    subject:
      "The Chrysalis: an object, not a figure, with no arms, no legs, no wings and no face: a tall upright cocoon of grey silk and old candle wax wrapped in burial cloth, bound with tarnished silver wire and hung with wax seals, split open down one side to a dark wet gap, a bulge pressing out from inside, on a short knot of silk at its base.",
    pose: "all in the same upright position",
  },
};

const DRAWN_JOBS = [
  ...Object.entries(DRAWN).map(([id, { subject, pose }]) => ({ id: `${id}-turnaround`, prompt: turnaround(`${MOTH} ${subject}`, DRAWN_3D, pose) })),
  ...Object.entries(DRAWN_2).map(([id, { subject, pose }]) => ({ id: `${id}-turnaround`, prompt: turnaround(subject, DRAWN_3D, pose) })),
  ...Object.entries(DRAWN_3).map(([id, { subject, pose }]) => ({ id: `${id}-turnaround`, prompt: turnaround(subject, DRAWN_3D, pose) })),
  ...Object.entries(DRAWN_3).flatMap(([id, { subject, stance }]) =>
    stance
      ? [{
          id: `${id}-stance`,
          prompt:
            `A 3D render of a game character model in a three-quarter front view, ${stance}, the whole figure visible from head to feet with a margin around it, like a sculpted and textured asset shown in a modelling program. ` +
            `${subject} ${DRAWN_3D} Flat, even, shadowless lighting from all sides, like a texture reference. A plain flat light grey background, no ground, no text.`,
        }]
      : [],
  ),
  ...Object.entries(DRAWN_2).map(([id, { subject, stance }]) => ({
    id: `${id}-stance`,
    prompt:
      `A 3D render of a game character model in a three-quarter front view, ${stance}, the whole figure visible from head to feet with a margin around it, like a sculpted and textured asset shown in a modelling program. ` +
      `${subject} ${DRAWN_3D} Flat, even, shadowless lighting from all sides, like a texture reference. A plain flat light grey background, no ground, no text.`,
  })),
  ...Object.entries(DRAWN).map(([id, { subject, stance }]) => ({
    id: `${id}-stance`,
    prompt:
      `A 3D render of a game character model in a three-quarter front view, ${stance}, the whole figure visible from head to feet with a margin around it, like a sculpted and textured asset shown in a modelling program. ` +
      `${MOTH} ${subject} ${DRAWN_3D} Flat, even, shadowless lighting from all sides, like a texture reference. A plain flat light grey background, no ground, no text.`,
  })),
];

/**
 * The Zealot in the 3D concept strategy (the user, 2026-10-05: the old ink portrait doesn't fit). The user's look
 * (`faction-stuff/jilliath/melee.md`), seven rounds (`docs/design/units/zealot-concepts.md`). **Picked (user):** round
 * one's *pyre*, turnaround 1000: "I think it works really well." The other readings (and the later rounds: bandages
 * that read as the Wastes' mummies, the user: "It's still supposed to be an inquisition faction… the antithesis to the
 * paladin unit") live on in the folder's manifest. No sword on the figure; it has its own prop sheet.
 */
const ZEALOT_MASK =
  "His whole head is covered by a smooth, completely featureless mask, no skin showing anywhere: no mouth, no nose, no expression, only two wide, staring round eye holes with pure black behind them. " +
  "Painted crisply on the forehead of the mask, a burning outstretched hand with spread fingers.";

const JILLIATH_3D =
  "Dark gothic fantasy, grim, weathered and worn physically based materials: bone-white lacquer and porcelain, blackened scorched steel, frayed white and blood-red cloth, old leather. " +
  "Pale colors with a strong contrast of black, white and blood red. Ominous, strange, inhuman: wrong, grotesque, deranged and twisted. Serious, adult, not cartoonish.";

const ZEALOTS: Readonly<Record<string, { readonly subject: string }>> = {
  "zealot-pyre": {
    subject: `A religious zealot, a tall gaunt man. ${ZEALOT_MASK} The painted hand smoulders with real embers. Spiked, tattered armor scorched black at the edges, singed white robes in rags, chains with small hooks hanging from the belt.`,
  },
};

const ZEALOT_SWORD =
  "a huge serrated two-handed greatsword of blackened steel, its edge cut into jagged teeth, the grip bound in red cloth; beside it the same sword seen from its flat side.";

const ZEALOT_JOBS = [
  ...Object.entries(ZEALOTS).map(([id, { subject }]) => ({ id: `${id}-turnaround`, prompt: turnaround(`${subject} His hands are empty and open, no weapon.`, JILLIATH_3D) })),
  {
    id: "zealot-sword-props",
    prompt: `A 3D render of a game prop model, like a textured asset shown in a modelling program: ${ZEALOT_SWORD} ${JILLIATH_3D} Each view whole and separate, laid flat. Flat, even, shadowless lighting from all sides. A plain flat light grey background, no ground, no hands, no text.`,
    width: 2048,
    height: 832,
  },
];

/**
 * The Psychopomp in the 3D concept strategy, picked by the user after six rounds (2026-10-05: "short 1002 is final").
 * Rounds two to five grew her description into a long outfit list that drowned the gothic line; this short one, in
 * the faction's material words, brought the game's look back. Every round's prompt is in the folder's manifest and
 * `docs/design/units/sylvan-psychopomp.md`.
 */
const PSYCHOPOMP_SUBJECT =
  "An elven shamaness of a wild forest people, possessed and absent: pale greenish skin, long pointed ears, dark green and black tribal tattoos across her face and arms, her hair in tight cornrows. " +
  "A hood of a wolf's head pelt with no lower jaw, two dark gouged-out pits where its eyes were; her face looks out under its upper teeth. Pale ghostly teal eyes staring through everything, lips parted. " +
  "Short fingerless ivory gloves, her bare fingers soaked scarlet red. Rough boots of matted grey wolf fur bound to the knee. Knotted ivory rags tied on at her chest and hips, a ragged fur mantle, leather wraps and tarnished bronze bangles on her arms. Her hands are open and empty.";

const PSYCHOPOMP_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: matted wolf fur, stained ivory rags, worn leather, tarnished bronze, wet moss and roots. Serious, adult, not cartoonish.";

// Picked: seed 1002.
const PSYCHOPOMP_JOBS = [{ id: "psychopomp-short-turnaround", prompt: turnaround(PSYCHOPOMP_SUBJECT, PSYCHOPOMP_3D) }];

/** Each group of jobs has its own folder, so one group's run doesn't mix into another's manifest. */
const GROUPS = [
  { dir: "art/candidates/units/grove", jobs: GROVE_JOBS },
  { dir: "art/candidates/units/neutrals/gnolls", jobs: GNOLL_JOBS },
  { dir: "art/candidates/units/neutrals/drawn", jobs: DRAWN_JOBS },
  { dir: "art/candidates/units/jilliath/zealot", jobs: ZEALOT_JOBS },
  { dir: "art/candidates/units/grove/psychopomp", jobs: PSYCHOPOMP_JOBS },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
// The early concepts (no group) go to their unit's folder, by the id's first word.
const EARLY: Readonly<Record<string, string>> = {
  custodian: "art/candidates/units/nexus/custodian",
  zealot: "art/candidates/units/jilliath/zealot",
  psychopomp: "art/candidates/units/grove/psychopomp",
};
// A T-pose spans wider than it stands tall: the portrait frame cut the arms off.
const frame = (id: string) => (id.includes("turnaround") ? { width: 2048, height: 832 } : id.includes("tpose") || id.includes("-3d") ? { width: 1344, height: 1024 } : { width: 896, height: 1152 });
const wanted = <T extends { readonly id: string }>(jobs: readonly T[]) => jobs.filter((j) => ids.length === 0 || ids.includes(j.id));
const group = GROUPS.find((g) => ids.length > 0 && ids.every((id) => g.jobs.some((j) => j.id === id)));
const runs = group
  ? [{ dir: group.dir, jobs: wanted(group.jobs) }]
  : Object.entries(EARLY).map(([unit, dir]) => ({ dir, jobs: wanted(JOBS).filter((j) => j.id.startsWith(`${unit}-`)) }));
for (const run of runs) {
  if (run.jobs.length > 0) await runBatch(run.dir, run.jobs.map((j) => ({ ...frame(j.id), ...j })), seeds.length > 0 ? seeds : [1000, 1001, 1002, 1003]);
}
