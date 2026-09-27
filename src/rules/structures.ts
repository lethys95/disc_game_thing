import { UNITS } from "#rules/units/index";

/**
 * Map structures a warband visits by standing on them (user, 2026-09-27): a mercenary camp hires out a few select
 * neutral units, a merchant buys and sells items, a mage merchant sells spells. The kinds are the user's; **every
 * stock, price and count here is provisional** (questions.md #54).
 */
export type StructureKind = "mercenaries" | "merchant" | "mage";

export const STRUCTURE_KINDS: readonly StructureKind[] = ["mercenaries", "merchant", "mage"];

export interface StructureDef {
  readonly name: string;
  readonly describe: string;
}

export const STRUCTURES: Readonly<Record<StructureKind, StructureDef>> = {
  mercenaries: { name: "Mercenary camp", describe: "Hires out a few neutral units, each once, to a warband standing here." },
  merchant: { name: "Merchant", describe: "Sells items to a warband standing here, and buys its unworn ones for half their price." },
  mage: { name: "Mage merchant", describe: "Sells spells no faction teaches, to a warband standing here." },
};

/** A unit a mercenary camp offers: hired once, it's gone. */
export interface Hire {
  readonly defId: string;
  /** Levels it comes with (pillars.md, levels past the end of a line). */
  readonly level: number;
}

/** What each mercenary camp on a map offers, in turn: the first camp the first list, and so on. */
export const MERCENARY_STOCKS: readonly (readonly Hire[])[] = [
  [{ defId: "marauder", level: 1 }, { defId: "hedge_mage", level: 1 }, { defId: "brigand", level: 0 }],
  [{ defId: "bandit", level: 1 }, { defId: "hedge_mage", level: 0 }, { defId: "marauder", level: 0 }],
];

/** Each item a merchant starts with, one of each. */
export const MERCHANT_STOCK: readonly string[] = ["iron_helm", "plate_armor", "swift_charm", "war_banner", "ankh"];

/** Gold per tier and per level a mercenary costs: dearer than a faction's own tier-1 recruits. */
const HIRE_COST_PER_TIER = 90;
const HIRE_COST_PER_LEVEL = 30;

export const hireCost = (hire: Hire): number => HIRE_COST_PER_TIER * Math.max(1, UNITS[hire.defId]?.tier ?? 1) + HIRE_COST_PER_LEVEL * hire.level;

/** What a merchant pays for an item: half its price (D2's rule). */
export const resalePrice = (price: number): number => Math.floor(price / 2);
