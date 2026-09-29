import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/**
 * The Grove (Sylvan): its melee line, the user's design (2026-09-29, `faction-stuff/sylvan/melee.md`). Names are
 * placeholders until the user names them; stats are provisional (`provisional.md` #57).
 */
export const GROVE_UNITS: Readonly<Record<string, UnitDef>> = {
  grove_melee_1: {
    id: "grove_melee_1", name: "Grove melee 1", faction: "grove", tier: 1, damageType: "weapon",
    stats: { maxHp: 121, shield: 0, damage: 24, armor: 0, initiative: 45 },
    abilities: [{ id: "regrowth", params: { percent: 6 } }, ...kit("attack", "defend", "wait")],
  },
  regrowth_2: {
    id: "regrowth_2", name: "Regrowth 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 192, shield: 0, damage: 43, armor: 0, initiative: 45 },
    abilities: [{ id: "regrowth", params: { percent: 12 } }, ...kit("attack", "defend", "wait")],
  },
  // The user: no regeneration on the decay branch; tankier, and it needs a support backline.
  decay_2: {
    id: "decay_2", name: "Decay 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 190, shield: 0, damage: 38, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 40 } }, ...kit("attack", "defend", "wait")],
  },
  // "Would probably not attack as much": a weak attack; mends and shelters instead.
  regrowth_3: {
    id: "regrowth_3", name: "Regrowth 3", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 260, shield: 0, damage: 32, armor: 0, initiative: 50 },
    abilities: [{ id: "regrowth", params: { percent: 12 } }, { id: "grove_mend", params: { amount: 40 } }, ...kit("attack", "defend", "wait")],
  },
  decay_3: {
    id: "decay_3", name: "Decay 3", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 390, shield: 0, damage: 76, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 50 } }, { id: "withering" }, ...kit("attack", "defend", "wait")],
  },
  // The user (2026-09-29): the Decay line's win condition, late game. Numbers provisional (#57).
  decay_4: {
    id: "decay_4", name: "Decay 4", faction: "grove", tier: 4, damageType: "weapon",
    stats: { maxHp: 376, shield: 0, damage: 72, armor: 0, initiative: 45 },
    abilities: [{ id: "decay", params: { percent: 55 } }, { id: "withering" }, { id: "lash_out" }, ...kit("attack", "defend", "wait")],
  },
};
