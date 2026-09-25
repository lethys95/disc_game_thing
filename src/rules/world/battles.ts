import { autoplay } from "#rules/ai";
import { createBattle } from "#rules/battle/engine";
import type { Battle, Side } from "#rules/battle/types";
import { sameTile } from "#rules/battle/grid";
import { SQUAD_LIMIT } from "#rules/doctrine";
import { NODES } from "#rules/nodes";
import { xpValue } from "#rules/progression";
import { GUARDIAN_ID } from "#rules/units/index";
import { freeTile, growSquad } from "#rules/world/economy";
import type { MoveTarget } from "#rules/world/movement";
import { cityById, lairById, leaderAt, leaderById, member, unitId } from "#rules/world/state";
import type { Defender, Engagement, Leader, SquadMember, World, WorldEvent, WorldStep } from "#rules/world/state";

/** Battles started on the map: who fights whom, with what context, and writing the result back. */

export function defenderOf(target: Exclude<MoveTarget, { kind: "capture" }>): Defender {
  if (target.kind === "leader") return { kind: "leader", leaderId: target.leaderId };
  if (target.kind === "lair") return { kind: "lair", lairId: target.lairId };
  return { kind: "garrison", cityId: target.cityId };
}

/** The defending squad and its battle side. Neutrals take whichever side the attacker leaves free. */
function defendingSquad(world: World, defender: Defender, attackerSide: Side): { side: Side; squad: SquadMember[]; neutral: boolean } {
  const free: Side = attackerSide === 0 ? 1 : 0;
  if (defender.kind === "leader") {
    const leader = leaderById(world, defender.leaderId);
    return { side: leader.side, squad: leader.squad, neutral: false };
  }
  if (defender.kind === "lair") return { side: free, squad: lairById(world, defender.lairId).guards, neutral: true };
  const city = cityById(world, defender.cityId);
  return { side: city.owner ?? free, squad: city.garrison, neutral: city.owner === null };
}

export function engagementBattle(world: World, attacker: Leader, defender: Defender): Battle {
  const defending = defendingSquad(world, defender, attacker.side);
  const squads: [SquadMember[], SquadMember[]] = attacker.side === 0 ? [attacker.squad, defending.squad] : [defending.squad, attacker.squad];
  // Each player side brings the battle effects of the city nodes it holds; neutrals bring none.
  const sideEffects = ([0, 1] as const).map((side) =>
    side === defending.side && defending.neutral ? [] : world.cities.filter((c) => c.owner === side).flatMap((c) => c.nodes.flatMap((n) => NODES[n.kind].battleEffects)),
  );
  return createBattle(squads, { sideEffects: [sideEffects[0] ?? [], sideEffects[1] ?? []] }).battle;
}

function survivors(squad: readonly SquadMember[], side: Side, battle: Battle): SquadMember[] {
  return squad.flatMap((m) => {
    const unit = battle.units[unitId(side, m.tile)];
    return unit?.alive ? [{ ...m, hp: unit.hp }] : [];
  });
}

function casualties(squad: readonly SquadMember[], side: Side, battle: Battle): SquadMember[] {
  return squad.filter((m) => battle.units[unitId(side, m.tile)]?.alive === false);
}

/** Writes a finished battle back into the world: survivors keep their wounds, the dead leave their squad. */
export function concludeBattle(world: World, battle: Battle): WorldStep {
  const engagement = world.engagement;
  if (!engagement || !battle.outcome) throw new Error("no finished battle to conclude");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  const attacker = leaderById(draft, engagement.attackerId);
  const defending = defendingSquad(draft, engagement.defender, attacker.side);

  // A player's dead go to their graveyard (not the Guardian, and never neutrals).
  const lost: [SquadMember[], SquadMember[]] = [[], []];
  lost[attacker.side] = casualties(attacker.squad, attacker.side, battle);
  lost[defending.side] = casualties(defending.squad, defending.side, battle);
  for (const side of [0, 1] as const) {
    if (side === defending.side && defending.neutral) continue;
    for (const m of lost[side]) {
      if (m.defId === GUARDIAN_ID) continue;
      draft.graveyard[side].push({ defId: m.defId, fellOnTurn: draft.turn });
      events.push({ type: "fell", side, defId: m.defId });
    }
  }

  attacker.squad = survivors(attacker.squad, attacker.side, battle);
  const defender = engagement.defender;
  if (defender.kind === "leader") {
    const leader = leaderById(draft, defender.leaderId);
    leader.squad = survivors(leader.squad, leader.side, battle);
  } else if (defender.kind === "lair") {
    const lair = lairById(draft, defender.lairId);
    lair.guards = survivors(lair.guards, defending.side, battle);
    if (lair.guards.length === 0 && attacker.squad.length > 0) {
      if (lair.kind === "camp") {
        draft.lairs = draft.lairs.filter((l) => l.id !== lair.id);
        events.push({ type: "cleared", lairId: lair.id, side: attacker.side });
      } else if (lair.reward && !lair.looted) {
        lair.looted = true;
        draft.gold[attacker.side] += lair.reward.gold;
        const joins = lair.reward.joins;
        const tile = joins ? freeTile(attacker.squad) : null;
        if (joins && tile && attacker.squad.length < SQUAD_LIMIT) attacker.squad.push(member(joins, tile));
        events.push({ type: "looted", lairId: lair.id, side: attacker.side, gold: lair.reward.gold, joins: joins && tile ? joins : null });
      }
    }
  } else {
    const city = cityById(draft, defender.cityId);
    const side = defending.side;
    const guardianBefore = city.garrison.some((m) => m.defId === GUARDIAN_ID);
    city.garrison = survivors(city.garrison, side, battle);
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
    const winners = winner === attacker.side ? attacker.squad : winnerSquad(draft, engagement.defender);
    if (pool > 0 && winners.length > 0) {
      const each = Math.ceil(pool / winners.length);
      events.push({ type: "xp", side: winner, pool, each });
      growSquad(winners, each, winner, draft.commitment[winner], events);
    }
  }

  for (const leader of draft.leaders) {
    if (leader.squad.length > 0) {
      if (!leader.squad.some((m) => sameTile(m.tile, leader.leaderTile))) leader.leaderTile = leader.squad[0]?.tile ?? leader.leaderTile;
      continue;
    }
    events.push({ type: "leaderFell", leaderId: leader.id, side: leader.side });
  }
  draft.leaders = draft.leaders.filter((l) => l.squad.length > 0);
  draft.engagement = null;
  return { world: draft, events };
}

function winnerSquad(world: World, defender: Defender): SquadMember[] {
  if (defender.kind === "leader") return world.leaders.find((l) => l.id === defender.leaderId)?.squad ?? [];
  if (defender.kind === "lair") return world.lairs.find((l) => l.id === defender.lairId)?.guards ?? [];
  return cityById(world, defender.cityId).garrison;
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
