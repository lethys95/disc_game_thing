import { BLACKSMITH_BONUS, MINE_INCOME } from "#rules/balance";
import type { EffectSeed } from "#rules/battle/types";

/**
 * City nodes (docs/design/pillars.md, Warlords 3 style): they belong to a city, and whoever holds the city holds
 * them. A node kind is data: income each turn, and effects its owner brings into every battle.
 */
export type NodeKind = "gold" | "blacksmith";

export interface NodeDef {
  readonly name: string;
  readonly income: number;
  readonly battleEffects: readonly EffectSeed[];
}

export const NODES: Readonly<Record<NodeKind, NodeDef>> = {
  gold: { name: "Gold mine", income: MINE_INCOME, battleEffects: [] },
  // User: "blacksmith node would increase the damage of abilities by 10 or something". Whom it reaches (every
  // warband of the owner) is provisional (docs/questions.md).
  blacksmith: { name: "Blacksmith", income: 0, battleEffects: [{ def: "blacksmith", amount: BLACKSMITH_BONUS }] },
};

export interface CityNode {
  readonly kind: NodeKind;
  readonly hex: { readonly q: number; readonly r: number };
}
