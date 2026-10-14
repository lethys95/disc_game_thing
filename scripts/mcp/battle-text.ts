import { BEHAVIORS, describeAbility } from "#rules/abilities/index";
import { abilityRef, applyAction, effectiveStatsOf, legalActions, unitAbilities, upcomingSlots } from "#rules/battle/engine";
import type { AbilityRef, Action, Battle, BattleEvent, BattleUnit, Enhancement, LegalAbility, Side, Stats } from "#rules/battle/types";
import { describeReward, describeTask } from "#rules/battle/tarot";
import { effectDef } from "#rules/effects";
import { asKnown } from "#view/secrecy";

/** A battle as one side sees it, in words: the field, whose turn it is, and the orders it can give. */

const ROW_NAMES = ["front", "middle", "back"] as const;

/** A unit's place in its grid: F1 is the front row's first column, B3 the back row's last. */
const place = (unit: BattleUnit): string => `${"FMB"[unit.tile.row] ?? "?"}${unit.tile.col + 1}`;

const whose = (unit: BattleUnit, side: Side) => (unit.side === side ? "your" : "enemy");

export const unitLabel = (unit: BattleUnit, side: Side): string => `${whose(unit, side)} ${unit.name} [${place(unit)}]`;

function unitLine(unit: BattleUnit, stats: Stats | undefined, current: boolean): string {
  if (!unit.alive) return `[${place(unit)}] ${unit.name}: ${unit.fled ? "fled" : "dead"}`;
  const parts = [`${unit.hp}/${stats?.maxHp ?? unit.base.maxHp} HP`];
  if (unit.shield > 0) parts.push(`shield ${unit.shield}`);
  if (stats && stats.armor > 0) parts.push(`armor ${stats.armor}`);
  parts.push(`init ${stats?.initiative ?? unit.base.initiative}`);
  if (unit.base.abilityPower !== 100 || (stats && stats.abilityPower !== unit.base.abilityPower)) parts.push(`power ${stats?.abilityPower ?? unit.base.abilityPower}%`);
  if (unit.spellCharges > 0) parts.push(`${unit.spellCharges} spell charges`);
  const effects = unit.effects.filter((e) => !effectDef(e.def).quiet).map((e) => `${effectDef(e.def).name}${e.stacks > 1 ? ` x${e.stacks}` : ""}`);
  if (effects.length > 0) parts.push(`effects: ${effects.join(", ")}`);
  return `[${place(unit)}]${unit.leader ? " (leader)" : ""} ${unit.name}: ${parts.join(", ")}${current ? "  <- acting now" : ""}`;
}

function sideBlock(battle: Battle, side: Side, title: string, viewer: Side, stats: Record<string, Stats>): string[] {
  const units = Object.values(battle.units).filter((u) => u.side === side);
  const lines = [title];
  for (const row of [0, 1, 2] as const) {
    const inRow = units.filter((u) => u.tile.row === row).sort((a, b) => a.tile.col - b.tile.col);
    if (inRow.length === 0) continue;
    lines.push(`  ${ROW_NAMES[row]} row:`);
    for (const unit of inRow) lines.push(`    ${unitLine(unit, stats[unit.id], battle.current?.unitId === unit.id && unit.side === viewer)}`);
  }
  return lines;
}

/** The field, the acting unit's abilities, and the turn order, as `side` knows them. */
export function battleView(truth: Battle, side: Side, title: string): string {
  const battle = asKnown(truth, side);
  const stats = effectiveStatsOf(battle);
  const theirs: Side = side === 0 ? 1 : 0;
  const lines = [title, `Round ${battle.round}.`];
  lines.push(...sideBlock(battle, side, `Your side (${side === 0 ? "attacking" : "defending"}):`, side, stats));
  lines.push(...sideBlock(battle, theirs, "Enemy side:", side, stats));
  const upcoming = upcomingSlots(battle).slice(0, 8).map((id) => battle.units[id]).filter((u) => u !== undefined);
  if (upcoming.length > 0) lines.push(`Turn order next: ${upcoming.map((u) => unitLabel(u, side)).join(", ")}.`);
  const hands = battle.tarot.filter((h) => h.side === side && h.chosen !== null);
  for (const hand of hands) {
    const card = hand.cards[hand.chosen ?? -1];
    if (card) lines.push(`Your tarot card: ${describeTask(card.task, (id) => namedIn(battle, id, side))} Reward: ${describeReward(card.reward)} (${hand.state}).`);
  }
  const acting = battle.current ? battle.units[battle.current.unitId] : undefined;
  if (acting && acting.side === side) {
    const power = stats[acting.id]?.abilityPower ?? 100;
    lines.push(`Abilities of ${unitLabel(acting, side)}:`);
    for (const ref of unitAbilities(battle, acting.id)) lines.push(`  - ${abilityName(ref)}: ${describeAbility(ref, power)}`);
  }
  return lines.join("\n");
}

/** An ability as the game names it: the unit's own name for it, else its behavior's. */
export const abilityName = (ref: AbilityRef): string => ref.name ?? BEHAVIORS[ref.id]?.name ?? ref.id;

const namedIn = (battle: Battle, id: string, side: Side): string => {
  const unit = battle.units[id];
  return unit ? unitLabel(unit, side) : id;
};

/** One order the seat can give in battle: an ability on a target (and its copies), or a tarot card. */
export type BattleChoice = { readonly kind: "act"; readonly action: Action } | { readonly kind: "tarot"; readonly hand: number; readonly card: number };

export interface BattleOption {
  readonly text: string;
  readonly choice: BattleChoice;
}

/** Past this many target sets, a replicated spell's combinations aren't listed. */
const MAX_COPY_SETS = 8;

function combinations(pool: readonly number[], k: number): number[][] {
  if (k === 0) return [[]];
  return pool.flatMap((first, i) => combinations(pool.slice(i + 1), k - 1).map((rest) => [first, ...rest]));
}

function enhancementText(enhancement: Enhancement, spellCost: number): string {
  const cost = spellCost > 0 ? `, ${spellCost} charges` : "";
  if (enhancement.kind === "overload") return ` (overloaded${cost})`;
  if (enhancement.kind === "replicate") return ` (replicated x${enhancement.copies + 1}${cost})`;
  return spellCost > 0 ? ` (${spellCost} charges)` : "";
}

/**
 * What an order would do, played on the battle as the seat knows it: HP lost and gained, and deaths, up to the next
 * unit's turn. Hidden effects of the enemy's can make the real outcome differ.
 */
function preview(known: Battle, action: Action, side: Side): string {
  let events: readonly BattleEvent[];
  try {
    events = applyAction(known, action).events;
  } catch {
    return "";
  }
  const end = events.findIndex((e, i) => i > 0 && e.type === "turnStart");
  const own = end < 0 ? events : events.slice(0, end);
  const totals = new Map<string, { damage: number; heal: number; died: boolean }>();
  const of = (id: string) => totals.get(id) ?? { damage: 0, heal: 0, died: false };
  for (const e of own) {
    if (e.type === "damage") totals.set(e.unitId, { ...of(e.unitId), damage: of(e.unitId).damage + e.amount });
    if (e.type === "heal") totals.set(e.unitId, { ...of(e.unitId), heal: of(e.unitId).heal + e.amount });
    if (e.type === "death") totals.set(e.unitId, { ...of(e.unitId), died: true });
  }
  const parts = [...totals].map(([id, t]) => {
    const unit = known.units[id];
    const name = unit ? unitLabel(unit, side) : id;
    const what = [t.damage > 0 ? `-${t.damage} HP` : "", t.heal > 0 ? `+${t.heal} HP` : "", t.died ? "dies" : ""].filter(Boolean).join(", ");
    return what ? `${name} ${what}` : "";
  });
  const text = parts.filter(Boolean).join("; ");
  return text ? ` => ${text}` : "";
}

function targetText(battle: Battle, legal: LegalAbility, choices: readonly number[], side: Side, actor: string): string {
  const affected = [...new Set(choices.flatMap((c) => legal.choices[c]?.affected ?? []))];
  if (affected.length === 1 && affected[0] === actor) return "on itself";
  const names = affected.map((id) => battle.units[id]).filter((u) => u !== undefined).map((u) => unitLabel(u, side));
  return names.length > 0 ? `on ${names.join(", ")}` : "";
}

/** Every order the seat can give now: a tarot pick while a hand of its waits, else its acting unit's abilities. */
export function battleOptions(truth: Battle, side: Side): BattleOption[] {
  const known = asKnown(truth, side);
  const hands = truth.tarot.flatMap((h, i) => (h.side === side && h.chosen === null ? [{ h, i }] : []));
  const first = hands[0];
  if (first) {
    return first.h.cards.map((card, c) => ({
      text: `Tarot: take card ${c + 1}: ${describeTask(card.task, (id) => namedIn(known, id, side))} Reward: ${describeReward(card.reward)}`,
      choice: { kind: "tarot", hand: first.i, card: c },
    }));
  }
  const slot = truth.current;
  const actor = slot ? truth.units[slot.unitId] : undefined;
  if (!slot || !actor || actor.side !== side) return [];
  const options: BattleOption[] = [];
  for (const legal of legalActions(truth)) {
    const indices = legal.choices.map((_, i) => i);
    const sets = legal.enhancement.kind === "replicate" ? combinations(indices, legal.enhancement.copies + 1) : indices.map((i) => [i]);
    if (sets.length > MAX_COPY_SETS && legal.enhancement.kind === "replicate") continue;
    for (const set of sets) {
      const [choice, ...copies] = set;
      if (choice === undefined) continue;
      const action: Action = { abilityId: legal.abilityId, choice, ...(legal.enhancement.kind === "none" ? {} : { enhancement: legal.enhancement }), ...(copies.length > 0 ? { copies } : {}) };
      const free = legal.choices[choice]?.cost === "free" ? " [free action]" : "";
      const target = targetText(known, legal, set, side, actor.id);
      options.push({ text: `${legal.name}${enhancementText(legal.enhancement, legal.spellCost)}${target ? ` ${target}` : ""}${free}${preview(known, action, side)}`, choice: { kind: "act", action } });
    }
  }
  return options;
}

/** Battle events in words, for the side reading them (pass them through `masked` first). */
export function battleLog(events: readonly BattleEvent[], battle: Battle, reader: Side): string[] {
  const lines: string[] = [];
  const name = (id: string | null, reader: Side) => {
    const unit = id ? battle.units[id] : undefined;
    return unit ? unitLabel(unit, reader) : "something";
  };
  for (const e of events) {
    switch (e.type) {
      case "roundStart":
        lines.push(`-- Round ${e.round} --`);
        break;
      case "ability": {
        const ref = battle.units[e.unitId] ? abilityRef(battle, e.unitId, e.abilityId) : { id: e.abilityId };
        const targets = e.targets.filter((t) => t !== e.unitId).map((t) => name(t, reader));
        lines.push(`${name(e.unitId, reader)} uses ${abilityName(ref)}${targets.length > 0 ? ` on ${targets.join(", ")}` : ""}.`);
        break;
      }
      case "damage":
        lines.push(`  ${name(e.unitId, reader)} loses ${e.amount} HP.`);
        break;
      case "heal":
        lines.push(`  ${name(e.unitId, reader)} heals ${e.amount} HP.`);
        break;
      case "shieldHit":
        lines.push(`  ${name(e.unitId, reader)}'s shield takes ${e.amount}.`);
        break;
      case "death":
        lines.push(`  ${name(e.unitId, reader)} dies.`);
        break;
      case "deathPrevented":
        lines.push(`  ${name(e.unitId, reader)} would die, but holds on at 1 HP.`);
        break;
      case "revived":
        lines.push(`  ${name(e.unitId, reader)} rises again.`);
        break;
      case "evaded":
        lines.push(`  ${name(e.unitId, reader)} evades.`);
        break;
      case "crit":
        lines.push(`  A critical hit on ${name(e.target, reader)}.`);
        break;
      case "effect":
        if (!effectDef(e.effect).quiet) lines.push(`  ${name(e.unitId, reader)} now has ${effectDef(e.effect).name}.`);
        break;
      case "fled":
        lines.push(`  ${name(e.unitId, reader)} leaves the field.`);
        break;
      case "skipped":
        lines.push(`${name(e.unitId, reader)} loses its turn.`);
        break;
      case "countered":
        lines.push(`  ${name(e.unitId, reader)}'s ability is countered.`);
        break;
      case "tarot":
        if (e.state === "fulfilled") lines.push(`  ${e.side === reader ? "Your" : "The enemy's"} tarot card is fulfilled.`);
        break;
      default:
        break;
    }
  }
  return lines;
}
