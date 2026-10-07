import { strongestHitOf } from "#rules/abilities/index";
import { applyAction, createBattle, legalActions } from "#rules/battle/engine";
import type { BattleContext, Placement } from "#rules/battle/engine";
import type { Battle, BattleEvent, BattleUnit, Col, EffectSeed, Row } from "#rules/battle/types";
import type { Commitment } from "#rules/forks";
import { UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { defaultColors } from "#rules/world/colors";
import type { PlayerSetup } from "#rules/world/create";
import type { Leader, World } from "#rules/world/state";
import { updateVision } from "#rules/world/vision";
import { stepCost } from "#rules/map";
import { neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";

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

/** Two players for a world test: squads, commitments and factions side by side, default colors. */
export function twoPlayers(
  squads: readonly [readonly Placement[], readonly Placement[]],
  commitments: readonly [Commitment, Commitment],
  factions: readonly [Playable, Playable],
): PlayerSetup[] {
  const colors = defaultColors(factions);
  return ([0, 1] as const).map((i) => ({ squad: squads[i], faction: factions[i], commitment: commitments[i], color: colors[i] ?? "white" }));
}

/** The world with each player's gold set, in player order. */
export function withGold(world: World, gold: readonly number[]): World {
  return { ...world, players: world.players.map((p, i) => ({ ...p, gold: gold[i] ?? p.gold })) };
}

/** A player's start hex (every player has one). */
export function startOf(world: World, player: number): Hex {
  const start = world.map.starts[player];
  if (!start) throw new Error(`no start for player ${player}`);
  return start;
}

/** The world with one player's graveyard replaced. */
export function withGraveyard(world: World, player: number, graveyard: World["players"][number]["graveyard"]): World {
  return { ...world, players: world.players.map((p, i) => (i === player ? { ...p, graveyard } : p)) };
}

/** The world with one leader changed, and every player's sight brought up to date as play would. */
export function withLeader(world: World, id: string, change: Partial<Leader>): World {
  const next = structuredClone({ ...world, leaders: world.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) });
  updateVision(next);
  return next;
}

/** A walkable hex next to `hex` with nothing on it (no city, lair or warband). */
export function beside(world: World, hex: Hex): Hex {
  const free = neighbors(hex).find(
    (n) => stepCost(world.map, n) !== null && !world.cities.some((c) => sameHex(c.hex, n)) && !world.lairs.some((l) => sameHex(l.hex, n)) && !world.leaders.some((l) => sameHex(l.hex, n)),
  );
  if (!free) throw new Error("no free hex");
  return free;
}

/** What a unit type hits for at its own ability power: its strongest damaging ability. */
export const hitOf = (defId: string): number => {
  const def = UNITS[defId];
  return def ? strongestHitOf(def) : 0;
};
