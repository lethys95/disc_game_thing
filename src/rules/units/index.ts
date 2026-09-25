import type { Faction, UnitDef } from "#rules/battle/types";
import { JILLIATH_UNITS } from "#rules/units/jilliath";
import { NEUTRAL_UNITS } from "#rules/units/neutral";
import { NEXUS_UNITS } from "#rules/units/nexus";

export const UNITS: Readonly<Record<string, UnitDef>> = { ...JILLIATH_UNITS, ...NEXUS_UNITS, ...NEUTRAL_UNITS };

export const GUARDIAN_ID = "capitol_guardian";

export type Playable = Exclude<Faction, "neutral">;

/**
 * Each playable faction's tier-1 units: what it recruits (tier 1 only, as in D2; higher tiers come from
 * evolution) and where its evolution tree starts.
 */
export const FACTION_ROOTS: Readonly<Record<Playable, readonly string[]>> = {
  jilliath: ["congregant"],
  nexus: ["custodian", "arcane_engineer", "apprentice"],
};

/** Canon: the Congregant costs 40 gold. The Nexus prices are provisional ("costly", quality over quantity). */
export const RECRUIT_COST: Readonly<Record<string, number>> = { congregant: 40, custodian: 60, arcane_engineer: 50, apprentice: 60 };

/** A fork a faction commits to once, for good (branch investment, docs/design/pillars.md). */
export interface Evolution {
  readonly to: string;
  /** At a fork, the side of the line's dichotomy this branch stands for (docs/design/dichotomies.md). */
  readonly label?: string;
}

/**
 * Evolution trees. A unit with more than one evolution is a **fork**: the owner chooses a branch once, for free,
 * and every unit of that kind follows it (docs/design/pillars.md). Forks are independent of each other.
 */
export const EVOLUTIONS: Readonly<Record<string, readonly Evolution[]>> = {
  // The canon Jilliath melee tree (docs/design/units/jilliath-melee-line.md).
  congregant: [{ to: "paladin", label: "Faith preserves" }, { to: "zealot", label: "Faith consumes" }],
  paladin: [{ to: "templar" }],
  templar: [{ to: "immortal" }],
  zealot: [{ to: "punisher", label: "Punishment" }, { to: "fanatic", label: "Self-sacrifice" }],
  punisher: [{ to: "torturer" }],
  fanatic: [{ to: "chosen" }],
  chosen: [{ to: "avatar_of_vengeance" }],
  // Ral-Vitahl: scheme vs overload, chosen per line (user, 2026-09-25).
  custodian: [{ to: "battery", label: "Scheme" }, { to: "mutant", label: "Overload" }],
  apprentice: [{ to: "justiciar", label: "Scheme" }, { to: "thaumaturge", label: "Overload" }],
};
