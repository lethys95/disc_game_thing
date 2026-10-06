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
  /** What the faction is called beside its name, its core identity and difficulty, in the user's words (factions/*.md). */
  readonly epithet: string;
  readonly identity: string;
  readonly difficulty: "easy" | "medium" | "hard";
  /** A line or two for the faction pick, the user's words. */
  readonly about: string;
}

export const FACTIONS: Readonly<Record<Playable, FactionDef>> = {
  jilliath: {
    name: "Jilliath",
    mana: "red",
    color: "red",
    levelBonusPercent: LEVEL_BONUS_PERCENT,
    epithet: "The Inquisition",
    identity: "Sacrifice",
    difficulty: "medium",
    about: "Make playing the game painful for the enemy: punishment, ultimatums, health spent as a resource. Faith that preserves, and faith that consumes.",
  },
  nexus: {
    name: "Ral-Vitahl",
    mana: "teal",
    color: "teal",
    levelBonusPercent: LEVEL_BONUS_PERCENT,
    epithet: "The Nexus",
    identity: "Expedience and burst",
    difficulty: "hard",
    about: "A house of nobles who do whatever they please, whatever it costs everyone else. Quality over quantity: great instant damage, costly units, power tied to batteries.",
  },
  grove: {
    name: "Sylvan",
    mana: "green",
    color: "green",
    levelBonusPercent: LEVEL_BONUS_PERCENT * 1.5,
    epithet: "The Grove",
    identity: "Ramp",
    difficulty: "easy",
    about: "Starts slow, but is persistent: life and death, regrowth and rot. A strong endgame that runs out of control if left unhandled.",
  },
};

/** A purse of every mana color, empty. */
export const noMana = (): Record<ManaColor, number> => ({ red: 0, teal: 0, green: 0 });
