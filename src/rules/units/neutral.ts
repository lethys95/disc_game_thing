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
    stats: { maxHp: 1500, shield: 0, damage: 80, armor: 25, initiative: 60, abilityPower: 100 },
    abilities: kit("attack", "defend", "wait"),
  },
  brigand: {
    id: "brigand", name: "Brigand", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 100, shield: 0, damage: 20, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: kit("attack", "stun_front", "defend", "wait"),
  },
  marauder: {
    id: "marauder", name: "Marauder", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 110, shield: 0, damage: 22, armor: 5, initiative: 45, abilityPower: 100 },
    abilities: kit("attack", "anti_armor", "defend", "wait"),
  },
  bandit: {
    id: "bandit", name: "Bandit", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 70, shield: 0, damage: 18, armor: 0, initiative: 70, abilityPower: 100 },
    abilities: kit("shoot", "defend", "wait"),
  },
  hedge_mage: {
    id: "hedge_mage", name: "Hedge Mage", faction: "neutral", tier: 1, damageType: "fire",
    stats: { maxHp: 50, shield: 0, damage: 20, armor: 0, initiative: 40, abilityPower: 100 },
    abilities: kit("area_2x2", "defend", "wait"),
  },
  // The gnoll tribe (Claude's pitch, accepted by the user 2026-10-04: `faction-stuff/neutrals/gnolls.md`). Numbers
  // provisional (#63).
  packstalker: {
    id: "packstalker", name: "Packstalker", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 95, shield: 0, damage: 20, armor: 0, initiative: 60, abilityPower: 100 },
    abilities: [{ id: "prey" }, ...kit("attack", "defend", "wait")],
  },
  bonecracker: {
    id: "bonecracker", name: "Bonecracker", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 125, shield: 0, damage: 24, armor: 3, initiative: 35, abilityPower: 100 },
    abilities: [{ id: "crack" }, ...kit("attack", "defend", "wait")],
  },
  hamstringer: {
    id: "hamstringer", name: "Hamstringer", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 65, shield: 0, damage: 16, armor: 0, initiative: 65, abilityPower: 100 },
    abilities: [{ id: "hamstring" }, ...kit("shoot", "defend", "wait")],
  },
  cackler: {
    id: "cackler", name: "Cackler", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 50, shield: 0, damage: 8, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "run_them_down" }, ...kit("cackle", "shoot", "defend", "wait")],
  },
  // Strong camps only: the pack's leader.
  matriarch: {
    id: "matriarch", name: "Matriarch", faction: "neutral", tier: 2, damageType: "weapon",
    stats: { maxHp: 260, shield: 0, damage: 42, armor: 5, initiative: 50, abilityPower: 125 },
    abilities: [{ id: "pecking_order" }, { id: "run_them_down" }, ...kit("attack", "defend", "wait")],
  },
  // The Drawn: moth-folk, Claude's own tribe (the user asked for one, 2026-10-04: `faction-stuff/neutrals/the-drawn.md`).
  // Not on the map yet. Numbers provisional (#64).
  dustwing: {
    id: "dustwing", name: "Dustwing", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 80, shield: 0, damage: 22, armor: 0, initiative: 55, abilityPower: 100 },
    abilities: [{ id: "dust" }, ...kit("flit", "defend", "wait")],
  },
  chrysalis: {
    id: "chrysalis", name: "Chrysalis", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 170, shield: 0, damage: 22, armor: 4, initiative: 35, abilityPower: 100 },
    abilities: [{ id: "metamorphosis" }, ...kit("defend", "wait")],
  },
  lightdrinker: {
    id: "lightdrinker", name: "Lightdrinker", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 60, shield: 0, damage: 12, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: kit("drink_light", "shoot", "defend", "wait"),
  },
  eyespot: {
    id: "eyespot", name: "Eyespot", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 65, shield: 0, damage: 14, armor: 0, initiative: 50, abilityPower: 100 },
    abilities: kit("mesmerize", "shoot", "defend", "wait"),
  },
  // Strong camps: the brood's mother.
  pale_mother: {
    id: "pale_mother", name: "Pale Mother", faction: "neutral", tier: 2, damageType: "weapon",
    stats: { maxHp: 240, shield: 0, damage: 34, armor: 3, initiative: 45, abilityPower: 125 },
    abilities: [{ id: "dust_veil" }, ...kit("flit", "open_the_eyes", "defend", "wait")],
  },
  // The carnival: the user's nomadic swindler tribe (2026-10-05, `faction-stuff/neutrals/carnival.md`). Not on the
  // map yet. Numbers provisional (#67).
  soothsayer: {
    id: "soothsayer", name: "Soothsayer", faction: "neutral", tier: 2, damageType: "weapon",
    stats: { maxHp: 150, shield: 0, damage: 55, armor: 0, initiative: 45, abilityPower: 125 },
    abilities: [{ id: "tarot", params: { cards: 5 } }, ...kit("foretell", "curse", "defend", "wait")],
  },
  omen: {
    id: "omen", name: "Omen", faction: "neutral", tier: 2, damageType: "weapon",
    stats: { maxHp: 130, shield: 0, damage: 40, armor: 0, initiative: 55, abilityPower: 125 },
    abilities: [{ id: "omen" }, ...kit("shoot", "defend", "wait")],
  },
  // The user, 2026-10-05: "very basic… Just high initiative and crit 4".
  cutpurse: {
    id: "cutpurse", name: "Cutpurse", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 75, shield: 0, damage: 18, armor: 0, initiative: 70, abilityPower: 100 },
    abilities: [{ id: "crit", params: { every: 4 } }, ...kit("attack", "defend", "wait")],
  },
  // The user, 2026-10-05: a backline support with potions.
  snakeoiler: {
    id: "snakeoiler", name: "Snakeoiler", faction: "neutral", tier: 1, damageType: "weapon",
    stats: { maxHp: 65, shield: 0, damage: 14, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: kit("healing_draught", "explosive_flask", "sleep_potion", "defend", "wait"),
  },
  fire_eater: {
    id: "fire_eater", name: "Fire Eater", faction: "neutral", tier: 1, damageType: "fire",
    stats: { maxHp: 105, shield: 0, damage: 18, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "ignite" }, ...kit("spit_fire", "defend", "wait")],
  },
};
