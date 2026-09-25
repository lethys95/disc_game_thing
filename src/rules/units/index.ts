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
export type Branch = "preserve" | "consume" | "punishment" | "sacrifice" | "scheme" | "overload";

export interface Evolution {
  readonly to: string;
  /** The branch the faction must have invested in; null where the line doesn't fork. */
  readonly requires: Branch | null;
}

/** The canon Jilliath melee tree (docs/design/units/jilliath-melee-line.md). */
export const EVOLUTIONS: Readonly<Record<string, readonly Evolution[]>> = {
  congregant: [{ to: "paladin", requires: "preserve" }, { to: "zealot", requires: "consume" }],
  paladin: [{ to: "templar", requires: null }],
  templar: [{ to: "immortal", requires: null }],
  zealot: [{ to: "punisher", requires: "punishment" }, { to: "fanatic", requires: "sacrifice" }],
  punisher: [{ to: "torturer", requires: null }],
  fanatic: [{ to: "chosen", requires: null }],
  chosen: [{ to: "avatar_of_vengeance", requires: null }],
  custodian: [{ to: "battery", requires: "scheme" }, { to: "mutant", requires: "overload" }],
  apprentice: [{ to: "justiciar", requires: "scheme" }, { to: "thaumaturge", requires: "overload" }],
};
