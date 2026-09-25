import { applyAction, legalActions } from "#rules/battle";
import type { Action, Battle, Side } from "#rules/types";

/** One-ply greedy opponent: tries every legal action and keeps the best resulting position. */
export function chooseAction(battle: Battle): Action | null {
  const slot = battle.current;
  if (!slot) return null;
  const side = battle.units[slot.unitId]?.side;
  if (side === undefined) return null;

  let best: Action | null = null;
  let bestScore = -Infinity;
  for (const option of legalActions(battle)) {
    option.choices.forEach((_, choice) => {
      const action = { abilityId: option.abilityId, choice };
      const score = evaluate(applyAction(battle, action).battle, side);
      if (score > bestScore) {
        best = action;
        bestScore = score;
      }
    });
  }
  return best;
}

function evaluate(battle: Battle, side: Side): number {
  if (battle.outcome) return battle.outcome.winner === side ? 1e6 : battle.outcome.winner === null ? 0 : -1e6;
  let score = 0;
  for (const unit of Object.values(battle.units)) {
    const sign = unit.side === side ? 1 : -1;
    score += sign * (unit.alive ? unit.hp : -100);
    // Spent charges count against their owner so once-per-combat heals aren't burned on scratches.
    score -= sign * 40 * unit.abilities.reduce((sum, a) => sum + a.chargesUsed, 0);
  }
  return score;
}
