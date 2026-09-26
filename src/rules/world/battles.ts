import { autoplay } from "#rules/ai";
import { CAMP_REGROWTH_TURNS, CITY_ARMOR_PER_TIER } from "#rules/balance";
import { sameHex } from "#rules/hex";
import { createBattle } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import type { Battle, Side } from "#rules/battle/types";
import { sameTile } from "#rules/battle/grid";
import { NODES } from "#rules/nodes";
import { xpValue } from "#rules/progression";
import { GUARDIAN_ID } from "#rules/units/index";
import { freeTile, growSquad, newcomer } from "#rules/world/economy";
import type { Held } from "#rules/world/economy";
import { leadershipOf } from "#rules/world/leaders";
import { isLeaderOf, placementOf } from "#rules/world/record";
import type { MoveTarget } from "#rules/world/movement";
import { alive, cityById, lairById, leaderAt, leaderById, leaderUnit, unitId } from "#rules/world/state";
import type { City, Defender, Engagement, Leader, SquadMember, World, WorldEvent, WorldStep } from "#rules/world/state";

/** Battles started on the map: who fights whom, with what context, and writing the result back. */

export function defenderOf(target: Exclude<MoveTarget, { kind: "capture" }>): Defender {
  if (target.kind === "leader") return { kind: "leader", leaderId: target.leaderId };
  if (target.kind === "lair") return { kind: "lair", lairId: target.lairId };
  return { kind: "garrison", cityId: target.cityId };
}

/** The defending squad and its battle side. Neutrals take whichever side the attacker leaves free. */
function defendingSquad(world: World, defender: Defender, attackerSide: Side): Held & { side: Side; neutral: boolean } {
  const free: Side = attackerSide === 0 ? 1 : 0;
  if (defender.kind === "leader") {
    const leader = leaderById(world, defender.leaderId);
    return { side: leader.side, squad: leader.squad, leader, neutral: false };
  }
  if (defender.kind === "lair") return { side: free, squad: lairById(world, defender.lairId).guards, leader: undefined, neutral: true };
  const city = cityById(world, defender.cityId);
  return { side: city.owner ?? free, squad: city.garrison, leader: undefined, neutral: city.owner === null };
}

/** The armor a defender gets from a city's walls: a garrison always, a warband only in its own city. */
function wallsFor(world: World, defender: Defender, side: Side): number {
  let city: City | undefined;
  if (defender.kind === "garrison") city = cityById(world, defender.cityId);
  if (defender.kind === "leader") {
    const hex = leaderById(world, defender.leaderId).hex;
    city = world.cities.find((c) => sameHex(c.hex, hex) && c.owner === side);
  }
  return city ? CITY_ARMOR_PER_TIER * (city.tier - 1) : 0;
}

export function engagementBattle(world: World, attacker: Leader, defender: Defender): Battle {
  const defending = defendingSquad(world, defender, attacker.side);
  const ours = attacker.squad.filter(alive).map((m) => placementOf(m, attacker));
  // Defenders in a city fight behind its walls: its garrison, or a warband standing in its own city.
  const walls = wallsFor(world, defender, defending.side);
  const theirs = defending.squad.filter(alive).map((m) => {
    const placement = placementOf(m, defending.leader);
    return walls > 0 ? { ...placement, effects: [...(placement.effects ?? []), { def: "fortified", amount: walls }] } : placement;
  });
  const squads: [Placement[], Placement[]] = attacker.side === 0 ? [ours, theirs] : [theirs, ours];
  // Each player side brings the battle effects of the city nodes it holds; neutrals bring none.
  const sideEffects = ([0, 1] as const).map((side) =>
    side === defending.side && defending.neutral ? [] : world.cities.filter((c) => c.owner === side).flatMap((c) => c.nodes.flatMap((n) => NODES[n.kind].battleEffects)),
  );
  return createBattle(squads, { sideEffects: [sideEffects[0] ?? [], sideEffects[1] ?? []] }).battle;
}

/** The squad after a battle: survivors keep their wounds, and a fallen leader stays while anyone else stands. */
function remaining(squad: readonly SquadMember[], side: Side, battle: Battle, leader: Leader | undefined): SquadMember[] {
  const after = squad.flatMap((m) => {
    if (!alive(m)) return [m];
    const unit = battle.units[unitId(side, m.tile)];
    if (unit?.alive) return [{ ...m, hp: unit.hp }];
    return isLeaderOf(m, leader) ? [{ ...m, hp: 0 }] : [];
  });
  return after.some(alive) ? after : [];
}

/** Units killed in this battle: what the winners' XP is made of. */
function killed(squad: readonly SquadMember[], side: Side, battle: Battle): SquadMember[] {
  return squad.filter((m) => alive(m) && battle.units[unitId(side, m.tile)]?.alive === false);
}

/** Writes a finished battle back into the world: survivors keep their wounds, the dead leave their squad. */
export function concludeBattle(world: World, battle: Battle): WorldStep {
  const engagement = world.engagement;
  if (!engagement || !battle.outcome) throw new Error("no finished battle to conclude");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  const attacker = leaderById(draft, engagement.attackerId);
  const defending = defendingSquad(draft, engagement.defender, attacker.side);

  const lost: [SquadMember[], SquadMember[]] = [[], []];
  lost[attacker.side] = killed(attacker.squad, attacker.side, battle);
  lost[defending.side] = killed(defending.squad, defending.side, battle);
  const attackers = remaining(attacker.squad, attacker.side, battle, attacker);
  const defenders = remaining(defending.squad, defending.side, battle, defending.leader);

  // A player's dead go to their graveyard (not the Guardian, never neutrals, and not a fallen leader who stays).
  const buried = (before: readonly SquadMember[], after: readonly SquadMember[]) => before.filter((m) => m.defId !== GUARDIAN_ID && !after.some((a) => sameTile(a.tile, m.tile)));
  const graves: [SquadMember[], SquadMember[]] = [[], []];
  graves[attacker.side] = buried(attacker.squad, attackers);
  graves[defending.side] = defending.neutral ? [] : buried(defending.squad, defenders);
  for (const side of [0, 1] as const) {
    for (const m of graves[side]) {
      draft.graveyard[side].push({ defId: m.defId, fellOnTurn: draft.turn, marks: m.marks, level: m.level });
      events.push({ type: "fell", side, defId: m.defId });
    }
  }

  attacker.squad = attackers;
  const defender = engagement.defender;
  if (defender.kind === "leader") {
    leaderById(draft, defender.leaderId).squad = defenders;
  } else if (defender.kind === "lair") {
    const lair = lairById(draft, defender.lairId);
    lair.guards = defenders;
    if (lair.guards.length === 0 && attacker.squad.length > 0) {
      if (lair.kind === "camp") {
        lair.regrowsOn = draft.turn + CAMP_REGROWTH_TURNS;
        events.push({ type: "cleared", lairId: lair.id, side: attacker.side });
      } else if (lair.reward && !lair.looted) {
        lair.looted = true;
        draft.gold[attacker.side] += lair.reward.gold;
        const joins = lair.reward.joins;
        const tile = joins ? freeTile(attacker.squad) : null;
        if (joins && tile && attacker.squad.length < leadershipOf(attacker)) attacker.squad.push(newcomer(draft, attacker.side, joins, tile));
        events.push({ type: "looted", lairId: lair.id, side: attacker.side, gold: lair.reward.gold, joins: joins && tile ? joins : null });
      }
    }
  } else {
    const city = cityById(draft, defender.cityId);
    const guardianBefore = city.garrison.some((m) => m.defId === GUARDIAN_ID);
    city.garrison = defenders;
    const guardianFell = guardianBefore && !city.garrison.some((m) => m.defId === GUARDIAN_ID);
    if (guardianFell) {
      draft.outcome = { winner: attacker.side };
      events.push({ type: "worldEnd", winner: attacker.side });
    } else if (city.garrison.length === 0 && attacker.squad.length > 0 && !leaderAt(draft, city.hex)) {
      city.owner = attacker.side;
      attacker.hex = city.hex;
      events.push({ type: "captured", cityId: city.id, side: attacker.side });
    }
  }

  // Canon: the defeated enemies' worth is split among the winning side's survivors.
  const winner = battle.outcome.winner;
  const neutralWon = winner === defending.side && defending.neutral;
  if (winner !== null && !neutralWon) {
    const loser: Side = winner === 0 ? 1 : 0;
    const pool = lost[loser].reduce((sum, m) => sum + xpValue(m.defId), 0);
    const winners = winner === attacker.side ? { squad: attacker.squad, leader: attacker } : winnerSquad(draft, engagement.defender);
    const standing = winners.squad.filter(alive).length;
    if (pool > 0 && standing > 0) {
      const each = Math.ceil(pool / standing);
      events.push({ type: "xp", side: winner, pool, each });
      growSquad(draft, winners, each, winner, events);
      // A living leader earns its share like any unit; it also counts toward the leader tree.
      const leaderStands = winners.leader && winners.leader.squad.some((m) => alive(m) && isLeaderOf(m, winners.leader));
      if (winners.leader && leaderStands) winners.leader.experience += each;
    }
  }

  for (const leader of draft.leaders) {
    if (leader.squad.length === 0) {
      events.push({ type: "leaderFell", leaderId: leader.id, side: leader.side });
      continue;
    }
    const own = leaderUnit(leader);
    if (own && !alive(own) && leader.fellOnTurn === null) leader.fellOnTurn = draft.turn;
  }
  draft.leaders = draft.leaders.filter((l) => l.squad.length > 0);
  draft.engagement = null;
  return { world: draft, events };
}

function winnerSquad(world: World, defender: Defender): Held {
  if (defender.kind === "leader") {
    const leader = world.leaders.find((l) => l.id === defender.leaderId);
    return { squad: leader?.squad ?? [], leader };
  }
  if (defender.kind === "lair") return { squad: world.lairs.find((l) => l.id === defender.lairId)?.guards ?? [], leader: undefined };
  return { squad: cityById(world, defender.cityId).garrison, leader: undefined };
}

/** The players (not neutrals) with a squad in this fight. A player who isn't in it only sees the result. */
export function playersIn(world: World, engagement: Engagement): Side[] {
  const attacker = leaderById(world, engagement.attackerId);
  const defending = defendingSquad(world, engagement.defender, attacker.side);
  return defending.neutral ? [attacker.side] : [attacker.side, defending.side];
}

/** The battle a move would start, played out by the AI on both sides. Deterministic, so it's a true forecast. */
export function forecast(world: World, leaderId: string, target: MoveTarget): Battle | null {
  if (target.kind === "capture") return null;
  return autoplay(engagementBattle(world, leaderById(world, leaderId), defenderOf(target)));
}
