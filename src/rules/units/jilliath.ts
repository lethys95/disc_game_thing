import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";

/** The Jilliath melee line (docs/design/units/jilliath-melee-line.md, canon; numbers first-pass). */
export const JILLIATH_UNITS: Readonly<Record<string, UnitDef>> = {
  congregant: {
    id: "congregant", name: "Congregant", faction: "jilliath", tier: 1, damageType: "weapon",
    stats: { maxHp: 90, shield: 0, damage: 20, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "congregation"),
  },
  // The backline's tier 1 (user, 2026-09-26: "keep it simple"). Stats are provisional.
  cleric: {
    id: "cleric", name: "Cleric", faction: "jilliath", tier: 1, damageType: "weapon",
    stats: { maxHp: 70, shield: 0, damage: 10, armor: 0, initiative: 45 },
    // A weak attack of its own (user: not D2's attack-less healer).
    abilities: kit("mend", "shoot", "defend", "wait"),
  },
  jilliath_mage_1: {
    id: "jilliath_mage_1", name: "Jilliath mage 1", faction: "jilliath", tier: 1, damageType: "fire",
    stats: { maxHp: 60, shield: 0, damage: 25, armor: 0, initiative: 50 },
    abilities: kit("condemn", "defend", "wait"),
  },
  paladin: {
    id: "paladin", name: "Paladin", faction: "jilliath", tier: 2, damageType: "weapon",
    stats: { maxHp: 150, shield: 0, damage: 40, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "lay_on_hands"),
  },
  templar: {
    id: "templar", name: "Templar", faction: "jilliath", tier: 3, damageType: "weapon",
    stats: { maxHp: 200, shield: 0, damage: 60, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "lay_on_hands", "devotion_aura"),
  },
  immortal: {
    id: "immortal", name: "Immortal", faction: "jilliath", tier: 4, damageType: "weapon",
    stats: { maxHp: 260, shield: 0, damage: 80, armor: 20, initiative: 50 },
    abilities: [...kit("attack", "defend", "wait"), { id: "lay_on_hands", name: "Divine Lay on Hands", params: { charges: 2, allies: 1 } }, ...kit("devotion_aura", "guardian_spirit")],
  },
  zealot: {
    id: "zealot", name: "Zealot", faction: "jilliath", tier: 2, damageType: "weapon",
    stats: { maxHp: 180, shield: 0, damage: 70, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "must_attack", "zeal"),
  },
  punisher: {
    id: "punisher", name: "Punisher", faction: "jilliath", tier: 3, damageType: "weapon",
    stats: { maxHp: 200, shield: 0, damage: 45, armor: 0, initiative: 50 },
    abilities: kit("flail", "defend", "wait", "punishment"),
  },
  torturer: {
    id: "torturer", name: "Torturer", faction: "jilliath", tier: 4, damageType: "weapon",
    stats: { maxHp: 220, shield: 0, damage: 60, armor: 0, initiative: 50 },
    abilities: kit("flail", "defend", "wait", "hook", "punishment", "domination"),
  },
  fanatic: {
    id: "fanatic", name: "Fanatic", faction: "jilliath", tier: 3, damageType: "weapon",
    stats: { maxHp: 280, shield: 0, damage: 110, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "must_attack", "fanaticism", "hysteria"),
  },
  chosen: {
    id: "chosen", name: "Chosen", faction: "jilliath", tier: 4, damageType: "fire",
    stats: { maxHp: 320, shield: 0, damage: 150, armor: 0, initiative: 60 },
    abilities: kit("attack", "defend", "wait", "must_attack", "fanaticism", "hysteria"),
  },
  avatar_of_vengeance: {
    id: "avatar_of_vengeance", name: "Avatar of Vengeance", faction: "jilliath", tier: 5, damageType: "fire",
    stats: { maxHp: 400, shield: 0, damage: 150, armor: 0, initiative: 60 },
    abilities: kit("attack", "defend", "wait", "fanaticism_aura"),
  },
};
