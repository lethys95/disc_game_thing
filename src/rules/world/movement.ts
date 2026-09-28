import { hexKey } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { exits, findPath, stepCost } from "#rules/map";
import type { Path } from "#rules/map";
import { cityAt, lairAt, leaderAt, leaderById } from "#rules/world/state";
import type { PlayerId, World } from "#rules/world/state";

/** Where a warband can go and what it runs into. */

/** What waits at the end of a march: nothing, an enemy leader, a garrison to storm, or an empty city to take. */
export type MoveTarget =
  | { kind: "leader"; leaderId: string }
  | { kind: "garrison"; cityId: string }
  | { kind: "lair"; lairId: string }
  | { kind: "capture"; cityId: string };

export interface MovePlan {
  readonly path: Path;
  /** How many hexes of the path are walked this turn. */
  readonly steps: number;
  /** Set when this turn's march reaches it. */
  readonly target: MoveTarget | null;
}

/** What a march by `side` ending on `hex` runs into. */
export function destination(world: World, side: PlayerId, hex: Hex): MoveTarget | null | "blocked" {
  const leader = leaderAt(world, hex);
  if (leader) return leader.player === side ? "blocked" : { kind: "leader", leaderId: leader.id };
  const lair = lairAt(world, hex);
  if (lair) return { kind: "lair", lairId: lair.id };
  const city = cityAt(world, hex);
  if (!city || city.owner === side) return null;
  return city.garrison.length > 0 ? { kind: "garrison", cityId: city.id } : { kind: "capture", cityId: city.id };
}

export function planMove(world: World, leaderId: string, to: Hex): MovePlan | null {
  const leader = leaderById(world, leaderId);
  const goal = destination(world, leader.player, to);
  if (goal === "blocked") return null;
  // Other leaders and cities not your own can only be a march's goal, never a waypoint.
  const blocked = (hex: Hex) => destination(world, leader.player, hex) !== null;
  const path = findPath(world.map, leader.hex, to, blocked);
  if (!path || path.hexes.length === 0) return null;
  let left = leader.movement;
  let steps = 0;
  for (const hex of path.hexes) {
    const cost = stepCost(world.map, hex) ?? Infinity;
    if (cost > left) break;
    left -= cost;
    steps += 1;
  }
  const arrives = steps === path.hexes.length;
  if (!arrives || !goal) return { path, steps, target: null };
  return { path, steps: goal.kind === "capture" ? steps : steps - 1, target: goal };
}

/** Movement cost to every hex this leader can walk to this turn (not counting attacks and captures). */
export function reachable(world: World, leaderId: string): Map<string, number> {
  const leader = leaderById(world, leaderId);
  const costs = new Map<string, number>([[hexKey(leader.hex), 0]]);
  const frontier: Hex[] = [leader.hex];
  while (frontier.length > 0) {
    const hex = frontier.shift();
    if (!hex) break;
    const spent = costs.get(hexKey(hex)) ?? 0;
    for (const next of exits(world.map, hex)) {
      const cost = stepCost(world.map, next);
      if (cost === null || destination(world, leader.player, next) !== null) continue;
      const total = spent + cost;
      if (total > leader.movement || total >= (costs.get(hexKey(next)) ?? Infinity)) continue;
      costs.set(hexKey(next), total);
      frontier.push(next);
    }
  }
  return costs;
}
