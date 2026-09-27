import type { Faction } from "#rules/battle/types";
import { slotInfo } from "#view/art-slots";
import type { Slot } from "#view/art-slots";

/**
 * Prompts for art slots in the style the user settled on (docs/design/art.md): bold black ink brush on pale paper,
 * a pale palette with hard black, and only the faction's colors saturated. Keepers that define it:
 * `zealot_inkBrush-1001`, `psychopomp_inkBrush-1003`. No artist names, ever; mood belongs to the subject.
 */

const COLORS: Readonly<Record<Faction, string>> = {
  jilliath: "vivid blood red",
  nexus: "electric teal, like lightning",
  neutral: "rust orange",
};

const STYLE = (faction: Faction) =>
  `A pale, washed-out palette of bone white and ash grey with hard contrasting black, and ${COLORS[faction]} as the only strong color. ` +
  "Bold black ink brushstrokes and washes, expressive dry-brush edges, large areas of untouched pale paper. No text, no letters, no watermark.";

/** The user's own descriptions, by slot key. Without one, a slot's prompt builds on its name and rules text. */
const LOOKS: Readonly<Record<string, string>> = {
  "portrait/zealot":
    "A zealot whose whole head is covered by a smooth, completely featureless mask: no mouth, no nose, no expression, only two wide, staring round eye holes with pure black behind them. " +
    "Painted on the forehead of the mask is a burning outstretched hand with spread fingers. The mask is ominous, strange and inhuman, deranged and wrong. " +
    "He wears spiked, tattered armor and holds a huge serrated two-handed sword.",
};

const SIZE: Readonly<Record<Slot["kind"], { width: number; height: number }>> = {
  portrait: { width: 896, height: 1152 },
  ability: { width: 1024, height: 1024 },
  effect: { width: 1024, height: 1024 },
};

function subject(slot: Slot): string {
  const info = slotInfo(slot);
  const look = LOOKS[`${slot.kind}/${slot.id}`];
  switch (slot.kind) {
    case "portrait":
      return `A full-body illustration of a single figure on a pale off-white background. ${look ?? `${info.name}, ${info.text} of a dark fantasy army.`}`;
    case "ability":
      return `A single emblem for a game ability icon, one centered subject with a bold readable silhouette that fills the frame, on a pale off-white background, no border, no frame. ${look ?? `The ability "${info.name}": ${info.text}`}`;
    case "effect":
      return `A single emblem for a game status-effect icon, one centered subject with a bold readable silhouette that fills the frame, on a pale off-white background, no border, no frame. ${look ?? `The effect "${info.name}": ${info.text}`}`;
  }
}

export function promptFor(slot: Slot): { prompt: string; width: number; height: number } {
  return { prompt: `${subject(slot)} ${STYLE(slotInfo(slot).faction)}`, ...SIZE[slot.kind] };
}
