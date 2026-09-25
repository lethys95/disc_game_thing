import type { Placement } from "#rules/battle/engine";
import type { Col, Row } from "#rules/battle/types";

const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

/** Starting formations per doctrine, made only of canon units. The formations themselves are not canon. */
/** Jilliath formations by doctrine key. */
export const PRESETS: Readonly<Record<"uncommitted" | "preserve" | "punishment" | "sacrifice", readonly Placement[]>> = {
  uncommitted: [
    at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2),
    at("congregant", 1, 0), at("congregant", 1, 1), at("congregant", 1, 2),
  ],
  preserve: [
    at("paladin", 0, 0), at("templar", 0, 1), at("paladin", 0, 2),
    at("congregant", 1, 0), at("congregant", 1, 1), at("congregant", 1, 2),
  ],
  punishment: [
    at("zealot", 0, 0), at("punisher", 0, 1), at("zealot", 0, 2),
    at("congregant", 1, 0), at("torturer", 1, 1), at("congregant", 1, 2),
  ],
  sacrifice: [
    at("zealot", 0, 0), at("fanatic", 0, 1), at("zealot", 0, 2),
    at("congregant", 1, 0), at("chosen", 1, 1), at("congregant", 1, 2),
  ],
};

/** Nexus formations by doctrine key, made of its units. Not canon. */
export const NEXUS_PRESETS: Readonly<Record<"uncommitted" | "scheme" | "overload", readonly Placement[]>> = {
  uncommitted: [
    at("custodian", 0, 0), at("custodian", 0, 1), at("custodian", 0, 2),
    at("arcane_engineer", 1, 0), at("apprentice", 1, 1), at("apprentice", 1, 2),
  ],
  scheme: [
    at("battery", 0, 0), at("custodian", 0, 1), at("battery", 0, 2),
    at("arcane_engineer", 1, 0), at("justiciar", 1, 1), at("apprentice", 1, 2),
  ],
  overload: [
    at("mutant", 0, 0), at("custodian", 0, 1), at("mutant", 0, 2),
    at("arcane_engineer", 1, 0), at("thaumaturge", 1, 1), at("apprentice", 1, 2),
  ],
};

export const NEXUS_PRESET = NEXUS_PRESETS.uncommitted;

/** A bandit group using all four of the user's bandit units. The formation is not canon. */
export const BANDIT_GROUP: readonly Placement[] = [
  at("brigand", 0, 0), at("marauder", 0, 1), at("brigand", 0, 2),
  at("bandit", 1, 0), at("hedge_mage", 1, 1), at("bandit", 1, 2),
];
