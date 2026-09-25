import type { UnitDef } from "#rules/types";

const kit = (...ids: string[]) => ids.map((id) => ({ id }));

/**
 * The Jilliath melee line (docs/design/units/jilliath-melee-line.md, canon), plus the Capitol Guardian:
 * canon says it exists, never leaves the Capitol and ends the game when it falls; its stats are provisional.
 */
export const UNITS: Readonly<Record<string, UnitDef>> = {
  capitol_guardian: {
    id: "capitol_guardian", name: "Capitol Guardian", faction: "neutral", tier: 0, damageType: "weapon",
    // Provisional, tuned by simulation: beats early and most mid armies, falls to fully evolved ones.
    stats: { maxHp: 1500, shield: 0, damage: 80, armor: 25, initiative: 60 },
    abilities: kit("attack", "defend", "wait"),
  },
  congregant: {
    id: "congregant", name: "Congregant", faction: "jilliath", tier: 1, damageType: "weapon",
    stats: { maxHp: 90, shield: 0, damage: 20, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "congregation"),
  },
  paladin: {
    id: "paladin", name: "Paladin", faction: "jilliath", tier: 2, damageType: "weapon",
    stats: { maxHp: 150, shield: 0, damage: 40, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "lay_on_hands"),
  },
  templar: {
    id: "templar", name: "Templar", faction: "jilliath", tier: 3, damageType: "weapon",
    stats: { maxHp: 200, shield: 0, damage: 60, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "lay_on_hands", "devotion_aura"),
  },
  immortal: {
    id: "immortal", name: "Immortal", faction: "jilliath", tier: 4, damageType: "weapon",
    stats: { maxHp: 260, shield: 0, damage: 80, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "divine_lay_on_hands", "devotion_aura", "guardian_spirit"),
  },
  zealot: {
    id: "zealot", name: "Zealot", faction: "jilliath", tier: 2, damageType: "weapon",
    stats: { maxHp: 180, shield: 0, damage: 70, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "must_attack", "zeal"),
  },
  punisher: {
    id: "punisher", name: "Punisher", faction: "jilliath", tier: 3, damageType: "weapon",
    stats: { maxHp: 200, shield: 0, damage: 45, armor: 0, initiative: 50 },
    abilities: kit("flail", "defend", "wait", "punishment"),
  },
  torturer: {
    id: "torturer", name: "Torturer", faction: "jilliath", tier: 4, damageType: "weapon",
    stats: { maxHp: 220, shield: 0, damage: 60, armor: 0, initiative: 50 },
    abilities: kit("flail", "defend", "wait", "hook", "punishment", "domination"),
  },
  fanatic: {
    id: "fanatic", name: "Fanatic", faction: "jilliath", tier: 3, damageType: "weapon",
    stats: { maxHp: 280, shield: 0, damage: 110, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "must_attack", "fanaticism", "hysteria"),
  },
  chosen: {
    id: "chosen", name: "Chosen", faction: "jilliath", tier: 4, damageType: "fire",
    stats: { maxHp: 320, shield: 0, damage: 150, armor: 0, initiative: 60 },
    abilities: kit("attack", "defend", "wait", "must_attack", "fanaticism", "hysteria"),
  },
  avatar_of_vengeance: {
    id: "avatar_of_vengeance", name: "Avatar of Vengeance", faction: "jilliath", tier: 5, damageType: "fire",
    stats: { maxHp: 400, shield: 0, damage: 150, armor: 0, initiative: 60 },
    abilities: kit("attack", "defend", "wait", "fanaticism_aura"),
  },

  // Ral-Vitahl (Nexus) tier 1, docs/design/units/nexus-tier1.md. Mechanics are the user's; stats are provisional.
  custodian: {
    id: "custodian", name: "Custodian", faction: "nexus", tier: 1, damageType: "weapon",
    stats: { maxHp: 60, shield: 90, damage: 25, armor: 0, initiative: 45 },
    abilities: kit("attack", "defend", "wait"),
  },
  arcane_engineer: {
    id: "arcane_engineer", name: "Arcane Engineer", faction: "nexus", tier: 1, damageType: "weapon",
    stats: { maxHp: 60, shield: 0, damage: 10, armor: 0, initiative: 45 },
    abilities: kit("shoot", "restore_shield", "defend", "wait"),
  },
  apprentice: {
    id: "apprentice", name: "Apprentice", faction: "nexus", tier: 1, damageType: "weapon",
    stats: { maxHp: 55, shield: 0, damage: 8, armor: 0, initiative: 45 },
    abilities: kit("plus_burst", "bolt", "defend", "wait"),
  },

  // Neutral bandits, docs/design/units/neutrals-bandits.md. Mechanics are the user's; stats are provisional.
  brigand: {
    id: "brigand", name: "Brigand", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 100, shield: 0, damage: 20, armor: 0, initiative: 45 },
    abilities: kit("attack", "stun_front", "defend", "wait"),
  },
  marauder: {
    id: "marauder", name: "Marauder", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 110, shield: 0, damage: 22, armor: 5, initiative: 45 },
    abilities: kit("attack", "anti_armor", "defend", "wait"),
  },
  bandit: {
    id: "bandit", name: "Bandit", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 70, shield: 0, damage: 18, armor: 0, initiative: 70 },
    abilities: kit("shoot", "defend", "wait"),
  },
  hedge_mage: {
    id: "hedge_mage", name: "Hedge Mage", faction: "neutral", tier: 1, damageType: "fire",
    stats: { maxHp: 50, shield: 0, damage: 20, armor: 0, initiative: 40 },
    abilities: kit("area_2x2", "defend", "wait"),
  },
};

export const GUARDIAN_ID = "capitol_guardian";

/** Units that can be bought: tier 1 only, as in D2; higher tiers come from evolution (M4). */
export const RECRUITS: readonly string[] = ["congregant"];

/** Canon: the Congregant costs 40 gold. */
export const RECRUIT_COST: Readonly<Record<string, number>> = { congregant: 40 };

/** A fork a faction commits to once, for good (branch investment, docs/design/pillars.md). */
export type Branch = "preserve" | "consume" | "punishment" | "sacrifice";

export interface Evolution {
  readonly to: string;
  /** The branch the faction must have invested in; null where the line doesn't fork. */
  readonly requires: Branch | null;
}

/** The canon Jilliath melee tree (docs/design/units/jilliath-melee-line.md). */
export const EVOLUTIONS: Readonly<Record<string, readonly Evolution[]>> = {
  congregant: [{ to: "paladin", requires: "preserve" }, { to: "zealot", requires: "consume" }],
  paladin: [{ to: "templar", requires: null }],
  templar: [{ to: "immortal", requires: null }],
  zealot: [{ to: "punisher", requires: "punishment" }, { to: "fanatic", requires: "sacrifice" }],
  punisher: [{ to: "torturer", requires: null }],
  fanatic: [{ to: "chosen", requires: null }],
  chosen: [{ to: "avatar_of_vengeance", requires: null }],
};
