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
const turnaround = (subject: string, materials: string) =>
  "A character turnaround sheet of a 3D game character model: the same figure shown three times side by side at the same size, in a front view, a side view from the left, and a back view, all standing in the same T-pose, " +
  `like a sculpted and textured asset shown in a modelling program, each view whole from head to feet and fingertip to fingertip. ${subject} ${materials} ` +
  "Flat, even, shadowless lighting from all sides, like a texture reference: no cast or painted shadows, no dark recesses. A plain flat light grey background, no ground, no text, no labels.";

const TURNAROUND = turnaround(GOLEM, GOTHIC_3D);

/**
 * The Custodian's turnaround recipe for the Grove (the user, 2026-10-04: the Decay line and the Sproutling in the same
 * 3D style; still the dark gothic world, the Sproutling not cute). GOTHIC_3D with the Grove's materials in place of
 * stone and brass. The subjects are Claude's concepts (`docs/design/units/sylvan-decay-line.md`), three per unit.
 */
const GROVE_3D =
  "Dark gothic fantasy, rich, brooding and ornate, desaturated colors with dark accents, grim, weathered and worn physically based materials: rough bark, wet moss, sodden dark wood, bone, frayed sinew and rawhide bindings. Serious, adult, not cartoonish, not cute.";

const GROVE_GLOW = "a faint deep moss green glow seeping from its cracks and wounds";

const GROVE: Readonly<Record<string, string>> = {
  "sproutling-graft":
    `A gaunt, feral elf warrior with pointed ears, wiry and scarred, ritual scars on the skin where pale green shoots push out through the flesh, old wounds closed over with scabs of bark, crude armor of bark plates lashed on with sinew, a carved wooden war mask, ${GROVE_GLOW}. Fierce and wild, not noble.`,
  "sproutling-husk":
    `A tall, thin, menacing figure woven from thorny briars and dark dead roots around a hollow body, like a wicker effigy, a carved tribal wooden mask for a face with dark empty eye holes, pale new shoots and thorns sprouting from its joints, ${GROVE_GLOW}. Not a child, not cute.`,
  "sproutling-sapling":
    `A feral elf berserker with pointed ears, hunched and muscular, a young tree rooted into the spine growing out of the back and shoulders with branches like antlers, roots running under the skin of the arms like veins, tattered hide wraps, ${GROVE_GLOW}. Fierce and wild, not noble.`,
  "moldling-bloom":
    `A broad, hunched brute covered in a thick coat of grey-white and green mold, puffball and cup fungus growing in clusters on its shoulders, spongy mold filling its old wounds, armor of rotting bark plates, a blank face hidden under the mold, ${GROVE_GLOW}.`,
  "moldling-litter":
    `An elf warrior with pointed ears wrapped in heavy layers of damp rotting leaf litter and fungus like a ragged ghillie cloak, shelf fungus growing as pauldrons, the face hidden behind a mask of bracket fungus with dark eye slits, a rotten wooden club, ${GROVE_GLOW}.`,
  "moldling-mycelium":
    `A heavy humanoid body of wet black rotting wood bound together by thick white threads of mycelium like tendons and bandages, small grey mushroom caps along the arms and spine, a head like a split rotten log with a dark hollow face, ${GROVE_GLOW}.`,
  "bog-giant-peat":
    "A massive hunched giant of black peat and sodden bog oak, dripping marsh water, reeds and sphagnum moss growing over its huge shoulders, rusted bog-iron fetters and chains on its wrists, a pale green will-o'-the-wisp light glowing deep inside its chest, long arms reaching the knees.",
  "bog-giant-idol":
    "A massive giant whose body is a mound of matted roots, peat and moss, with an ancient weathered carved wooden idol for a head, bound with old rawhide straps and bone fetishes, rusted bog-iron chains wound around its torso, deep moss green light in the idol's eyes.",
  "bog-giant-troll":
    "A huge, heavy troll-like being with a hide of thick wet moss and lichen, a hanging beard of bog moss, legs like knotted roots, a great club of black bog oak, crude armor of bark and bone, tiny deep-set eyes glowing deep moss green.",
  "deadwood-blasted":
    "A towering figure of split, lightning-blasted dead grey wood, a hollow charred core glowing deep moss green from inside, jagged splinters and broken branches jutting from it like spikes, long whip-like dead branches for arms, dark sap running from its cracks like blood.",
  "deadwood-knight":
    "A tall warrior whose armor and body are grown from bleached silver-grey dead driftwood shaped like gothic plate armor, a crown of broken branch spikes, its cracks leaking a deep moss green rot light, long splintered wooden claws.",
  "deadwood-gaunt":
    "A gaunt, skeletal-thin creature of dead twisted wood, wind-blasted, bark peeling from it in long strips, a cavity mouth in a narrow head, thorned spiky limbs, hung with withered dry leaves and dead vines, deep moss green light in its eye hollows. Not a noble tree spirit: starved and spiteful.",
  // The user's look (2026-10-04): the plant matter receding to show that it parasitically infests a corpse.
  "mulch-gorger-skeleton":
    "A plant skeleton: a human skeleton parasitically infested by plant matter, bark grown over the bones like a cast, vines wrapped and threaded through them, moss filling the ribcage, fungus caps along the spine, in places the plant matter receding to show the bone underneath, deep moss green light in the skull's eye sockets.",
  "mulch-gorger-mound":
    "A hulking shape of mulch, leaf litter, roots and moss, with a corpse's skeleton showing through where the mulch slides away from it: a ribcage, a skull with a jaw of root teeth, finger bones inside root claws, the plant matter infesting the bones like a parasite, deep moss green light inside it.",
  "mulch-gorger-puppet":
    "A tall elf skeleton with a long narrow skull, bound in bark like splints and moved by vines like a puppet's strings, roots grown through the bones of its arms and legs, moss and lichen on the skull, the plant matter receding from its face and chest to show the bone, deep moss green light in its eye sockets.",
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
  ...Object.entries(GROVE).map(([id, subject]) => ({ id: `${id}-turnaround`, prompt: turnaround(subject, GROVE_3D) })),
  { id: "psychopomp-plain", prompt: `${FIGURE} ${PSYCHOPOMP} ${PLAIN("deep moss green and spectral purple")}` },
];

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const ids = args.filter((a) => Number.isNaN(Number(a)));
await runBatch(
  "art/candidates/units/concepts",
  // A T-pose spans wider than it stands tall: the portrait frame cut the arms off.
  JOBS.filter((j) => ids.length === 0 || ids.includes(j.id)).map((j) => ({ ...j, ...(j.id.includes("turnaround") ? { width: 2048, height: 832 } : j.id.includes("tpose") || j.id.includes("-3d") ? { width: 1344, height: 1024 } : { width: 896, height: 1152 }) })),
  seeds.length > 0 ? seeds : [1000, 1001, 1002, 1003],
);
