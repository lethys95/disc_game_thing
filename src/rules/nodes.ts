import { BLACKSMITH_BONUS, MINE_INCOME } from "#rules/balance";
import type { EffectSeed } from "#rules/battle/types";

/**
 * Nodes (Warlords 3 style, docs/design/pillars.md "Cities"): map features that belong to the **nearest city** (a
 * Capitol counts), so whoever holds that city holds them. A node kind is data: income per turn and effects its
 * owner brings into every battle, both growing with the node's level (investment, provisional numbers).
 */
export type NodeKind = "gold" | "blacksmith";

export interface NodeDef {
  readonly name: string;
  readonly income: (level: number) => number;
  readonly battleEffects: (level: number) => readonly EffectSeed[];
}

export const NODES: Readonly<Record<NodeKind, NodeDef>> = {
  gold: { name: "Gold mine", income: (level) => MINE_INCOME * level, battleEffects: () => [] },
  // User: "blacksmith node would increase the damage of abilities by 10 or something". Whom it reaches (every
  // warband of the owner) is provisional (docs/questions.md).
  blacksmith: { name: "Blacksmith", income: () => 0, battleEffects: (level) => [{ def: "blacksmith", amount: BLACKSMITH_BONUS * level }] },
};

/** Where a node is generated; the world gives it an id and a level. */
export interface NodeSite {
  readonly kind: NodeKind;
  readonly hex: { readonly q: number; readonly r: number };
}
