import { LEVEL_BONUS_PERCENT } from "#rules/balance";
import type { Playable } from "#rules/units/index";
import type { PlayerColor } from "#rules/world/colors";

/**
 * What a faction is, beyond its units: its name, its mana color (factions/*.md), and the player color it takes by
 * default. One record per faction, so adding one is one entry here plus its units.
 */
export type ManaColor = "red" | "teal" | "green";

export interface FactionDef {
  /** The user's names (docs/design/factions/). */
  readonly name: string;
  readonly mana: ManaColor;
  readonly color: PlayerColor;
  /**
   * How much of its base stats a unit gains per level past the end of its line, in percent (pillars.md). The Grove
   * ramps: 50% more than others (user, 2026-09-29: more would make players pick the lines that end soonest).
   */
  readonly levelBonusPercent: number;
}

export const FACTIONS: Readonly<Record<Playable, FactionDef>> = {
  jilliath: { name: "Jilliath", mana: "red", color: "red", levelBonusPercent: LEVEL_BONUS_PERCENT },
  nexus: { name: "Ral-Vitahl", mana: "teal", color: "teal", levelBonusPercent: LEVEL_BONUS_PERCENT },
  grove: { name: "Sylvan", mana: "green", color: "green", levelBonusPercent: LEVEL_BONUS_PERCENT * 1.5 },
};

/** A purse of every mana color, empty. */
export const noMana = (): Record<ManaColor, number> => ({ red: 0, teal: 0, green: 0 });
