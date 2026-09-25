import type { UnitDef } from "#rules/types";

const kit = (...ids: string[]) => ids.map((id) => ({ id }));

/**
 * The Jilliath melee line (docs/design/units/jilliath-melee-line.md, canon), plus the Capitol Guardian:
 * canon says it exists, never leaves the Capitol and ends the game when it falls; its stats are provisional.
 */
export const UNITS: Readonly<Record<string, UnitDef>> = {
  capitol_guardian: {
    id: "capitol_guardian", name: "Capitol Guardian", tier: 0, damageType: "weapon",
    // Provisional, tuned by simulation: beats early and most mid armies, falls to fully evolved ones.
    stats: { maxHp: 1500, damage: 80, armor: 25, initiative: 60 },
    abilities: kit("attack", "defend", "wait"),
  },
  congregant: {
    id: "congregant", name: "Congregant", tier: 1, damageType: "weapon",
    stats: { maxHp: 90, damage: 20, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "congregation"),
  },
  paladin: {
    id: "paladin", name: "Paladin", tier: 2, damageType: "weapon",
    stats: { maxHp: 150, damage: 40, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "lay_on_hands"),
  },
  templar: {
    id: "templar", name: "Templar", tier: 3, damageType: "weapon",
    stats: { maxHp: 200, damage: 60, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "lay_on_hands", "devotion_aura"),
  },
  immortal: {
    id: "immortal", name: "Immortal", tier: 4, damageType: "weapon",
    stats: { maxHp: 260, damage: 80, armor: 20, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "divine_lay_on_hands", "devotion_aura", "guardian_spirit"),
  },
  zealot: {
    id: "zealot", name: "Zealot", tier: 2, damageType: "weapon",
    stats: { maxHp: 180, damage: 70, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "must_attack", "zeal"),
  },
  punisher: {
    id: "punisher", name: "Punisher", tier: 3, damageType: "weapon",
    stats: { maxHp: 200, damage: 45, armor: 0, initiative: 50 },
    abilities: kit("flail", "defend", "wait", "punishment"),
  },
  torturer: {
    id: "torturer", name: "Torturer", tier: 4, damageType: "weapon",
    stats: { maxHp: 220, damage: 60, armor: 0, initiative: 50 },
    abilities: kit("flail", "defend", "wait", "hook", "punishment", "domination"),
  },
  fanatic: {
    id: "fanatic", name: "Fanatic", tier: 3, damageType: "weapon",
    stats: { maxHp: 280, damage: 110, armor: 0, initiative: 50 },
    abilities: kit("attack", "defend", "wait", "must_attack", "fanaticism", "hysteria"),
  },
  chosen: {
    id: "chosen", name: "Chosen", tier: 4, damageType: "fire",
    stats: { maxHp: 320, damage: 150, armor: 0, initiative: 60 },
    abilities: kit("attack", "defend", "wait", "must_attack", "fanaticism", "hysteria"),
  },
  avatar_of_vengeance: {
    id: "avatar_of_vengeance", name: "Avatar of Vengeance", tier: 5, damageType: "fire",
    stats: { maxHp: 400, damage: 150, armor: 0, initiative: 60 },
    abilities: kit("attack", "defend", "wait", "fanaticism_aura"),
  },
};

export const GUARDIAN_ID = "capitol_guardian";

/** Units that can be bought: tier 1 only, as in D2; higher tiers come from evolution (M4). */
export const RECRUITS: readonly string[] = ["congregant"];

/** Canon: the Congregant costs 40 gold. */
export const RECRUIT_COST: Readonly<Record<string, number>> = { congregant: 40 };

/** A fork a faction commits to once, for good (branch investment, docs/design/pillars.md). */
export type Branch = "preserve" | "consume" | "punishment" | "sacrifice";

export interface Evolution {
  readonly to: string;
  /** The branch the faction must have invested in; null where the line doesn't fork. */
  readonly requires: Branch | null;
}

/** The canon Jilliath melee tree (docs/design/units/jilliath-melee-line.md). */
export const EVOLUTIONS: Readonly<Record<string, readonly Evolution[]>> = {
  congregant: [{ to: "paladin", requires: "preserve" }, { to: "zealot", requires: "consume" }],
  paladin: [{ to: "templar", requires: null }],
  templar: [{ to: "immortal", requires: null }],
  zealot: [{ to: "punisher", requires: "punishment" }, { to: "fanatic", requires: "sacrifice" }],
  punisher: [{ to: "torturer", requires: null }],
  fanatic: [{ to: "chosen", requires: null }],
  chosen: [{ to: "avatar_of_vengeance", requires: null }],
};
