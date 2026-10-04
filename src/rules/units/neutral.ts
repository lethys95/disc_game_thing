import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/**
 * Neutral units: the user's bandits (docs/design/units/neutrals-bandits.md; stats provisional), the gnolls, and the Capitol
 * Guardian (canon: exists, never leaves the Capitol, its fall ends the game; stats provisional, tuned by simulation).
 */
export const NEUTRAL_UNITS: Readonly<Record<string, UnitDef>> = {
  capitol_guardian: {
    id: "capitol_guardian", name: "Capitol Guardian", faction: "neutral", tier: 0, damageType: "weapon",
    // Provisional, tuned by simulation: beats early and most mid armies, falls to fully evolved ones.
    stats: { maxHp: 1500, shield: 0, damage: 80, armor: 25, initiative: 60 },
    abilities: kit("attack", "defend", "wait"),
  },
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
  // The gnoll tribe (Claude's pitch, accepted by the user 2026-10-04: `faction-stuff/neutrals/gnolls.md`). Numbers
  // provisional (#63).
  packstalker: {
    id: "packstalker", name: "Packstalker", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 95, shield: 0, damage: 20, armor: 0, initiative: 60 },
    abilities: [{ id: "prey" }, ...kit("attack", "defend", "wait")],
  },
  bonecracker: {
    id: "bonecracker", name: "Bonecracker", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 125, shield: 0, damage: 24, armor: 3, initiative: 35 },
    abilities: [{ id: "crack" }, ...kit("attack", "defend", "wait")],
  },
  hamstringer: {
    id: "hamstringer", name: "Hamstringer", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 65, shield: 0, damage: 16, armor: 0, initiative: 65 },
    abilities: [{ id: "hamstring" }, ...kit("shoot", "defend", "wait")],
  },
  cackler: {
    id: "cackler", name: "Cackler", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 50, shield: 0, damage: 8, armor: 0, initiative: 45 },
    abilities: [{ id: "run_them_down" }, ...kit("cackle", "shoot", "defend", "wait")],
  },
  // Strong camps only: the pack's leader.
  matriarch: {
    id: "matriarch", name: "Matriarch", faction: "neutral", tier: 2, damageType: "weapon",
    stats: { maxHp: 260, shield: 0, damage: 42, armor: 5, initiative: 50 },
    abilities: [{ id: "pecking_order" }, { id: "run_them_down" }, ...kit("attack", "defend", "wait")],
  },
};
