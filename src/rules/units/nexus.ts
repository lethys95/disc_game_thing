import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/** Ral-Vitahl (docs/design/units/nexus-tier1.md, docs/design/dichotomies.md). Mechanics are the user's; stats are provisional. */
export const NEXUS_UNITS: Readonly<Record<string, UnitDef>> = {
  custodian: {
    id: "custodian", name: "Custodian", faction: "nexus", tier: 1, damageType: "weapon",
    stats: { maxHp: 60, shield: 65, damage: 25, armor: 0, initiative: 45 },
    abilities: kit("attack", "defend", "wait"),
  },
  technician: {
    id: "technician", name: "Technician", faction: "nexus", tier: 1, damageType: "weapon",
    stats: { maxHp: 60, shield: 0, damage: 10, armor: 0, initiative: 45 },
    abilities: kit("shoot", "restore_shield", "defend", "wait"),
  },
  apprentice: {
    id: "apprentice", name: "Apprentice", faction: "nexus", tier: 1, damageType: "weapon",
    stats: { maxHp: 55, shield: 0, damage: 8, armor: 0, initiative: 45 },
    abilities: [{ id: "plus_burst", params: { power: 35 } }, ...kit("bolt", "defend", "wait")],
    spellCharges: 2,
  },
  cyclops: {
    id: "cyclops", name: "Cyclops", faction: "nexus", tier: 2, damageType: "weapon",
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
    // Scheme replicates: precise, every target chosen.
    abilities: [{ id: "counter", params: { replicate: 1 } }, { id: "plus_burst", params: { replicate: 1 } }, ...kit("bolt", "defend", "wait")],
    spellCharges: 4,
  },
  thaumaturge: {
    id: "thaumaturge", name: "Thaumaturge", faction: "nexus", tier: 2, damageType: "weapon",
    stats: { maxHp: 65, shield: 0, damage: 12, armor: 0, initiative: 50 },
    // Overload overloads: wider, and it doesn't care who it hits.
    abilities: [{ id: "homing_lightning", params: { overload: 1, power: 55 } }, { id: "plus_burst", params: { overload: 1 } }, ...kit("bolt", "defend", "wait")],
    spellCharges: 4,
  },
  // Tier 3 mages (the user's mage sheet, 2026-09-26). Stats and charges are provisional.
  etherborn: {
    id: "etherborn", name: "Etherborn", faction: "nexus", tier: 3, damageType: "weapon",
    stats: { maxHp: 90, shield: 0, damage: 10, armor: 0, initiative: 60 },
    // Loses Burst; Bolt becomes Absorb. Scheme still replicates its secrets.
    abilities: [{ id: "counter", params: { replicate: 1 } }, { id: "negate", params: { replicate: 1 } }, ...kit("absorb", "defend", "wait")],
    spellCharges: 6,
  },
  backlasher: {
    id: "backlasher", name: "Backlasher", faction: "nexus", tier: 3, damageType: "weapon",
    stats: { maxHp: 85, shield: 0, damage: 16, armor: 0, initiative: 60 },
    abilities: [{ id: "counter", name: "Backlash", params: { replicate: 1, backlash: 40 } }, { id: "plus_burst", params: { replicate: 1, power: 55 } }, ...kit("bolt", "defend", "wait")],
    spellCharges: 6,
  },
  maelstrom: {
    id: "maelstrom", name: "Maelstrom", faction: "nexus", tier: 3, damageType: "weapon",
    stats: { maxHp: 85, shield: 0, damage: 16, armor: 0, initiative: 55 },
    // The Thaumaturge's kit, two more charges, and Combustion.
    abilities: [
      { id: "homing_lightning", params: { overload: 1, power: 105 } },
      { id: "plus_burst", params: { overload: 1, power: 55 } },
      ...kit("combustion", "bolt", "defend", "wait"),
    ],
    spellCharges: 6,
  },
};
