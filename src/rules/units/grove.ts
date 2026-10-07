import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/**
 * The Grove (Sylvan): its melee line, the user's design (2026-09-29, `faction-stuff/sylvan/melee.md`). The user named
 * tier 1 and the Decay side (2026-10-04), then swapped the Decay names of tiers 3 and 4 for the look (the dead tree
 * comes before the swamp; each tier kept its kit); "Regrowth 2/3" and the backline's names are placeholders. Stats are
 * provisional (`provisional.md` #57).
 */
export const GROVE_UNITS: Readonly<Record<string, UnitDef>> = {
  sproutling: {
    id: "sproutling", name: "Sproutling", faction: "grove", tier: 1,
    stats: { maxHp: 121, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "regrowth", params: { percent: 6 } }, { id: "attack", params: { power: 24 } }, ...kit("defend", "wait")],
  },
  regrowth_2: {
    id: "regrowth_2", name: "Regrowth 2", faction: "grove", tier: 2,
    stats: { maxHp: 192, shield: 0, armor: 0, initiative: 45, abilityPower: 200 },
    abilities: [{ id: "regrowth", params: { percent: 15 } }, { id: "attack", params: { power: 24 } }, ...kit("defend", "wait")],
  },
  // The user: no regeneration on the decay branch; tankier, and it needs a support backline.
  moldling: {
    id: "moldling", name: "Moldling", faction: "grove", tier: 2,
    stats: { maxHp: 210, shield: 0, armor: 0, initiative: 45, abilityPower: 200 },
    abilities: [{ id: "decay", params: { percent: 40 } }, { id: "attack", params: { power: 23 } }, ...kit("defend", "wait")],
  },
  // "Would probably not attack as much": a weak attack; mends and shelters instead.
  regrowth_3: {
    id: "regrowth_3", name: "Regrowth 3", faction: "grove", tier: 3,
    stats: { maxHp: 260, shield: 0, armor: 0, initiative: 50, abilityPower: 300 },
    abilities: [{ id: "regrowth", params: { percent: 12 } }, { id: "grove_mend" }, { id: "attack", params: { power: 11 } }, ...kit("defend", "wait")],
  },
  deadwood: {
    id: "deadwood", name: "Deadwood", faction: "grove", tier: 3,
    stats: { maxHp: 390, shield: 0, armor: 0, initiative: 45, abilityPower: 300 },
    abilities: [{ id: "decay", params: { percent: 50 } }, { id: "withering" }, { id: "attack", params: { power: 25 } }, ...kit("defend", "wait")],
  },
  // The user (2026-09-29): the Decay line's win condition, late game. Numbers provisional (#57).
  bog_giant: {
    id: "bog_giant", name: "Bog Giant", faction: "grove", tier: 4,
    stats: { maxHp: 376, shield: 0, armor: 0, initiative: 45, abilityPower: 400 },
    abilities: [{ id: "decay", params: { percent: 55 } }, { id: "withering" }, { id: "lash_out" }, { id: "attack", params: { power: 18 } }, ...kit("defend", "wait")],
  },
  // The user (2026-10-04): the Decay line forks again after the Deadwood; a plant skeleton that feeds on the dead.
  // It keeps the line's decay and withering (Claude's reading). End of the line. Numbers provisional (#57).
  mulch_gorger: {
    id: "mulch_gorger", name: "Mulch Gorger", faction: "grove", tier: 4,
    stats: { maxHp: 376, shield: 0, armor: 0, initiative: 45, abilityPower: 400 },
    abilities: [{ id: "decay", params: { percent: 50 } }, { id: "withering" }, { id: "gorge" }, { id: "attack", params: { power: 16 } }, ...kit("defend", "wait")],
  },
  // The backline (user, 2026-09-29: `faction-stuff/sylvan/support.md`, `mage.md`). Numbers provisional (#58).
  grove_support_1: {
    id: "grove_support_1", name: "Grove support 1", faction: "grove", tier: 1,
    stats: { maxHp: 70, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "bloom" }, { id: "water", params: { power: 10 } }, ...kit("defend", "wait")],
  },
  // The Decay branch: weaker healing, corpses.
  decay_support_2: {
    id: "decay_support_2", name: "Decay support 2", faction: "grove", tier: 2,
    stats: { maxHp: 95, shield: 0, armor: 0, initiative: 45, abilityPower: 200 },
    abilities: [{ id: "witherbloom" }, ...kit("corpse_growth", "corpse_explosion"), { id: "shoot", params: { power: 6 } }, ...kit("defend", "wait")],
  },
  // The Spiritess branch (user, 2026-09-29): semi-HoT and Burst mend at tier 2; the Psychopomp adds Spiritwalk.
  spiritess_2: {
    id: "spiritess_2", name: "Spiritess 2", faction: "grove", tier: 2,
    stats: { maxHp: 95, shield: 0, armor: 0, initiative: 45, abilityPower: 200 },
    abilities: [...kit("spirit_bloom", "burst_mend"), { id: "water", params: { power: 5 } }, ...kit("defend", "wait")],
  },
  psychopomp: {
    id: "psychopomp", name: "Psychopomp", faction: "grove", tier: 3,
    stats: { maxHp: 130, shield: 0, armor: 0, initiative: 50, abilityPower: 300 },
    abilities: [...kit("spirit_bloom", "burst_mend", "spiritwalk"), { id: "water", params: { power: 5 } }, ...kit("defend", "wait")],
  },
  grove_mage_1: {
    id: "grove_mage_1", name: "Grove mage 1", faction: "grove", tier: 1,
    stats: { maxHp: 55, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: kit("cycle", "defend", "wait"),
  },
};
