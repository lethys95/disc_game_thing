import { ITEMS } from "#rules/items";
import type { Biome } from "#rules/map";
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

/** The levels a mercenary camp's hires come with, in the order it offers them (provisional #84). */
const MERCENARY_LEVELS: readonly number[] = [1, 1, 0];

/**
 * What a mercenary camp offers: the first of its land's tribe's units (`tribeUnits`, lowest tiers first; the user,
 * 2026-10-15: whom a camp hires out fits its biome), seasoned by `MERCENARY_LEVELS`.
 */
export const mercenaryStock = (tribeUnits: readonly string[]): Hire[] =>
  tribeUnits.slice(0, MERCENARY_LEVELS.length).map((defId, i) => ({ defId, level: MERCENARY_LEVELS[i] ?? 0 }));

/** How many of each structure a map has: one per this many hexes, at least one (so bigger maps have more). */
const HEXES_PER_STRUCTURE = 60;

export const structuresPerKind = (hexes: number): number => Math.max(1, Math.floor(hexes / HEXES_PER_STRUCTURE));

/** What every merchant always sells, without running out. */
export const MERCHANT_STAPLES: readonly string[] = ["healing_potion", "resurrection_potion"];

/** How many changing wares a merchant lays out, and how many rounds they stay before new ones replace them. */
const MERCHANT_WARES = 3;
export const MERCHANT_RESTOCK_TURNS = 6;

/**
 * What a biome's merchants sell besides the staples, and what every merchant may (the user, 2026-10-16: strict, like
 * the node pools; the lists were Claude's hints, taken as they were).
 */
export const MERCHANT_POOLS: Readonly<Record<Biome | "anywhere", readonly string[]>> = {
  anywhere: ["iron_helm", "plate_armor", "swift_charm", "war_banner", "storm_capacitor", "wayfinders_map"],
  temperate: ["hatchet", "outlaws_pocketwatch", "reaching_spear", "banner_of_the_vanguard", "spyglass_helm", "veterans_standard"],
  desert: ["deck_of_cards", "ankh", "crown_of_the_pretender", "salt_of_the_old_kings", "hourglass_of_borrowed_time", "gold_item"],
  swamp: ["twin_knives", "seedpod_reliquary", "hatchet", "deck_of_cards"],
  tundra: ["grudgebearer", "penitents_chains", "veterans_standard", "banner_of_the_vanguard"],
  haunted: ["burial_wrappings", "hollow_plate", "deck_of_cards", "hourglass_of_borrowed_time", "ankh"],
};

/**
 * The wares a merchant in `biome` lays out from `turn`: a few items from its biome's list and the "anywhere" list,
 * picked by noise on the merchant and the turn, so they differ between merchants and each time, yet the game stays
 * deterministic.
 */
export function merchantWares(merchantId: string, turn: number, biome: Biome): string[] {
  const seed = hashOf(merchantId);
  const pool = new Set([...MERCHANT_POOLS[biome], ...MERCHANT_POOLS.anywhere]);
  return ITEMS.filter((i) => pool.has(i.id))
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
