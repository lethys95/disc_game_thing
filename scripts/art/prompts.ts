/**
 * Prompt templates per asset kind, built from docs/design/art.md ("gothic reliquary"). No artist names, ever.
 * A faction's mana color is the one saturated accent. Unit subjects stick to what the design says about them and
 * are otherwise open studies for the user to judge, not canon.
 */

export type Faction = "jilliath" | "nexus" | "neutral";

const ACCENT: Readonly<Record<Faction, string>> = {
  jilliath: "deep blood red",
  nexus: "electric teal, like lightning",
  neutral: "dull ember orange",
};

/**
 * Looks to fish for our style (user, 2026-09-25: the first batch was generic). Each describes qualities only.
 * Emotion is never global: a dark world isn't a sad one, so mood belongs to the subject.
 */
export const STYLES = {
  reliquary:
    "Dark painterly fantasy illustration: sacred things worn by use, tarnished metal, bone, old lacquer, cracked stone and heavy aged cloth. Desaturated umber, ash and bone, chiaroscuro with a hard rim light.",
  biomechanical:
    "Biomechanical dark surrealism: flesh, bone and machinery fused into one organism, ribbed vertebral structures, tubes and cables like tendons, repeating skeletal ornament, glossy smooth airbrushed surfaces in near-monochrome greys and blacks. Uncanny, alien and beautiful.",
  engraving:
    "A dark copperplate engraving: dense cross-hatched ink linework on aged yellowed paper, stark black and bone, meticulous and grotesque, the only color hand-tinted by brush.",
  ornate:
    "A highly intricate dark fantasy illustration in fine ink linework, surreal and grotesque, ornamental patterns and strange growths filling every space, decorative and dreamlike, flat muted colors.",
  icon:
    "A cracked and blackened religious icon painting: egg tempera on a wooden panel, tarnished gold leaf background, elongated stylized figures, halos and gilded ornament, centuries of soot and damage.",
  baroque:
    "A baroque oil painting with violent chiaroscuro, theatrical and grotesque, dramatic foreshortening and bodies in extreme motion, thick glazes and deep blacks.",
  // Blends of the sweep's strongest looks.
  biomechanicalOrnate:
    "Biomechanical dark surrealism drawn in highly intricate fine ink linework: flesh, bone and machinery fused into one organism, ribbed vertebral structures and cables like tendons, surreal ornamental growths filling every space, decorative and dreamlike, near-monochrome greys and bone.",
  biomechanicalEngraving:
    "A dark copperplate engraving of biomechanical surrealism: dense cross-hatched ink linework on aged paper, flesh, bone and machinery fused into one organism, ribbed vertebral structures, cables like tendons, meticulous and grotesque, stark black and bone.",
} as const;

export type Style = keyof typeof STYLES;

const SWEEP: readonly Style[] = ["reliquary", "biomechanical", "engraving", "ornate", "icon", "baroque"];
const BLENDS: readonly Style[] = ["biomechanicalOrnate", "biomechanicalEngraving"];

const style = (faction: Faction, look: Style) =>
  `${STYLES[look]} The one saturated color in the image is ${ACCENT[faction]}, used where there is magic or devotion. No text, no letters, no watermark.`;

export type Kind = "portrait" | "figure" | "illustration" | "icon" | "ornament";

export interface Asset {
  readonly id: string;
  /** A finished prompt that bypasses the kind's framing and the style (for fully specified designs). */
  readonly prompt?: string;
  readonly kind: Kind;
  readonly faction: Faction;
  /** What the image shows; the kind adds framing and the style. */
  readonly subject: string;
  readonly style?: Style;
}

const SIZE: Readonly<Record<Kind, { width: number; height: number }>> = {
  portrait: { width: 896, height: 1152 },
  figure: { width: 832, height: 1216 },
  illustration: { width: 1024, height: 1024 },
  icon: { width: 1024, height: 1024 },
  ornament: { width: 1024, height: 1024 },
};

const FRAMING: Readonly<Record<Kind, (subject: string) => string>> = {
  portrait: (s) => `A bust portrait in three-quarter view of ${s}, against a plain dark background.`,
  figure: (s) => `A full-body character concept of ${s}, standing in a neutral pose, the whole figure visible from head to feet, on a plain flat dark grey background.`,
  illustration: (s) => `A dynamic character illustration of ${s}.`,
  icon: (s) => `A single emblem for a game ability icon: ${s}. One centered subject with a bold, readable silhouette that fills the frame, on a plain black background, with no border and no frame.`,
  ornament: (s) => `${s}, isolated on a plain black background, flat front view, symmetrical, for use as a game interface decoration.`,
};

export function promptFor(asset: Asset): { prompt: string; width: number; height: number } {
  if (asset.prompt) return { prompt: asset.prompt, ...SIZE[asset.kind] };
  return { prompt: `${FRAMING[asset.kind](asset.subject)} ${style(asset.faction, asset.style ?? "reliquary")}`, ...SIZE[asset.kind] };
}

/** The sweep's subjects: the Custodian the user liked as the control, and the two that missed, rewritten. */
const SWEEP_SUBJECTS: readonly Omit<Asset, "style">[] = [
  {
    id: "zealot",
    kind: "illustration",
    faction: "jilliath",
    subject:
      "a frenzied religious zealot in the grip of holy madness, screaming mid-charge with wide ecstatic eyes and a manic grin, strips of burning scripture nailed into his skin, a crude weapon raised overhead",
  },
  {
    id: "congregant",
    kind: "illustration",
    faction: "jilliath",
    subject:
      "a furious peasant at the front of a surging mob of the faithful, pitchfork and torch raised, face twisted with righteous rage, crude holy symbols and scraps of armor, more fanatics crowding behind",
  },
  { id: "custodian", kind: "figure", faction: "nexus", subject: "a golem guardian built of stone and dark brass, wrapped in a crackling protective shield of energy" },
];

/**
 * The user's Zealot (units/jilliath-melee-line.md) and palette (pale; strong black, white, red), rendered in
 * different strokes: the user's references were about stroke and style, not theme.
 */
const ZEALOT =
  "A full-body illustration of a single figure in a menacing stance, on a pale off-white background. " +
  "A zealot whose whole head is covered by a smooth, completely featureless mask: no mouth, no nose, no expression, only two wide, staring round eye holes with pure black behind them. " +
  "Painted on the forehead of the mask is a burning outstretched hand with spread fingers. The mask is ominous, strange and inhuman, deranged and wrong. " +
  "He wears spiked, tattered armor and holds a huge serrated two-handed sword. " +
  "A pale, washed-out palette of bone white and ash grey with hard contrasting black and vivid blood red as the only strong colors. No text, no watermark.";

/**
 * The user's Psychopomp (units/sylvan-psychopomp.md): a different message in the Zealot's style. Same framing,
 * same palette structure (pale, hard black, only the faction's colors saturated), same strokes.
 */
const PSYCHOPOMP =
  "A full-body illustration of a single figure in a hypnotic, otherworldly stance, on a pale off-white background. " +
  "A shamanistic elf woman, a druid who guides souls, with long pointed ears and rough, wild, tangled hair full of trinkets, charms, beads and small baubles. " +
  "Her eyes are wide open and staring straight at the viewer, hypnotic, with glowing violet irises and spiralling pupils. " +
  "Several faint spectral echoes of her own face, blurred and barely visible, brush outward from her head like drifting afterimages. " +
  "Roots and vines sprawl around and through her clothes and limbs, teeming with life. Confusing, dreamlike and psychedelic. " +
  "A pale, washed-out palette of bone white and ash grey with hard contrasting black, and vivid moss green with pulsing violet as the only strong colors. No text, no watermark.";

const ZEALOT_MASK =
  "A head-and-shoulders portrait of a single figure, facing the viewer, on a pale off-white background. " +
  "His whole head is covered by a smooth, pale, completely featureless mask: no mouth, no nose, no brows, no expression. " +
  "It has only two eye holes, large perfectly round holes much bigger than human eyes, wide open and staring, with pure black emptiness behind them. " +
  "High on the forehead, above the eye holes, is a small emblem: an outstretched open hand with spread fingers, drawn in red, with real flames rising from its fingertips. The rest of the mask is blank. " +
  "The mask is ominous, strange and inhuman; it looks deranged and wrong. Spiked, tattered armor on his shoulders. " +
  "A pale, washed-out palette of bone white and ash grey with hard contrasting black and vivid blood red as the only strong colors. No text, no watermark.";

const STROKES: Readonly<Record<string, string>> = {
  painterly: "Painterly realism: confident loose oil brushwork, solid anatomy, dramatic directional light.",
  inkBrush: "Bold black ink brushstrokes and washes, expressive dry-brush edges, large areas of untouched pale paper.",
  penInk: "Fine, intricate pen-and-ink linework with careful hatching and flat fills of color.",
  airbrush: "Smooth airbrushed gradients, soft-edged precise shading and polished surfaces.",
};

/** Named batches: `pnpm art <batch>`. */
export const BATCHES: Readonly<Record<string, readonly Asset[]>> = {
  sweep: SWEEP.flatMap((look) => SWEEP_SUBJECTS.map((s) => ({ ...s, id: `${look}_${s.id}`, style: look }))),
  pairing: [
    { id: "zealot_inkBrush", kind: "portrait", faction: "jilliath", subject: "", prompt: `${ZEALOT} ${STROKES["inkBrush"] ?? ""}` },
    { id: "psychopomp_inkBrush", kind: "portrait", faction: "neutral", subject: "", prompt: `${PSYCHOPOMP} ${STROKES["inkBrush"] ?? ""}` },
    { id: "psychopomp_painterly", kind: "portrait", faction: "neutral", subject: "", prompt: `${PSYCHOPOMP} ${STROKES["painterly"] ?? ""}` },
  ],
  zealotMask: ["painterly", "penInk"].map((stroke) => ({ id: `mask_${stroke}`, kind: "portrait", faction: "jilliath", subject: "", prompt: `${ZEALOT_MASK} ${STROKES[stroke] ?? ""}` })),
  zealot: Object.entries(STROKES).map(([stroke, text]) => ({ id: `zealot_${stroke}`, kind: "portrait", faction: "jilliath", subject: "", prompt: `${ZEALOT} ${text}` })),
  blends: BLENDS.flatMap((look) => SWEEP_SUBJECTS.map((s) => ({ ...s, id: `${look}_${s.id}`, style: look }))),
  // Style anchors: a spread of kinds and both factions, to settle the look before any production batch.
  anchors: [
    { id: "congregant", kind: "portrait", faction: "jilliath", subject: "a devout foot soldier of a militant faith, in worn robes over plain battered armor, holding a simple blade" },
    { id: "paladin", kind: "portrait", faction: "jilliath", subject: "a heavily armored holy knight whose faith preserves him, dented plate, a tall helm, a scarred shield" },
    { id: "zealot", kind: "portrait", faction: "jilliath", subject: "a zealot whose faith consumes him, gaunt and scarred, bare-armed, eyes burning with devotion" },
    { id: "punisher", kind: "figure", faction: "jilliath", subject: "an executioner of a militant faith carrying a heavy multi-headed flanged flail" },
    { id: "custodian", kind: "figure", faction: "nexus", subject: "a golem guardian built of stone and dark brass, wrapped in a crackling protective shield of energy" },
    { id: "apprentice", kind: "portrait", faction: "nexus", subject: "a young spellcasting apprentice of an order of arcane engineers, lightning gathering between the fingers" },
    { id: "icon_heal", kind: "icon", faction: "jilliath", subject: "a gauntleted hand pressed against a wound, glowing with healing light" },
    { id: "icon_flail", kind: "icon", faction: "jilliath", subject: "a spiked multi-headed flail mid-swing" },
    { id: "icon_burst", kind: "icon", faction: "nexus", subject: "a burst of lightning erupting in the shape of a plus sign" },
    { id: "icon_defend", kind: "icon", faction: "neutral", subject: "a battered, dented shield raised in defense" },
    { id: "ornament_corner", kind: "ornament", faction: "jilliath", subject: "An ornate gothic corner piece of tarnished iron filigree and bone, shaped like the corner of a picture frame" },
  ],
};
