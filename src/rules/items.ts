import type { EffectSeed } from "#rules/battle/types";

/**
 * Items (pillars.md: elevation grants equipment slots; dungeons reward treasure items; the Ankh). The slots are the
 * user's 2024 design (`legacy/disc 5.6/Script/Creature/Leader/Inventory.as`): headgear, body armor, a banner, two
 * utility slots, and a bag for what isn't worn. The Ankh is canon, the Hatchet and the Outlaw's pocketwatch are the
 * user's (2026-09-27); **the others are plain placeholders** with provisional numbers (questions.md #53).
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
  | { readonly kind: "raiseFallen" };

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
  readonly describe: string;
}

export const ITEMS: readonly ItemDef[] = [
  // The user's (2026-09-27); prices provisional.
  {
    id: "hatchet",
    name: "Hatchet",
    slot: "weapon",
    price: 100,
    worn: [{ def: "carries", ability: { id: "throw_hatchet" } }],
    banner: [],
    revivesFree: false,
    describe: "Once per combat, the leader throws it at any enemy for 30.",
  },
  {
    id: "outlaws_pocketwatch",
    name: "Outlaw's pocketwatch",
    slot: "utility",
    price: 150,
    worn: [{ def: "pocketwatch", amount: 5 }],
    banner: [],
    revivesFree: false,
    describe: "The leader's attacks deal +5, and +10 more against a target that still has shield.",
  },
  {
    id: "ankh",
    name: "Ankh",
    slot: null,
    price: 150,
    worn: [],
    banner: [],
    revivesFree: true,
    describe: "If its leader falls, reviving it costs nothing. Used up when it does.",
  },
  {
    id: "iron_helm",
    name: "Iron helm (placeholder)",
    slot: "head",
    price: 100,
    worn: [{ def: "extra_armor", amount: 5 }],
    banner: [],
    revivesFree: false,
    describe: "The leader has +5 armor.",
  },
  {
    id: "plate_armor",
    name: "Plate armor (placeholder)",
    slot: "armor",
    price: 150,
    worn: [{ def: "extra_armor", amount: 8 }],
    banner: [],
    revivesFree: false,
    describe: "The leader has +8 armor.",
  },
  {
    id: "swift_charm",
    name: "Swift charm (placeholder)",
    slot: "utility",
    price: 100,
    worn: [{ def: "extra_initiative", amount: 10 }],
    banner: [],
    revivesFree: false,
    describe: "The leader has +10 initiative.",
  },
  {
    id: "war_banner",
    name: "War banner (placeholder)",
    slot: "banner",
    price: 200,
    worn: [],
    banner: [{ def: "extra_damage", amount: 5 }],
    revivesFree: false,
    describe: "Every unit of the warband deals +5 damage.",
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
    describe: "Use on the map: every living unit of the warband heals 50 HP. Used up.",
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
    describe: "Use on the map: your most recently fallen unit rises into this warband at 1 HP, wherever it stands. Used up.",
  },
];

export function itemById(id: string): ItemDef {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`unknown item: ${id}`);
  return item;
}
