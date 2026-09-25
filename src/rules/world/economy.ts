import { CAPITOL_HEALING, CAPITOL_INCOME, GARRISON_LIMIT, RESURRECTION_BASE, RESURRECTION_PREMIUM } from "#rules/balance";
import type { Side, Tile } from "#rules/battle/types";
import { chooseProblem, isFork, openForks } from "#rules/forks";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import { sameHex } from "#rules/hex";
import { NODES } from "#rules/nodes";
import { grow, xpToEvolve } from "#rules/progression";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units/index";
import { leadershipOf, learnProblem, movementOf, squadHealingOf } from "#rules/world/leaders";
import { maxHpOf } from "#rules/world/record";
import { UPGRADES, upgradesFor } from "#rules/upgrades";
import { capitolOf, leaderAt, leaderById, member } from "#rules/world/state";
import type { City, Leader, Mark, RecruitInto, SquadMember, World, WorldEvent } from "#rules/world/state";

/** Gold, recruiting, branch choices, resurrection, elevation, and the start of a side's turn. */

export function income(world: World, side: Side): number {
  const nodes = world.cities.filter((c) => c.owner === side).flatMap((c) => c.nodes);
  return (capitolOf(world, side) ? CAPITOL_INCOME : 0) + nodes.reduce((sum, n) => sum + NODES[n.kind].income, 0);
}


export function freeTile(squad: readonly SquadMember[]): Tile | null {
  for (const row of ROWS) for (const col of COLS) if (!squad.some((m) => sameTile(m.tile, { row, col }))) return { row, col };
  return null;
}

/** Why a recruit order can't happen, or null if it can. */
export function recruitProblem(world: World, defId: string, into: RecruitInto): string | null {
  const side = world.activeSide;
  const cost = RECRUIT_COST[defId];
  const capitol = capitolOf(world, side);
  if (cost === undefined || !FACTION_ROOTS[world.factions[side]].includes(defId)) return "not recruitable";
  if (!capitol) return "no Capitol";
  if (world.gold[side] < cost) return "not enough gold";
  return roomProblem(world, capitol, into);
}

/** Why this side can't choose `to` at `fork` now, or null. */
export function chooseBranchProblem(world: World, fork: string, to: string): string | null {
  const side = world.activeSide;
  if (!openForks(world.factions[side], world.commitment[side]).includes(fork)) return "not an open fork";
  return chooseProblem(world.commitment[side], fork, to);
}

/** Forks where one of this side's units waits, XP full, for a choice. The view prompts; the AI just chooses. */
export function waitingForks(world: World, side: Side): string[] {
  const forks = squadsOf(world, side).flatMap(({ squad }) => squad.filter((m) => isFork(m.defId) && world.commitment[side][m.defId] === undefined && m.xp >= (xpToEvolve(m.defId) ?? Infinity)).map((m) => m.defId));
  return [...new Set(forks)];
}

export function resurrectionCost(world: World, side: Side, index: number): number | null {
  const fallen = world.graveyard[side][index];
  if (!fallen) return null;
  const base = RESURRECTION_BASE * Math.max(1, UNITS[fallen.defId]?.tier ?? 1);
  const waited = world.turn - fallen.fellOnTurn;
  return base * Math.max(1, RESURRECTION_PREMIUM - waited);
}

export function resurrectProblem(world: World, index: number, into: RecruitInto): string | null {
  const side = world.activeSide;
  const cost = resurrectionCost(world, side, index);
  const capitol = capitolOf(world, side);
  if (cost === null) return "nobody there";
  if (!capitol) return "no Capitol";
  if (world.gold[side] < cost) return "not enough gold";
  return roomProblem(world, capitol, into);
}

export function roomProblem(world: World, capitol: City, into: RecruitInto): string | null {
  if (into.kind === "garrison") return capitol.garrison.length >= GARRISON_LIMIT ? "garrison full" : null;
  const leader = leaderById(world, into.leaderId);
  if (leader.side !== world.activeSide || !sameHex(leader.hex, capitol.hex)) return "leader not in the Capitol";
  const leadership = leadershipOf(leader);
  return leader.squad.length >= leadership ? `squad full (Leadership ${leadership})` : null;
}

export function squadFor(world: World, into: RecruitInto): SquadMember[] | undefined {
  return into.kind === "garrison" ? capitolOf(world, world.activeSide)?.garrison : leaderById(world, into.leaderId).squad;
}

/** A squad and its leader; garrisons have none. */
export interface Held {
  readonly squad: SquadMember[];
  readonly leader: Leader | undefined;
}

/** Every squad a side owns: its warbands and its garrisons. */
export function squadsOf(world: World, side: Side): Held[] {
  return [
    ...world.leaders.filter((l) => l.side === side).map((l) => ({ squad: l.squad, leader: l })),
    ...world.cities.filter((c) => c.owner === side).map((c) => ({ squad: c.garrison, leader: undefined })),
  ];
}

/**
 * The marks a unit receives on becoming `defId`: the side's upgrades for that type. Upgrades bought later never
 * reach it; a unit that becomes the type later does (the timing rule, docs/design/pillars.md).
 */
export function marksOnBecoming(world: World, side: Side, defId: string): Mark[] {
  return upgradesFor(defId)
    .filter((u) => world.upgrades[side].includes(u.id))
    .map((u): Mark => ({ effect: u.effect, source: { kind: "upgrade", upgrade: u.id } }));
}

/** A new unit for `side`: recruited, joining, or otherwise acquired. */
export function newcomer(world: World, side: Side, defId: string, tile: Tile): SquadMember {
  return { ...member(defId, tile), marks: marksOnBecoming(world, side, defId) };
}

/** Evolves members in place; the new form arrives at full health (provisional). */
export function growSquad(world: World, { squad, leader }: Held, gained: number, side: Side, events: WorldEvent[]): void {
  squad.forEach((m, i) => {
    const growth = grow(m.defId, m.xp, gained, world.commitment[side]);
    let from = m.defId;
    for (const to of growth.evolvedInto) {
      events.push({ type: "evolved", side, from, to });
      from = to;
    }
    if (growth.evolvedInto.length === 0) {
      squad[i] = { ...m, xp: growth.xp };
      return;
    }
    const marks = [...m.marks, ...growth.evolvedInto.flatMap((to) => marksOnBecoming(world, side, to))];
    const evolved = { ...m, defId: growth.defId, xp: growth.xp, marks };
    squad[i] = { ...evolved, hp: maxHpOf(evolved, leader) };
  });
}

export function elevateProblem(world: World, tile: Tile): string | null {
  const capitol = capitolOf(world, world.activeSide);
  if (!capitol) return "no Capitol";
  const unit = capitol.garrison.find((m) => sameTile(m.tile, tile));
  if (!unit) return "no unit there";
  if (unit.defId === GUARDIAN_ID) return "the Guardian never leaves the Capitol";
  if (leaderAt(world, capitol.hex)) return "a leader already stands in the Capitol";
  return null;
}


export function startTurn(world: World, events: WorldEvent[]): void {
  const side = world.activeSide;
  const earned = income(world, side);
  world.gold[side] += earned;
  const capitol = capitolOf(world, side);
  for (const { squad, leader } of squadsOf(world, side)) {
    const resting = capitol !== undefined && (leader === undefined ? squad === capitol.garrison : sameHex(leader.hex, capitol.hex));
    const share = (resting ? CAPITOL_HEALING : 0) + (leader ? squadHealingOf(leader) : 0);
    if (share === 0) continue;
    squad.forEach((m, i) => {
      const max = maxHpOf(m, leader);
      squad[i] = { ...m, hp: Math.min(max, m.hp + Math.ceil(max * share)) };
    });
  }
  for (const leader of world.leaders) if (leader.side === side) leader.movement = movementOf(leader);
  events.push({ type: "turnStarted", side, turn: world.turn, income: earned });
}

export function learnSkillProblem(world: World, leaderId: string, skill: string): string | null {
  const leader = leaderById(world, leaderId);
  if (leader.side !== world.activeSide) return "not your leader";
  return learnProblem(leader, skill);
}

export function upgradeProblem(world: World, id: string): string | null {
  const side = world.activeSide;
  const upgrade = UPGRADES.get(id);
  if (!upgrade) return "no such upgrade";
  if (UNITS[upgrade.unitType]?.faction !== world.factions[side]) return "another faction's unit";
  if (world.upgrades[side].includes(id)) return "already bought";
  if (!capitolOf(world, side)) return "no Capitol";
  if (world.gold[side] < upgrade.price) return "not enough gold";
  return null;
}
