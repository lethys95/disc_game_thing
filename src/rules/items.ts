import { behavior, paramsOf } from "#rules/abilities/index";
import type { EffectSeed } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

/**
 * Items (pillars.md: elevation grants equipment slots; dungeons reward treasure items; the Ankh). The slots are the
 * user's 2024 design (`legacy/disc 5.6/Script/Creature/Leader/Inventory.as`): headgear, body armor, a banner, two
 * utility slots, and a bag for what isn't worn. The Ankh is canon, the Hatchet and the Outlaw's pocketwatch are the
 * user's (2026-09-27); **the others are plain placeholders** with provisional numbers (provisional.md #53).
 */
export type EquipmentSlot = "head" | "armor" | "weapon" | "utility" | "banner";

/** How many of each slot a leader has. */
/** The weapon slot came with the user's Hatchet (2026-09-27); the 2024 layout had none. */
export const SLOT_CAPACITY: Readonly<Record<EquipmentSlot, number>> = { head: 1, armor: 1, weapon: 1, utility: 2, banner: 1 };

export const SLOT_NAMES: Readonly<Record<EquipmentSlot, string>> = { head: "Headgear", armor: "Body armor", weapon: "Weapon", utility: "Utility", banner: "Banner" };

/** What a consumable does when its leader uses it on the map; used up doing so. */
export type ItemUse =
  /** Every living unit of the warband heals this much, up to its max. */
  | { readonly kind: "healWarband"; readonly amount: number }
  /** The player's most recently fallen unit rises into this warband, at 1 HP (as a resurrection does). */
  | { readonly kind: "raiseFallen" }
  /** A hex beside the warband that nothing may enter for `turns` turns (Salt of the old kings). */
  | { readonly kind: "ward"; readonly turns: number };

/** What a worn item gives its leader's warband on the map, while the leader stands. */
export interface MapGifts {
  /** Room for more units (the Crown of the pretender). Counts even while the leader is down, so a squad never overflows. */
  readonly leadership?: number;
  /** Gold for its player at the start of each of its turns. */
  readonly gold?: number;
  /** Hexes of sight beyond the warband's own. */
  readonly sight?: number;
  /** XP for the leader for each hex its march is the first of its player's to reveal (a Spyglass helm). */
  readonly scouting?: number;
  /** Forest and hills cost the warband what plains cost (a Wayfinder's map). */
  readonly sureFooted?: boolean;
}

type CountedGift = "leadership" | "gold" | "sight" | "scouting";

export interface ItemDef {
  readonly id: string;
  readonly name: string;
  /** Where it's worn; null for an item that's only carried (a consumable). */
  readonly slot: EquipmentSlot | null;
  readonly price: number;
  /** What the leader's own unit brings into battle while it's worn. */
  readonly worn: readonly EffectSeed[];
  /** What every unit of the warband brings into battle while it's worn (banners). */
  readonly banner: readonly EffectSeed[];
  /** Carried (worn or in the bag), it makes reviving its fallen leader free, and is used up doing so (the Ankh). */
  readonly revivesFree: boolean;
  /** A consumable's use (potions); absent for items that are worn or just carried. */
  readonly use?: ItemUse;
  /** Worn: what it does on the map. */
  readonly map?: MapGifts;
  /**
   * What it remembers, carried in its id as a count (`grudgebearer:3`), so the count goes wherever it goes: sold,
   * worn by another, taken as spoils. Its seeds get that many stacks, up to `cap`.
   */
  readonly memory?: { readonly counts: "leaderKills" | "battles"; readonly cap?: number };
  /** Worn, a unit of this type stands in a free tile of the warband's grid in every battle, whole again each time. */
  readonly standsIn?: string;
}

export const ITEMS: readonly ItemDef[] = [
  // The user's (2026-10-05): "adds tarot 4 to leader". A utility item (Claude's reading of "misc"); price provisional.
  {
    id: "deck_of_cards",
    name: "Deck of cards",
    slot: "utility",
    price: 150,
    worn: [{ def: "carries", ability: { id: "tarot", params: { cards: 4 } } }],
    banner: [],
    revivesFree: false,
  },
  // The user's (2026-09-27); prices provisional.
  {
    id: "hatchet",
    name: "Hatchet",
    slot: "weapon",
    price: 100,
    worn: [{ def: "carries", ability: { id: "throw_hatchet" } }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "outlaws_pocketwatch",
    name: "Outlaw's pocketwatch",
    slot: "utility",
    price: 150,
    worn: [{ def: "pocketwatch", amount: 5 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "ankh",
    name: "Ankh",
    slot: null,
    price: 150,
    worn: [],
    banner: [],
    revivesFree: true,
  },
  {
    id: "iron_helm",
    name: "Iron helm (placeholder)",
    slot: "head",
    price: 100,
    worn: [{ def: "extra_armor", amount: 5 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "plate_armor",
    name: "Plate armor (placeholder)",
    slot: "armor",
    price: 150,
    worn: [{ def: "extra_armor", amount: 8 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "swift_charm",
    name: "Swift charm (placeholder)",
    slot: "utility",
    price: 100,
    worn: [{ def: "extra_initiative", amount: 10 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "war_banner",
    name: "War banner (placeholder)",
    slot: "banner",
    price: 200,
    worn: [],
    banner: [{ def: "extra_damage", amount: 5 }],
    revivesFree: false,
  },
  // The user's picks from Claude's brainstorm (2026-09-29, `docs/design/items.md`, "Taken"); numbers and prices
  // provisional (#83).
  {
    id: "crown_of_the_pretender",
    name: "Crown of the pretender",
    slot: "head",
    price: 250,
    worn: [],
    banner: [{ def: "pretender" }],
    revivesFree: false,
    map: { leadership: 1 },
  },
  {
    id: "burial_wrappings",
    name: "Burial wrappings",
    slot: "armor",
    price: 150,
    worn: [{ def: "death_ward" }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "banner_of_the_vanguard",
    name: "Banner of the vanguard",
    slot: "banner",
    price: 150,
    worn: [{ def: "vanguard" }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "storm_capacitor",
    name: "Storm capacitor",
    slot: "utility",
    price: 150,
    worn: [{ def: "carries", ability: { id: "storm_capacitor" } }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "seedpod_reliquary",
    name: "Seedpod reliquary",
    slot: "utility",
    price: 150,
    worn: [],
    banner: [{ def: "seedpod", amount: 4 }],
    revivesFree: false,
  },
  {
    id: "penitents_chains",
    name: "Penitent's chains",
    slot: "armor",
    price: 200,
    worn: [{ def: "penitent", amount: 50 }, { def: "extra_armor", amount: 10 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "twin_knives",
    name: "Twin knives",
    slot: "weapon",
    price: 200,
    worn: [{ def: "twin_knives", amount: 60 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "reaching_spear",
    name: "Reaching spear",
    slot: "weapon",
    price: 150,
    worn: [{ def: "reaching_spear", amount: 50 }],
    banner: [],
    revivesFree: false,
  },
  {
    id: "hourglass_of_borrowed_time",
    name: "Hourglass of borrowed time",
    slot: "utility",
    price: 200,
    worn: [{ def: "carries", ability: { id: "hourglass" } }],
    banner: [],
    revivesFree: false,
  },
  {
    // "Gold item (was Deed to a silver mine)": the user, "we can have a gold bonus item. homm have them too"; the
    // name is a placeholder until the user names it.
    id: "gold_item",
    name: "Gold item (placeholder)",
    slot: "utility",
    price: 300,
    worn: [],
    banner: [],
    revivesFree: false,
    map: { gold: 25 },
  },
  {
    id: "wayfinders_map",
    name: "Wayfinder's map",
    slot: "utility",
    price: 150,
    worn: [],
    banner: [],
    revivesFree: false,
    map: { sureFooted: true },
  },
  {
    // The user: "+2 sight, and the leader gains XP for every never-before-explored hex it reveals".
    id: "spyglass_helm",
    name: "Spyglass helm",
    slot: "head",
    price: 150,
    worn: [],
    banner: [],
    revivesFree: false,
    map: { sight: 2, scouting: 2 },
  },
  {
    id: "salt_of_the_old_kings",
    name: "Salt of the old kings",
    slot: null,
    price: 100,
    worn: [],
    banner: [],
    revivesFree: false,
    use: { kind: "ward", turns: 3 },
  },
  {
    // The user: "+3 damage per enemy leader killed, for good; keep the tooltip from turning into spam (a count, maybe
    // the last few names)". A count.
    id: "grudgebearer",
    name: "Grudgebearer",
    slot: "weapon",
    price: 200,
    worn: [{ def: "grudge", amount: 3 }],
    banner: [],
    revivesFree: false,
    memory: { counts: "leaderKills" },
  },
  {
    // The user: "+damage to the warband per battle it has seen, capped; '10 is not much, maybe buff'". Claude's buff:
    // the same +1 a battle, up to +20.
    id: "veterans_standard",
    name: "Veteran's standard",
    slot: "banner",
    price: 200,
    worn: [],
    banner: [{ def: "battle_worn", amount: 1 }],
    revivesFree: false,
    memory: { counts: "battles", cap: 20 },
  },
  {
    // The user: "cool, but you shouldnt have to restore at city": it stands up whole for every battle.
    id: "hollow_plate",
    name: "Hollow plate",
    slot: "armor",
    price: 250,
    worn: [],
    banner: [],
    revivesFree: false,
    standsIn: "hollow_plate",
  },
  // Potions: the merchant's staples (user, 2026-09-27: "resurrection potions or healing potions"); numbers provisional (#54).
  {
    id: "healing_potion",
    name: "Healing potion",
    slot: null,
    price: 60,
    worn: [],
    banner: [],
    revivesFree: false,
    use: { kind: "healWarband", amount: 50 },
  },
  {
    id: "resurrection_potion",
    name: "Resurrection potion",
    slot: null,
    price: 120,
    worn: [],
    banner: [],
    revivesFree: false,
    use: { kind: "raiseFallen" },
  },
];

/** An item's type id, without the count a remembering item carries. */
export const baseItem = (item: string): string => item.split(":")[0] ?? item;

/** What a remembering item has counted so far. */
export const tallyOf = (item: string): number => Number(item.split(":")[1] ?? 0);

export const withTally = (item: string, tally: number): string => `${baseItem(item)}:${tally}`;

/** An item's worn and banner seeds with what it remembers laid on as stacks. */
export function seedsOf(item: string): { readonly worn: readonly EffectSeed[]; readonly banner: readonly EffectSeed[] } {
  const def = itemById(item);
  if (!def.memory) return def;
  const stacks = Math.min(tallyOf(item), def.memory.cap ?? Infinity);
  return { worn: def.worn.map((s) => ({ ...s, stacks })), banner: def.banner.map((s) => ({ ...s, stacks })) };
}

/** The sum of one gift over the items worn. */
export const wornGift = (worn: readonly string[], gift: CountedGift): number => worn.reduce((sum, id) => sum + (itemById(id).map?.[gift] ?? 0), 0);

export const sureFooted = (worn: readonly string[]): boolean => worn.some((id) => itemById(id).map?.sureFooted === true);

export function itemById(id: string): ItemDef {
  const base = baseItem(id);
  const item = ITEMS.find((i) => i.id === base);
  if (!item) throw new Error(`unknown item: ${id}`);
  return item;
}

/** What one carried effect or ability does: the ability's own text, or the effect's. */
function seedText(seed: EffectSeed, abilityPower: number): string {
  if (seed.ability) return `carries ${behavior(seed.ability.id).name}. ${behavior(seed.ability.id).describe(paramsOf(seed.ability, abilityPower))}`;
  return effectDef(seed.def).describe({ def: seed.def, source: null, stacks: seed.stacks ?? 1, amount: seed.amount ?? 0 });
}

/** A carried item's rules text: its type's, with what it has counted so far (a Grudgebearer's kills). */
export const describeCarried = (item: string, abilityPower: number): string => describeItem({ ...itemById(item), ...seedsOf(item) }, abilityPower);

/**
 * An item's rules text, computed from what it carries (as effects' and abilities' are), so its numbers can't drift from
 * the rule. `abilityPower`: the leader's, for an ability it carries whose numbers grow with it (100 when there's none).
 */
export function describeItem(item: ItemDef, abilityPower: number): string {
  const parts = [
    ...item.worn.map((seed) => (seed.ability ? `The leader ${seedText(seed, abilityPower)}` : `The leader: ${seedText(seed, abilityPower)}`)),
    ...item.banner.map((seed) => `Every unit of the warband: ${seedText(seed, abilityPower)}`),
  ];
  if (item.use?.kind === "healWarband") parts.push(`Use on the map: every living unit of the warband heals ${item.use.amount} HP. Used up.`);
  if (item.use?.kind === "raiseFallen") parts.push("Use on the map: your most recently fallen unit rises into this warband at 1 HP, wherever it stands. Used up.");
  const map = item.map;
  if (map?.leadership) parts.push(`+${map.leadership} Leadership for the leader.`);
  if (map?.gold) parts.push(`+${map.gold} gold at the start of each of your turns while the leader stands.`);
  if (map?.sight) parts.push(`The warband sees ${map.sight} hexes farther.`);
  if (map?.scouting) parts.push(`The leader gains ${map.scouting} XP for each hex its march is the first of yours to reveal.`);
  if (map?.sureFooted) parts.push("Forest and hills cost the warband what plains cost.");
  if (item.use?.kind === "ward") parts.push(`Use on the map: a hex beside the warband can't be entered by anyone for ${item.use.turns} turns. Used up.`);
  if (item.standsIn) parts.push(`In battle it stands on its own in a free tile of the warband's grid, whole again every time; it gains no XP.`);
  if (item.revivesFree) parts.push("If its leader falls, reviving it costs nothing. Used up when it does.");
  return parts.join(" ");
}
