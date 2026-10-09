import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { img2img, KREA2_TURBO } from "#scripts/art/comfy";
import { record, runBatch } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";

/**
 * Portraits from picked concepts (questions #13), so the card on the field, the icon and the 3D model are the same
 * creature: image-to-image from the picked concept's front view, the figure on a card for the card and a head crop for
 * the bust; the icon is cut from the bust, zoomed in on the face, so it is the same painting (three framings: `Frame`
 * in `src/view/art-slots.ts`). Learned on the Punisher and the Bog Giant (2026-10-05, `docs/design/art.md`): a T-pose
 * needs 0.75+ to be re-posed; a body that already stands needs 0.3–0.4, or its details drift. ComfyUI's Krea-2
 * reference blueprint, tried without its style LoRA, gave a dotted halftone mess and was dropped.
 *
 *     pnpm exec tsx scripts/art/portraits.ts <unit…> [--sources]           test images (--sources: only their sources)
 *     pnpm exec tsx scripts/art/portraits.ts --install <unit…>               its picks into the game
 *     pnpm exec tsx scripts/art/portraits.ts --fresh <unit…>                 cards painted from words alone (`fresh`)
 */

// The first batch's portraits the user liked were painted with chiaroscuro and a rim light on dark grey. "Ornate" in
// a painting turned the Bog Giant's bark into gold filigree; *plain* is the same line without it (the user: "try
// things out"), to compare.
type Style = "ornate" | "plain";
const PAINTED: Readonly<Record<Style, string>> = {
  ornate:
    "Dark gothic fantasy in the manner of Disciples II's art: rich, brooding and ornate, desaturated colors with dark accents, dramatic and grim materials, weathered and worn. Serious, adult, not cartoonish. " +
    "A painted fantasy illustration with chiaroscuro lighting, deep shadows and a hard rim light, on a plain flat dark grey background. No text.",
  plain:
    "Dark gothic fantasy in the manner of Disciples II's art: rich and brooding, desaturated colors with dark accents, dramatic and grim materials, weathered and worn. Serious, adult, not cartoonish. " +
    "A painted fantasy illustration with chiaroscuro lighting, deep shadows and a hard rim light, on a plain flat dark grey background. No text.",
};

const BACKGROUND = { r: 58, g: 58, b: 60 };
/** How many pixels in from the ground the fringe is cleaned. */
const FRINGE = 2;
/** An enclosed patch this close to the grey (summed RGB) is ground when its surroundings average this far from it. */
const POCKET = 16;
const POCKET_RIM = 90;
const POCKET_FLAT = 5.5;
const CARD = { width: 832, height: 1216 };
const ICON = 1024;

/** Strengths that worked: a T-pose re-posed on the card; a body that already stands, kept. */
const T_POSED = { card: [0.75, 0.9], bust: [] } as const;
const STANDING = { card: [0.3, 0.4], bust: [] } as const;

interface Square {
  readonly size: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Where the bust and icon are cut from (the user, 2026-10-05: a bust painted on its own "rarely makes for good icon
 * material", and the Zealot came out three different ways): the card, so all three framings are one painting; a
 * separately painted bust only where it's better (the Psychopomp, the Bog Giant). Fractions: `size` and `x` of the
 * source's width, `y` of its height.
 */
interface Crop extends Square {
  readonly from: "card" | "bust";
}

interface Unit {
  /** The picked concept's front view, split from its turnaround sheet. */
  readonly front: string;
  /** Who it is, in a sentence, for every prompt. */
  readonly identity: string;
  /** How it stands on its card, and what it holds; several to try more than one. */
  readonly poses: readonly string[];
  readonly strengths: { readonly card: readonly number[]; readonly bust: readonly number[] };
  readonly styles?: readonly Style[];
  /** The head's square within the front view, for a painted bust, when the head isn't on top of the figure. */
  readonly head?: Square;
  /**
   * Cards painted from words alone, no concept underneath (`--fresh`): for a unit whose card must show more than its
   * model can (the Godkin's daybreak; the user, 2026-10-09: "generate a new image entirely").
   */
  readonly fresh?: readonly string[];
  /** Claude's picks from the test, and where the bust and icon are cut from, installed by `--install`. */
  readonly picked?: { readonly card: string; readonly bust?: string; readonly crops: { readonly bust: Crop; readonly icon: Crop } };
}

const UNITS: Readonly<Record<string, Unit>> = {
  punisher: {
    front: "shots/tripo/punisher-front.png",
    identity:
      "a hooded executioner of a militant faith: a tall pointed hood with only black inside it, no face; a long cassock and a hooded mantle of dark iron-grey cloth; dented iron bracers, a heavy chain belt",
    poses: ["he stands upright, a heavy multi-headed flail resting over his shoulder"],
    strengths: T_POSED,
    picked: {
      card: "punisher-card-d75.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.5, y: 0.28 }, icon: { from: "card", size: 0.28, x: 0.48, y: 0.27 } },
    },
  },
  zealot: {
    front: "shots/tripo/zealot-front.png",
    identity:
      "a religious zealot, a tall gaunt man: his whole head covered by a smooth white mask with two wide round black eye holes and a small burning red handprint on its forehead; spiked, tattered armor scorched black, singed white robes in rags stained blood red, chains with small hooks at his belt",
    poses: ["he stands tense and leaning forward, a huge serrated two-handed greatsword of blackened steel held low"],
    strengths: T_POSED,
    picked: {
      card: "zealot-card-d75.png",
      crops: { bust: { from: "card", size: 0.5, x: 0.5, y: 0.26 }, icon: { from: "card", size: 0.2, x: 0.485, y: 0.195 } },
    },
  },
  psychopomp: {
    front: "shots/tripo/psychopomp-earless-front.png",
    identity:
      "a shamaness of a wild forest people: pale greenish skin, dark green and black tribal tattoos across her face and body, dark hair in cornrows, a hood of a wolf's head pelt with its upper teeth over her brow and its grey fur close around the sides of her face, pale ghostly teal eyes staring through everything, short fingerless ivory gloves, boots of matted grey wolf fur, knotted ivory rags, a ragged fur mantle, leather wraps and bronze bangles on her arms",
    // "Could really use a pose of some sort in the card… she just looks sort of bland" (the user). The first is the
    // user's casting reference (`docs/design/units/sylvan-psychopomp.md`); the second is Claude's, picked. Bust and
    // icon from the card too, for consistency (the user).
    poses: [
      "she stands with her palms turned down at her sides and her back bowed backwards in a strange arch, her head tilted back, staring",
      "she stands absent and swaying, one hand raised before her face with its blood-red fingers spread, the other hand hanging low",
    ],
    // Round one gave her elf ears sticking out of the hood again (the user had them painted out of the concept): no
    // "elven", the hood's fur around her face, the bust lower.
    strengths: { card: [0.75, 0.9], bust: [] },
    picked: {
      card: "psychopomp-card-pose2-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.5, y: 0.25 }, icon: { from: "card", size: 0.3, x: 0.511, y: 0.16 } },
    },
  },
  custodian: {
    front: "art/candidates/units/nexus/custodian/custodian-3d-1002.png",
    identity:
      "a hulking golem guardian, not a person: a massive body of cracked grey stone blocks bound with dark brass bands, a blank stone head, thick stone arms and legs, faint electric teal lightning crackling in the cracks, a scrap of old cloth at its waist",
    poses: ["it stands guard, its heavy arms lowered"],
    strengths: T_POSED,
    picked: {
      card: "custodian-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.55, y: 0.25 }, icon: { from: "card", size: 0.28, x: 0.64, y: 0.15 } },
    },
  },
  bonecracker: {
    front: "shots/tripo/bonecracker-front.png",
    identity:
      "a gnoll, a hyena-headed brute: heavy and broad with short legs, enormous forequarters and a thick neck, pale grey fur with dark stripes and a bristling dark mane, a massive jaw with iron-capped teeth, a heavy collar of bone plates and bronze rings, scarred bare arms, one fist in a spiked bronze gauntlet",
    poses: ["it stands hunched forward, its fists ready"],
    strengths: T_POSED,
    picked: {
      card: "bonecracker-card-d90.png",
      crops: { bust: { from: "card", size: 0.62, x: 0.6, y: 0.33 }, icon: { from: "card", size: 0.44, x: 0.7, y: 0.32 } },
    },
  },
  cackler: {
    front: "shots/tripo/cackler-front.png",
    identity:
      "a gnoll, a scrawny hunched hyena-headed creature with pale grey fur, dark spots and a bristling dark mane, its mouth stretched in a wide manic grin, a ragged cloak of tattered cloth strips like rotten jester's motley, bone rattles and small bronze bells hanging from it",
    poses: ["it stands hunched, holding a crooked staff topped with a hyena skull"],
    strengths: T_POSED,
    picked: {
      card: "cackler-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.55, y: 0.38 }, icon: { from: "card", size: 0.3, x: 0.6, y: 0.365 } },
    },
  },
  matriarch: {
    front: "shots/tripo/matriarch-front.png",
    identity:
      "a gnoll matriarch, the largest of the pack: a tall, upright, broad-shouldered female hyena-headed warrior with pale grey fur, dark stripes, a great dark mane and a scarred muzzle, a mantle of bronze plates and trophy bones over her shoulders, a cloak of a great beast's hide, a crest of teeth and bronze on her brow",
    poses: ["she stands tall, holding a heavy bronze glaive"],
    strengths: T_POSED,
    picked: {
      card: "matriarch-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.52, y: 0.3 }, icon: { from: "card", size: 0.3, x: 0.51, y: 0.21 } },
    },
  },
  sproutling: {
    front: "shots/tripo/sproutling-front.png",
    identity:
      "a small treant, nothing human about it: a squat, gnarled young stump of dark bark on uneven root legs, one arm a long crooked branch and the other a short thick knot of wood, a face of knotholes with a ragged split in the bark for a mouth, pale new shoots and a few leaves sprouting from one side of its head",
    poses: ["it stands on its root legs"],
    strengths: STANDING,
    picked: {
      card: "sproutling-card-d40.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.52, y: 0.3 }, icon: { from: "card", size: 0.3, x: 0.52, y: 0.3 } },
    },
  },
  moldling: {
    front: "shots/tripo/moldling-front.png",
    identity:
      "a skinny, hunched body of wet black rotting wood bound together by white threads of mycelium, leaning to one side, one arm longer and thinner than the other, a head like a split rotten log with a dark hollow face, small grey mushroom caps on one side, white mold furring one leg",
    poses: ["it stands hunched, leaning to one side"],
    // Its concept stands in a T-pose, but it is a creature whose details drift: between the two.
    strengths: { card: [0.6, 0.75], bust: [] },
    picked: {
      card: "moldling-card-d75.png",
      crops: { bust: { from: "card", size: 0.55, x: 0.55, y: 0.3 }, icon: { from: "card", size: 0.34, x: 0.62, y: 0.24 } },
    },
  },
  deadwood: {
    front: "shots/tripo/deadwood-front.png",
    identity:
      "an animated dead tree, nothing humanoid about it: a lightning-split, charred grey trunk, one side burned black and the other bleached and peeling, dead branches clawing up from its top on one side, two massive arms of thick dead stumps, short root legs, a faint smoky ghostly face in the split of the trunk with a faint moss green glow",
    poses: ["it stands leaning forward on its stump arms"],
    strengths: STANDING,
    picked: {
      card: "deadwood-card-d40.png",
      crops: { bust: { from: "card", size: 0.65, x: 0.5, y: 0.33 }, icon: { from: "card", size: 0.35, x: 0.48, y: 0.28 } },
    },
  },
  // Round one (0.75/0.9 card, 0.45–0.75 bust) lost its pale face and grew gold filigree; round two: the bust holds at
  // 0.3–0.4, the card turned to carved filigree at 0.5 and "bone-white" made the face a skull; round three: carved
  // roots even at 0.3. Round four: the plain style.
  bog_giant: {
    front: "shots/tripo/bog-giant-front.png",
    identity:
      "a massive hunched hulk with no human shape: a lump of black bark and sodden bog oak oozing swamp sludge, peat and mud, reeds, cattails and patches of moss; a small, pale grey-white sunken face low in the bark and a pale, cracked chest; its right arm an enormous club of bark, roots and mud, its left arm small and withered",
    poses: ["it stands hunched, its huge right arm dragging on the ground"],
    // Its icon works best from a painted bust (the user).
    strengths: { card: [0.3, 0.4], bust: [0.3] },
    styles: ["plain"],
    // Its face sits low in the bark, below the reeds on its top.
    head: { size: 0.42, x: 0.557, y: 0.33 },
    picked: {
      card: "bog_giant-card-plain-d30.png", bust: "bog_giant-bust-plain-d30.png",
      crops: { bust: { from: "bust", size: 1, x: 0.5, y: 0.5 }, icon: { from: "bust", size: 0.42, x: 0.51, y: 0.44 } },
    },
  },
  mulch_gorger: {
    front: "shots/tripo/mulch-gorger-front.png",
    identity:
      "a lurching heap of black rotting bark, mulch, bracket fungi, pale mold, wet leaves and roots with a human skull half sunk into its top, tipped back, its jaw gaping at the sky, moss and fungus growing from the skull's mouth and eye sockets; three uneven limbs of twisted roots, one a long grasping root",
    poses: ["it lurches forward"],
    strengths: STANDING,
    picked: {
      card: "mulch_gorger-card-d40.png",
      crops: { bust: { from: "card", size: 0.55, x: 0.47, y: 0.22 }, icon: { from: "card", size: 0.25, x: 0.49, y: 0.135 } },
    },
  },
  omen: {
    front: "shots/tripo/omen-front.png",
    identity:
      "a blind gunslinger-prophet of a nomadic swindlers' carnival, tall and gaunt: a red blindfold with two staring eyes painted on it in white, a wide crooked grin of gold teeth, a battered top hat with old tarot cards in its band, a long ragged oxblood-red trenchcoat with a black pentagram on its back, bandoliers of powder flasks",
    poses: ["he stands with a long ornate flintlock pistol of dark wood and brass in each hand, one raised and one low"],
    strengths: T_POSED,
    picked: {
      card: "omen-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.5, y: 0.27 }, icon: { from: "card", size: 0.25, x: 0.5, y: 0.185 } },
    },
  },
  soothsayer: {
    front: "shots/tripo/soothsayer-front.png",
    identity:
      "a fortune teller of a nomadic swindlers' carnival, a tall woman with deep dark brown skin, her face completely hidden behind a veil of strung gold coins under a deep hood, a long coat of faded red and mustard striped tent canvas covered in painted staring eyes, over a dark wrapped dress",
    poses: ["she stands still, a glass orb with a living eye floating inside it hovering above one open hand, a fan of tarot cards in the other"],
    strengths: T_POSED,
    picked: {
      card: "soothsayer-card-d90.png",
      crops: { bust: { from: "card", size: 0.66, x: 0.5, y: 0.23 }, icon: { from: "card", size: 0.25, x: 0.5, y: 0.13 } },
    },
  },
  etherborn: {
    front: "shots/tripo/etherborn-front.png",
    identity:
      "an arcane noblewoman whose skin is deep space, dark blue-black with swirling galaxies, violet nebulae and stars; a smooth featureless head with no face; a tall fan collar of black enamel and gold; an immaculate black silk gown with gold filigree and a long open overcoat lined with the same starfield; magenta-violet arcane energy wreathing her hands",
    poses: ["she stands tall and composed, her hands raised slightly at her sides, wreathed in magenta-violet arcane fire"],
    strengths: T_POSED,
    picked: {
      card: "etherborn-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.5, y: 0.21 }, icon: { from: "card", size: 0.24, x: 0.535, y: 0.09 } },
    },
  },
  packstalker: {
    front: "shots/tripo/packstalker-front.png",
    identity:
      "a gnoll, a lean long-legged hyena-headed hunter built to run, pale tawny-grey fur with dark spots, its head inside a helm made from a horned antelope skull, a brigandine harness of dark leather studded with bronze, strips of red-dyed cloth tied to its arms and hanging from its belt",
    poses: ["it crouches low and forward, a long barbed bronze hunting spear with a tuft of fur and a red cloth strip levelled in both hands"],
    strengths: T_POSED,
    picked: {
      card: "packstalker-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.58, y: 0.3 }, icon: { from: "card", size: 0.32, x: 0.635, y: 0.26 } },
    },
  },
  hamstringer: {
    front: "shots/tripo/hamstringer-front.png",
    identity:
      "a gnoll, a small wiry hyena-headed skirmisher with pale grey fur and dark spots, wrapped almost head to toe in dusty layered strips of dark cloth, a dark cowl and scarf around its head and neck, a string of round bronze bolas weights across its chest, rawhide-wrapped legs",
    poses: ["it stands poised to throw, a short barbed bronze javelin drawn back in one hand, a bundle of javelins slung on its back"],
    strengths: T_POSED,
    picked: {
      card: "hamstringer-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.52, y: 0.28 }, icon: { from: "card", size: 0.28, x: 0.52, y: 0.2 } },
    },
  },
  dustwing: {
    front: "shots/tripo/dustwing-front.png",
    identity:
      "a slender moth-folk creature: a thin pale grey body with a ruff of white fur at its throat, a small head with large black eyes and feathered antennae, thin clawed limbs, broad tattered dusty grey-brown moth wings with dark staring eyespots and long trailing tails",
    poses: ["it hovers just above the ground, its wings spread wide, its claws reaching forward, dust falling from its wings"],
    strengths: T_POSED,
    picked: {
      card: "dustwing-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.53, y: 0.33 }, icon: { from: "card", size: 0.28, x: 0.55, y: 0.34 } },
    },
  },
  chrysalis: {
    front: "shots/tripo/chrysalis-front.png",
    identity:
      "a tall upright cocoon, an object with no limbs and no face: overlapping scales of grey silk and old wax bound in a spiral of tarnished silver wire with silver filigree, a dark split opening near its top",
    poses: ["it stands upright"],
    // At 0.3–0.4 (round one) it stays a 3D render; round two repaints it harder.
    strengths: { card: [0.5, 0.6], bust: [] },
    styles: ["ornate", "plain"],
    picked: {
      card: "chrysalis-card-d60.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.5, y: 0.25 }, icon: { from: "card", size: 0.42, x: 0.47, y: 0.21 } },
    },
  },
  lightdrinker: {
    front: "shots/tripo/lightdrinker-front.png",
    identity:
      "a moth-folk like a death's-head hawkmoth, gaunt and menacing, not cute: a heavy furred black body banded with pale cream stripes, a pale bony skull-like mask of a face with two dark insect eyes and small mandibles, feathered antennae, narrow mottled dark wings folded down its back like a coat, thin clawed arms, small vials of pale light on a cord at its waist",
    // Round one (one pose, a plain "skull-like face") came out round and owlish, one huge eye at 0.9.
    poses: [
      "it stands upright on two furred legs, leaning forward, its thin clawed hands raised",
      "it stands hunched and looming, its clawed hands reaching toward the viewer",
    ],
    strengths: T_POSED,
    picked: {
      card: "lightdrinker-card-pose2-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.57, y: 0.27 }, icon: { from: "card", size: 0.28, x: 0.6, y: 0.21 } },
    },
  },
  eyespot: {
    front: "shots/tripo/eyespot-front.png",
    identity:
      "a moth-folk with four huge dark wine-red moth wings spread wide behind it like a fan, each set with a dark staring eyespot; a thin pale body in a long high-collared black velvet coat with black lace at its hem, its face hidden behind a black lace veil, feathered antennae",
    poses: ["it stands with its four wings raised and spread wide behind it"],
    strengths: T_POSED,
    picked: {
      card: "eyespot-card-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.5, y: 0.3 }, icon: { from: "card", size: 0.3, x: 0.47, y: 0.25 } },
    },
  },
  pale_mother: {
    front: "shots/tripo/pale-mother-front.png",
    identity:
      "a moth-folk matriarch, tall and regal: pale ivory fur, a moth's face with two huge round black compound eyes and no nose, a crown of lit white candles between feathered antennae, tarnished silver chains and jewelry on her arms and waist, a dark gown, broad pale ivory moth wings with dark eyespots hanging around her like a cloak",
    // Round one ("large black eyes", the first pose alone) gave her a cat's face with a pink nose.
    poses: [
      "she stands tall, her wings beginning to open like a cloak, her clawed hands at her sides",
      "she stands tall, her wings wrapped around her like a long veil and cloak, one clawed hand raised in command",
    ],
    strengths: T_POSED,
    picked: {
      card: "pale_mother-card-pose1-d90.png",
      crops: { bust: { from: "card", size: 0.6, x: 0.51, y: 0.25 }, icon: { from: "card", size: 0.34, x: 0.51, y: 0.135 } },
    },
  },
  // Jilliath's picked concepts (2026-10-09, `docs/design/units/jilliath-identities.md`, `roster.md`). Their crops come
  // from `scripts/art/portrait-frames.py` (a pose model finds the head and shoulders), not from estimates.
  seraph: {
    front: "shots/tripo/seraph-front.png",
    identity: "a humble angel woman, her face hidden in the shadow of a deep black hood, long layered robes of black cloth over white silk, plain brown feathered wings",
    poses: ["she stands with her head bowed and her hands clasped in prayer before her, her wings folded behind her"],
    strengths: T_POSED,
    picked: {
      card: "seraph-card-d90.png",
      crops: { bust: { from: "card", size: 0.619, x: 0.511, y: 0.227 }, icon: { from: "card", size: 0.310, x: 0.509, y: 0.161 } },
    },
  },
  emissary: {
    front: "shots/tripo/emissary-front.png",
    identity: "a graceful angel woman, her calm face uncovered and long pale hair loose, long flowing robes of white and pale gold silk, large white feathered wings",
    poses: ["she stands serene, one hand raised in blessing, her wings half open"],
    strengths: T_POSED,
    picked: {
      card: "emissary-card-d75.png",
      crops: { bust: { from: "card", size: 0.467, x: 0.486, y: 0.318 }, icon: { from: "card", size: 0.234, x: 0.489, y: 0.269 } },
    },
  },
  shepherd: {
    front: "shots/tripo/shepherd-front.png",
    identity: "an angel woman whose wings are stained glass, long feathers of red, gold and deep blue glass in black lead frames; her face a smooth oval pane of pale glass with no features; long robes of white and deep blue",
    poses: ["she stands tall, holding a long shepherd's crook, her stained-glass wings spread"],
    strengths: T_POSED,
    picked: {
      card: "shepherd-card-d90.png",
      crops: { bust: { from: "card", size: 0.570, x: 0.500, y: 0.257 }, icon: { from: "card", size: 0.285, x: 0.499, y: 0.197 } },
    },
  },
  godkin: {
    front: "shots/tripo/godkin-front.png",
    identity: "a tall female figure that is only a smooth bare silhouette with no face and no features: her whole surface is a bright cloudy daytime sky, white clouds on blue, shafts of golden sunlight shining out of her",
    // The user (2026-10-09): the card should show the effects that flesh her out in game, not only the bare model:
    // "godrays, daybreak, sunlight".
    poses: [
      "she stands still and upright in a burst of daybreak: blinding shafts of golden sunlight and god rays pour out of her body in every direction, cutting through the dark around her, a dawn glow spreading from her",
      "she stands with her arms a little open as daybreak breaks out of her: rays of golden light burst from her silhouette, lighting the dark around her gold and white",
    ],
    // Round two: only the pose whose rays reached across the dark (round one's pose 2 kept the light inside her).
    fresh: [
      "she stands upright and still in the heart of daybreak: blinding shafts of golden sunlight and god rays burst out of her in every direction and stream far across the dark around her, the whole image lit by her dawn, the darkness behind her split by long beams of light",
    ],
    strengths: T_POSED,
    // Picked: a fresh card (`--fresh`, seed 1006), painted from words with the god rays across the whole image, its thin
    // grey side margins replaced by its own dark edges stretched outward (`godkin-fresh-1006-card.png`). The pose model sees no person in a silhouette: the crops are
    // measured from her outline (the head at its top).
    picked: {
      card: "godkin-fresh-1006-card.png",
      crops: { bust: { from: "card", size: 0.56, x: 0.5, y: 0.2 }, icon: { from: "card", size: 0.3, x: 0.5, y: 0.095 } },
    },
  },
  reclaimer: {
    front: "shots/tripo/reclaimer-front.png",
    identity: "an inhuman angel, feminine and powerfully built, her body a segmented shell of thick pale platinum-grey plates, her head a small smooth shell with no face and a gold diamond in the brow, her legs tapering into scaled points dark teal at the tips, huge stone-grey wings going teal at the tips",
    poses: ["she hovers above the ground, legs hanging, one hand reaching out"],
    strengths: T_POSED,
    picked: {
      card: "reclaimer-card-d90.png",
      crops: { bust: { from: "card", size: 0.545, x: 0.505, y: 0.275 }, icon: { from: "card", size: 0.273, x: 0.492, y: 0.218 } },
    },
  },
  paragon: {
    front: "shots/tripo/paragon-front.png",
    identity: "an angel woman with a calm face, blazing red hair falling over the right side of her face, light free-flowing armour of white and red cloth over a few fitted plates, a burning open hand emblem on her right pauldron, a book on a chain at her left hip, runic tattoos on her hands and forearms, white wings dipped in blood red at the tips",
    poses: ["she stands calm, one hand resting on the chained book at her hip, the other raised"],
    strengths: T_POSED,
    picked: {
      card: "paragon-card-d90.png",
      crops: { bust: { from: "card", size: 0.513, x: 0.495, y: 0.208 }, icon: { from: "card", size: 0.257, x: 0.492, y: 0.154 } },
    },
  },
  acolyte: {
    front: "shots/tripo/acolyte-front.png",
    identity: "a young novice of a militant faith, thin and pale, his head shaved, his eyes bound with a strip of red cloth, his forearms bound in blood-red cloth, a coarse grey robe, a heavy iron chain around his neck",
    poses: ["he walks forward, holding up a lit iron lantern on its chain"],
    strengths: T_POSED,
    picked: {
      card: "acolyte-card-d90.png",
      crops: { bust: { from: "card", size: 0.621, x: 0.530, y: 0.227 }, icon: { from: "card", size: 0.287, x: 0.527, y: 0.176 } },
    },
  },
  pontiff: {
    front: "shots/tripo/pontiff-front.png",
    identity: "a high priest of a militant faith in heavy red and white vestments thick with gold embroidery, a tall crown of burning candles on his head, white wax running down over a black veil that hides his face",
    poses: ["he stands upright, a smoking censer swinging from its chain in one hand"],
    strengths: T_POSED,
    picked: {
      card: "pontiff-card-d90.png",
      crops: { bust: { from: "card", size: 0.825, x: 0.545, y: 0.260 }, icon: { from: "card", size: 0.413, x: 0.528, y: 0.172 } },
    },
  },
  doomsayer: {
    front: "shots/tripo/doomsayer-front.png",
    identity: "a wild street prophet of doom, gaunt, long matted hair, his face whitened with ash, a ragged grey and red robe, a wooden yoke across his shoulders hung with small iron bells",
    poses: ["he stands proclaiming, holding up an enormous half-unrolled scroll of yellowed parchment in both hands"],
    strengths: T_POSED,
    picked: {
      card: "doomsayer-card-d90.png",
      crops: { bust: { from: "card", size: 0.696, x: 0.536, y: 0.235 }, icon: { from: "card", size: 0.348, x: 0.526, y: 0.161 } },
    },
  },
  templar: {
    front: "shots/tripo/templar-front.png",
    identity: "a heavily armoured holy knight of a militant faith in white-lacquered plate armour with a red surcoat and a closed great helm",
    poses: ["he stands guard behind a tall white kite shield bearing a large raised silver rose"],
    strengths: T_POSED,
    picked: {
      card: "templar-card-d90.png",
      crops: { bust: { from: "card", size: 0.809, x: 0.508, y: 0.189 }, icon: { from: "card", size: 0.373, x: 0.485, y: 0.137 } },
    },
  },
  immortal: {
    front: "shots/tripo/immortal-front.png",
    identity: "a towering holy knight in ornate plate of white marble mended with seams of gold, a tall crested helm, a golden halo behind his head, a long white cape torn at the hem",
    poses: ["he stands unmoving and unbowed, his fists at his sides"],
    strengths: T_POSED,
    picked: {
      card: "immortal-card-d90.png",
      crops: { bust: { from: "card", size: 0.712, x: 0.502, y: 0.215 }, icon: { from: "card", size: 0.356, x: 0.505, y: 0.140 } },
    },
  },
  chosen: {
    front: "shots/tripo/chosen-front.png",
    identity: "an inhuman juggernaut in a man's shape, faceless, his head a smooth rounded shell, his body thick battered shell plates of black, bone-white and blood-red enamel, one shoulder heavier than the other",
    poses: ["he stands braced, a massive two-handed greatsword of glowing heated metal resting on his shoulder"],
    strengths: T_POSED,
    // The pose model put his face points on the sword beside his faceless head: the icon set by hand.
    picked: {
      card: "chosen-card-d90.png",
      crops: { bust: { from: "card", size: 0.661, x: 0.495, y: 0.295 }, icon: { from: "card", size: 0.26, x: 0.541, y: 0.197 } },
    },
  },
  avatar_of_vengeance: {
    front: "shots/tripo/avatar-of-vengeance-front.png",
    identity: "a vengeance angel, a man in hooded white and red angelic armour with glowing edges, no face, only a glowing red void inside his hood, three pairs of enormous red wings of long loose feathers streaking away into light and smoke",
    poses: ["he stands with his enormous red wings spread wide behind him, embers drifting"],
    strengths: T_POSED,
    picked: {
      card: "avatar_of_vengeance-card-d90.png",
      crops: { bust: { from: "card", size: 0.405, x: 0.481, y: 0.386 }, icon: { from: "card", size: 0.187, x: 0.474, y: 0.369 } },
    },
  },
};

const dirOf = (id: string) => `art/candidates/portraits/${id}`;

/** The view's figure on a dark ground: the light grey connected to the edges becomes BACKGROUND. */
async function figure(path: string): Promise<{ data: Buffer; width: number; height: number; box: { top: number; bottom: number; left: number; right: number } }> {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (i: number) => [data[i * 3] ?? 0, data[i * 3 + 1] ?? 0, data[i * 3 + 2] ?? 0] as const;
  const [r0, g0, b0] = at(0);
  const isGround = (i: number) => {
    const [r, g, b] = at(i);
    return Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) <= 48;
  };
  const ground = new Uint8Array(width * height);
  const stack: number[] = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length > 0) {
    const i = stack.pop() ?? 0;
    if (ground[i] || !isGround(i)) continue;
    ground[i] = 1;
    const x = i % width;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (i >= width) stack.push(i - width);
    if (i < width * (height - 1)) stack.push(i + width);
  }
  // Ground enclosed by the figure (between reeds, under an arm) is ground too: a flat patch of the grey's own colour
  // whose surroundings are clearly not grey. A pale highlight on a pale face has pale surroundings and stays.
  const near = (i: number) => {
    const [r, g, b] = at(i);
    return Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0);
  };
  const seen = new Uint8Array(width * height);
  for (let start = 0; start < width * height; start++) {
    if (ground[start] || seen[start] || near(start) > POCKET) continue;
    const patch: number[] = [];
    const queue = [start];
    seen[start] = 1;
    while (queue.length > 0) {
      const i = queue.pop() ?? 0;
      patch.push(i);
      const x = i % width;
      for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
        if (j < 0 || j >= width * height || seen[j] || ground[j] || near(j) > POCKET) continue;
        seen[j] = 1;
        queue.push(j);
      }
    }
    const inside = new Set(patch);
    let sum = 0;
    let count = 0;
    for (const i of patch) {
      const x = i % width;
      for (const j of [x > 2 ? i - 3 : -1, x < width - 3 ? i + 3 : -1, i - 3 * width, i + 3 * width]) {
        if (j < 0 || j >= width * height || inside.has(j)) continue;
        sum += near(j);
        count += 1;
      }
    }
    const mean = patch.reduce((total, i) => total + near(i), 0) / patch.length;
    const spread = Math.sqrt(patch.reduce((total, i) => total + (near(i) - mean) ** 2, 0) / patch.length);
    if (count > 0 && sum / count > POCKET_RIM && spread <= POCKET_FLAT) for (const i of patch) ground[i] = 1;
  }
  // The concept's edges are anti-aliased against its light grey: left alone, that fringe becomes a thin white outline
  // the repaint keeps or turns into rim light (the user, 2026-10-05). Defringe: the pixels within FRINGE of the ground
  // take the colour of the figure just inside them, filled from the inside out.
  const depth = new Uint8Array(width * height);
  let ring = [...ground.keys()].filter((i) => ground[i]);
  for (let step = 1; step <= FRINGE; step++) {
    const next: number[] = [];
    for (const i of ring) {
      const x = i % width;
      for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
        if (j < 0 || j >= width * height || ground[j] || depth[j]) continue;
        depth[j] = step;
        next.push(j);
      }
    }
    ring = next;
  }
  for (let step = FRINGE; step >= 1; step--) {
    for (let i = 0; i < width * height; i++) {
      if (depth[i] !== step) continue;
      const x = i % width;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width, x > 0 ? i - width - 1 : -1, x < width - 1 ? i - width + 1 : -1, x > 0 ? i + width - 1 : -1, x < width - 1 ? i + width + 1 : -1]) {
        if (j < 0 || j >= width * height || ground[j]) continue;
        const inner = depth[j] ?? 0;
        if (inner !== 0 && inner <= step) continue;
        r += data[j * 3] ?? 0;
        g += data[j * 3 + 1] ?? 0;
        b += data[j * 3 + 2] ?? 0;
        n += 1;
      }
      if (n === 0) continue;
      data[i * 3] = Math.round(r / n);
      data[i * 3 + 1] = Math.round(g / n);
      data[i * 3 + 2] = Math.round(b / n);
      depth[i] = 0;
    }
  }
  const box = { top: height, bottom: 0, left: width, right: 0 };
  for (let i = 0; i < width * height; i++) {
    if (ground[i]) {
      data[i * 3] = BACKGROUND.r;
      data[i * 3 + 1] = BACKGROUND.g;
      data[i * 3 + 2] = BACKGROUND.b;
      continue;
    }
    const x = i % width;
    const y = Math.floor(i / width);
    box.top = Math.min(box.top, y);
    box.bottom = Math.max(box.bottom, y);
    box.left = Math.min(box.left, x);
    box.right = Math.max(box.right, x);
  }
  return { data, width, height, box };
}

/** The head and shoulders, square: where the unit says, or centred on the top of the figure. */
async function bustSource(front: string, out: string, square: Square | undefined): Promise<void> {
  const { data, width, height, box } = await figure(front);
  if (square) {
    const side = Math.round(width * square.size);
    const left = Math.max(0, Math.min(width - side, Math.round(width * square.x - side / 2)));
    const top = Math.max(0, Math.min(height - side, Math.round(height * square.y - side / 2)));
    await sharp(data, { raw: { width, height, channels: 3 } }).extract({ left, top, width: side, height: side }).resize(ICON, ICON).png().toFile(out);
    return;
  }
  const side = Math.round((box.bottom - box.top) * 0.46);
  const band = Math.round((box.bottom - box.top) * 0.08);
  let sum = 0;
  let count = 0;
  for (let y = box.top; y < box.top + band; y++) {
    for (let x = box.left; x <= box.right; x++) {
      const i = y * width + x;
      if (data[i * 3] !== BACKGROUND.r || data[i * 3 + 1] !== BACKGROUND.g || data[i * 3 + 2] !== BACKGROUND.b) {
        sum += x;
        count += 1;
      }
    }
  }
  const centre = Math.round(sum / Math.max(1, count));
  const left = Math.max(0, Math.min(width - side, centre - Math.round(side / 2)));
  const top = Math.max(0, box.top - Math.round(side * 0.06));
  await sharp(data, { raw: { width, height, channels: 3 } })
    .extract({ left, top, width: side, height: Math.min(side, height - top) })
    .resize(ICON, ICON, { fit: "contain", background: BACKGROUND })
    .png()
    .toFile(out);
}

/** The whole figure, fitted to a card. */
async function cardSource(front: string, out: string): Promise<void> {
  const { data, width, height, box } = await figure(front);
  const figureImage = await sharp(data, { raw: { width, height, channels: 3 } })
    .extract({ left: box.left, top: box.top, width: box.right - box.left + 1, height: box.bottom - box.top + 1 })
    .resize(Math.round(CARD.width * 0.92), Math.round(CARD.height * 0.9), { fit: "inside" })
    .png()
    .toBuffer();
  await sharp({ create: { ...CARD, channels: 3, background: BACKGROUND } }).composite([{ input: figureImage, gravity: "center" }]).png().toFile(out);
}

/** Sizes in the game: the card as the old portraits, the bust and icon square. */
const INSTALLED = { card: 384, bust: 384, icon: 192 };

async function install(id: string): Promise<void> {
  const unit = UNITS[id];
  if (!unit) throw new Error(`unknown unit "${id}"`);
  const picked = unit.picked;
  if (!picked) throw new Error(`${id} has no picks yet: test it, pick, and place its crops`);
  const dir = dirOf(id);
  const cut = async (crop: Crop, size: number, out: string) => {
    const file = crop.from === "card" ? picked.card : picked.bust;
    if (!file) throw new Error(`${id} crops from a bust it hasn't picked`);
    const { width = 0, height = 0 } = await sharp(`${dir}/${file}`).metadata();
    const side = Math.round(width * crop.size);
    const left = Math.max(0, Math.min(width - side, Math.round(width * crop.x - side / 2)));
    const top = Math.max(0, Math.min(height - side, Math.round(height * crop.y - side / 2)));
    await sharp(`${dir}/${file}`).extract({ left, top, width: side, height: side }).resize(size, size).webp({ quality: 88 }).toFile(out);
  };
  await sharp(`${dir}/${picked.card}`).resize({ width: INSTALLED.card }).webp({ quality: 88 }).toFile(`assets/art/portrait/${id}.webp`);
  await mkdir("assets/art/bust", { recursive: true });
  await mkdir("assets/art/icon", { recursive: true });
  await cut(picked.crops.bust, INSTALLED.bust, `assets/art/bust/${id}.webp`);
  await cut(picked.crops.icon, INSTALLED.icon, `assets/art/icon/${id}.webp`);
  console.log(`installed assets/art/{portrait,bust,icon}/${id}.webp`);
}

type Run = { readonly file: string; readonly make: () => Promise<Uint8Array>; readonly entry: Omit<Candidate, "file" | "model"> };

async function test(id: string, sourcesOnly: boolean): Promise<void> {
  const unit = UNITS[id];
  if (!unit) throw new Error(`unknown unit "${id}"; known: ${Object.keys(UNITS).join(", ")}`);
  const dir = dirOf(id);
  await mkdir(dir, { recursive: true });
  const bustSrc = `${dir}/${id}-bust-source.png`;
  const cardSrc = `${dir}/${id}-card-source.png`;
  await bustSource(unit.front, bustSrc, unit.head);
  await cardSource(unit.front, cardSrc);
  if (sourcesOnly) return;
  const runs: Run[] = (unit.styles ?? ["ornate"]).flatMap((style): Run[] => {
    const suffix = style === "ornate" ? "" : `-${style}`;
    const bustPrompt = `A painted head-and-shoulders portrait of ${unit.identity}. ${PAINTED[style]}`;
    return [
      ...unit.strengths.bust.map((denoise): Run => ({
        file: `${id}-bust${suffix}-d${Math.round(denoise * 100)}.png`,
        make: () => img2img({ prompt: bustPrompt, seed: 1000, source: bustSrc, denoise }, `disc/${id}-bust`),
        entry: { id: `${id}-bust${suffix}`, seed: 1000, prompt: bustPrompt, source: bustSrc, denoise },
      })),
      ...unit.poses.flatMap((pose, p) => {
        const cardPrompt = `A painted full-body character card of ${unit.identity}; ${pose}. ${PAINTED[style]}`;
        const posed = unit.poses.length > 1 ? `-pose${p + 1}` : "";
        return unit.strengths.card.map((denoise): Run => ({
          file: `${id}-card${suffix}${posed}-d${Math.round(denoise * 100)}.png`,
          make: () => img2img({ prompt: cardPrompt, seed: 1000, source: cardSrc, denoise }, `disc/${id}-card`),
          entry: { id: `${id}-card${suffix}${posed}`, seed: 1000, prompt: cardPrompt, source: cardSrc, denoise },
        }));
      }),
    ];
  });
  const made: Candidate[] = [];
  for (const run of runs) {
    const started = Date.now();
    // Every image is kept (the unit-concepts skill): an earlier one of the same name moves to earlier/, stamped.
    const earlier = await stat(`${dir}/${run.file}`).catch(() => null);
    if (earlier) {
      await mkdir(`${dir}/earlier`, { recursive: true });
      await rename(`${dir}/${run.file}`, `${dir}/earlier/${run.file.replace(/\.png$/, `-${earlier.mtime.toISOString().replace(/[:.]/g, "-")}.png`)}`);
    }
    await writeFile(`${dir}/${run.file}`, await run.make());
    console.log(`${dir}/${run.file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    made.push({ file: run.file, model: KREA2_TURBO.diffusionModel, ...run.entry });
    await record(dir, made);
  }
}

/** Every `fresh` pose at three seeds, the card's size, into the unit's portrait folder. */
async function fresh(id: string): Promise<void> {
  const unit = UNITS[id];
  if (!unit?.fresh) throw new Error(`${id} has no fresh poses`);
  const jobs = unit.fresh.map((pose, p) => ({
    id: `${id}-fresh${unit.fresh && unit.fresh.length > 1 ? `-pose${p + 1}` : ""}`,
    // "Character card" painted a card's frame inside the image; a fresh card fills its image edge to edge.
    prompt: `A painted full-body illustration of ${unit.identity}; ${pose}. The painting fills the whole image edge to edge, no border, no frame. ${PAINTED.ornate}`,
    ...CARD,
  }));
  await runBatch(dirOf(id), jobs, [1003, 1004, 1005, 1006]);
}

const args = process.argv.slice(2);
if (args[0] === "--install") {
  for (const id of args.slice(1)) await install(id);
} else if (args[0] === "--fresh") {
  for (const id of args.slice(1)) await fresh(id);
} else {
  const sourcesOnly = args.includes("--sources");
  for (const id of args.filter((a) => !a.startsWith("--"))) await test(id, sourcesOnly);
}
