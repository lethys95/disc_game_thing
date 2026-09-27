import { ITEMS } from "#rules/items";
import { hashOf, noise } from "#rules/noise";
import { UNITS } from "#rules/units/index";

/**
 * Map structures a warband visits by standing on them (user, 2026-09-27): a mercenary camp hires out a few select
 * neutral units (never running out), a merchant sells staples always and a few wares that change every few rounds,
 * and buys items; a mage merchant sells neutral spells. The rules are the user's (#54); **every stock, price and
 * count here is provisional**.
 */
export type StructureKind = "mercenaries" | "merchant" | "mage";

export const STRUCTURE_KINDS: readonly StructureKind[] = ["mercenaries", "merchant", "mage"];

export interface StructureDef {
  readonly name: string;
  readonly describe: string;
}

export const STRUCTURES: Readonly<Record<StructureKind, StructureDef>> = {
  mercenaries: { name: "Mercenary camp", describe: "Hires out neutral units to a warband standing here, as many as it can pay for." },
  merchant: { name: "Merchant", describe: "Sells potions always and a few wares that change every few rounds, to a warband standing here; buys its unworn items for half their price." },
  mage: { name: "Mage merchant", describe: "Sells spells no faction teaches, to a warband standing here." },
};

/** A unit a mercenary camp offers, as often as it's paid for. */
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

/** How many of each structure a map has: one per this many hexes, at least one (so bigger maps have more). */
const HEXES_PER_STRUCTURE = 60;

export const structuresPerKind = (hexes: number): number => Math.max(1, Math.floor(hexes / HEXES_PER_STRUCTURE));

/** What every merchant always sells, without running out. */
export const MERCHANT_STAPLES: readonly string[] = ["healing_potion", "resurrection_potion"];

/** How many changing wares a merchant lays out, and how many rounds they stay before new ones replace them. */
const MERCHANT_WARES = 3;
export const MERCHANT_RESTOCK_TURNS = 6;

/**
 * The wares a merchant lays out from `turn`: a few items from everything but the staples, picked by noise on the
 * merchant and the turn, so they differ between merchants and each time, yet the game stays deterministic.
 */
export function merchantWares(merchantId: string, turn: number): string[] {
  const seed = hashOf(merchantId);
  return ITEMS.filter((i) => !MERCHANT_STAPLES.includes(i.id))
    .map((i) => ({ id: i.id, roll: noise(seed, turn, hashOf(i.id)) }))
    .sort((a, b) => a.roll - b.roll)
    .slice(0, MERCHANT_WARES)
    .map((i) => i.id);
}

/** Gold per tier and per level a mercenary costs: dearer than a faction's own tier-1 recruits. */
const HIRE_COST_PER_TIER = 90;
const HIRE_COST_PER_LEVEL = 30;

export const hireCost = (hire: Hire): number => HIRE_COST_PER_TIER * Math.max(1, UNITS[hire.defId]?.tier ?? 1) + HIRE_COST_PER_LEVEL * hire.level;

/** What a merchant pays for an item: half its price (D2's rule). */
export const resalePrice = (price: number): number => Math.floor(price / 2);
