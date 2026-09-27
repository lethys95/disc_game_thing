import { BLACKSMITH_BONUS, MANA_NODE_INCOME, MINE_INCOME } from "#rules/balance";
import type { EffectSeed } from "#rules/battle/types";

/**
 * Nodes (Warlords 3 style, docs/design/pillars.md "Cities"): map features that belong to the **nearest city** (a
 * Capitol counts), so whoever holds that city holds them. A node kind is data: gold and mana per turn, and what units
 * recruited in its city carry, all growing with the node's level (investment, provisional numbers).
 */
export type NodeKind = "gold" | "blacksmith" | "mana";

export interface NodeDef {
  readonly name: string;
  readonly income: (level: number) => number;
  /** Mana per turn, in the holder's faction color. */
  readonly mana: (level: number) => number;
  /** What a unit recruited in the node's city carries for good (a mark). */
  readonly recruitEffects: (level: number) => readonly EffectSeed[];
}

export const NODES: Readonly<Record<NodeKind, NodeDef>> = {
  gold: { name: "Gold mine", income: (level) => MINE_INCOME * level, mana: () => 0, recruitEffects: () => [] },
  // User (2026-09-27): units recruited in the Blacksmith's city get +10 attack. It stays with them, as a mark.
  blacksmith: { name: "Blacksmith", income: () => 0, mana: () => 0, recruitEffects: (level) => [{ def: "blacksmith", amount: BLACKSMITH_BONUS * level }] },
  mana: { name: "Mana node", income: () => 0, mana: (level) => MANA_NODE_INCOME * level, recruitEffects: () => [] },
};

/** Where a node is generated; the world gives it an id and a level. */
export interface NodeSite {
  readonly kind: NodeKind;
  readonly hex: { readonly q: number; readonly r: number };
}
