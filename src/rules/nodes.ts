import { BLACKSMITH_BONUS, MANA_NODE_INCOME, MINE_INCOME } from "#rules/balance";
import type { EffectSeed } from "#rules/battle/types";

/**
 * Nodes (Warlords 3 style, docs/design/pillars.md "Cities"): map features that belong to the **nearest city** (a
 * Capitol counts), so whoever holds that city holds them. A node kind is data: gold and mana per turn, and what units
 * recruited in its city carry, all growing with the node's level (investment, provisional numbers).
 */
export type NodeKind = "gold" | "blacksmith" | "mana" | "cathedral" | "foundry" | "leech_pits" | "stables" | "tannery" | "siege_workshop";

export interface NodeDef {
  readonly name: string;
  readonly income: (level: number) => number;
  /** Mana per turn, in the holder's faction color. */
  readonly mana: (level: number) => number;
  /** What a unit recruited in the node's city carries for good (a mark). */
  readonly recruitEffects: (level: number) => readonly EffectSeed[];
  /** What it gives at a level, in words. */
  readonly describe: (level: number) => string;
}

export const NODES: Readonly<Record<NodeKind, NodeDef>> = {
  gold: { name: "Gold mine", income: (level) => MINE_INCOME * level, mana: () => 0, recruitEffects: () => [], describe: (level) => `+${MINE_INCOME * level} gold per turn` },
  // User (2026-09-27): units recruited in the Blacksmith's city get +10 attack. It stays with them, as a mark.
  blacksmith: {
    name: "Blacksmith",
    income: () => 0,
    mana: () => 0,
    recruitEffects: (level) => [{ def: "blacksmith", amount: BLACKSMITH_BONUS * level }],
    describe: (level) => `units recruited here deal +${BLACKSMITH_BONUS * level} damage, for good`,
  },
  mana: { name: "Mana node", income: () => 0, mana: (level) => MANA_NODE_INCOME * level, recruitEffects: () => [], describe: (level) => `+${MANA_NODE_INCOME * level} mana per turn` },
  // User (2026-09-27): units hired in the Cathedral's city carry holy water (heal 30, once per combat). Levels don't
  // change it yet (provisional).
  cathedral: {
    name: "Cathedral",
    income: () => 0,
    mana: () => 0,
    recruitEffects: () => [{ def: "carries", ability: { id: "holy_water" } }],
    describe: () => "units recruited here carry holy water (heal 30, once per combat)",
  },
  // The user's picks from Claude's brainstorm (design/nodes.md, 2026-09-28): recruit marks. Numbers provisional (#56).
  foundry: markNode("Foundry", (level) => ({ def: "foundry", amount: 6 + 6 * level }), (level) => `units recruited here have +${6 + 6 * level} shield that mends ${2 + 2 * level} a turn, for good`),
  leech_pits: markNode("Leech pits", (level) => ({ def: "leech", amount: 5 + 3 * level }), (level) => `units recruited here heal ${5 + 3 * level}% of the damage they deal, for good`),
  stables: markNode("Stables", () => ({ def: "stables", amount: 1 }), () => "a warband with a unit recruited here has +1 movement on the map"),
  tannery: markNode("Tannery", (level) => ({ def: "tannery", amount: 8 + 7 * level }), (level) => `units recruited here take ${8 + 7 * level} less from the first hit to reach them each battle, for good`),
  siege_workshop: markNode("Siege workshop", () => ({ def: "siege" }), () => "units recruited here ignore a city's fortification with their first attack in a battle against it, for good"),
};

/** A node whose only gift is a mark on the units recruited in its city. */
function markNode(name: string, mark: (level: number) => EffectSeed, describe: (level: number) => string): NodeDef {
  return { name, income: () => 0, mana: () => 0, recruitEffects: (level) => [mark(level)], describe };
}

/** Where a node is generated; the world gives it an id and a level. */
export interface NodeSite {
  readonly kind: NodeKind;
  readonly hex: { readonly q: number; readonly r: number };
}
