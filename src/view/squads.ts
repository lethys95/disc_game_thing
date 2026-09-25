import type { Placement } from "#rules/battle/engine";
import type { Col, Row } from "#rules/battle/types";
import type { Playable } from "#rules/units/index";

const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

/** Starting formations, made only of canon units. The formations themselves are not canon. */
export const PRESETS: Readonly<Record<"uncommitted" | "preserve" | "punishment" | "sacrifice", readonly Placement[]>> = {
  uncommitted: [
    at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2),
    at("congregant", 1, 0), at("congregant", 1, 2),
  ],
  preserve: [
    at("paladin", 0, 0), at("templar", 0, 1), at("paladin", 0, 2),
    at("congregant", 1, 0), at("congregant", 1, 2),
  ],
  punishment: [
    at("zealot", 0, 0), at("punisher", 0, 1), at("zealot", 0, 2),
    at("congregant", 1, 0), at("torturer", 1, 1),
  ],
  sacrifice: [
    at("zealot", 0, 0), at("fanatic", 0, 1), at("zealot", 0, 2),
    at("congregant", 1, 0), at("chosen", 1, 1),
  ],
};

/** Nexus formations, made of its units. Not canon. */
export const NEXUS_PRESETS: Readonly<Record<"uncommitted" | "scheme" | "overload", readonly Placement[]>> = {
  uncommitted: [
    at("custodian", 0, 0), at("custodian", 0, 1), at("custodian", 0, 2),
    at("arcane_engineer", 1, 0), at("apprentice", 1, 1),
  ],
  scheme: [
    at("battery", 0, 0), at("custodian", 0, 1), at("battery", 0, 2),
    at("arcane_engineer", 1, 0), at("justiciar", 1, 1),
  ],
  overload: [
    at("mutant", 0, 0), at("custodian", 0, 1), at("mutant", 0, 2),
    at("arcane_engineer", 1, 0), at("thaumaturge", 1, 1),
  ],
};


/** A bandit group using all four of the user's bandit units. The formation is not canon. */
export const BANDIT_GROUP: readonly Placement[] = [
  at("brigand", 0, 0), at("marauder", 0, 1), at("brigand", 0, 2),
  at("bandit", 1, 0), at("hedge_mage", 1, 1), at("bandit", 1, 2),
];

/** The setup screen's formation presets per faction, named after the branches they took. */
export const FORMATIONS: Readonly<Record<Playable, readonly { readonly name: string; readonly squad: readonly Placement[] }[]>> = {
  jilliath: [
    { name: "Congregants", squad: PRESETS.uncommitted },
    { name: "Faith preserves", squad: PRESETS.preserve },
    { name: "Faith consumes: Punishment", squad: PRESETS.punishment },
    { name: "Faith consumes: Self-sacrifice", squad: PRESETS.sacrifice },
  ],
  nexus: [
    { name: "Tier 1", squad: NEXUS_PRESETS.uncommitted },
    { name: "Scheme", squad: NEXUS_PRESETS.scheme },
    { name: "Overload", squad: NEXUS_PRESETS.overload },
  ],
};
