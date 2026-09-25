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

const style = (faction: Faction) =>
  `Dark painterly fantasy illustration with a gothic reliquary mood: sacred things worn thin by use, tarnished metal, bone, old lacquer, cracked stone and heavy aged cloth. ` +
  `A desaturated palette of umber, ash, bone and oxidized iron, with a single saturated accent of ${ACCENT[faction]} where there is magic or devotion. ` +
  `Chiaroscuro lighting with deep shadows and a hard rim light. Solemn, tragic and oppressive rather than gory. No text, no letters, no watermark.`;

export type Kind = "portrait" | "figure" | "icon" | "ornament";

export interface Asset {
  readonly id: string;
  readonly kind: Kind;
  readonly faction: Faction;
  /** What the image shows; the kind adds framing and the style. */
  readonly subject: string;
}

const SIZE: Readonly<Record<Kind, { width: number; height: number }>> = {
  portrait: { width: 896, height: 1152 },
  figure: { width: 832, height: 1216 },
  icon: { width: 1024, height: 1024 },
  ornament: { width: 1024, height: 1024 },
};

const FRAMING: Readonly<Record<Kind, (subject: string) => string>> = {
  portrait: (s) => `A bust portrait in three-quarter view of ${s}, against a plain dark background.`,
  figure: (s) => `A full-body character concept of ${s}, standing in a neutral pose, the whole figure visible from head to feet, on a plain flat dark grey background.`,
  icon: (s) => `A single emblem for a game ability icon: ${s}. One centered subject with a bold, readable silhouette that fills the frame, on a plain black background, with no border and no frame.`,
  ornament: (s) => `${s}, isolated on a plain black background, flat front view, symmetrical, for use as a game interface decoration.`,
};

export function promptFor(asset: Asset): { prompt: string; width: number; height: number } {
  return { prompt: `${FRAMING[asset.kind](asset.subject)} ${style(asset.faction)}`, ...SIZE[asset.kind] };
}

/** Named batches: `pnpm art <batch>`. */
export const BATCHES: Readonly<Record<string, readonly Asset[]>> = {
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
