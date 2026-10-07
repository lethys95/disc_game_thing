import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/** The Jilliath melee line (docs/design/units/jilliath-melee-line.md, canon; numbers first-pass). */
export const JILLIATH_UNITS: Readonly<Record<string, UnitDef>> = {
  congregant: {
    id: "congregant", name: "Congregant", faction: "jilliath", tier: 1,
    stats: { maxHp: 90, shield: 0, armor: 0, initiative: 50, abilityPower: 100 },
    abilities: [{ id: "attack", params: { power: 20 } }, ...kit("defend", "wait", "congregation")],
  },
  // The backline's tier 1 (user, 2026-09-26: "keep it simple"). Stats are provisional.
  cleric: {
    id: "cleric", name: "Cleric", faction: "jilliath", tier: 1,
    stats: { maxHp: 70, shield: 0, armor: 0, initiative: 45, abilityPower: 100 },
    // A weak attack of its own (user: not D2's attack-less healer).
    abilities: [{ id: "mend" }, { id: "shoot", params: { power: 10 } }, ...kit("defend", "wait")],
  },
  jilliath_mage_1: {
    id: "jilliath_mage_1", name: "Jilliath mage 1", faction: "jilliath", tier: 1,
    stats: { maxHp: 60, shield: 0, armor: 0, initiative: 50, abilityPower: 100 },
    abilities: [{ id: "condemn", params: { power: 25 }, damageType: "fire" }, ...kit("defend", "wait")],
  },
  // The mage line past tier 1 (faction-stuff/jilliath/mage.md): faith is holy damage, fanaticism fire and stacking
  // burn. Every tier keeps the last one's spells. Names other than the Doomsayer's are placeholders; stats provisional.
  jilliath_holy_2: {
    id: "jilliath_holy_2", name: "Holy mage 2", faction: "jilliath", tier: 2,
    stats: { maxHp: 75, shield: 0, armor: 0, initiative: 50, abilityPower: 200 },
    abilities: [{ id: "castigation" }, ...kit("defend", "wait")],
  },
  jilliath_holy_3: {
    id: "jilliath_holy_3", name: "Holy mage 3", faction: "jilliath", tier: 3,
    stats: { maxHp: 90, shield: 0, armor: 0, initiative: 50, abilityPower: 300 },
    abilities: [{ id: "castigation" }, ...kit("repentance", "defend", "wait")],
  },
  jilliath_holy_4: {
    id: "jilliath_holy_4", name: "Holy mage 4", faction: "jilliath", tier: 4,
    stats: { maxHp: 105, shield: 0, armor: 0, initiative: 50, abilityPower: 400 },
    abilities: [{ id: "castigation" }, ...kit("judgement", "repentance", "defend", "wait")],
  },
  doomsayer: {
    id: "doomsayer", name: "Doomsayer", faction: "jilliath", tier: 2,
    stats: { maxHp: 75, shield: 0, armor: 0, initiative: 50, abilityPower: 200 },
    abilities: [{ id: "condemn", params: { power: 25 }, damageType: "fire" }, { id: "burn_at_the_stake" }, { id: "ignite", params: { burn: 5 } }, ...kit("defend", "wait")],
  },
  jilliath_fire_3: {
    id: "jilliath_fire_3", name: "Fire mage 3", faction: "jilliath", tier: 3,
    stats: { maxHp: 90, shield: 0, armor: 0, initiative: 50, abilityPower: 300 },
    abilities: [{ id: "condemn", params: { power: 25 }, damageType: "fire" }, ...kit("fire_on_all", "burn_at_the_stake"), { id: "ignite", params: { burn: 3 } }, ...kit("defend", "wait")],
  },
  jilliath_fire_4: {
    id: "jilliath_fire_4", name: "Fire mage 4", faction: "jilliath", tier: 4,
    stats: { maxHp: 105, shield: 0, armor: 0, initiative: 50, abilityPower: 400 },
    abilities: [{ id: "condemn", params: { power: 25 }, damageType: "fire" }, ...kit("fire_on_all", "detonate", "burn_at_the_stake"), { id: "ignite", params: { burn: 3 } }, ...kit("defend", "wait")],
  },
  // The martyrdom caster: its own branch at tier 4 (the user, 2026-10-06). More health, to carry the backfire.
  jilliath_martyr_4: {
    id: "jilliath_martyr_4", name: "Martyr mage 4", faction: "jilliath", tier: 4,
    stats: { maxHp: 160, shield: 0, armor: 0, initiative: 50, abilityPower: 400 },
    abilities: [{ id: "condemn", params: { power: 25 }, damageType: "fire" }, ...kit("beam", "fire_on_all", "burn_at_the_stake"), { id: "ignite", params: { burn: 3 } }, ...kit("fanaticism", "defend", "wait")],
  },
  paladin: {
    id: "paladin", name: "Paladin", faction: "jilliath", tier: 2,
    stats: { maxHp: 150, shield: 0, armor: 20, initiative: 50, abilityPower: 200 },
    abilities: [{ id: "attack", params: { power: 20 } }, ...kit("defend", "wait", "lay_on_hands")],
  },
  templar: {
    id: "templar", name: "Templar", faction: "jilliath", tier: 3,
    stats: { maxHp: 200, shield: 0, armor: 20, initiative: 50, abilityPower: 300 },
    abilities: [{ id: "attack", params: { power: 20 } }, ...kit("defend", "wait", "lay_on_hands", "devotion_aura")],
  },
  immortal: {
    id: "immortal", name: "Immortal", faction: "jilliath", tier: 4,
    stats: { maxHp: 260, shield: 0, armor: 20, initiative: 50, abilityPower: 400 },
    abilities: [{ id: "attack", params: { power: 20 } }, ...kit("defend", "wait"), { id: "lay_on_hands", name: "Divine Lay on Hands", params: { charges: 2, allies: 1 } }, ...kit("devotion_aura", "guardian_spirit")],
  },
  zealot: {
    id: "zealot", name: "Zealot", faction: "jilliath", tier: 2,
    stats: { maxHp: 180, shield: 0, armor: 0, initiative: 50, abilityPower: 200 },
    abilities: [{ id: "attack", params: { power: 35 } }, ...kit("defend", "wait", "must_attack", "zeal")],
  },
  punisher: {
    id: "punisher", name: "Punisher", faction: "jilliath", tier: 3,
    stats: { maxHp: 200, shield: 0, armor: 0, initiative: 50, abilityPower: 300 },
    abilities: [{ id: "flail", params: { power: 15 } }, ...kit("defend", "wait", "punishment")],
  },
  torturer: {
    id: "torturer", name: "Torturer", faction: "jilliath", tier: 4,
    stats: { maxHp: 220, shield: 0, armor: 0, initiative: 50, abilityPower: 400 },
    abilities: [{ id: "flail", params: { power: 15 } }, ...kit("defend", "wait", "hook", "punishment", "domination")],
  },
  fanatic: {
    id: "fanatic", name: "Fanatic", faction: "jilliath", tier: 3,
    stats: { maxHp: 280, shield: 0, armor: 0, initiative: 50, abilityPower: 300 },
    abilities: [{ id: "attack", params: { power: 37 } }, ...kit("defend", "wait", "must_attack", "fanaticism", "hysteria")],
  },
  chosen: {
    id: "chosen", name: "Chosen", faction: "jilliath", tier: 4,
    stats: { maxHp: 320, shield: 0, armor: 0, initiative: 60, abilityPower: 400 },
    abilities: [{ id: "attack", params: { power: 38 }, damageType: "fire" }, ...kit("defend", "wait", "must_attack", "fanaticism", "hysteria")],
  },
  avatar_of_vengeance: {
    id: "avatar_of_vengeance", name: "Avatar of Vengeance", faction: "jilliath", tier: 5,
    stats: { maxHp: 400, shield: 0, armor: 0, initiative: 60, abilityPower: 500 },
    abilities: [{ id: "attack", params: { power: 30 }, damageType: "fire" }, ...kit("defend", "wait", "fanaticism_aura")],
  },
};
