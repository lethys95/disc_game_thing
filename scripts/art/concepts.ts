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
 * The Punisher in the 3D concept strategy, picked by the user after two rounds (2026-10-05: "I'd totally go with iron
 * 1000. He's terrifying"). Round one's three detailed readings came out "very very bland"; this goes back to the
 * first batch's favourite (`anchors/punisher-1001`): a faceless executioner's hood, a cassock, a mantle, in dark iron
 * grey (the user: "less white colors, more towards metal"). Every round's prompt is in the folder's manifest and
 * `docs/design/units/punisher-concepts.md`. The flail is not picked yet.
 */
const PUNISHER_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: heavy aged cloth worn thin by use, tarnished iron, old leather, bone. Serious, adult, not cartoonish.";

const PUNISHER_SUBJECT =
  "An executioner of a militant faith: a tall pointed executioner's hood with only black shadow inside it, no face; a long cassock and a stiff hooded mantle of dark iron-grey cloth; dented iron bracers, an iron gorget, a heavy chain belt, blood red soaked into the cloth.";

const PUNISHER_FLAIL =
  "a heavy multi-headed flail: a long wooden haft bound in iron bands, from its end three chains, each ending in a flanged mace head of six flat iron blades standing out around a round core; drawn twice, once from the front and once turned sideways.";

const PUNISHER_JOBS = [
  // Picked: seed 1000.
  { id: "punisher-iron-turnaround", prompt: turnaround(`${PUNISHER_SUBJECT} His hands are empty and open, no weapon.`, PUNISHER_3D) },
  {
    id: "punisher-flail-flanged-props",
    prompt: `A 3D render of a game prop model, like a textured asset shown in a modelling program: ${PUNISHER_FLAIL} ${PUNISHER_3D} Each view whole and separate, laid flat. Flat, even, shadowless lighting from all sides. A plain flat light grey background, no ground, no hands, no text.`,
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

/**
 * The carnival's Omen and Soothsayer and the Nexus Etherborn, picked by the user (2026-10-06) after three to six
 * rounds under the user's rule "how to not make this boring" (`docs/design/units/carnival-concepts.md`; every round's
 * prompt is in the folders' manifests and git). The user's looks held, the twists Claude's: the Omen's top hat and
 * gold grin, the Soothsayer's eye coat and fully veiled face, the Etherborn's galaxy skin and fan collar.
 */
const CARNIVAL_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: faded striped canvas, patched velvet, cracked leather, tarnished brass and gold, bone. Serious, adult, not cartoonish.";

// The Nexus "definitely are not worn, weathered and repaired" (the user, `factions/ral-vitahl.md`): "immaculate" in
// that one place of the recipe.
const NEXUS_NOBLE_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, immaculate physically based materials: dark silk and velvet, polished gold and brass filigree, enamel, skin of deep starlit space. Serious, adult, not cartoonish.";

// Picked: seed 1001.
const OMEN =
  "A blind gunslinger-prophet of a nomadic swindlers' carnival, tall and gaunt. Over his eyes a band of dirty red cloth with two large wide-open eyes painted on it in white, staring. A wide, crooked grin full of gold teeth. " +
  "A battered tall top hat. A long ragged trenchcoat of faded oxblood red to his ankles, a large black pentagram painted across its back; bandoliers of powder flasks across his chest, two empty holsters at his hips. Old tarot cards tucked into the hat band.";

// Picked: seed 1000.
const OMEN_PISTOLS =
  "a pair of long ornate flintlock pistols of dark wood and tarnished brass, their barrels engraved with small skulls and stars, each grip capped with a brass raven's head; each pistol drawn twice, from the side and from above.";

// Picked: seed 1000 ("the fully veiled one… very spooky").
const SOOTHSAYER =
  "A fortune teller of a nomadic swindlers' carnival, a tall woman with deep dark brown skin whose face is hidden: a deep hood, and below it a veil of strung gold coins, so only her eyes show, one of them milky white and glowing faintly. She wears a long coat of faded red and mustard striped carnival tent canvas with dozens of large open eyes painted on it in white and black, staring in every direction, its hood part of the same striped canvas, over a dark wrapped dress and boots.";

// Her orb and the cards she wields; neither picked yet.
const SOOTHSAYER_ORB =
  "a glass orb the size of a head with a single living eye floating inside it, veined and staring, wisps of smoke inside the glass; beside it a fanned hand of five worn tarot cards with dark painted faces. Each object separate.";
const SOOTHSAYER_CARDS =
  "a fan of five oversized tarot cards made as weapons: plates of thin dark metal with gilded razor edges, their faces painted with dark arcana and a single staring eye on each back; beside them one card seen edge-on, and a single card held between two gloved fingers.";

// Picked: seed 1001 ("the sleeved one. It feels more noble").
const ETHERBORN =
  "An arcane noblewoman, tall and slender. Her bare skin is deep space: dark blue-black filled with swirling galaxies, violet and blue nebulae and countless stars, as if her body were a window into the night sky. " +
  "Her arms, shoulders and neck are bare, showing the starfield. Her head is a smooth featureless oval with no eyes, no nose and no mouth, the same starfield across it. A tall, stiff fan of a collar in black enamel and gold rises behind her head. Glowing magenta-violet arcane energy wreathes her open hands. An immaculate black silk gown with gold filigree and a long open overcoat whose lining is the same starfield as her skin.";

const prop = (description: string, materials: string) =>
  `A 3D render of a game prop model, like a textured asset shown in a modelling program: ${description} ${materials} Each view whole and separate, laid flat. Flat, even, shadowless lighting from all sides. A plain flat light grey background, no ground, no hands, no text.`;

const CARNIVAL_JOBS = [
  { id: "omen-grin-turnaround", prompt: turnaround(`${OMEN} Hands empty and open, no weapon.`, CARNIVAL_3D) },
  { id: "soothsayer-hooded-dark-turnaround", prompt: turnaround(`${SOOTHSAYER} Hands empty and open, no weapon.`, CARNIVAL_3D) },
  { id: "omen-pistols-props", prompt: prop(OMEN_PISTOLS, CARNIVAL_3D), width: 2048, height: 832 },
  { id: "soothsayer-orb-props", prompt: prop(SOOTHSAYER_ORB, CARNIVAL_3D), width: 2048, height: 832 },
  { id: "soothsayer-cards-props", prompt: prop(SOOTHSAYER_CARDS, CARNIVAL_3D), width: 2048, height: 832 },
];

const ETHERBORN_JOBS = [{ id: "etherborn-lined-turnaround", prompt: turnaround(ETHERBORN, NEXUS_NOBLE_3D) }];

/**
 * Jilliath's angels, the support line (`docs/design/units/jilliath-identities.md`, the user's answers 2026-10-08): all
 * female; winged people from above, not Christianity. Round one. The user's words are held fixed (the Guardian's
 * glowing white wings, black robes and white hair; the Shepherd's stained glass; the Godkin's sky silhouette; the
 * Paragon's halo of flames; the Reclaimer's sealed ivory armour, or an iron maiden). The rest, and each unit's
 * standout, are Claude's. No weapons on the figures (support units; staffs and crooks get prop sheets later).
 */
const ANGEL_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: aged white linen and black silk, white and ivory feathers, tarnished gold and silver, blackened iron. Serious, adult, not cartoonish.";

const WINGED_T_POSE = "all standing in the same T-pose, her wings open behind her and clear of her arms";

const ANGELS: Readonly<Record<string, { readonly subject: string; readonly pose?: string; readonly materials?: string }>> = {
  // The user: "hooded, closed off, praying"; not "a bundle of feathers". Praying is a pose, so the hood carries it.
  "seraph-hooded": {
    subject: "A humble young angel woman, small and slight. A deep plain hood of undyed linen leaves her face in shadow, her head bowed. A simple long robe of undyed grey linen tied with a rope cord, bare feet. Small grey-white wings folded close behind her back.",
    pose: "all standing in the same T-pose, her small wings folded behind her",
  },
  // The user: "closer to the stereotypical angel, likely with some free flowy robes"; her face may show.
  "emissary-robed": {
    subject: "A graceful angel woman, tall, her calm face uncovered and long pale hair loose. Long flowing robes of white and pale gold silk that drift and trail around her, a thin gold circlet. Large white feathered wings.",
  },
  "guardian-glowing": {
    subject: "A stern angel woman with porcelain-white skin and long, smooth, silky white hair falling straight. A long black robe with a high collar and long black sleeves. Her two wings are made of brilliant glowing white light, neon bright, a strong contrast against the black robe.",
  },
  "shepherd-glass": {
    subject: "An angel woman whose wings are stained glass: long feather shapes of red, gold and deep blue glass held in black lead frames. Her face is a single smooth oval pane of pale stained glass in a lead frame, with no features. Long robes of white and deep blue.",
  },
  // The user: "No clothing, just the silhouette of sky and godrays." Two readings: with wings and without.
  "godkin-sky": {
    subject: "A tall female figure that is only a smooth silhouette, no face, no features, no clothing, no details: her whole surface is a bright cloudy daytime sky, white clouds drifting across blue, and shafts of golden sunlight spike out from her body.",
    pose: "all standing in the same T-pose",
  },
  "godkin-sky-winged": {
    subject: "A tall female figure that is only a smooth silhouette, no face, no features, no clothing, no details: her whole surface, wings included, is a bright cloudy daytime sky, white clouds drifting across blue, and shafts of golden sunlight spike out from her body and wings.",
  },
  "paragon-flame": {
    subject: "An angel woman with her face uncovered, severe and beautiful, eyes open and stern. A halo of fire burns above her head. White feathered wings whose tips are dipped in blood red. A long robe of white and blood-red cloth over a fitted steel breastplate.",
  },
  "empyreal-blades": {
    subject: "An angel woman in long red and white robes over a breastplate. Above her head stands her halo: a ring of upright steel blades. Her white wings are blood red from the tips halfway up.",
  },
  // The user: full tight-fitting ivory armour with a fully covered helmet; or "an iron maiden angel".
  "reclaimer-ivory": {
    subject: "An angel woman sealed from head to toe in tight-fitting armor of smooth curved ivory plates, slender and elegant, no skin showing; a fully closed ivory helmet with a smooth faceplate and no face. Long ivory feathered wings.",
  },
  "reclaimer-maiden": {
    subject: "An angel woman built as an iron maiden: her body is a tall riveted iron casket in a woman's shape with a calm sculpted iron face, its front doors standing a little open to show rows of iron spikes inside. Arms and legs of riveted iron, wings of blackened iron feathers.",
  },
  // Round two (Claude's read of round one: the Godkin came out dress-shaped, the Paragon's halo a thorn crown, the
  // Reclaimer a generic knight's helm, and the iron maiden a dark angel with no casket at all).
  "godkin-bare": {
    subject: "A tall slender female figure that is only the smooth silhouette of a bare body, legs apart, no dress, no hair, no face, no features: her whole surface is a bright cloudy daytime sky, white clouds on blue, and shafts of golden sunlight spike out from her body.",
    pose: "all standing in the same T-pose",
  },
  "paragon-fire": {
    subject: "An angel woman with her face uncovered, severe and beautiful, eyes open and stern. Above her head floats a ring of real burning fire, flames rising from it. White feathered wings whose tips are dipped in blood red. A long white robe over a fitted steel breastplate.",
  },
  "reclaimer-porcelain": {
    subject: "An angel woman sealed from head to toe in seamless, tight-fitting armor of smooth polished ivory, slender and elegant, no skin showing, no straps or rivets. Her head is a smooth ivory helm with a blank curved faceplate, no visor, no eye slits. Long ivory feathered wings.",
  },
  // The iron-maiden reading as the user means it: "the metal and the spikes, not the shell".
  "reclaimer-iron": {
    subject: "An angel woman in close-fitting armor of dark riveted iron, rows of short iron spikes standing out along her arms, shoulders and spine, an iron helm shaped as a calm sculpted woman's face. Wings of blackened iron feathers.",
  },
  "reclaimer-casket": {
    subject: "An iron maiden, the medieval torture casket, made into an angel: a tall upright riveted iron coffin in the shape of a woman, a calm sculpted woman's face on its lid, the lid open a little to show iron spikes inside; slender iron arms, and wings of blackened iron feathers spread from its back.",
  },
  // Round three, after the user's notes (2026-10-08, `jilliath-identities.md`).
  "seraph-adult": {
    subject: "A tall, grown angel woman, a mature adult, slender. A deep plain hood of undyed linen leaves her face in shadow, her head bowed. A long simple robe of undyed grey linen tied with a rope cord, bare feet. Grey-white wings folded close behind her back.",
    pose: "all standing in the same T-pose, her wings folded behind her",
  },
  // The user: a halo that is "a flat 2d plane regardless of angle, not unlike how it is in some old art of angels",
  // filled with something. Two fillings; vengeance "much much more extreme".
  "paragon-icon-gold": {
    subject: "An angel of vengeance, a woman with a face of cold fury. Behind her head a halo that is a flat round disc of hammered gold leaf tooled with rays and flames, facing forward, flat as in old icon paintings. White wings drenched in fresh blood from the tips halfway up, blood dripping from the feathers. A white robe spattered with blood over a scorched steel breastplate.",
  },
  "paragon-icon-fire": {
    subject: "An angel of vengeance, a woman with a face of cold fury. Behind her head a halo that is a flat round disc filled with burning fire, facing forward, flat as in old icon paintings. White wings drenched in fresh blood from the tips halfway up, blood dripping from the feathers. A white robe spattered with blood over a scorched steel breastplate.",
  },
  // The user's: huge blades, bright orange eyes, skin cracked and coloured like an ancient painting's canvas, a glare.
  "empyreal-glare": {
    subject: "An angel of vengeance, a woman of utter intensity. Behind and above her rises an enormous halo of huge steel blades, each blade longer than she is tall, fanning out in a vast ring that dwarfs her whole body. Her eyes glow bright orange. Her skin is cracked all over with the fine craquelure of an ancient oil painting, its colours yellowed and darkened by old varnish. Her face is set in a fixed, intense glare staring straight ahead. Blood-red wings.",
  },
  // The user: no skirt, greaves. "Armor" pulls Krea to knights, so the word is left out.
  "reclaimer-ivory-greaves": {
    subject: "An angel woman covered from head to toe in fitted plates of polished ivory, slender and elegant, no skin showing, no skirt: plate greaves on her legs, pointed sabatons on her feet. A smooth ivory helm with a blank curved faceplate. Long ivory feathered wings.",
  },
  "reclaimer-iron-greaves": {
    subject: "An angel woman covered in fitted plates of dark riveted iron, rows of short iron spikes standing out along her arms, shoulders, spine and greaves, no skirt: iron greaves on her legs. An iron helm shaped as a calm sculpted woman's face. Wings of blackened iron feathers.",
  },
  // The user: the stained-glass wings are great, "the rest is boring and forgetable".
  "shepherd-window": {
    subject: "An angel woman whose whole body and robes are made of stained glass: panes of red, gold and deep blue glass held in black lead frames, light glowing through them. Her wings are the same stained glass in long feather shapes. Her face is a single smooth oval pane of pale glass with no features.",
  },
  // The user: "It needs more, I think. Dress is boring."
  "guardian-silver": {
    subject: "A stern angel woman with porcelain-white skin and long, smooth, silky white hair falling straight. Over a long black robe she wears an ornate breastplate and tall collar of silver filigree, silver vambraces and a long open black coat edged in silver. Her two wings are made of brilliant glowing white light, neon bright, a strong contrast against the black.",
  },
  // Round four (the user on round three, 2026-10-08).
  "shepherd-window-face": {
    subject: "An angel woman whose whole body and robes are made of stained glass: panes of red, gold and deep blue glass held in black lead frames, light glowing through them. Her wings are the same stained glass in long feather shapes. She has a calm, beautiful woman's face of pale glass, eyes closed, framed by long silver hair.",
  },
  "seraph-blue": {
    subject: "A tall, grown angel woman, a mature adult, slender. A deep hood of faded deep blue linen leaves her face in shadow, her head bowed. A long simple robe of the same faded blue, tied with a rope cord, bare feet. Grey-white wings folded close behind her back.",
    pose: "all standing in the same T-pose, her wings folded behind her",
  },
  // The user: "think exoskeleton armor/shell instead of a full plated armor set. No skirt, rather tight fitting. Wings
  // should probably be metal colored too. Bladed feathers maybe."
  "reclaimer-shell": {
    subject: "An angel woman whose body is a smooth ivory exoskeleton: a seamless shell fitted tight to her slender form from head to toe, her head part of the same shell, curved and blank, no visor, no skirt, long slender legs in the same shell. Her wings are polished silver metal, each feather a long thin blade.",
  },
  "reclaimer-shell-gold": {
    subject: "An angel woman sealed in a tight, seamless exoskeleton of polished white and pale gold, a smooth carapace, the head a featureless curved shell joined to the body, no visor, no skirt, slender legs in the same shell. Wings of pale gold metal, every feather a long thin blade.",
  },
  // Round five (the user on round four, 2026-10-08): the Shepherd's face of stained glass; the Seraph's cloak looked like
  // clay (flat light on an untextured cloth: the weave is named now); the Reclaimer after the user's reference, an
  // inhuman shell with no feet, described in words. "Woman" and the angels' linen line dressed her in a skirt and heels,
  // so both are gone from her prompt.
  "shepherd-glassface": {
    subject: "An angel woman whose whole body and robes are made of stained glass: panes of red, gold and deep blue glass held in black lead frames, light glowing through them. Her wings are the same stained glass in long feather shapes. Her face too is stained glass: a calm woman's face built from pale panes in black lead, long silver hair.",
  },
  "seraph-wool": {
    subject: "A tall, grown angel woman, a mature adult, slender. A long simple robe and deep hood of coarse woven wool in faded deep blue, the weave visible, heavy soft folds, frayed hems, tied with a rope cord, bare feet. The hood leaves her face in shadow, her head bowed. Grey-white wings folded close behind her back.",
    pose: "all standing in the same T-pose, her wings folded behind her",
  },
  "reclaimer-platinum": {
    subject: "An inhuman angel, slender and feminine, tall with long elongated limbs: her whole body is a segmented shell of smooth pale platinum-grey plates, overlapping along her arms, waist and legs. Her head is a small smooth shell fused to the body, no face, a small gold diamond set in the brow, small gold diamonds set in her chest and shoulders. Her legs have no feet: they taper into long pointed tails of overlapping scaled plates, dark teal at the tips. No cloth anywhere, no skirt, no shoes. Huge wings of pale stone-grey feathers darkening to deep teal at the tips.",
    pose: "all in the same pose, arms straight out to the sides, legs hanging straight down, wings spread wide behind her",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: polished platinum, pale grey stone, tarnished gold, dark teal enamel. Serious, adult, not cartoonish.",
  },
  "reclaimer-platinum-blades": {
    subject: "An inhuman angel, slender and feminine, tall with long elongated limbs: her whole body is a segmented shell of smooth pale platinum-grey plates, overlapping along her arms, waist and legs. Her head is a small smooth shell fused to the body, no face, a small gold diamond set in the brow, small gold diamonds set in her chest and shoulders. Her legs have no feet: they taper into long pointed tails of overlapping scaled plates. No cloth anywhere, no skirt, no shoes. Huge wings of pale platinum feathers, each feather a long thin blade, darkening to deep teal at the tips.",
    pose: "all in the same pose, arms straight out to the sides, legs hanging straight down, wings spread wide behind her",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: polished platinum, pale grey stone, tarnished gold, dark teal enamel. Serious, adult, not cartoonish.",
  },
  // Round six (the user, 2026-10-08): "make the reclaimer bulkier". Round five's platinum reading, heavier.
  "reclaimer-platinum-heavy": {
    subject: "An inhuman angel, feminine and powerfully built, broad-shouldered and tall: her whole body is a segmented shell of thick, heavy pale platinum-grey plates, layered deep over her chest, shoulders, arms, hips and thighs. Her head is a small smooth shell fused to the body, no face, a small gold diamond set in the brow, gold diamonds set in her chest and shoulders. Her legs have no feet: they taper into long pointed tails of overlapping scaled plates, dark teal at the tips. No cloth anywhere, no skirt, no shoes. Huge wings of pale stone-grey feathers darkening to deep teal at the tips.",
    pose: "all in the same pose, arms straight out to the sides, legs hanging straight down, wings spread wide behind her",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: polished platinum, pale grey stone, tarnished gold, dark teal enamel. Serious, adult, not cartoonish.",
  },
  "reclaimer-platinum-heavy-blades": {
    subject: "An inhuman angel, feminine and powerfully built, broad-shouldered and tall: her whole body is a segmented shell of thick, heavy pale platinum-grey plates, layered deep over her chest, shoulders, arms, hips and thighs, the shoulder plates wide and high. Her head is a small smooth shell fused to the body, no face, a small gold diamond set in the brow, gold diamonds set in her chest and shoulders. Her legs have no feet: they taper into long pointed tails of overlapping scaled plates. No cloth anywhere, no skirt, no shoes. Huge wings of pale platinum feathers, each feather a long thin blade, darkening to deep teal at the tips.",
    pose: "all in the same pose, arms straight out to the sides, legs hanging straight down, wings spread wide behind her",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: polished platinum, pale grey stone, tarnished gold, dark teal enamel. Serious, adult, not cartoonish.",
  },
  // The user (2026-10-08): "She's not captured, she's just humble. Make her hooded. Hide her face, give her robes. She'll
  // be praying in her posture in game. Robes are black and white cloth/silk. Wings are brown and plain."
  "seraph-silk": {
    subject: "A tall, grown angel woman, humble and quiet. A deep hood hides her face completely in shadow. Long layered robes of black and white: a black outer robe of heavy woven cloth over an inner robe of white silk with soft sheen and fine folds, the white showing at the collar, sleeves and hem. Plain brown feathered wings folded behind her back.",
    pose: "all standing in the same T-pose, her wings folded behind her",
  },
  "seraph-silk-white": {
    subject: "A tall, grown angel woman, humble and quiet. A deep hood hides her face completely in shadow. Long layered robes of white and black: a white outer robe of soft silk with fine folds and a gentle sheen over an inner robe of black woven cloth, the black showing at the collar, sleeves and hem. Plain brown feathered wings folded behind her back.",
    pose: "all standing in the same T-pose, her wings folded behind her",
  },
  // The user's directions (2026-10-09, `jilliath-identities.md`); "Keep the gothic stuff on all of these."
  "guardian-porcelain": {
    subject: "A stern angel woman. Her skin is white porcelain, cracked all over, streaks of brilliant white light pouring out of the cracks. Long, smooth, silky white hair falling straight. Over a long black robe she wears an ancient chestplate from a forgotten age: pure, clean and abstract, alien in its shape, smooth pale metal without ornament. Her two wings are made of brilliant glowing white light, neon bright, a strong contrast against the black.",
  },
  "paragon-runes": {
    subject: "An angel woman with a calm face. Blazing red hair falls over the right side of her face, hiding it. Light, free-flowing armour of white and red cloth over a few fitted plates. On her right pauldron an emblem of a burning open hand, palm forward. A book hangs on a chain at her left hip. Her hands and forearms are covered in runic tattoos, her fingertips fading from pale skin into pale blue. White wings dipped in blood red at the tips.",
  },
  // Claude's, the user: "Try yours": an old icon painting come alive, the painting's gold disc in the blades' place.
  "empyreal-icon": {
    subject: "An angel of vengeance, an old icon painting come alive. Her skin is cracked oil paint, yellowed and darkened under old varnish, the craquelure running over her face and arms. Her eyes glow bright orange in a fixed, intense glare staring straight ahead. Three pairs of blood-red wings. Behind her head stands a large flat disc of tooled gold leaf, the painting's gold background. Robes of deep red and white painted cloth, cracked where they fold.",
    pose: "all standing in the same T-pose, her three pairs of wings open behind her and clear of her arms",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: old cracked oil paint and yellowed varnish, tooled gold leaf, red and white painted cloth, blood-red feathers. Serious, adult, not cartoonish.",
  },
  "empyreal-icon-plain": {
    subject: "An angel of vengeance, an old icon painting come alive. Her skin is cracked oil paint, yellowed and darkened under old varnish, the craquelure running over her face and arms. Her eyes glow bright orange in a fixed, intense glare staring straight ahead. Three pairs of blood-red wings. Robes of deep red and white painted cloth, cracked where they fold.",
    pose: "all standing in the same T-pose, her three pairs of wings open behind her and clear of her arms",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: old cracked oil paint and yellowed varnish, tooled gold leaf, red and white painted cloth, blood-red feathers. Serious, adult, not cartoonish.",
  },
};

const ANGEL_JOBS = Object.entries(ANGELS).map(([id, { subject, pose, materials }]) => ({ id: `${id}-turnaround`, prompt: turnaround(`${subject} Her hands are empty and open.`, materials ?? ANGEL_3D, pose ?? WINGED_T_POSE) }));

/**
 * Jilliath's priests, the mage line's faith side: the humans who follow the angels (`jilliath-identities.md`). Round
 * one. The Archon is the user's (wings of thick glowing bands, a black hooded cowl with glowing lining, no face). The
 * Cleric's iron bridle and the Pontiff's crown of candles are Claude's second tries, after the user's "I'm afraid of
 * this becoming generic" and "It's a bit weak". The Doomsayer is Claude's ("We can try it out").
 */
const PRIEST_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: heavy black and blood-red cloth, yellowed white linen, tarnished gold, blackened iron, old wax and leather. Serious, adult, not cartoonish.";

const PRIESTS: Readonly<Record<string, { readonly subject: string; readonly pose?: string }>> = {
  "acolyte-bound": {
    subject: "A young novice of a militant faith, thin and pale, his head shaved. A plain coarse grey robe tied with a rope. Both hands and forearms tightly bound in strips of blood-red cloth, the only colour on him.",
  },
  "cleric-bridle": {
    subject: "A priest of a militant faith sworn to silence: an iron scold's bridle locked over his head, a cage of iron bands around his skull with a flat iron plate pressing over his mouth, his eyes stern behind the bars. A long black cassock with a high white collar, a red stole.",
  },
  "pontiff-candles": {
    subject: "A high priest of a militant faith in heavy red and white vestments thick with gold embroidery. On his head a tall crown made of dozens of burning candles, white wax running down over a black veil that hides his face. Censers hang from his belt on chains.",
  },
  "archon-bands": {
    subject: "A tall figure completely covered in a black hooded cowl and long black robes, every edge lined with glowing neon-white light. Inside the hood no face, only blank white light. From the back spread wings made of four or five thick glowing white bands on each side, long ribbons of light curving in a wave.",
  },
  // Round two: round one's Cleric ignored the bridle and came out the generic priest the user feared.
  "cleric-cage": {
    subject: "A priest whose head is locked inside an iron scold's bridle: a cage of riveted iron bands around his whole skull, a flat iron plate clamped over his mouth, a padlock at the back. Behind the bars, stern eyes. A long black cassock with a high white collar and a red stole.",
  },
  "doomsayer-prophet": {
    subject: "A wild street prophet of doom, gaunt, long matted hair, his face whitened with ash. A ragged grey robe with burnt scrolls of proclamation nailed through it, a wooden yoke across his shoulders hung with small iron bells.",
  },
  // Round three, after the user's notes (2026-10-08).
  "acolyte-branded": {
    subject: "A young novice of a militant faith, thin and pale, head shaved, a burning outstretched hand freshly branded on his scalp. His eyes bound with a strip of red cloth, both forearms bound in blood-red cloth. A coarse grey robe, a heavy iron chain around his neck from which hangs a lit iron lantern.",
  },
  "doomsayer-plain": {
    subject: "A wild street prophet of doom, gaunt, long matted hair, his face whitened with ash, his eyes wide. A ragged grey and red robe, a wooden yoke across his shoulders hung with small iron bells.",
  },
  "cleric-weeping": {
    subject: "A priest of a militant faith whose face is hidden behind a gilded mask of a weeping face, tears of red enamel running down its cheeks. A long black cassock with a high white collar and a red stole, a black skullcap.",
  },
  "cleric-sewn": {
    subject: "A priest of a militant faith whose eyes are sewn shut with red thread, a third eye painted in red on his forehead, wide open. A long black cassock with a high white collar and a red stole.",
  },
  // The user: massive bands, not "wet noodles" (and not framed as anything with legs, or the model draws it).
  "archon-massive": {
    subject: "A tall figure completely covered in a black hooded cowl and long black robes, every edge lined with glowing neon-white light. Inside the hood no face, only blank white light. From his back reach enormous wings of four or five massive bands of glowing white light on each side, each band as thick as his whole torso, reaching far out beyond his hands and curving down to the ground.",
  },
  // Claude's, the user: "Try yours": ascension without wings (the bands looked like "wet noodles").
  "archon-floating": {
    subject: "A tall figure completely covered in a black hooded cowl and long black robes, every edge lined with glowing neon-white light. Inside the hood no face, only blank white light. No wings. The hem of his robes dissolves into white light: no feet, the cowl floating on a column of light.",
    pose: "all floating in the same T-pose",
  },
  "archon-crack": {
    subject: "A tall figure completely covered in a black hooded cowl and long black robes, every edge lined with glowing neon-white light. Inside the hood no face, only blank white light. No wings. A crack of brilliant white light runs down the front of his robe from the hood to the hem, widest at the chest.",
  },
  "archon-ring": {
    subject: "A tall figure completely covered in a black hooded cowl and long black robes, every edge lined with glowing neon-white light. Inside the hood no face, only blank white light. No wings. A ring of white light stands upright around his whole body, from the ground to above his hood.",
  },
};

/**
 * Jilliath's melee line past the Zealot and Punisher (`jilliath-identities.md`). Round one. The Torturer is the user's
 * ("iron maiden full metal degeneracy"); the rest are Claude's drafts the user marked keep or maybe. No masks after the
 * Zealot (the user: "nothing after zealot needs it"). The Avatar of Vengeance is the one male angel. No weapons on the
 * figures.
 */
const KNIGHT_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: blackened and scorched steel, bone-white lacquer, frayed white and blood-red cloth, old leather, tarnished brass. Serious, adult, not cartoonish.";

const MELEE: Readonly<Record<string, { readonly subject: string; readonly pose?: string; readonly materials?: string }>> = {
  "templar-reliquary": {
    subject: "A heavily armoured holy knight of a militant faith in white-lacquered plate armour with a red surcoat. Set into the centre of his breastplate, a glass-fronted reliquary holding an old finger bone, faint golden light around it. A closed great helm.",
  },
  "immortal-deathmask": {
    subject: "A holy knight whose armour is riveted together from the pieces of many broken suits, mismatched plates of white lacquer, blackened steel and brass. His visor is a bronze death mask cast from his own face, calm, eyes closed.",
  },
  "torturer-maiden": {
    subject: "A torturer of a militant faith encased in spiked iron: his body sealed in a rusted iron shell in the shape of an iron maiden, iron spikes driven through it pointing out in every direction, a small barred window where the face should be. Grotesque, degenerate, full metal.",
  },
  "fanatic-scarred": {
    subject: "A religious fanatic, a tall wiry man with a shaved head and wild staring eyes, no mask. Bare back, chest and arms scored with fresh whip scars, small scraps of written prayer nailed into his skin. Torn white and red cloth at his waist, heavy chains wound around his arms.",
  },
  // Round two: round one's Immortal had no death mask, the Torturer no iron maiden, the Avatar's wings no fire.
  "immortal-bronze": {
    subject: "A holy knight with no helmet: his face is a bronze death mask cast from his own face, calm, eyes closed, fixed to his head with iron bands. His armour is a patchwork of mismatched plates from many broken suits, white lacquer beside blackened steel beside brass, held by rivets and leather straps.",
  },
  // The user (2026-10-08): "I don't want a casket for the reclaimer or the torturer. It's the metal and the spikes, not
  // the shell."
  "torturer-spikes": {
    subject: "A torturer of a militant faith in heavy rusted iron armor bristling with iron spikes, long spikes driven through the plates at every angle, some turned inward into his own body, dried blood at the joints; a rusted iron cage helm over his head. Grotesque, degenerate, full metal.",
  },
  "avatar-fire": {
    subject: "A vengeance angel, a man with a scorched, burned bare body and glowing cracks in his skin. His wings are not feathers: two great wings made entirely of roaring orange fire burst from his back. His eyes burn white. Rags of blood-red cloth at his waist, blackened steel greaves.",
    pose: "all standing in the same T-pose, his wings of fire open behind him and clear of his arms",
  },
  "avatar-wings": {
    subject: "A vengeance angel, a man: a powerful scorched human body, burned bare, from whose back two great wings of roaring fire tear out through the skin. His eyes burn white. Rags of blood-red cloth at his waist, blackened steel greaves.",
    pose: "all standing in the same T-pose, his wings of fire open behind him and clear of his arms",
  },
  // Round three, after the user's notes (2026-10-08).
  "templar-rose": {
    subject: "A heavily armoured holy knight of a militant faith in white-lacquered plate armour with a red surcoat, a closed great helm.",
  },
  // A step up from the Templar: broken and made whole again (Guardian Spirit).
  "immortal-kintsugi": {
    subject: "A towering holy knight in ornate plate of white marble, cracked all over and mended with seams of gold. A tall crested helm of white marble and gold, a golden halo standing behind his head, a long white cape torn at the hem.",
  },
  "torturer-iron": {
    subject: "A grotesque torturer of a militant faith covered from head to toe in rusted iron: riveted iron plates bolted onto his body, hundreds of long iron spikes sticking out of him at every angle, iron hooks and chains hanging from him, a rusted iron cage locked over his head. Degenerate, full metal.",
  },
  "fanatic-nails": {
    subject: "A religious fanatic, a tall wiry man, no mask, wild staring eyes. A crown of long iron nails driven into his shaved scalp, blood streaking down his face. His bare chest branded with a burning outstretched hand. Heavy chains wound around his arms, torn white and red cloth at his waist.",
  },
  "avatar-smoulder": {
    subject: "A vengeance angel, a towering man in blackened gold plate. His wings are charred black feathers, smouldering, their edges glowing orange with embers and trailing smoke. A ring of fire stands behind his head. His eyes burn white. Blood-red cloth at his waist.",
    pose: "all standing in the same T-pose, his wings open behind him and clear of his arms",
  },
  "avatar-flamehead": {
    subject: "A vengeance angel, a towering man in blackened gold plate whose head is a single burning flame, no face. Great wings of charred black feathers glowing with embers at the edges. Blood-red cloth at his waist.",
    pose: "all standing in the same T-pose, his wings open behind him and clear of his arms",
  },
  // The user: "He should be in abstract painted armor and he should have a sword of heated metal."
  "chosen-painted": {
    subject: "A fanatic champion of a militant faith in plate armour painted all over with bold abstract strokes and shapes of red, white and black paint. No mask, a shaved head, a stern scarred face.",
  },
  // The user's directions (2026-10-09); each with materials of its own, without the shared steel line.
  "chosen-juggernaut": {
    subject: "An inhuman juggernaut in a man's shape, a brutish champion of a militant faith, massive and heavy, completely covered in form-fitting armour of smooth shell plates that follow his body, no skin showing. A red and white cape.",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: blackened shell plates, bone-white enamel, red and white cloth, heat-scorched metal. Serious, adult, not cartoonish.",
  },
  "torturer-husk": {
    subject: "A torturer: an inhuman, grotesque husk of cold grey metal plates, metal skin and no flesh showing anywhere, riddled with cone-shaped iron spikes. His face is an iron-maiden mask of anguish, a sculpted iron face frozen in a scream. Evil gauntlets hung with chains. Disastrous, wrong.",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: cold grey iron, rust, blackened chains, old dried blood. Serious, adult, not cartoonish.",
  },
  "avatar-illusory": {
    subject: "A vengeance angel, a man in hooded white and red angelic armour, its rims and edges glowing and covered in abstract symbols; his gauntlets and boots fade into glowing heated metal. Three pairs of wings layered one behind another, translucent and illusory, their feathers ending in flames.",
    pose: "all standing in the same T-pose, his three pairs of wings open behind him and clear of his arms",
    materials: "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: white enamel, red cloth, tarnished gold, glowing heated metal, translucent light. Serious, adult, not cartoonish.",
  },
};

// What they hold, as models of their own (the user, 2026-10-08): the Doomsayer's scroll, the Templar's rose shield, the
// Chosen's sword of heated metal.
const DOOMSAYER_SCROLL =
  "an enormous scroll of yellowed parchment as tall as a man, half unrolled, crowded with dense black writing and red wax seals, its wooden rollers capped with iron; beside it the same scroll rolled up.";
const TEMPLAR_SHIELD =
  "a tall kite shield of white-lacquered steel with a large raised silver rose across its face, its edge banded in tarnished silver; beside it the same shield seen from the side and from behind.";
const CHOSEN_ZWEIHANDER =
  "a massive two-handed greatsword, a zweihander of heated metal glowing orange-red along the blade, a long grip wrapped in red cloth, a wide crossguard with parrying hooks; drawn twice, from the side and turned flat.";
const CHOSEN_SWORD =
  "a long straight sword of heated metal glowing orange-red from the hilt to the tip, a blackened crossguard and grip; drawn twice, from the side and turned flat.";

const PRIEST_JOBS = [
  ...Object.entries(PRIESTS).map(([id, { subject, pose }]) => ({ id: `${id}-turnaround`, prompt: turnaround(`${subject} Hands empty and open, no weapon.`, PRIEST_3D, pose) })),
  { id: "doomsayer-scroll-props", prompt: prop(DOOMSAYER_SCROLL, PRIEST_3D), width: 2048, height: 832 },
];
const MELEE_JOBS = [
  ...Object.entries(MELEE).map(([id, { subject, pose, materials }]) => ({ id: `${id}-turnaround`, prompt: turnaround(`${subject} His hands are empty and open, no weapon.`, materials ?? KNIGHT_3D, pose) })),
  { id: "templar-shield-props", prompt: prop(TEMPLAR_SHIELD, KNIGHT_3D), width: 2048, height: 832 },
  { id: "chosen-sword-props", prompt: prop(CHOSEN_SWORD, KNIGHT_3D), width: 2048, height: 832 },
  { id: "chosen-zweihander-props", prompt: prop(CHOSEN_ZWEIHANDER, KNIGHT_3D), width: 2048, height: 832 },
];

/** Each group of jobs has its own folder, so one group's run doesn't mix into another's manifest. */
const GROUPS = [
  { dir: "art/candidates/units/grove", jobs: GROVE_JOBS },
  { dir: "art/candidates/units/neutrals/gnolls", jobs: GNOLL_JOBS },
  { dir: "art/candidates/units/neutrals/drawn", jobs: DRAWN_JOBS },
  { dir: "art/candidates/units/jilliath/zealot", jobs: ZEALOT_JOBS },
  { dir: "art/candidates/units/jilliath/punisher", jobs: PUNISHER_JOBS },
  { dir: "art/candidates/units/grove/psychopomp", jobs: PSYCHOPOMP_JOBS },
  { dir: "art/candidates/units/neutrals/carnival", jobs: CARNIVAL_JOBS },
  { dir: "art/candidates/units/nexus/etherborn", jobs: ETHERBORN_JOBS },
  { dir: "art/candidates/units/jilliath/angels", jobs: ANGEL_JOBS },
  { dir: "art/candidates/units/jilliath/priests", jobs: PRIEST_JOBS },
  { dir: "art/candidates/units/jilliath/melee", jobs: MELEE_JOBS },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
// No ids would run every job there is (it happened once by accident, regenerating old candidates over themselves).
if (ids.length === 0) throw new Error("name the jobs to run: pnpm exec tsx scripts/art/concepts.ts <job id…> [seed…]");
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
