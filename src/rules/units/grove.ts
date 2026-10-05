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
    id: "sproutling", name: "Sproutling", faction: "grove", tier: 1, damageType: "weapon",
    stats: { maxHp: 121, shield: 0, damage: 24, armor: 0, initiative: 45 },
    abilities: [{ id: "regrowth", params: { percent: 6 } }, ...kit("attack", "defend", "wait")],
  },
  regrowth_2: {
    id: "regrowth_2", name: "Regrowth 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 192, shield: 0, damage: 48, armor: 0, initiative: 45 },
    abilities: [{ id: "regrowth", params: { percent: 15 } }, ...kit("attack", "defend", "wait")],
  },
  // The user: no regeneration on the decay branch; tankier, and it needs a support backline.
  moldling: {
    id: "moldling", name: "Moldling", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 210, shield: 0, damage: 46, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 40 } }, ...kit("attack", "defend", "wait")],
  },
  // "Would probably not attack as much": a weak attack; mends and shelters instead.
  regrowth_3: {
    id: "regrowth_3", name: "Regrowth 3", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 260, shield: 0, damage: 32, armor: 0, initiative: 50 },
    abilities: [{ id: "regrowth", params: { percent: 12 } }, { id: "grove_mend", params: { amount: 40 } }, ...kit("attack", "defend", "wait")],
  },
  deadwood: {
    id: "deadwood", name: "Deadwood", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 390, shield: 0, damage: 76, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 50 } }, { id: "withering" }, ...kit("attack", "defend", "wait")],
  },
  // The user (2026-09-29): the Decay line's win condition, late game. Numbers provisional (#57).
  bog_giant: {
    id: "bog_giant", name: "Bog Giant", faction: "grove", tier: 4, damageType: "weapon",
    stats: { maxHp: 376, shield: 0, damage: 72, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 55 } }, { id: "withering" }, { id: "lash_out" }, ...kit("attack", "defend", "wait")],
  },
  // The user (2026-10-04): the Decay line forks again after the Deadwood; a plant skeleton that feeds on the dead.
  // It keeps the line's decay and withering (Claude's reading). End of the line. Numbers provisional (#57).
  mulch_gorger: {
    id: "mulch_gorger", name: "Mulch Gorger", faction: "grove", tier: 4, damageType: "weapon",
    stats: { maxHp: 376, shield: 0, damage: 66, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 50 } }, { id: "withering" }, { id: "gorge" }, ...kit("attack", "defend", "wait")],
  },
  // The backline (user, 2026-09-29: `faction-stuff/sylvan/support.md`, `mage.md`). Numbers provisional (#58).
  grove_support_1: {
    id: "grove_support_1", name: "Grove support 1", faction: "grove", tier: 1, damageType: "weapon",
    stats: { maxHp: 70, shield: 0, damage: 10, armor: 0, initiative: 45 },
    abilities: kit("bloom", "water", "defend", "wait"),
  },
  // The Decay branch: weaker healing, corpses.
  decay_support_2: {
    id: "decay_support_2", name: "Decay support 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 95, shield: 0, damage: 12, armor: 0, initiative: 45 },
    abilities: [{ id: "bloom", params: { amount: 8 } }, ...kit("corpse_growth", "corpse_explosion", "shoot", "defend", "wait")],
  },
  // The Spiritess branch (user, 2026-09-29): semi-HoT and Burst mend at tier 2; the Psychopomp adds Spiritwalk.
  spiritess_2: {
    id: "spiritess_2", name: "Spiritess 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 95, shield: 0, damage: 10, armor: 0, initiative: 45 },
    abilities: [{ id: "spirit_bloom", params: { heal: 35 } }, ...kit("burst_mend", "water", "defend", "wait")],
  },
  psychopomp: {
    id: "psychopomp", name: "Psychopomp", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 130, shield: 0, damage: 14, armor: 0, initiative: 50 },
    abilities: [{ id: "spirit_bloom", params: { heal: 40, amount: 15 } }, ...kit("burst_mend", "spiritwalk", "water", "defend", "wait")],
  },
  grove_mage_1: {
    id: "grove_mage_1", name: "Grove mage 1", faction: "grove", tier: 1, damageType: "weapon",
    stats: { maxHp: 55, shield: 0, damage: 8, armor: 0, initiative: 45 },
    abilities: kit("cycle", "defend", "wait"),
  },
};
