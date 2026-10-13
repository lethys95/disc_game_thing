import { itemById } from "#rules/items";
import { freeTile } from "#rules/world/economy";
import { leadershipOf } from "#rules/world/leaders";
import { maxHpOf } from "#rules/world/record";
import { neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { alive, cityAt, lairAt, leaderAt, leaderById, playerOf } from "#rules/world/state";
import type { World, WorldEvent } from "#rules/world/state";

/** Consumables (`ItemDef.use`): a leader uses one from its bag on the map, on its player's turn, and it's gone. */

/** Whether using `item` takes a hex to use it on (aimed on the map, as a spell is). */
export const takesHex = (item: string): boolean => itemById(item).use?.kind === "ward";

/** The hexes a ward from this leader's warband can go on: beside it, open ground, nobody and nothing there. */
export function wardTargets(world: World, leaderId: string): Hex[] {
  const leader = leaderById(world, leaderId);
  return neighbors(leader.hex).filter(
    (hex) => stepCost(world.map, hex) !== null && !leaderAt(world, hex) && !cityAt(world, hex) && !lairAt(world, hex) && !world.wards.some((w) => sameHex(w.hex, hex)),
  );
}

/** Why `leaderId` can't use `item` (on `at`, for one that takes a hex) now, or null. */
export function useItemProblem(world: World, leaderId: string, item: string, at?: Hex): string | null {
  const leader = leaderById(world, leaderId);
  if (leader.player !== world.activePlayer) return "not your warband";
  if (!leader.bag.includes(item)) return "not carried";
  const use = itemById(item).use;
  if (!use) return "nothing to use";
  switch (use.kind) {
    case "healWarband":
      return leader.squad.some((m) => alive(m) && m.hp < maxHpOf(m, leader)) ? null : "nobody is wounded";
    case "raiseFallen": {
      const fallen = playerOf(world, leader.player).graveyard.at(-1);
      if (!fallen) return "nobody has fallen";
      if (leader.squad.length >= leadershipOf(leader)) return `squad full (Leadership ${leadershipOf(leader)})`;
      return freeTile(leader.squad, fallen.defId) ? null : "no free spot";
    }
    case "ward":
      if (!at) return "pick a hex beside the warband";
      return wardTargets(world, leaderId).some((hex) => sameHex(hex, at)) ? null : "not an open hex beside the warband";
  }
}

export function useItem(world: World, leaderId: string, item: string, events: WorldEvent[], at?: Hex): void {
  const problem = useItemProblem(world, leaderId, item, at);
  const use = itemById(item).use;
  if (problem || !use) throw new Error(`cannot use ${item}: ${problem}`);
  const leader = leaderById(world, leaderId);
  leader.bag.splice(leader.bag.indexOf(item), 1);
  switch (use.kind) {
    case "healWarband":
      leader.squad = leader.squad.map((m) => (alive(m) ? { ...m, hp: Math.min(maxHpOf(m, leader), m.hp + use.amount) } : m));
      break;
    case "raiseFallen": {
      const player = playerOf(world, leader.player);
      const fallen = player.graveyard.pop();
      const tile = fallen ? freeTile(leader.squad, fallen.defId) : null;
      if (!fallen || !tile) throw new Error(`cannot use ${item}: nobody to raise`);
      leader.squad.push({ defId: fallen.defId, tile, hp: 1, xp: 0, marks: fallen.marks, level: fallen.level });
      events.push({ type: "resurrected", player: leader.player, defId: fallen.defId });
      break;
    }
    case "ward":
      if (!at) throw new Error(`cannot use ${item}: no hex`);
      world.wards.push({ hex: at, until: world.turn + use.turns - 1 });
      break;
  }
  events.push({ type: "used", leaderId, item });
}
