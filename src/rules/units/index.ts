import type { Faction, UnitDef } from "#rules/battle/types";
import { JILLIATH_UNITS } from "#rules/units/jilliath";
import { NEUTRAL_UNITS } from "#rules/units/neutral";
import { NEXUS_UNITS } from "#rules/units/nexus";

export const UNITS: Readonly<Record<string, UnitDef>> = { ...JILLIATH_UNITS, ...NEXUS_UNITS, ...NEUTRAL_UNITS };

export const GUARDIAN_ID = "capitol_guardian";

export type Playable = Exclude<Faction, "neutral">;

/** The user's faction names (docs/design/factions/). */
export const FACTION_NAMES: Readonly<Record<Playable, string>> = { jilliath: "Jilliath", nexus: "Ral-Vitahl" };

/**
 * Each playable faction's tier-1 units: what it recruits (tier 1 only, as in D2; higher tiers come from
 * evolution) and where its evolution tree starts.
 */
export const FACTION_ROOTS: Readonly<Record<Playable, readonly string[]>> = {
  jilliath: ["congregant", "cleric", "jilliath_mage_1"],
  nexus: ["custodian", "technician", "apprentice"],
};

/** The kinds of line a faction's units come in (D2's archetypes, which the user pointed to). */
export const ARCHETYPES = ["melee", "ranged", "support", "mage"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

/** Which kind of line each tier-1 unit starts (user: the melee lines, the Technician supports, the Apprentice casts). */
export const LINE_ARCHETYPE: Readonly<Record<string, Archetype>> = { congregant: "melee", cleric: "support", jilliath_mage_1: "mage", custodian: "melee", technician: "support", apprentice: "mage" };

/** Canon: the Congregant costs 40 gold. The Nexus prices are provisional ("costly", quality over quantity). */
export const RECRUIT_COST: Readonly<Record<string, number>> = { congregant: 40, cleric: 50, jilliath_mage_1: 60, custodian: 60, technician: 50, apprentice: 60 };

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
 * Evolution trees. A unit with more than one evolution is a **fork**: the owner chooses a branch once, for free,
 * and every unit of that kind follows it (docs/design/pillars.md). Forks are independent of each other.
 */
export const EVOLUTIONS: Readonly<Record<string, readonly Evolution[]>> = {
  // The canon Jilliath melee tree (docs/design/units/jilliath-melee-line.md).
  congregant: [{ to: "paladin", label: "Faith preserves" }, { to: "zealot", label: "Faith consumes" }],
  paladin: [{ to: "templar" }],
  templar: [{ to: "immortal" }],
  zealot: [{ to: "punisher" }, { to: "fanatic" }],
  punisher: [{ to: "torturer" }],
  fanatic: [{ to: "chosen" }],
  chosen: [{ to: "avatar_of_vengeance" }],
  // Ral-Vitahl: scheme vs overload, chosen per line (user, 2026-09-25).
  custodian: [{ to: "cyclops", label: "Scheme" }, { to: "mutant", label: "Overload" }],
  apprentice: [{ to: "justiciar", label: "Scheme" }, { to: "thaumaturge", label: "Overload" }],
  // Tier 3 mages (user, 2026-09-26).
  justiciar: [{ to: "etherborn" }, { to: "backlasher" }],
  thaumaturge: [{ to: "maelstrom" }],
};
