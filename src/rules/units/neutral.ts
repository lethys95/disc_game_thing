import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/**
 * Neutral units: the user's bandits (docs/design/units/neutrals-bandits.md; stats provisional), the gnolls, and the Capitol
 * Guardian (canon: exists, never leaves the Capitol, its fall ends the game; stats provisional, tuned by simulation).
 */
export const NEUTRAL_UNITS: Readonly<Record<string, UnitDef>> = {
  capitol_guardian: {
    id: "capitol_guardian", name: "Capitol Guardian", faction: "neutral", tier: 0,
    // Provisional, tuned by simulation: beats early and most mid armies, falls to fully evolved ones.
    stats: { maxHp: 1500, shield: 0, armor: 25, initiative: 60, abilityPower: 100 },
    abilities: [{ id: "attack", params: { power: 80 } }, ...kit("defend", "wait")],
  },
  brigand: {
    id: "brigand", name: "Brigand", faction: "neutral", tier: 1,
    stats: { maxHp: 100, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "attack", params: { power: 20 } }, ...kit("stun_front", "defend", "wait")],
  },
  marauder: {
    id: "marauder", name: "Marauder", faction: "neutral", tier: 1,
    stats: { maxHp: 110, shield: 0, armor: 5, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "attack", params: { power: 22 } }, ...kit("anti_armor", "defend", "wait")],
  },
  bandit: {
    id: "bandit", name: "Bandit", faction: "neutral", tier: 1,
    stats: { maxHp: 70, shield: 0, armor: 0, initiative: 70, abilityPower: 100 },
    abilities: [{ id: "shoot", params: { power: 18 } }, ...kit("defend", "wait")],
  },
  hedge_mage: {
    id: "hedge_mage", name: "Hedge Mage", faction: "neutral", tier: 1,
    stats: { maxHp: 50, shield: 0, armor: 0, initiative: 40, abilityPower: 100 },
    abilities: [{ id: "area_2x2", params: { power: 20 }, damageType: "fire" }, ...kit("defend", "wait")],
  },
  // The gnoll tribe (Claude's pitch, accepted by the user 2026-10-04: `faction-stuff/neutrals/gnolls.md`). Numbers
  // provisional (#63).
  packstalker: {
    id: "packstalker", name: "Packstalker", faction: "neutral", tier: 1,
    stats: { maxHp: 95, shield: 0, armor: 0, initiative: 60, abilityPower: 100 },
    abilities: [{ id: "prey" }, { id: "attack", params: { power: 20 } }, ...kit("defend", "wait")],
  },
  bonecracker: {
    id: "bonecracker", name: "Bonecracker", faction: "neutral", tier: 1,
    stats: { maxHp: 125, shield: 0, armor: 3, initiative: 35, abilityPower: 100 },
    abilities: [{ id: "crack" }, { id: "attack", params: { power: 24 } }, ...kit("defend", "wait")],
  },
  hamstringer: {
    id: "hamstringer", name: "Hamstringer", faction: "neutral", tier: 1,
    stats: { maxHp: 65, shield: 0, armor: 0, initiative: 65, abilityPower: 100 },
    abilities: [{ id: "hamstring" }, { id: "shoot", params: { power: 16 } }, ...kit("defend", "wait")],
  },
  cackler: {
    id: "cackler", name: "Cackler", faction: "neutral", tier: 1,
    stats: { maxHp: 50, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "run_them_down" }, { id: "cackle" }, { id: "shoot", params: { power: 8 } }, ...kit("defend", "wait")],
  },
  // Strong camps only: the pack's leader.
  matriarch: {
    id: "matriarch", name: "Matriarch", faction: "neutral", tier: 2,
    stats: { maxHp: 260, shield: 0, armor: 5, initiative: 50, abilityPower: 200 },
    abilities: [{ id: "pecking_order" }, { id: "run_them_down" }, { id: "attack", params: { power: 21 } }, ...kit("defend", "wait")],
  },
  // The Drawn: moth-folk, Claude's own tribe (the user asked for one, 2026-10-04: `faction-stuff/neutrals/the-drawn.md`).
  // Not on the map yet. Numbers provisional (#64).
  dustwing: {
    id: "dustwing", name: "Dustwing", faction: "neutral", tier: 1,
    stats: { maxHp: 80, shield: 0, armor: 0, initiative: 55, abilityPower: 100 },
    abilities: [{ id: "dust" }, { id: "flit", params: { power: 22 } }, ...kit("defend", "wait")],
  },
  chrysalis: {
    id: "chrysalis", name: "Chrysalis", faction: "neutral", tier: 1,
    stats: { maxHp: 170, shield: 0, armor: 4, initiative: 35, abilityPower: 100 },
    abilities: [{ id: "metamorphosis" }, ...kit("defend", "wait")],
  },
  lightdrinker: {
    id: "lightdrinker", name: "Lightdrinker", faction: "neutral", tier: 1,
    stats: { maxHp: 60, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "drink_light" }, { id: "shoot", params: { power: 12 } }, ...kit("defend", "wait")],
  },
  eyespot: {
    id: "eyespot", name: "Eyespot", faction: "neutral", tier: 1,
    stats: { maxHp: 65, shield: 0, armor: 0, initiative: 50, abilityPower: 100 },
    abilities: [{ id: "mesmerize" }, { id: "shoot", params: { power: 14 } }, ...kit("defend", "wait")],
  },
  // Strong camps: the brood's mother.
  pale_mother: {
    id: "pale_mother", name: "Pale Mother", faction: "neutral", tier: 2,
    stats: { maxHp: 240, shield: 0, armor: 3, initiative: 45, abilityPower: 200 },
    abilities: [{ id: "dust_veil" }, { id: "flit", params: { power: 17 } }, ...kit("open_the_eyes", "defend", "wait")],
  },
  // The carnival: the user's nomadic swindler tribe (2026-10-05, `faction-stuff/neutrals/carnival.md`). Not on the
  // map yet. Numbers provisional (#67).
  soothsayer: {
    id: "soothsayer", name: "Soothsayer", faction: "neutral", tier: 2,
    stats: { maxHp: 150, shield: 0, armor: 0, initiative: 45, abilityPower: 200 },
    abilities: [{ id: "tarot", params: { cards: 5 } }, { id: "foretell", params: { power: 28 } }, ...kit("curse", "defend", "wait")],
  },
  omen: {
    id: "omen", name: "Omen", faction: "neutral", tier: 2,
    stats: { maxHp: 130, shield: 0, armor: 0, initiative: 55, abilityPower: 200 },
    abilities: [{ id: "omen" }, { id: "shoot", params: { power: 20 } }, ...kit("defend", "wait")],
  },
  // The user, 2026-10-05: "very basic… Just high initiative and crit 4".
  cutpurse: {
    id: "cutpurse", name: "Cutpurse", faction: "neutral", tier: 1,
    stats: { maxHp: 75, shield: 0, armor: 0, initiative: 70, abilityPower: 100 },
    abilities: [{ id: "crit", params: { every: 4 } }, { id: "attack", params: { power: 18 } }, ...kit("defend", "wait")],
  },
  // The user, 2026-10-05: a backline support with potions.
  snakeoiler: {
    id: "snakeoiler", name: "Snakeoiler", faction: "neutral", tier: 1,
    stats: { maxHp: 65, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: kit("healing_draught", "explosive_flask", "sleep_potion", "defend", "wait"),
  },
  fire_eater: {
    id: "fire_eater", name: "Fire Eater", faction: "neutral", tier: 1,
    stats: { maxHp: 105, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    abilities: [{ id: "ignite" }, { id: "spit_fire", params: { power: 18 } }, ...kit("defend", "wait")],
  },
};
