import { createBattle } from "#rules/battle";
import type { Placement } from "#rules/battle";
import { hexKey, neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { findPath, generateMap, stepCost } from "#rules/map";
import type { Path, WorldMap } from "#rules/map";
import type { Battle, Side, Tile } from "#rules/types";
import { UNITS } from "#rules/units";

/** A unit in a leader's squad on the map; its HP carries from one battle to the next. */
export interface SquadMember extends Placement {
  readonly hp: number;
}


export interface Leader {
  readonly id: string;
  readonly side: Side;
  hex: Hex;
  movement: number;
  squad: SquadMember[];
  /** The squad member who is the leader. Cosmetic for now: it picks the figure shown on the map. */
  leaderTile: Tile;
}

export interface Engagement {
  readonly attackerId: string;
  readonly defenderId: string;
  readonly battle: Battle;
}

export interface World {
  readonly map: WorldMap;
  leaders: Leader[];
  turn: number;
  activeSide: Side;
  engagement: Engagement | null;
  outcome: { winner: Side } | null;
}

export type WorldAction = { type: "move"; leaderId: string; to: Hex } | { type: "endTurn" };

export type WorldEvent =
  | { type: "moved"; leaderId: string; path: readonly Hex[] }
  | { type: "engaged"; attackerId: string; defenderId: string }
  | { type: "turnStarted"; side: Side; turn: number }
  | { type: "leaderFell"; leaderId: string }
  | { type: "worldEnd"; winner: Side };

export interface WorldStep {
  readonly world: World;
  readonly events: readonly WorldEvent[];
}

/** Provisional: no canon movement allowance yet. On a radius-4 map this means contact on turn two or three. */
export const LEADER_MOVEMENT = 4;

export function createWorld(seed: number, squads: readonly [readonly Placement[], readonly Placement[]]): World {
  const map = generateMap(seed);
  const leaders = squads.map((squad, index): Leader => {
    const side: Side = index === 0 ? 0 : 1;
    const first = squad[0];
    if (!first) throw new Error("a leader needs at least one unit");
    return {
      id: `leader${side}`,
      side,
      hex: map.starts[side],
      movement: LEADER_MOVEMENT,
      squad: squad.map((p) => ({ defId: p.defId, tile: p.tile, hp: UNITS[p.defId]?.stats.maxHp ?? 0 })),
      leaderTile: first.tile,
    };
  });
  return { map, leaders, turn: 1, activeSide: 0, engagement: null, outcome: null };
}

function unitId(side: Side, tile: Tile): string {
  return `${side}.${tile.row}.${tile.col}`;
}

export function leaderById(world: World, id: string): Leader {
  const leader = world.leaders.find((l) => l.id === id);
  if (!leader) throw new Error(`unknown leader: ${id}`);
  return leader;
}

export function leaderAt(world: World, hex: Hex): Leader | undefined {
  return world.leaders.find((l) => sameHex(l.hex, hex));
}

/** What a move order would do: the path, how far this turn's movement reaches, and whether it ends in an attack. */
export interface MovePlan {
  readonly path: Path;
  /** How many hexes of the path are walked this turn. */
  readonly steps: number;
  readonly attacks: string | null;
}

export function planMove(world: World, leaderId: string, to: Hex): MovePlan | null {
  const leader = leaderById(world, leaderId);
  const occupant = leaderAt(world, to);
  if (occupant?.side === leader.side) return null;
  const path = findPath(world.map, leader.hex, to, (hex) => leaderAt(world, hex) !== undefined);
  if (!path || path.hexes.length === 0) return null;
  let left = leader.movement;
  let steps = 0;
  for (const hex of path.hexes) {
    const cost = stepCost(world.map, hex) ?? Infinity;
    if (cost > left) break;
    left -= cost;
    steps += 1;
  }
  const reachesEnemy = occupant !== undefined && steps === path.hexes.length;
  return { path, steps: reachesEnemy ? steps - 1 : steps, attacks: reachesEnemy ? occupant.id : null };
}

/** Movement cost to every hex this leader can reach this turn. */
export function reachable(world: World, leaderId: string): Map<string, number> {
  const leader = leaderById(world, leaderId);
  const costs = new Map<string, number>([[hexKey(leader.hex), 0]]);
  const frontier: Hex[] = [leader.hex];
  while (frontier.length > 0) {
    const hex = frontier.shift();
    if (!hex) break;
    const spent = costs.get(hexKey(hex)) ?? 0;
    for (const next of neighbors(hex)) {
      const cost = stepCost(world.map, next);
      if (cost === null || leaderAt(world, next)) continue;
      const total = spent + cost;
      if (total > leader.movement || total >= (costs.get(hexKey(next)) ?? Infinity)) continue;
      costs.set(hexKey(next), total);
      frontier.push(next);
    }
  }
  return costs;
}

export function applyWorldAction(world: World, action: WorldAction): WorldStep {
  if (world.outcome || world.engagement) throw new Error("the world is not taking orders");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  switch (action.type) {
    case "move": {
      const leader = leaderById(draft, action.leaderId);
      if (leader.side !== draft.activeSide) throw new Error(`${leader.id} cannot move on the other side's turn`);
      const plan = planMove(draft, leader.id, action.to);
      if (!plan) throw new Error(`no path for ${leader.id}`);
      const walked = plan.path.hexes.slice(0, plan.steps);
      for (const hex of walked) leader.movement -= stepCost(draft.map, hex) ?? 0;
      const last = walked[walked.length - 1];
      if (last) leader.hex = last;
      if (walked.length > 0) events.push({ type: "moved", leaderId: leader.id, path: walked });
      if (plan.attacks) {
        const defender = leaderById(draft, plan.attacks);
        leader.movement = 0;
        const squads: [SquadMember[], SquadMember[]] = leader.side === 0 ? [leader.squad, defender.squad] : [defender.squad, leader.squad];
        draft.engagement = { attackerId: leader.id, defenderId: defender.id, battle: createBattle(squads).battle };
        events.push({ type: "engaged", attackerId: leader.id, defenderId: defender.id });
      }
      break;
    }
    case "endTurn": {
      draft.activeSide = draft.activeSide === 0 ? 1 : 0;
      if (draft.activeSide === 0) draft.turn += 1;
      for (const leader of draft.leaders) if (leader.side === draft.activeSide) leader.movement = LEADER_MOVEMENT;
      events.push({ type: "turnStarted", side: draft.activeSide, turn: draft.turn });
      break;
    }
  }
  return { world: draft, events };
}

/** Writes a finished battle back into the world: survivors keep their wounds, the dead leave the squad. */
export function concludeBattle(world: World, battle: Battle): WorldStep {
  const engagement = world.engagement;
  if (!engagement || !battle.outcome) throw new Error("no finished battle to conclude");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  for (const id of [engagement.attackerId, engagement.defenderId]) {
    const leader = leaderById(draft, id);
    leader.squad = leader.squad.flatMap((member) => {
      const unit = battle.units[unitId(leader.side, member.tile)];
      return unit?.alive ? [{ ...member, hp: unit.hp }] : [];
    });
    const figure = leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col) ?? leader.squad[0];
    if (figure) leader.leaderTile = figure.tile;
    else events.push({ type: "leaderFell", leaderId: id });
  }
  draft.leaders = draft.leaders.filter((l) => l.squad.length > 0);
  draft.engagement = null;
  for (const side of [0, 1] as const) {
    if (!draft.leaders.some((l) => l.side === side)) {
      draft.outcome = { winner: side === 0 ? 1 : 0 };
      events.push({ type: "worldEnd", winner: draft.outcome.winner });
      break;
    }
  }
  return { world: draft, events };
}

/** Map AI: every leader marches on the nearest enemy and attacks when it can; then the turn ends. */
export function chooseWorldAction(world: World): WorldAction {
  for (const leader of world.leaders) {
    if (leader.side !== world.activeSide || leader.movement <= 0) continue;
    const plans = world.leaders
      .filter((l) => l.side !== leader.side)
      .map((enemy) => planMove(world, leader.id, enemy.hex))
      .filter((plan): plan is MovePlan => plan !== null && (plan.steps > 0 || plan.attacks !== null))
      .sort((a, b) => a.path.cost - b.path.cost);
    const plan = plans[0];
    const target = plan?.path.hexes[plan.path.hexes.length - 1];
    if (plan && target) return { type: "move", leaderId: leader.id, to: target };
  }
  return { type: "endTurn" };
}
