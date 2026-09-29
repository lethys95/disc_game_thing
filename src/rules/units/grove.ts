import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/**
 * The Grove (Sylvan): its melee line, the user's design (2026-09-29, `faction-stuff/sylvan/melee.md`). Names are
 * placeholders until the user names them; stats are provisional (`provisional.md` #57).
 */
export const GROVE_UNITS: Readonly<Record<string, UnitDef>> = {
  grove_melee_1: {
    id: "grove_melee_1", name: "Grove melee 1", faction: "grove", tier: 1, damageType: "weapon",
    stats: { maxHp: 110, shield: 0, damage: 20, armor: 0, initiative: 35 },
    abilities: [{ id: "regrowth", params: { percent: 6 } }, ...kit("attack", "defend", "wait")],
  },
  regrowth_2: {
    id: "regrowth_2", name: "Regrowth 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 150, shield: 0, damage: 28, armor: 0, initiative: 40 },
    abilities: [{ id: "regrowth", params: { percent: 10 } }, ...kit("attack", "defend", "wait")],
  },
  // The user: no regeneration on the decay branch; tankier, and it needs a support backline.
  decay_2: {
    id: "decay_2", name: "Decay 2", faction: "grove", tier: 2, damageType: "weapon",
    stats: { maxHp: 175, shield: 0, damage: 28, armor: 0, initiative: 35 },
    abilities: [{ id: "decay", params: { percent: 40 } }, ...kit("attack", "defend", "wait")],
  },
  // "Would probably not attack as much": a weak attack; mends and shelters instead.
  regrowth_3: {
    id: "regrowth_3", name: "Regrowth 3", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 180, shield: 0, damage: 18, armor: 0, initiative: 45 },
    abilities: [{ id: "regrowth", params: { percent: 10 } }, { id: "grove_mend" }, ...kit("attack", "defend", "wait")],
  },
  decay_3: {
    id: "decay_3", name: "Decay 3", faction: "grove", tier: 3, damageType: "weapon",
    stats: { maxHp: 210, shield: 0, damage: 32, armor: 0, initiative: 35 },
    abilities: [{ id: "decay", params: { percent: 50 } }, { id: "withering" }, ...kit("attack", "defend", "wait")],
  },
};
