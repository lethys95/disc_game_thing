import { behavior, paramsOf } from "#rules/abilities/index";
import { BASE_ABILITY_POWER, BLACKSMITH_BONUS, MANA_NODE_INCOME, MINE_INCOME } from "#rules/balance";
import { effectDef } from "#rules/effects";
import type { EffectSeed } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";

/**
 * Nodes (Warlords 3 style, docs/design/pillars.md "Cities"): map features that belong to the **nearest city** (a
 * Capitol counts), so whoever holds that city holds them. A node kind is data: gold and mana per turn, and what units
 * recruited in its city carry, all growing with the node's level (investment, provisional numbers).
 */
export type NodeKind =
  | "gold"
  | "blacksmith"
  | "mana"
  | "cathedral"
  | "foundry"
  | "leech_pits"
  | "stables"
  | "tannery"
  | "siege_workshop"
  | "quarry"
  | "ossuary"
  | "watchtower"
  | "bell_tower"
  | "tribal_outpost";

export interface NodeDef {
  readonly name: string;
  readonly income: (level: number) => number;
  /** Mana per turn, in the holder's faction color. */
  readonly mana: (level: number) => number;
  /** What a unit recruited in the node's city carries for good (a mark). */
  readonly recruitEffects: (level: number) => readonly EffectSeed[];
  /** What it gives at a level, in words. */
  readonly describe: (level: number) => string;
  /** What it does for its city (and its holder) rather than for recruits; absent for most kinds. */
  readonly city?: CityGifts;
}

/** A node's gifts to its city, each a number by the node's level; missing ones are none. */
export interface CityGifts {
  /** Share off the city's upgrades (Quarry). */
  readonly upgradeDiscount?: (level: number) => number;
  /** Extra fortification armor for the city's defenders (Quarry). */
  readonly wallArmor?: (level: number) => number;
  /**
   * The dead can be raised in this city without the Capitol's research, at the Capitol's price less this share
   * (Ossuary).
   */
  readonly raisesDead?: (level: number) => number;
  /** Its holder sees this far around the node (Watchtower). */
  readonly sight?: (level: number) => number;
  /** Its holder hears of an enemy warband ending a march this close to the city (Bell tower). */
  readonly warning?: (level: number) => number;
  /** Tribe units the city can recruit, besides its holder's own (a Tribal outpost; `tribes.md`). */
  readonly tribeRecruits?: (level: number) => readonly string[];
  /** Effects the city's defenders bring into a battle there (Bell tower). */
  readonly defenderEffects?: (level: number) => readonly EffectSeed[];
}

// The user's picks (design/nodes.md, 2026-09-28): gifts to the city. Numbers provisional (#56); their nodes' texts read them.
const QUARRY = { upgradeDiscount: (level: number) => 0.1 + 0.1 * level, wallArmor: (level: number) => 1 + level };
// "It sounds very powerful. Careful." (user): no discount until invested.
const OSSUARY = { raisesDead: (level: number) => 0.1 * (level - 1) };
const WATCHTOWER = { sight: (level: number) => 2 + level };

export const NODES: Readonly<Record<NodeKind, NodeDef>> = {
  gold: { name: "Gold mine", income: (level) => MINE_INCOME * level, mana: () => 0, recruitEffects: () => [], describe: (level) => `+${MINE_INCOME * level} gold per turn` },
  // User (2026-09-27): units recruited in the Blacksmith's city get +10 attack. It stays with them, as a mark.
  blacksmith: {
    name: "Blacksmith",
    income: () => 0,
    mana: () => 0,
    recruitEffects: (level) => [{ def: "blacksmith", amount: BLACKSMITH_BONUS * level }],
    describe: (level) => `units recruited here, for good: ${markText({ def: "blacksmith", amount: BLACKSMITH_BONUS * level })}`,
  },
  mana: { name: "Mana node", income: () => 0, mana: (level) => MANA_NODE_INCOME * level, recruitEffects: () => [], describe: (level) => `+${MANA_NODE_INCOME * level} mana per turn` },
  // User (2026-09-27): units hired in the Cathedral's city carry holy water (heal 30, once per combat). Levels don't
  // change it yet (provisional).
  cathedral: {
    name: "Cathedral",
    income: () => 0,
    mana: () => 0,
    recruitEffects: () => [{ def: "carries", ability: { id: "holy_water" } }],
    describe: () => `units recruited here carry Holy Water. ${behavior("holy_water").describe(paramsOf({ id: "holy_water" }, BASE_ABILITY_POWER))}`,
  },
  // The user's picks from Claude's brainstorm (design/nodes.md, 2026-09-28): recruit marks. Numbers provisional (#56).
  foundry: markNode("Foundry", (level) => ({ def: "foundry", amount: 6 + 6 * level })),
  leech_pits: markNode("Leech pits", (level) => ({ def: "leech", amount: 5 + 3 * level })),
  stables: markNode("Stables", () => ({ def: "stables", amount: 1 })),
  tannery: markNode("Tannery", (level) => ({ def: "tannery", amount: 8 + 7 * level })),
  siege_workshop: markNode("Siege workshop", () => ({ def: "siege" })),
  quarry: cityNode("Quarry", QUARRY, (level) => `the city's upgrades cost ${Math.round(QUARRY.upgradeDiscount(level) * 100)}% less; its defenders have +${QUARRY.wallArmor(level)} armor behind its walls`),
  ossuary: cityNode("Ossuary", OSSUARY, (level) => `the dead can be raised in this city without the research, at the Capitol's price${OSSUARY.raisesDead(level) > 0 ? ` less ${Math.round(OSSUARY.raisesDead(level) * 100)}%` : ""}`),
  watchtower: cityNode("Watchtower", WATCHTOWER, (level) => `you see ${WATCHTOWER.sight(level)} hexes around it, through the fog`),
  // "I really love this one" (user): the land's tribe recruits here. Bandits until biomes bring others.
  tribal_outpost: {
    name: "Tribal outpost",
    income: () => 0,
    mana: () => 0,
    recruitEffects: () => [],
    describe: (level) => `the city recruits bandits (${BANDIT_RECRUITS.slice(0, level + 1).map((id) => UNITS[id]?.name ?? id).join(", ")}); they take no garrison slot`,
    city: { tribeRecruits: (level) => BANDIT_RECRUITS.slice(0, level + 1) },
  },
  bell_tower: cityNode("Bell tower", { warning: (level) => 1 + level, defenderEffects: () => [{ def: "forewarned" }] }, (level) => `you hear of enemy warbands ending a march within ${1 + level} hexes of the city; its defenders act first in the first round of a battle there`),
};

/** The bandits a Tribal outpost offers, more with each level (provisional #56). */
const BANDIT_RECRUITS = ["brigand", "bandit", "marauder", "hedge_mage"] as const;

/** A node whose gifts are to its city, not to recruits. */
function cityNode(name: string, city: CityGifts, describe: (level: number) => string): NodeDef {
  return { name, income: () => 0, mana: () => 0, recruitEffects: () => [], describe, city };
}

/** A node whose only gift is a mark on the units recruited in its city. */
/** A mark's own text (its effect's), lowered to follow "units recruited here, for good:". */
function markText(seed: EffectSeed): string {
  const text = effectDef(seed.def).describe({ def: seed.def, source: null, stacks: seed.stacks ?? 1, amount: seed.amount ?? 0 });
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function markNode(name: string, mark: (level: number) => EffectSeed): NodeDef {
  return { name, income: () => 0, mana: () => 0, recruitEffects: (level) => [mark(level)], describe: (level) => `units recruited here, for good: ${markText(mark(level))}` };
}

/** Where a node is generated; the world gives it an id and a level. */
export interface NodeSite {
  readonly kind: NodeKind;
  readonly hex: { readonly q: number; readonly r: number };
}
