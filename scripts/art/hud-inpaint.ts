import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { depthInpaint, inpaint } from "#scripts/art/comfy";

/**
 * Repairs part of a painted HUD piece (the `hud-paint-in` skill, after judging): a masked image to image over the
 * named boxes; everything outside the mask is kept exactly. Boxes are in the layout's page px. With a depth map (the
 * piece's depth greybox) the repaint is held to the piece's structure, so a box may cross a rim without losing it.
 *
 *     pnpm tsx scripts/art/hud-inpaint.ts <repair> [seed…]     (candidates into art/candidates/ui/inpaint/<repair>/)
 */

interface Repair {
  readonly source: string;
  readonly page: readonly [number, number];
  readonly boxes: readonly (readonly [number, number, number, number])[];
  /** A drawn mask (white is repainted) in place of the boxes, at the source's size, for parts no box fits (a window's
   * glass between its leads). */
  readonly mask?: string;
  readonly denoise: readonly number[];
  readonly prompt: string;
  readonly depth?: { readonly map: string; readonly strength: number };
}

const REPAIRS: Readonly<Record<string, Repair>> = {
  /**
   * What round 4's angel stands on (the user, 2026-10-11: "It looks like she's standing on a stool [...] Maybe that's
   * where those spires can be?"): a foliage corbel crowning a crocketed gable over a pointed portal that frames the
   * leave button, pinnacles beside her with small flying buttresses. Sketched into seed 4 and held to its own depth
   * map (`art/greybox/jilliath-capitol-base/make.py`); the angel and the button are outside the mask.
   */
  "jilliath-capitol-base": {
    source: "art/greybox/jilliath-capitol-base/source.png",
    page: [300, 864],
    boxes: [],
    mask: "art/greybox/jilliath-capitol-base/mask.png",
    denoise: [0.8, 0.9],
    depth: { map: "art/greybox/jilliath-capitol-base/depth.png", strength: 0.9 },
    prompt:
      "Game interface art, the lower part of a tall dark iron column seen straight on, in soft even light without glare. Behind everything, blackened cast iron covered in a gothic diaper of small quatrefoils in a diamond lattice, dark on dark, old and worn. In the middle, a gothic church portal carved in pale weathered stone: a deep pointed doorway with moulded arches stepping inward, dark inside, a round ivory enamel button in an iron socket in its depths, under a steep gable with crockets climbing its edges, the gable's peak carrying a carved stone corbel of curling leaves on which a statue stands. On each side, a slender gothic pinnacle of dark iron with a crocketed spire and a finial, each joined to the portal by a small flying buttress. Old and worn, matte, with no polish. No text, no letters.",
  },
  /**
   * Round 4's base again, tighter (the user: the first base's pattern came back "about 4 times bigger" and its spires
   * didn't belong; the door can be the way out): a leaf corbel on a crocketed gable over a stone portal with a closed
   * oak door, no pinnacles, the diaper held at round 4's scale by the depth map (`art/greybox/jilliath-capitol-door/`).
   */
  "jilliath-capitol-door": {
    source: "art/greybox/jilliath-capitol-door/source.png",
    page: [300, 864],
    boxes: [],
    mask: "art/greybox/jilliath-capitol-door/mask.png",
    denoise: [0.8, 0.9],
    depth: { map: "art/greybox/jilliath-capitol-door/depth.png", strength: 0.9 },
    prompt:
      "Game interface art, the lower part of a tall dark iron column seen straight on, in soft even light without glare. Behind everything, blackened cast iron covered in a gothic diaper of small quatrefoils in a fine diamond lattice, dark on dark, old and worn. In the middle, a gothic church portal carved in pale weathered stone, its moulded arches stepping inward, holding a closed pointed door of dark oak planks with black iron strap hinges and a ring handle, under a steep stone gable with crockets climbing its edges, the gable's peak carrying a carved stone corbel of curling leaves on which a statue stands. Old and worn, matte, with no polish. No text, no letters.",
  },
  /** The door repaint's pick with the remnants of round 4's low iron arch beside the portal painted out, the diaper held. */
  "jilliath-capitol-door-edges": {
    source: "art/candidates/ui/inpaint/jilliath-capitol-door/jilliath-capitol-door-d80-3.png",
    page: [300, 864],
    boxes: [],
    mask: "art/greybox/jilliath-capitol-door/edges-mask.png",
    denoise: [0.7, 0.85],
    depth: { map: "art/greybox/jilliath-capitol-door/depth.png", strength: 0.9 },
    prompt:
      "Game interface art, dark blackened cast iron covered in a gothic diaper of small quatrefoils in a fine diamond lattice, dark on dark, old and worn, an even flat surface, matte. No text, no letters.",
  },
  /**
   * The garrison wall's squad windows back to three by three: every seed split each pane into smaller leaded pieces.
   * The greybox's nine panes laid in (`art/greybox/jilliath-garrison-panes/make.py`) and held to the wall's depth.
   */
  "jilliath-garrison-panes": {
    source: "art/greybox/jilliath-garrison-panes/source.png",
    page: [1236, 864],
    boxes: [],
    mask: "art/greybox/jilliath-garrison-panes/mask.png",
    denoise: [0.6, 0.72],
    depth: { map: "art/greybox/jilliath-garrison/depth.png", strength: 1 },
    prompt:
      "Game interface art, part of a gothic stained glass window in soft even light: a grid of exactly nine large square panes, three across and three down, in heavy dark lead cames, each pane one single unbroken piece of glowing red or amber glass with a little mottling, the colours mixed across the grid. No text, no letters.",
  },
  /**
   * The accepted Capitol column with its diaper replaced by masonry in shadow, matching the garrison's round 2 (the
   * user: the pattern "was already a bit much to look at on the right side"); the masonry is laid into the source and
   * the depth at the garrison's block size (`art/greybox/jilliath-capitol-stone/make.py`).
   */
  "jilliath-capitol-stone": {
    source: "art/greybox/jilliath-capitol-stone/source.png",
    page: [300, 864],
    boxes: [],
    mask: "art/greybox/jilliath-capitol-stone/mask.png",
    denoise: [0.7, 0.82],
    depth: { map: "art/greybox/jilliath-capitol-stone/depth.png", strength: 0.8 },
    prompt:
      "Game interface art, a wall of large old dressed stone blocks in irregular courses seen straight on, warm dark grey, weathered and chipped, each block a little different, in deep shadow, plain, with no pattern on it, in soft even light. No lattice. No text, no letters.",
  },
  /** The stone column's last lattice: between the angel's arms and at the gable's shoulders, held to the masonry depth. */
  "jilliath-capitol-stone-rest": {
    source: "art/candidates/ui/inpaint/jilliath-capitol-stone/jilliath-capitol-stone-d82-1.png",
    page: [300, 864],
    boxes: [[134, 318, 32, 58], [90, 598, 28, 54], [182, 598, 28, 54]],
    denoise: [0.75, 0.88],
    depth: { map: "art/greybox/jilliath-capitol-stone/depth.png", strength: 0.8 },
    prompt:
      "Game interface art, a wall of large old dressed stone blocks seen straight on, warm dark grey, weathered, in deep shadow, plain, with no pattern on it. No lattice. No text, no letters.",
  },
  /** The stone column's lattice that the first pass left beside the angel's arms and the gable, masked to the lattice itself (`art/greybox/jilliath-capitol-stone/rest.py`). */
  "jilliath-capitol-stone-rest2": {
    source: "art/candidates/ui/inpaint/jilliath-capitol-stone-rest/jilliath-capitol-stone-rest-d88-2.png",
    page: [300, 864],
    boxes: [],
    mask: "art/greybox/jilliath-capitol-stone/rest-mask.png",
    denoise: [0.85, 0.95],
    depth: { map: "art/greybox/jilliath-capitol-stone/depth.png", strength: 0.8 },
    prompt:
      "Game interface art, a wall of large old dressed stone blocks seen straight on, warm dark grey, weathered, in deep shadow, plain, with no pattern on it. No lattice. No text, no letters.",
  },
  /** The lattice still between the angel's raised arms (the glow made it read as coloured to the mask), a box between them only. */
  "jilliath-capitol-stone-arms": {
    source: "art/candidates/ui/inpaint/jilliath-capitol-stone-rest2/jilliath-capitol-stone-rest2-d95-2.png",
    page: [300, 864],
    boxes: [[138, 334, 32, 50]],
    denoise: [0.85, 0.95],
    depth: { map: "art/greybox/jilliath-capitol-stone/depth.png", strength: 0.8 },
    prompt:
      "Game interface art, a wall of large old dressed stone blocks seen straight on, warm dark grey, weathered, plain, with no pattern on it, softly lit by a warm golden glow from above. No lattice. No text, no letters.",
  },
  /** The lattice just outside the angel's raised arms, masked to the lattice (`rest.py`, the flanks line in its doc). */
  "jilliath-capitol-stone-flanks": {
    source: "art/candidates/ui/inpaint/jilliath-capitol-stone-arms/jilliath-capitol-stone-arms-d85-1.png",
    page: [300, 864],
    boxes: [],
    mask: "art/greybox/jilliath-capitol-stone/flanks-mask.png",
    denoise: [0.85, 0.95],
    depth: { map: "art/greybox/jilliath-capitol-stone/depth.png", strength: 0.8 },
    prompt:
      "Game interface art, a wall of large old dressed stone blocks seen straight on, warm dark grey, weathered, plain, with no pattern on it, softly lit by a warm golden glow from above. No lattice. No text, no letters.",
  },
  /** The duel bar's figures: arms and hands came out malformed (the user, 2026-10-10). */
  "duel-hands": {
    source: "art/candidates/ui/paint-in/battle-bar-duel-dull-nostone/battle-bar-duel-dull-nostone-3.png",
    page: [1536, 200],
    boxes: [[0, 0, 200, 200], [1336, 0, 200, 200]],
    denoise: [0.55, 0.7],
    prompt:
      "Game interface art, a dark iron bar in soft even light. At the left end, carved in deep relief in old worn blackened iron, a grown veiled woman in long robes with a folded feathered wing, kneeling on a ledge, both hands laid flat and gently on a large sphere of deep red glass, her arms and hands well formed, each hand with five fingers. " +
      "At the right end, mirroring her, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, kneeling, both hands laid flat on another sphere of deep red glass, arms and hands well formed. No text, no letters.",
  },
  /** The same, only the arms and hands, held to the bar's depth greybox (the first try repainted the globes' rims away). */
  "duel-hands-held": {
    source: "art/candidates/ui/paint-in/battle-bar-duel-dull-nostone/battle-bar-duel-dull-nostone-3.png",
    page: [1536, 200],
    boxes: [[50, 25, 115, 115], [1371, 25, 115, 115]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/battle-bar-duel-dull-nostone/depth.png", strength: 1 },
    prompt:
      "Game interface art, a dark iron bar in soft even light. At the left end, carved in deep relief in old worn blackened iron, a grown veiled woman in long robes with a folded feathered wing, kneeling on a ledge, both hands laid flat and gently on a large sphere of deep red glass, her arms and hands well formed, each hand with five fingers. " +
      "At the right end, mirroring her, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, kneeling, both hands laid flat on another sphere of deep red glass, arms and hands well formed. No text, no letters.",
  },
  /** The held repair, the sphere told to fill its rim (it shrank inside it). */
  "duel-hands-full": {
    source: "art/candidates/ui/paint-in/battle-bar-duel-dull-nostone/battle-bar-duel-dull-nostone-3.png",
    page: [1536, 200],
    boxes: [[50, 25, 115, 115], [1371, 25, 115, 115]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/battle-bar-duel-dull-nostone/depth.png", strength: 1 },
    prompt:
      "Game interface art, a dark iron bar in soft even light. At the left end, carved in deep relief in old worn blackened iron, a grown veiled woman in long robes with a folded feathered wing, kneeling on a ledge, both hands laid flat and gently on a large sphere of deep red glass that fills its round iron rim edge to edge, her arms and hands well formed, each hand with five fingers. " +
      "At the right end, mirroring her, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, kneeling, both hands laid flat on another sphere of deep red glass that fills its rim edge to edge, arms and hands well formed. No text, no letters.",
  },
  /** The map column's window in another glass (the user, 2026-10-11: ours reads "murky red"; real windows use many colours in coordination). Chartres blue: cobalt ground, ruby and gold through it, emerald accents. */
  "glass-chartres": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.75, 0.9],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, glowing with light from behind, the grey lead cames and iron bars exactly where they are. " +
      "Chartres blue: the window's ground a deep luminous cobalt blue, with ruby red and gold yellow pieces set through it in a regular pattern, a few small emerald green pieces; the border strips alternate ruby and gold; the tracery head blue with gold and ruby." +
      " Real medieval cathedral glass: each square pane is made of several smaller leaded pieces with faint painted detail, the colours clear, saturated and luminous, not murky. No text, no letters.",
  },
  /** The map column's window in another glass (the user, 2026-10-11: ours reads "murky red"; real windows use many colours in coordination). Jewel colours: the panes alternate sapphire, ruby, emerald, amber and violet. */
  "glass-jewels": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.75, 0.9],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, glowing with light from behind, the grey lead cames and iron bars exactly where they are. " +
      "Jewel colours in a coordinated pattern: the nine square panes alternate sapphire blue, ruby red, emerald green, amber gold and violet, no two neighbours alike, the centre pane gold; the border strips small pieces of every colour in turn; the tracery head ruby and sapphire around a gold centre." +
      " Real medieval cathedral glass: each square pane is made of several smaller leaded pieces with faint painted detail, the colours clear, saturated and luminous, not murky. No text, no letters.",
  },
  /** The map column's window in another glass (the user, 2026-10-11: ours reads "murky red"; real windows use many colours in coordination). Ember and sky: warm ruby and gold panes inside a sapphire border and head. */
  "glass-ember": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.75, 0.9],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, glowing with light from behind, the grey lead cames and iron bars exactly where they are. " +
      "Ember and sky: the nine square panes warm ruby red, crimson and gold amber, set inside a border of deep sapphire blue strips, the tracery head deep blue with gold and ruby pieces, so the warm centre glows against the cool blue around it." +
      " Real medieval cathedral glass: each square pane is made of several smaller leaded pieces with faint painted detail, the colours clear, saturated and luminous, not murky. No text, no letters.",
  },
  /** The map column's window in a scheme with reasons (hud-pieces.md, "Colour in the glass"). Analogous with light: ruby 60, amber 30, pale straw 10. Exact glass mask. */
  "glass-ruby-light": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.8, 0.95],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, the grey lead cames and iron bars exactly where they are. " +
      "Jilliath's scheme, analogous with light: about two thirds of the pieces deep ruby red, about a quarter warm amber gold set as a regular pattern among them, and a few small pieces of pale clear straw glass as points of light; the border strips alternate ruby and amber." +
      " Real medieval cathedral glass with light shining through it: every piece of glass one clean, even, saturated colour from edge to edge, luminous and translucent, brightest at its centre, separated by dark lead lines; no grey, no black or muddy patches inside the glass. No text, no letters.",
  },
  /** The analogous scheme with a lighter red: deep ruby painted dark and mottled at any strength (ruby is a dark glass). */
  "glass-scarlet-light": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.8, 0.95],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, the grey lead cames and iron bars exactly where they are. " +
      "Jilliath's scheme, analogous with light: about two thirds of the pieces bright clear scarlet red, a light vermilion that glows with the light behind it,, about a quarter warm amber gold set as a regular pattern among them, and a few small pieces of pale clear straw glass as points of light; the border strips alternate scarlet and amber." +
      " Real medieval cathedral glass with light shining through it: every piece of glass one clean, even, saturated colour from edge to edge, luminous and translucent, brightest at its centre, separated by dark lead lines; no grey, no black or muddy patches inside the glass. No text, no letters.",
  },
  /** The map column's window in a scheme with reasons (hud-pieces.md, "Colour in the glass"). Ruby 60, amber 30, a deep ultramarine accent 10 in the border. Exact glass mask. */
  "glass-ruby-blue": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.8, 0.95],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, the grey lead cames and iron bars exactly where they are. " +
      "Jilliath's scheme, with a cool accent: about two thirds of the pieces deep ruby red, about a quarter warm amber gold, and a few small pieces of very deep ultramarine blue only in the border strips and the tracery head, so the warm centre glows against them." +
      " Real medieval cathedral glass with light shining through it: every piece of glass one clean, even, saturated colour from edge to edge, luminous and translucent, brightest at its centre, separated by dark lead lines; no grey, no black or muddy patches inside the glass. No text, no letters.",
  },
  /** The map column's window in a scheme with reasons (hud-pieces.md, "Colour in the glass"). Ruby on pale white grisaille, a little amber. Exact glass mask. */
  "glass-ruby-white": {
    source: "art/candidates/ui/inpaint/column-third-arm/column-third-arm-d65-4.png",
    page: [300, 864],
    boxes: [],
    mask: "art/masks/map-column-glass.png",
    denoise: [0.8, 0.95],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a gothic stained glass window seen straight on, the grey lead cames and iron bars exactly where they are. " +
      "Jilliath's scheme, ruby on light: about half the pieces deep ruby red, set against a ground of pale warm white and clear straw glass, with a few small amber gold pieces; like grisaille glass with ruby, light and solemn." +
      " Real medieval cathedral glass with light shining through it: every piece of glass one clean, even, saturated colour from edge to edge, luminous and translucent, brightest at its centre, separated by dark lead lines; no grey, no black or muddy patches inside the glass. No text, no letters.",
  },
  /** The garrison wall's effigy: one forearm stood up from his chest and the other was lost; hands folded, as asked. */
  "garrison-effigy": {
    source: "art/candidates/ui/paint-in/capitol-garrison/capitol-garrison-6.png",
    page: [1236, 864],
    boxes: [[958, 694, 110, 70]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/capitol-garrison/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a dark iron relief, everything carved in the same old dark worn iron, matte, no skin, no flesh. " +
      "A recumbent knight effigy in plate armour lying on his back on the lid of a tomb chest, both arms bent so that his two gauntleted hands meet palm to palm in prayer, resting flat on his chest, nothing raised above him. No text, no letters.",
  },
  /** The garrison windows: an extra lead down each window's middle column made four columns of panes, not three. */
  "garrison-leads": {
    source: "art/candidates/ui/inpaint/garrison-effigy/garrison-effigy-d55-2.png",
    page: [1236, 864],
    boxes: [[202, 330, 20, 296], [619, 330, 20, 296]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/capitol-garrison/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: stained glass panes in deep red and amber held by grey lead cames in a dark iron window. " +
      "Each pane is one whole piece of glass across this strip, with no upright lead line through it; only the horizontal lead cames run straight across. No text, no letters.",
  },
  /** The leads repair left each middle pane in two colours with a seam; the whole middle column repainted, one colour per pane. */
  "garrison-middle-panes": {
    source: "art/candidates/ui/inpaint/garrison-effigy/garrison-effigy-d55-2.png",
    page: [1236, 864],
    boxes: [[161, 334, 101, 289], [579, 334, 101, 289]],
    denoise: [0.7, 0.85],
    depth: { map: "art/greybox/capitol-garrison/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a column of three square panes of stained glass stacked in a dark iron window, held by grey lead cames along their edges only. " +
      "Each pane is one whole piece of deep amber glass, a single even colour from edge to edge, with no line, seam or split down its middle. No text, no letters.",
  },
  /** The map column's foot: the angel's and the succubus's hands around the End turn gem (the user, 2026-10-10). */
  "column-hands": {
    source: "art/candidates/ui/paint-in/map-column-duality/map-column-duality-2.png",
    page: [300, 864],
    boxes: [[92, 700, 118, 122]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: carved in deep relief in old dark worn iron, a grown angel with feathered wings kneeling at the left and a grown succubus with bat wings and small curved horns at the right, " +
      "both resting their hands gently on a large round disc of lit amber glass that fills its round iron rim edge to edge, the angel's cheek and both hands against the glass, the succubus's arm laid over its top, " +
      "their arms and hands well formed, each hand with five fingers. No text, no letters.",
  },
  /** The same, one small box per hand, the faces and the glass outside them; everything kept iron. */
  "column-hands-2": {
    source: "art/candidates/ui/paint-in/map-column-duality/map-column-duality-2.png",
    page: [300, 864],
    boxes: [[98, 722, 30, 40], [108, 782, 40, 36], [138, 712, 34, 26], [162, 778, 46, 40]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a dark iron relief, everything carved in the same old dark worn iron, no skin, no flesh. " +
      "The iron hands of a kneeling angel and a kneeling succubus resting gently on a large disc of deep orange amber glass in a round iron rim, " +
      "each hand well formed with five slender fingers laid flat on the glass. No text, no letters.",
  },
  /** The angel's near hand at her chest, which the per-hand boxes missed (the user, 2026-10-10: "still broken"). */
  "column-angel-hand": {
    source: "art/candidates/ui/inpaint/column-hands-2/column-hands-2-d55-2.png",
    page: [300, 864],
    boxes: [[78, 724, 36, 48]],
    denoise: [0.55, 0.7],
    depth: { map: "art/greybox/map-column-duality/depth.png", strength: 1 },
    prompt:
      "Game interface art in soft even light: a dark iron relief, everything carved in the same old dark worn iron, no skin, no flesh. " +
      "A kneeling angel's hand laid flat against her breast beside a disc of amber glass, a well formed hand with four slender fingers held together and a thumb, the folds of her iron sleeve at the wrist. No text, no letters.",
  },
  /** The column's third arm, down the globe's left rim to a hand at its foot: painted out (the user, 2026-10-10). */
  "column-third-arm": {
    source: "art/candidates/ui/inpaint/column-hands-2/column-hands-2-d55-2.png",
    page: [300, 864],
    boxes: [[100, 762, 46, 58]],
    denoise: [0.65, 0.8],
    prompt:
      "Game interface art in soft even light: the lower left of a large disc of deep orange amber glass, glowing softly from within, " +
      "set in a heavy round rim of old dark worn iron that curves around it. Only glass and the iron rim, nothing in front of the glass: no arm, no hand, no figure. No text, no letters.",
  },
  /** The bar's extensions, seen only on monitors wider than 16:9 (the user, 2026-10-10: Warcraft III's way): only the two ends are painted; the bar between is kept. Source and depth from `art/greybox/battle-bar-wide/compose.py`. */
  "battle-bar-wide": {
    source: "art/candidates/ui/inpaint/battle-bar-wide-source/source.png",
    page: [2183, 200],
    boxes: [[0, 0, 328, 200], [1855, 0, 328, 200]],
    denoise: [0.8, 0.95],
    depth: { map: "art/candidates/ui/inpaint/battle-bar-wide-source/depth.png", strength: 1 },
    prompt:
      "A long horizontal game interface bar seen straight on, painted as game interface art, in soft even light without glare, dull lighting. " +
      "Blackened cast iron, old and worn. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery, dark on dark, no surface left plain. " +
      "Two tall blind gothic lancet arches of dark iron tracery, each with two narrow lancets and a carved rosette in its head, and between them a slender gothic spire pinnacle with crockets climbing its edges. " +
      "An upright iron band with a small faceted amber stud at each end. No figures, no glass, no plates. No text, no letters.",
  },
};

const [name, ...rest] = process.argv.slice(2);
const repair = name === undefined ? undefined : REPAIRS[name];
if (name === undefined || repair === undefined) throw new Error(`name a repair: ${Object.keys(REPAIRS).join(", ")}`);
const seeds = rest.length > 0 ? rest.map(Number) : [1, 2, 3];
const out = `art/candidates/ui/inpaint/${name}`;
await mkdir(out, { recursive: true });
const { width = 0, height = 0 } = await sharp(repair.source).metadata();
const sx = width / repair.page[0];
const sy = height / repair.page[1];
const rects = repair.boxes.map(([x, y, w, h]) => `<rect x="${x * sx}" y="${y * sy}" width="${w * sx}" height="${h * sy}" fill="#fff"/>`).join("");
const mask = repair.mask ?? `${out}/mask.png`;
if (!repair.mask) {
  // A soft edge, so the repainted part blends into what is kept.
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/>${rects}</svg>`)).blur(6).png().toFile(mask);
}
for (const denoise of repair.denoise) {
  for (const seed of seeds) {
    const started = Date.now();
    const job = { prompt: repair.prompt, seed, source: repair.source, mask, denoise };
    const png = repair.depth ? await depthInpaint({ ...job, depth: repair.depth.map, depthStrength: repair.depth.strength }, `disc/inpaint-${name}`) : await inpaint(job, `disc/inpaint-${name}`);
    const file = `${out}/${name}-d${Math.round(denoise * 100)}-${seed}.png`;
    await writeFile(file, png);
    console.log(`${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  }
}
