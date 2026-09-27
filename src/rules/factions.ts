import type { Playable } from "#rules/units/index";
import type { PlayerColor } from "#rules/world/colors";

/**
 * What a faction is, beyond its units: its name, its mana color (factions/*.md), and the player color it takes by
 * default. One record per faction, so adding one is one entry here plus its units.
 */
export type ManaColor = "red" | "teal";

export interface FactionDef {
  /** The user's names (docs/design/factions/). */
  readonly name: string;
  readonly mana: ManaColor;
  readonly color: PlayerColor;
}

export const FACTIONS: Readonly<Record<Playable, FactionDef>> = {
  jilliath: { name: "Jilliath", mana: "red", color: "red" },
  nexus: { name: "Ral-Vitahl", mana: "teal", color: "teal" },
};

/** A purse of every mana color, empty. */
export const noMana = (): Record<ManaColor, number> => ({ red: 0, teal: 0 });
