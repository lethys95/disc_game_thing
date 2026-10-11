import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";
import type { FactionUnits } from "#rules/units/types";

/** Ral-Vitahl (docs/design/units/nexus-tier1.md, docs/design/dichotomies.md). Mechanics are the user's; stats are provisional. */
const UNITS: Readonly<Record<string, UnitDef>> = {
  custodian: {
    id: "custodian", name: "Custodian", faction: "nexus", tier: 1,
    stats: { maxHp: 60, shield: 65, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "attack", params: { power: 25 } }, ...kit("defend", "wait")],
  },
  technician: {
    id: "technician", name: "Technician", faction: "nexus", tier: 1,
    stats: { maxHp: 60, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "shoot", params: { power: 10 } }, ...kit("restore_shield", "defend", "wait")],
  },
  apprentice: {
    id: "apprentice", name: "Apprentice", faction: "nexus", tier: 1,
    stats: { maxHp: 55, shield: 0, armor: 0, initiative: 45, abilityPower: 150 },
    abilities: [{ id: "plus_burst" }, { id: "bolt", params: { power: 5 } }, ...kit("defend", "wait")],
    spellCharges: 2,
  },
  cyclops: {
    id: "cyclops", name: "Cyclops", faction: "nexus", tier: 2,
    stats: { maxHp: 70, shield: 160, armor: 0, initiative: 45, abilityPower: 200 },
    abilities: [{ id: "attack", params: { power: 15 } }, ...kit("equalize", "defend", "wait")],
  },
  mutant: {
    id: "mutant", name: "Mutant", faction: "nexus", tier: 2,
    stats: { maxHp: 150, shield: 60, armor: 0, initiative: 50, abilityPower: 200 },
    abilities: [{ id: "attack", params: { power: 20 } }, ...kit("mutate", "defend", "wait")],
  },
  justiciar: {
    id: "justiciar", name: "Justiciar", faction: "nexus", tier: 2,
    stats: { maxHp: 70, shield: 0, armor: 0, initiative: 55, abilityPower: 200 },
    // Scheme replicates: precise, every target chosen.
    abilities: [{ id: "counter", params: { replicate: 1 } }, { id: "plus_burst", params: { replicate: 1 } }, { id: "bolt", params: { power: 6 } }, ...kit("defend", "wait")],
    spellCharges: 4,
  },
  thaumaturge: {
    id: "thaumaturge", name: "Thaumaturge", faction: "nexus", tier: 2,
    stats: { maxHp: 65, shield: 0, armor: 0, initiative: 50, abilityPower: 250 },
    // Overload overloads: wider, and it doesn't care who it hits.
    abilities: [{ id: "homing_lightning", params: { overload: 1 } }, { id: "plus_burst", params: { overload: 1 } }, { id: "bolt", params: { power: 5 } }, ...kit("defend", "wait")],
    spellCharges: 4,
  },
  // Tier 3 mages (the user's mage sheet, 2026-09-26). Stats and charges are provisional.
  etherborn: {
    id: "etherborn", name: "Etherborn", faction: "nexus", tier: 3,
    stats: { maxHp: 90, shield: 0, armor: 0, initiative: 60, abilityPower: 300 },
    // Loses Burst; Bolt becomes Absorb. Scheme still replicates its secrets.
    abilities: [{ id: "counter", params: { replicate: 1 } }, { id: "negate", params: { replicate: 1 } }, { id: "absorb", params: { power: 3 } }, ...kit("defend", "wait")],
    spellCharges: 6,
  },
  backlasher: {
    id: "backlasher", name: "Backlasher", faction: "nexus", tier: 3,
    stats: { maxHp: 85, shield: 0, armor: 0, initiative: 60, abilityPower: 350 },
    abilities: [{ id: "counter", name: "Backlash", params: { replicate: 1, backlash: 11 } }, { id: "plus_burst", params: { replicate: 1 } }, { id: "bolt", params: { power: 5 } }, ...kit("defend", "wait")],
    spellCharges: 6,
  },
  maelstrom: {
    id: "maelstrom", name: "Maelstrom", faction: "nexus", tier: 3,
    stats: { maxHp: 85, shield: 0, armor: 0, initiative: 55, abilityPower: 350 },
    // The Thaumaturge's kit, two more charges, and Combustion.
    abilities: [
      { id: "homing_lightning", params: { overload: 1 } },
      { id: "plus_burst", params: { overload: 1 } },
      { id: "combustion" }, { id: "bolt", params: { power: 5 } }, ...kit("defend", "wait"),
    ],
    spellCharges: 6,
  },
};

export const NEXUS: FactionUnits = {
  units: UNITS,
  roots: ["custodian", "technician", "apprentice"],
  // Provisional: "costly", quality over quantity.
  recruitCost: { custodian: 60, technician: 50, apprentice: 60 },
  archetype: { custodian: "melee", technician: "support", apprentice: "mage" },
  evolutions: {
    // Ral-Vitahl: scheme vs overload, chosen per line (user, 2026-09-25).
    custodian: [{ to: "cyclops", label: "Scheme" }, { to: "mutant", label: "Overload" }],
    apprentice: [{ to: "justiciar", label: "Scheme" }, { to: "thaumaturge", label: "Overload" }],
    // Tier 3 mages (user, 2026-09-26).
    justiciar: [{ to: "etherborn" }, { to: "backlasher" }],
    thaumaturge: [{ to: "maelstrom" }],
  },
};
