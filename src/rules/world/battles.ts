import { autoplay } from "#rules/ai";
import { CITY_ARMOR_PER_TIER } from "#rules/balance";
import { sameHex } from "#rules/hex";
import { createBattle } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import type { Battle, EffectSeed, Side } from "#rules/battle/types";
import { NODES } from "#rules/nodes";
import { sameTile } from "#rules/battle/grid";
import { xpValue } from "#rules/progression";
import { GUARDIAN_ID } from "#rules/units/index";
import { growSquad } from "#rules/world/economy";
import type { Held } from "#rules/world/economy";
import { isLeaderOf, placementOf } from "#rules/world/record";
import type { MoveTarget } from "#rules/world/movement";
import { updateVision } from "#rules/world/vision";
import { bury, clearLair, settleWarbands } from "#rules/world/fate";
import { alive, cityById, giftsOf, lairById, leaderAt, leaderById, nodesOf, playerOf, unitId } from "#rules/world/state";
import type { City, Defender, Enchantment, Engagement, Leader, PlayerId, SquadMember, World, WorldEvent, WorldStep } from "#rules/world/state";

/**
 * Battles started on the map: who fights whom, with what context, and writing the result back. Every battle has
 * two sides whatever the number of players: the attacker on side 0, the defender on side 1.
 */
const ATTACKER: Side = 0;
const DEFENDER: Side = 1;

export function defenderOf(target: Exclude<MoveTarget, { kind: "capture" }>): Defender {
  if (target.kind === "leader") return { kind: "leader", leaderId: target.leaderId };
  if (target.kind === "lair") return { kind: "lair", lairId: target.lairId };
  return { kind: "garrison", cityId: target.cityId };
}

/** The defending squad and the player it belongs to (null: neutrals). */
function defendingSquad(world: World, defender: Defender): Held & { player: PlayerId | null } {
  if (defender.kind === "leader") {
    const leader = leaderById(world, defender.leaderId);
    return { player: leader.player, squad: leader.squad, leader };
  }
  if (defender.kind === "lair") return { player: null, squad: lairById(world, defender.lairId).guards, leader: undefined };
  const city = cityById(world, defender.cityId);
  return { player: city.owner, squad: city.garrison, leader: undefined };
}

/** The city whose walls the defenders stand behind: a garrison's own, or a warband's own city it stands in. */
function defendedCity(world: World, defender: Defender, player: PlayerId | null): City | undefined {
  if (defender.kind === "garrison") return cityById(world, defender.cityId);
  if (defender.kind !== "leader") return undefined;
  const hex = leaderById(world, defender.leaderId).hex;
  return world.cities.find((c) => sameHex(c.hex, hex) && c.owner === player);
}

/** The armor a defender gets from a city's walls: a garrison always, a warband only in its own city. */
function wallsFor(world: World, defender: Defender, player: PlayerId | null): number {
  const city = defendedCity(world, defender, player);
  return city ? CITY_ARMOR_PER_TIER * (city.tier - 1) + giftsOf(world, city, "wallArmor").reduce((a, b) => a + b, 0) : 0;
}

/** What the city's nodes give the defenders behind its walls (a Bell tower's warning). */
function nodeDefenceFor(world: World, defender: Defender, player: PlayerId | null): EffectSeed[] {
  const city = defendedCity(world, defender, player);
  return city ? nodesOf(world, city).flatMap((n) => [...(NODES[n.kind].city?.defenderEffects?.(n.level) ?? [])]) : [];
}

/** A fight between a warband and whatever it walked into, ready to play. */
export function engage(world: World, attacker: Leader, defender: Defender): Engagement {
  return { attackerId: attacker.id, defender, battle: engagementBattle(world, attacker, defender), players: [attacker.player, defendingSquad(world, defender).player] };
}

function engagementBattle(world: World, attacker: Leader, defender: Defender): Battle {
  const defending = defendingSquad(world, defender);
  const spelled = (placement: Placement, on: readonly Enchantment[]): Placement =>
    on.length === 0 ? placement : { ...placement, effects: [...(placement.effects ?? []), ...on.map((e) => e.effect)] };
  const ours = attacker.squad.filter(alive).map((m) => spelled(placementOf(m, attacker), attacker.enchantments));
  // A warband brings its own spells; defenders behind a city's walls (its garrison, or a warband in its own city)
  // also bring the city's.
  const theirSpells = [...(defending.leader?.enchantments ?? []), ...(defendedCity(world, defender, defending.player)?.enchantments ?? [])];
  // Defenders in a city fight behind its walls: its garrison, or a warband standing in its own city.
  const walls = wallsFor(world, defender, defending.player);
  const cornered = defendedCity(world, defender, defending.player) !== undefined;
  const fromNodes = nodeDefenceFor(world, defender, defending.player);
  const theirs = defending.squad.filter(alive).map((m) => {
    const placement = spelled(placementOf(m, defending.leader), theirSpells);
    const effects = [...(placement.effects ?? []), ...(walls > 0 ? [{ def: "fortified", amount: walls }] : []), ...(cornered ? [{ def: "cornered" }] : []), ...fromNodes];
    return { ...placement, effects };
  });
  const squads: [Placement[], Placement[]] = [ours, theirs];
  return createBattle(squads).battle;
}

/** The squad after a battle: survivors keep their wounds, and a fallen leader stays while anyone else stands. */
function remaining(squad: readonly SquadMember[], side: Side, battle: Battle, leader: Leader | undefined): SquadMember[] {
  const after = squad.flatMap((m) => {
    if (!alive(m)) return [m];
    const unit = battle.units[unitId(side, m.tile)];
    // The fled survive with the health they left with.
    if (unit?.alive || unit?.fled) return [{ ...m, hp: unit.hp }];
    return isLeaderOf(m, leader) ? [{ ...m, hp: 0 }] : [];
  });
  return after.some(alive) ? after : [];
}

/** Units killed in this battle: what the winners' XP is made of. */
function killed(squad: readonly SquadMember[], side: Side, battle: Battle): SquadMember[] {
  return squad.filter((m) => {
    const unit = battle.units[unitId(side, m.tile)];
    return alive(m) && unit?.alive === false && !unit.fled;
  });
}

/** Writes a finished battle back into the world: survivors keep their wounds, the dead leave their squad. */
export function concludeBattle(world: World, battle: Battle): WorldStep {
  const engagement = world.engagement;
  if (!engagement || !battle.outcome) throw new Error("no finished battle to conclude");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  const attacker = leaderById(draft, engagement.attackerId);
  const defending = defendingSquad(draft, engagement.defender);

  const lost: [SquadMember[], SquadMember[]] = [killed(attacker.squad, ATTACKER, battle), killed(defending.squad, DEFENDER, battle)];
  const attackers = remaining(attacker.squad, ATTACKER, battle, attacker);
  const defenders = remaining(defending.squad, DEFENDER, battle, defending.leader);

  // The dead leave their squads (a fallen leader stays, to be revived).
  const gone = (before: readonly SquadMember[], after: readonly SquadMember[]) => before.filter((m) => !after.some((a) => sameTile(a.tile, m.tile)));
  bury(draft, attacker.player, gone(attacker.squad, attackers), events);
  bury(draft, defending.player, gone(defending.squad, defenders), events);

  attacker.squad = attackers;
  const defender = engagement.defender;
  if (defender.kind === "leader") {
    leaderById(draft, defender.leaderId).squad = defenders;
  } else if (defender.kind === "lair") {
    const lair = lairById(draft, defender.lairId);
    lair.guards = defenders;
    if (lair.guards.length === 0 && attacker.squad.length > 0) clearLair(draft, lair, attacker.player, attacker, events);
  } else {
    const city = cityById(draft, defender.cityId);
    const guardianBefore = city.garrison.some((m) => m.defId === GUARDIAN_ID);
    city.garrison = defenders;
    const guardianFell = guardianBefore && !city.garrison.some((m) => m.defId === GUARDIAN_ID);
    if (guardianFell && defending.player !== null) eliminate(draft, defending.player, events);
    if (!draft.outcome && city.garrison.length === 0 && attacker.squad.length > 0 && !leaderAt(draft, city.hex)) {
      city.owner = attacker.player;
      attacker.hex = city.hex;
      events.push({ type: "captured", cityId: city.id, player: attacker.player });
    }
  }

  // Canon: the defeated enemies' worth is split among the winning side's survivors.
  const winner = battle.outcome.winner;
  const winnerPlayer = winner === null ? null : winner === ATTACKER ? attacker.player : defending.player;
  if (winner !== null && winnerPlayer !== null) {
    const pool = lost[winner === ATTACKER ? DEFENDER : ATTACKER].reduce((sum, m) => sum + xpValue(m.defId), 0);
    const winners = winner === ATTACKER ? { squad: attacker.squad, leader: attacker } : winnerSquad(draft, engagement.defender);
    const standing = winners.squad.filter(alive).length;
    if (pool > 0 && standing > 0) {
      const each = Math.ceil(pool / standing);
      events.push({ type: "xp", player: winnerPlayer, pool, each });
      growSquad(draft, winners, each, winnerPlayer, events);
      // A living leader earns its share like any unit; it also counts toward the leader tree.
      const leaderStands = winners.leader && winners.leader.squad.some((m) => alive(m) && isLeaderOf(m, winners.leader));
      if (winners.leader && leaderStands) winners.leader.experience += each;
    }
  }

  // A warband wiped out by the other side's warband leaves it its items.
  const fighters = [attacker.id, ...(engagement.defender.kind === "leader" ? [engagement.defender.leaderId] : [])];
  settleWarbands(draft, events, (beaten) => (fighters.includes(beaten.id) ? draft.leaders.find((l) => fighters.includes(l.id) && l.id !== beaten.id) : undefined));
  draft.engagement = null;
  updateVision(draft);
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
export function playersIn(engagement: Engagement): PlayerId[] {
  return engagement.players.filter((p): p is PlayerId => p !== null);
}

/**
 * A player whose Guardian fell is out: its warbands disband and its other cities fall neutral, garrisons and all.
 * When one player is left, the game is over.
 */
function eliminate(world: World, player: PlayerId, events: WorldEvent[]): void {
  playerOf(world, player).eliminated = true;
  world.leaders = world.leaders.filter((l) => l.player !== player);
  for (const city of world.cities) if (city.owner === player) city.owner = null;
  events.push({ type: "eliminated", player });
  const standing = world.players.map((p, id) => ({ p, id })).filter(({ p }) => !p.eliminated);
  const last = standing[0];
  if (standing.length === 1 && last) {
    world.outcome = { winner: last.id };
    events.push({ type: "worldEnd", winner: last.id });
  }
}

/**
 * The battle a move would start, played out by the AI on both sides. Deterministic, so it's a true forecast. The
 * mover is always side 0.
 */
export function forecast(world: World, leaderId: string, target: MoveTarget): Battle | null {
  const start = openingBattle(world, leaderId, target);
  return start ? autoplay(start) : null;
}

/** The battle a move would start, not yet played (null for a capture). */
export function openingBattle(world: World, leaderId: string, target: MoveTarget): Battle | null {
  if (target.kind === "capture") return null;
  return engagementBattle(world, leaderById(world, leaderId), defenderOf(target));
}
