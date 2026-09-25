import { applyAction, createBattle, legalActions } from "#rules/battle/engine";
import type { BattleContext, Placement } from "#rules/battle/engine";
import type { Battle, BattleEvent, BattleUnit, Col, EffectSeed, Row } from "#rules/battle/types";

/** Shared battle-test helpers. */

export const p = (defId: string, row: Row, col: Col, effects?: EffectSeed[]): Placement => ({
  defId,
  tile: { row, col },
  ...(effects ? { effects } : {}),
});

export const start = (first: Placement[], second: Placement[], context?: BattleContext): Battle => createBattle([first, second], context).battle;

export const anchorKey = (c: { anchor: { side: number; tile: { row: number; col: number } } }) => `${c.anchor.side}.${c.anchor.tile.row}.${c.anchor.tile.col}`;

/** Uses `abilityId` with the choice anchored on tile key `anchor` ("side.row.col"), or its first choice. */
export function act(battle: Battle, abilityId: string, anchor?: string): { battle: Battle; events: readonly BattleEvent[] } {
  const option = legalActions(battle).find((a) => a.abilityId === abilityId);
  if (!option) throw new Error(`${abilityId} is not legal for ${battle.current?.unitId}`);
  const choice = anchor === undefined ? 0 : option.choices.findIndex((c) => anchorKey(c) === anchor);
  if (choice < 0) throw new Error(`${abilityId} has no choice anchored at ${anchor}`);
  return applyAction(battle, { abilityId, choice });
}

/** Everyone else passes (waits, or defends once waiting is used up) until `id` is up. */
export function until(battle: Battle, id: string): Battle {
  let b = battle;
  for (let i = 0; i < 50 && b.current?.unitId !== id; i++) {
    b = act(b, legalActions(b).some((a) => a.abilityId === "wait") ? "wait" : "defend").battle;
  }
  if (b.current?.unitId !== id) throw new Error(`${id} never got a turn`);
  return b;
}

export function unit(battle: Battle, id: string): BattleUnit {
  const found = battle.units[id];
  if (!found) throw new Error(`no unit ${id}`);
  return found;
}

/** Choices of `abilityId` for the unit whose turn it is, as the affected unit lists keyed by anchor. */
export const affectedBy = (battle: Battle, abilityId: string, anchor: string) =>
  legalActions(battle).find((a) => a.abilityId === abilityId)?.choices.find((c) => anchorKey(c) === anchor)?.affected;
