import { CAMP_REGROWTH_TURNS } from "#rules/balance";
import { hexDistance } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { GUARDIAN_ID } from "#rules/units/index";
import { freeTile, newcomer } from "#rules/world/economy";
import { leadershipOf } from "#rules/world/leaders";
import { alive, leaderUnit, playerOf } from "#rules/world/state";
import type { Lair, Leader, PlayerId, SquadMember, World, WorldEvent } from "#rules/world/state";

/**
 * What happens to the dead and the beaten on the map, whoever killed them (a battle, a spell): one place, so the two
 * can't drift apart. All on a draft world.
 */

/** A player's dead go to its graveyard (never the Guardian, never neutrals'). */
export function bury(world: World, player: PlayerId | null, dead: readonly SquadMember[], events: WorldEvent[]): void {
  if (player === null) return;
  for (const m of dead) {
    if (m.defId === GUARDIAN_ID) continue;
    playerOf(world, player).graveyard.push({ defId: m.defId, fellOnTurn: world.turn, marks: m.marks, level: m.level });
    events.push({ type: "fell", player, defId: m.defId });
  }
}

/**
 * A lair whose guards are all dead: a camp starts regrowing; a dungeon's one-time reward goes to `player`, its
 * joining unit and item to `taker` (the warband that cleared it, or for a spell the caster's nearest one).
 */
export function clearLair(world: World, lair: Lair, player: PlayerId, taker: Leader | undefined, events: WorldEvent[]): void {
  if (lair.kind === "camp") {
    lair.regrowsOn = world.turn + CAMP_REGROWTH_TURNS;
    events.push({ type: "cleared", lairId: lair.id, player });
    return;
  }
  const reward = lair.reward;
  if (!reward || lair.looted) return;
  lair.looted = true;
  playerOf(world, player).gold += reward.gold;
  const joins = reward.joins;
  const tile = joins && taker ? freeTile(taker.squad, joins) : null;
  const joined = joins && taker && tile && taker.squad.length < leadershipOf(taker) ? joins : null;
  if (joined && taker && tile) taker.squad.push(newcomer(world, player, joined, tile));
  const item = reward.item && taker ? reward.item : null;
  if (item && taker) taker.bag.push(item);
  events.push({ type: "looted", lairId: lair.id, player, gold: reward.gold, joins: joined, item });
}

/** This player's warband nearest to `hex`, if it has any. */
export function nearestWarband(world: World, player: PlayerId, hex: Hex): Leader | undefined {
  return world.leaders.filter((l) => l.player === player && l.squad.length > 0).sort((a, b) => hexDistance(a.hex, hex) - hexDistance(b.hex, hex))[0];
}

/**
 * After deaths: a warband with nobody left falls, leaving its items to `victorOf` it (spoils, as in D2; provisional);
 * a warband whose leader died while others stand keeps its fallen leader, to be revived.
 */
export function settleWarbands(world: World, events: WorldEvent[], victorOf: (beaten: Leader) => Leader | undefined): void {
  for (const leader of world.leaders) {
    if (leader.squad.length > 0) {
      const own = leaderUnit(leader);
      if (own && !alive(own) && leader.fellOnTurn === null) leader.fellOnTurn = world.turn;
      continue;
    }
    const items = [...leader.worn, ...leader.bag];
    const victor = victorOf(leader);
    if (victor && victor.squad.length > 0 && items.length > 0) {
      victor.bag.push(...items);
      events.push({ type: "spoils", leaderId: victor.id, items });
    }
    events.push({ type: "leaderFell", leaderId: leader.id, player: leader.player });
  }
  world.leaders = world.leaders.filter((l) => l.squad.length > 0);
}
