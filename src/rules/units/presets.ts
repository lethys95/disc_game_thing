import type { Placement } from "#rules/battle/engine";
import type { Col, Row } from "#rules/battle/types";
import type { Playable } from "#rules/units/index";

const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

/**
 * Starting formations, made only of canon units. The formations themselves are not canon. `uncommitted` is the squad
 * a map game starts with: like the other factions', three melee, a support and a mage. Five Congregants (two of them
 * unable to reach the enemy from the back row) lost to every other opening squad and made Jilliath the weakest
 * faction in whole AI games (the audit, 2026-10-06; provisional #70).
 */
export const PRESETS: Readonly<Record<"uncommitted" | "congregants" | "preserve" | "punishment" | "sacrifice", readonly Placement[]>> = {
  uncommitted: [
    at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2),
    at("cleric", 2, 0), at("jilliath_mage_1", 2, 1),
  ],
  congregants: [
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
export const NEXUS_PRESETS: Readonly<Record<"uncommitted" | "scheme" | "overload" | "etherborn" | "backlasher" | "maelstrom", readonly Placement[]>> = {
  uncommitted: [
    at("custodian", 0, 0), at("custodian", 0, 1), at("custodian", 0, 2),
    at("technician", 2, 0), at("apprentice", 2, 1),
  ],
  scheme: [
    at("cyclops", 0, 0), at("custodian", 0, 1), at("cyclops", 0, 2),
    at("technician", 2, 0), at("justiciar", 2, 1),
  ],
  overload: [
    at("mutant", 0, 0), at("custodian", 0, 1), at("mutant", 0, 2),
    at("technician", 2, 0), at("thaumaturge", 2, 1),
  ],
  etherborn: [
    at("cyclops", 0, 0), at("custodian", 0, 1), at("cyclops", 0, 2),
    at("technician", 2, 0), at("etherborn", 2, 1),
  ],
  backlasher: [
    at("cyclops", 0, 0), at("custodian", 0, 1), at("cyclops", 0, 2),
    at("technician", 2, 0), at("backlasher", 2, 1),
  ],
  maelstrom: [
    at("mutant", 0, 0), at("custodian", 0, 1), at("mutant", 0, 2),
    at("technician", 2, 0), at("maelstrom", 2, 1),
  ],
};


/** The Grove: its melee line and the first of its backline (user, 2026-09-29). */
export const GROVE_PRESETS = {
  uncommitted: [at("sproutling", 0, 0), at("sproutling", 0, 1), at("sproutling", 0, 2), at("grove_support_1", 2, 0), at("grove_mage_1", 2, 2)],
  regrowth: [at("regrowth_2", 0, 0), at("regrowth_2", 0, 2), at("regrowth_3", 0, 1), at("psychopomp", 2, 0), at("grove_mage_1", 2, 2)],
  decay: [at("moldling", 0, 0), at("deadwood", 0, 1), at("moldling", 0, 2), at("decay_support_2", 2, 0), at("grove_mage_1", 2, 2)],
} as const satisfies Readonly<Record<string, readonly Placement[]>>;

/** A bandit group using all four of the user's bandit units. The formation is not canon. */
export const BANDIT_GROUP: readonly Placement[] = [
  at("brigand", 0, 0), at("marauder", 0, 1), at("brigand", 0, 2),
  at("bandit", 1, 0), at("hedge_mage", 1, 1), at("bandit", 1, 2),
];

/** A gnoll pack with all five gnolls, led by the Matriarch (`?fight=gnolls`). The formation is not canon. */
export const GNOLL_GROUP: readonly Placement[] = [
  at("packstalker", 0, 0), at("matriarch", 0, 1), at("bonecracker", 0, 2),
  at("hamstringer", 1, 0), at("cackler", 1, 1), at("hamstringer", 1, 2),
];

/** The Drawn, Claude's moth-folk tribe, led by the Pale Mother (`?fight=drawn`). The formation is not canon. */
export const DRAWN_GROUP: readonly Placement[] = [
  at("chrysalis", 0, 0), at("pale_mother", 0, 1), at("dustwing", 0, 2),
  at("eyespot", 1, 0), at("lightdrinker", 1, 1), at("eyespot", 1, 2),
];

/** The user's carnival, all five (`?fight=carnival`). The formation is not canon. */
export const CARNIVAL_GROUP: readonly Placement[] = [
  at("cutpurse", 0, 0), at("fire_eater", 0, 1), at("cutpurse", 0, 2), at("snakeoiler", 1, 0), at("soothsayer", 1, 1), at("omen", 1, 2),
];

/** The setup screen's formation presets per faction, named after the branches they took. */
export const FORMATIONS: Readonly<Record<Playable, readonly { readonly name: string; readonly squad: readonly Placement[] }[]>> = {
  jilliath: [
    { name: "Congregants with a Cleric and a mage", squad: PRESETS.uncommitted },
    { name: "Congregants", squad: PRESETS.congregants },
    { name: "Faith", squad: PRESETS.preserve },
    { name: "Fanaticism: Punisher", squad: PRESETS.punishment },
    { name: "Fanaticism: Fanatic", squad: PRESETS.sacrifice },
  ],
  nexus: [
    { name: "Tier 1", squad: NEXUS_PRESETS.uncommitted },
    { name: "Scheme", squad: NEXUS_PRESETS.scheme },
    { name: "Overload", squad: NEXUS_PRESETS.overload },
    { name: "Scheme: Etherborn", squad: NEXUS_PRESETS.etherborn },
    { name: "Scheme: Backlasher", squad: NEXUS_PRESETS.backlasher },
    { name: "Overload: Maelstrom", squad: NEXUS_PRESETS.maelstrom },
  ],
  grove: [
    { name: "Tier 1", squad: GROVE_PRESETS.uncommitted },
    { name: "Regrowth", squad: GROVE_PRESETS.regrowth },
    { name: "Decay", squad: GROVE_PRESETS.decay },
  ],
};
