import { AI_CHARGE_VALUE } from "#rules/balance";
import { applyAction, effectiveStatsOf, legalActions, traitValues } from "#rules/battle/engine";
import { UNITS } from "#rules/units/index";
import type { Action, Battle, Side } from "#rules/battle/types";

/**
 * Greedy opponent: tries every legal action and keeps the best resulting position. An action that leaves the same
 * unit's turn going (a free action, a bonus attack) is worth its best follow-up too, looked at `depth` steps deep:
 * otherwise a free action that only pays off on the next one (Combustion) never looks worth it.
 */
export function chooseAction(battle: Battle): Action | null {
  return fleeing(battle) ?? bestAction(battle, FOLLOW_UP_DEPTH)?.action ?? null;
}

/** Below this share of the enemy's strength a fight is lost: a unit that can flee saves itself for the next one. */
const HOPELESS = 0.15;

/** What a side can still do: each living unit's health (shields at half) weighted by its damage. */
function strengthOf(battle: Battle, side: Side): number {
  const stats = effectiveStatsOf(battle);
  return Object.values(battle.units)
    .filter((u) => u.alive && u.side === side)
    .reduce((sum, u) => sum + (u.hp + 0.5 * u.shield) * (1 + (stats[u.id]?.damage ?? 0)), 0);
}

/** A losing unit's way out: an ability tagged `flee` (Retreat), when its side is hopelessly behind. */
function fleeing(battle: Battle): Action | null {
  const unit = battle.current ? battle.units[battle.current.unitId] : undefined;
  // Only units worth saving flee: tier-1 fodder fights on.
  if (!unit || (UNITS[unit.defId]?.tier ?? 1) < 2) return null;
  const option = legalActions(battle).find((o) => o.tags.includes("flee") && o.enhancement.kind === "none");
  if (!option) return null;
  const ours = strengthOf(battle, unit.side);
  const theirs = strengthOf(battle, unit.side === 0 ? 1 : 0);
  return ours < HOPELESS * theirs ? { abilityId: option.abilityId, choice: 0 } : null;
}

const FOLLOW_UP_DEPTH = 2;

function bestAction(battle: Battle, depth: number): { action: Action; score: number } | null {
  const slot = battle.current;
  if (!slot) return null;
  const side = battle.units[slot.unitId]?.side;
  if (side === undefined) return null;

  let best: { action: Action; score: number } | null = null;
  const consider = (action: Action) => {
    const after = applyAction(battle, action).battle;
    let score = evaluate(after, side);
    if (depth > 0 && after.current?.unitId === slot.unitId && !after.outcome) score = Math.max(score, bestAction(after, depth - 1)?.score ?? -Infinity);
    if (!best || score > best.score) best = { action, score };
  };
  const options = legalActions(battle);
  for (const option of options) {
    const enhancement = option.enhancement;
    if (enhancement.kind === "replicate") {
      // Copies go on the targets that score best for a single cast, rather than trying every combination.
      const single = options.find((o) => o.abilityId === option.abilityId && o.enhancement.kind === "none");
      if (!single) continue;
      const ranked = single.choices
        .map((_, choice) => ({ choice, score: evaluate(applyAction(battle, { abilityId: option.abilityId, choice }).battle, side) }))
        .sort((a, b) => b.score - a.score)
        .map((r) => r.choice);
      const [first, ...rest] = ranked.slice(0, enhancement.copies + 1);
      if (first !== undefined && rest.length === enhancement.copies) consider({ abilityId: option.abilityId, choice: first, enhancement, copies: rest });
      continue;
    }
    option.choices.forEach((_, choice) => consider({ abilityId: option.abilityId, choice, enhancement }));
  }
  return best;
}

/**
 * How good a position is for `side`. Health, shields and spent charges are universal; everything mechanic-specific
 * (a pending Counter, a Mutation, a fire shield) comes from the traits' own `aiValue`.
 */
function evaluate(battle: Battle, side: Side): number {
  if (battle.outcome) return battle.outcome.winner === side ? 1e6 : battle.outcome.winner === null ? 0 : -1e6;
  let score = 0;
  const traits = traitValues(battle);
  for (const unit of Object.values(battle.units)) {
    const sign = unit.side === side ? 1 : -1;
    const spentSpells = (UNITS[unit.defId]?.spellCharges ?? 0) - unit.spellCharges;
    score -= sign * AI_CHARGE_VALUE * (Object.values(unit.chargesUsed).reduce((sum, n) => sum + n, 0) + spentSpells);
    if (!unit.alive) {
      // A unit that fled is saved, not lost: its health still counts, less its absence from the fight.
      score += unit.fled ? sign * 0.5 * unit.hp : -sign * 100;
      continue;
    }
    // Shields are worth less than health: they return after battle, and lent ones perish.
    score += sign * (unit.hp + 0.5 * unit.shield + (traits[unit.id] ?? 0));
  }
  return score;
}

/** Plays a battle to its end with the greedy AI on both sides: the deterministic forecast of a fight. */
export function autoplay(start: Battle, limit = 5000): Battle {
  let battle = start;
  for (let i = 0; i < limit && !battle.outcome; i++) {
    const action = chooseAction(battle);
    if (!action) break;
    battle = applyAction(battle, action).battle;
  }
  return battle;
}
