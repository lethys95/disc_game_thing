import type { EffectSeed } from "#rules/battle/types";
import type { Playable } from "#rules/units/index";
import { FACTIONS } from "#rules/factions";
import type { ManaColor } from "#rules/factions";

/**
 * Overworld spells (pillars.md, "Spells": cast on the map, HoMM3-ish, paid in typed mana, not combat abilities;
 * targets an ally, an enemy, an empty tile or an area). The system is canon; **every spell here is a provisional
 * placeholder** following each faction's direction (factions/*.md: Jilliath targets infrastructure, Ral-Vitahl
 * mostly nukes) until the user designs the real ones (questions.md). Names are plain descriptions, not lore.
 */

export const MANA_NAMES: Readonly<Record<ManaColor, string>> = { red: "red mana", teal: "teal mana" };

/** What a spell can be aimed at: someone else's group (a warband, or neutrals in a lair), one of yours, a city, or an area. */
export type SpellTarget = "enemyGroup" | "ownWarband" | "enemyCity" | "area";

/** What a spell does, as data: the world applies it, whatever the spell. */
export type SpellEffect =
  /** Every unit hit loses this much HP, and may die of it (`world/spells.ts`). */
  | { readonly kind: "damage"; readonly amount: number }
  /** An effect every unit of the target brings into its battles for a number of turns. */
  | { readonly kind: "enchant"; readonly effect: EffectSeed; readonly turns: number };

export interface SpellDef {
  readonly id: string;
  readonly name: string;
  /** A faction's spells are learned at its Capitol; neutral ones are bought from a mage merchant. */
  readonly faction: Playable | "neutral";
  /** "own": cast with the caster's own faction color (neutral spells). */
  readonly mana: ManaColor | "own";
  /** Mana per cast. */
  readonly cost: number;
  /** Gold to learn it, at the Capitol or a mage merchant (a spell tree comes later, pillars.md). */
  readonly learnCost: number;
  readonly target: SpellTarget;
  /** For area spells: how far around the chosen hex it reaches. */
  readonly radius: number;
  readonly effect: SpellEffect;
  readonly describe: string;
}

export const SPELLS: readonly SpellDef[] = [
  {
    id: "break_walls",
    name: "Break walls",
    faction: "jilliath",
    mana: "red",
    cost: 60,
    learnCost: 200,
    target: "enemyCity",
    radius: 0,
    effect: { kind: "enchant", effect: { def: "sundered", amount: 4 }, turns: 3 },
    describe: "An enemy or neutral city in sight: its defenders fight with 4 less armor for 3 turns.",
  },
  {
    id: "bless_warband",
    name: "Bless warband",
    faction: "jilliath",
    mana: "red",
    cost: 45,
    learnCost: 150,
    target: "ownWarband",
    radius: 0,
    effect: { kind: "enchant", effect: { def: "extra_damage", amount: 10 }, turns: 2 },
    describe: "One of your warbands: its units deal 10 more damage in battles for 2 turns.",
  },
  {
    id: "lightning_strike",
    name: "Lightning strike",
    faction: "nexus",
    mana: "teal",
    cost: 45,
    learnCost: 150,
    target: "enemyGroup",
    radius: 0,
    effect: { kind: "damage", amount: 30 },
    describe: "An enemy warband or neutral group in sight: each of its units loses 30 HP.",
  },
  {
    id: "lightning_storm",
    name: "Lightning storm",
    faction: "nexus",
    mana: "teal",
    cost: 75,
    learnCost: 250,
    target: "area",
    radius: 1,
    effect: { kind: "damage", amount: 15 },
    describe: "A hex in sight and its neighbours: every unit of every enemy warband and neutral group there loses 15 HP.",
  },
  // Sold by mage merchants (user, 2026-09-27); plain placeholders (#54).
  {
    id: "firebolt",
    name: "Firebolt",
    faction: "neutral",
    mana: "own",
    cost: 40,
    learnCost: 200,
    target: "enemyGroup",
    radius: 0,
    effect: { kind: "damage", amount: 20 },
    describe: "An enemy warband or neutral group in sight: each of its units loses 20 HP.",
  },
  {
    id: "harden_warband",
    name: "Harden warband",
    faction: "neutral",
    mana: "own",
    cost: 40,
    learnCost: 200,
    target: "ownWarband",
    radius: 0,
    effect: { kind: "enchant", effect: { def: "extra_armor", amount: 5 }, turns: 2 },
    describe: "One of your warbands: its units have 5 more armor in battles for 2 turns.",
  },
];

export function spellById(id: string): SpellDef {
  const spell = SPELLS.find((s) => s.id === id);
  if (!spell) throw new Error(`unknown spell: ${id}`);
  return spell;
}

export const spellsOf = (faction: Playable | "neutral"): SpellDef[] => SPELLS.filter((s) => s.faction === faction);

/** The mana color a player of `faction` pays this spell in. */
export const manaColorOf = (spell: SpellDef, faction: Playable): ManaColor => (spell.mana === "own" ? FACTIONS[faction].mana : spell.mana);
