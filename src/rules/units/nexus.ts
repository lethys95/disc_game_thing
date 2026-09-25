import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/** Ral-Vitahl (docs/design/units/nexus-tier1.md, docs/design/dichotomies.md). Mechanics are the user's; stats are provisional. */
export const NEXUS_UNITS: Readonly<Record<string, UnitDef>> = {
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
  battery: {
    id: "battery", name: "Battery", faction: "nexus", tier: 2, damageType: "weapon",
    stats: { maxHp: 70, shield: 160, damage: 30, armor: 0, initiative: 45 },
    abilities: kit("attack", "equalize", "defend", "wait"),
  },
  mutant: {
    id: "mutant", name: "Mutant", faction: "nexus", tier: 2, damageType: "weapon",
    stats: { maxHp: 150, shield: 60, damage: 40, armor: 0, initiative: 50 },
    abilities: kit("attack", "mutate", "defend", "wait"),
  },
  justiciar: {
    id: "justiciar", name: "Justiciar", faction: "nexus", tier: 2, damageType: "weapon",
    stats: { maxHp: 70, shield: 0, damage: 12, armor: 0, initiative: 55 },
    abilities: kit("negate", "plus_burst", "bolt", "defend", "wait"),
  },
  thaumaturge: {
    id: "thaumaturge", name: "Thaumaturge", faction: "nexus", tier: 2, damageType: "weapon",
    stats: { maxHp: 65, shield: 0, damage: 12, armor: 0, initiative: 50 },
    abilities: kit("homing_lightning", "plus_burst", "bolt", "defend", "wait"),
  },
};
