import type { Faction, UnitDef } from "#rules/battle/types";
import { GROVE_UNITS } from "#rules/units/grove";
import { JILLIATH_UNITS } from "#rules/units/jilliath";
import { NEUTRAL_UNITS } from "#rules/units/neutral";
import { NEXUS_UNITS } from "#rules/units/nexus";

/**
 * Every faction unit can retreat (the user's design: surrender is a default action, and a unit that must not flee
 * simply lacks it). Neutrals and the Guardian don't.
 */
const canRetreat = (units: Readonly<Record<string, UnitDef>>): Record<string, UnitDef> =>
  Object.fromEntries(Object.entries(units).map(([id, def]) => [id, { ...def, abilities: [...def.abilities, { id: "retreat" }] }]));

export const UNITS: Readonly<Record<string, UnitDef>> = { ...canRetreat(JILLIATH_UNITS), ...canRetreat(NEXUS_UNITS), ...canRetreat(GROVE_UNITS), ...NEUTRAL_UNITS };

export const GUARDIAN_ID = "capitol_guardian";

export type Playable = Exclude<Faction, "neutral">;


/**
 * Each playable faction's tier-1 units: what it recruits (tier 1 only, as in D2; higher tiers come from
 * evolution) and where its evolution tree starts.
 */
export const FACTION_ROOTS: Readonly<Record<Playable, readonly string[]>> = {
  jilliath: ["congregant", "cleric", "jilliath_mage_1"],
  nexus: ["custodian", "technician", "apprentice"],
  grove: ["sproutling", "grove_support_1", "grove_mage_1"],
};

/**
 * The kinds of line a faction's units come in (D2's archetypes, which the user pointed to). The fourth is a joker:
 * a concept unique to each faction (user, 2026-09-27), none designed yet.
 */
export const ARCHETYPES = ["melee", "support", "mage", "joker"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

/** Which kind of line each tier-1 unit starts (user: the melee lines, the Technician supports, the Apprentice casts). */
export const LINE_ARCHETYPE: Readonly<Record<string, Archetype>> = { congregant: "melee", cleric: "support", jilliath_mage_1: "mage", custodian: "melee", technician: "support", apprentice: "mage", sproutling: "melee", grove_support_1: "support", grove_mage_1: "mage" };

/** Canon: the Congregant costs 40 gold. The Nexus prices are provisional ("costly", quality over quantity). */
export const RECRUIT_COST: Readonly<Record<string, number>> = { congregant: 40, cleric: 50, jilliath_mage_1: 60, custodian: 60, technician: 50, apprentice: 60, sproutling: 45, grove_support_1: 50, grove_mage_1: 60 };

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
  // The Grove's melee line: life and death (user, 2026-09-29).
  sproutling: [{ to: "regrowth_2", label: "Regrowth" }, { to: "moldling", label: "Decay" }],
  regrowth_2: [{ to: "regrowth_3" }],
  moldling: [{ to: "deadwood" }],
  // Regrowth ends at tier 3; Decay goes on to a tier 4 (user, 2026-09-29), in two kinds (user, 2026-10-04).
  deadwood: [{ to: "bog_giant" }, { to: "mulch_gorger" }],
  // The support forks into Spiritess (healing over time, then the Psychopomp's crowd control) and Decay (corpses).
  grove_support_1: [{ to: "spiritess_2", label: "Spiritess" }, { to: "decay_support_2", label: "Decay" }],
  spiritess_2: [{ to: "psychopomp" }],
};
