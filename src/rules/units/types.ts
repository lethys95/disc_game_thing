import type { UnitDef } from "#rules/battle/types";

/**
 * The kinds of line a faction's units come in (D2's archetypes, which the user pointed to). The fourth is a joker:
 * a concept unique to each faction (user, 2026-09-27).
 */
export const ARCHETYPES = ["melee", "support", "mage", "joker"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

/** One step up an evolution tree. */
export interface Evolution {
  readonly to: string;
  /**
   * At the faction's duality fork, the side this branch stands for (docs/design/dichotomies.md). Later forks go
   * unlabelled: both branches come from the same side (user, 2026-09-26).
   */
  readonly label?: string;
}

/**
 * Everything a playable faction's units are, in one place: adding a unit is an entry here, in its faction's file.
 * A unit with more than one evolution is a **fork**: the owner chooses a branch once, for free, and every unit of that
 * kind follows it (docs/design/pillars.md).
 */
export interface FactionUnits {
  readonly units: Readonly<Record<string, UnitDef>>;
  /** Its tier-1 units: what it recruits (tier 1 only, as in D2; higher tiers come from evolution), each a line's root. */
  readonly roots: readonly string[];
  readonly recruitCost: Readonly<Record<string, number>>;
  /** Which kind of line each root starts. */
  readonly archetype: Readonly<Record<string, Archetype>>;
  readonly evolutions: Readonly<Record<string, readonly Evolution[]>>;
}
