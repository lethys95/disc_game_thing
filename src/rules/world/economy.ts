import { CAMP_MEDIUM_FROM, CAMP_STRONG_FROM, CAPITOL_HEALING, CITY_MAX_TIER, CITY_UPGRADE_COST, CAPITOL_INCOME, RESURRECTION_BASE, RESURRECTION_PREMIUM } from "#rules/balance";
import type { Side, Tile } from "#rules/battle/types";
import { chooseProblem, isFork, openForks } from "#rules/forks";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import { sameHex } from "#rules/hex";
import { NODES } from "#rules/nodes";
import { grow, xpToEvolve } from "#rules/progression";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units/index";
import { learnProblem, movementOf, squadHealingOf } from "#rules/world/leaders";
import { maxHpOf } from "#rules/world/record";
import { UPGRADES, upgradesFor } from "#rules/upgrades";
import { alive, banditGroup, capitolOf, cityById, leaderAt, leaderById, leaderUnit, member } from "#rules/world/state";
import type { City, Leader, Mark, SquadMember, SquadRef, Strength, World, WorldEvent } from "#rules/world/state";
import { capacityOf, hexOf, ownerOf, squadAt } from "#rules/world/squads";

/** Gold, recruiting, branch choices, resurrection, elevation, and the start of a side's turn. */

export function income(world: World, side: Side): number {
  const nodes = world.cities.filter((c) => c.owner === side).flatMap((c) => c.nodes);
  return (capitolOf(world, side) ? CAPITOL_INCOME : 0) + nodes.reduce((sum, n) => sum + NODES[n.kind].income, 0);
}


export function freeTile(squad: readonly SquadMember[]): Tile | null {
  for (const row of ROWS) for (const col of COLS) if (!squad.some((m) => sameTile(m.tile, { row, col }))) return { row, col };
  return null;
}

/** Why a recruit order can't happen, or null if it can. Any city you hold recruits (pillars.md, "Cities"). */
export function recruitProblem(world: World, defId: string, into: SquadRef, tile?: Tile): string | null {
  const side = world.activeSide;
  const cost = RECRUIT_COST[defId];
  if (cost === undefined || !FACTION_ROOTS[world.factions[side]].includes(defId)) return "not recruitable";
  if (world.gold[side] < cost) return "not enough gold";
  return placeProblem(world, into, tile, (city) => city.owner === side);
}

/**
 * Why a new unit can't be put into this squad, or null: a garrison of a city that qualifies, or a warband standing
 * in one; room left; and the tile, if one is named, free.
 */
function placeProblem(world: World, into: SquadRef, tile: Tile | undefined, qualifies: (city: City) => boolean): string | null {
  const side = world.activeSide;
  if (ownerOf(world, into) !== side) return "not your squad";
  const city = into.kind === "garrison" ? cityById(world, into.cityId) : world.cities.find((c) => sameHex(c.hex, hexOf(world, into)));
  if (!city || !qualifies(city)) return into.kind === "garrison" ? "not here" : "the warband must stand in the right city";
  const squad = squadAt(world, into);
  if (squad.length >= capacityOf(world, into)) return into.kind === "warband" ? `squad full (Leadership ${capacityOf(world, into)})` : "garrison full";
  if (tile && squad.some((m) => sameTile(m.tile, tile))) return "that spot is taken";
  return null;
}

/** Why this side can't choose `to` at `fork` now, or null. */
export function chooseBranchProblem(world: World, fork: string, to: string): string | null {
  const side = world.activeSide;
  if (!openForks(world.factions[side], world.commitment[side]).includes(fork)) return "not an open fork";
  return chooseProblem(world.commitment[side], fork, to);
}

/** Forks where one of this side's units waits, XP full, for a choice. The view prompts; the AI just chooses. */
export function waitingForks(world: World, side: Side): string[] {
  const forks = squadsOf(world, side).flatMap(({ squad }) => squad.filter((m) => alive(m) && isFork(m.defId) && world.commitment[side][m.defId] === undefined && m.xp >= (xpToEvolve(m.defId) ?? Infinity)).map((m) => m.defId));
  return [...new Set(forks)];
}

/** Canon: dear at once, cheaper for each turn you wait, down to a base by tier. */
function raiseCost(world: World, defId: string, fellOnTurn: number): number {
  const base = RESURRECTION_BASE * Math.max(1, UNITS[defId]?.tier ?? 1);
  return base * Math.max(1, RESURRECTION_PREMIUM - (world.turn - fellOnTurn));
}

export function resurrectionCost(world: World, side: Side, index: number): number | null {
  const fallen = world.graveyard[side][index];
  return fallen ? raiseCost(world, fallen.defId, fallen.fellOnTurn) : null;
}

/** Reviving a warband's fallen leader costs what resurrecting it would (provisional). */
export function reviveCost(world: World, leader: Leader): number | null {
  const own = leaderUnit(leader);
  return own && leader.fellOnTurn !== null ? raiseCost(world, own.defId, leader.fellOnTurn) : null;
}

export function reviveProblem(world: World, leaderId: string): string | null {
  const leader = leaderById(world, leaderId);
  const capitol = capitolOf(world, world.activeSide);
  const cost = reviveCost(world, leader);
  if (leader.side !== world.activeSide) return "not your leader";
  if (cost === null) return "the leader stands";
  if (!capitol || !sameHex(leader.hex, capitol.hex)) return "the warband must stand in the Capitol";
  if (world.gold[leader.side] < cost) return "not enough gold";
  return null;
}

/** Resurrection happens at the Capitol: into its garrison, or a warband standing in it. */
export function resurrectProblem(world: World, index: number, into: SquadRef, tile?: Tile): string | null {
  const side = world.activeSide;
  const cost = resurrectionCost(world, side, index);
  if (cost === null) return "nobody there";
  if (world.gold[side] < cost) return "not enough gold";
  return placeProblem(world, into, tile, (city) => city.kind === "capitol" && city.owner === side);
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

/** Evolves or levels members in place; a new form or level arrives at full health (provisional). */
export function growSquad(world: World, { squad, leader }: Held, gained: number, side: Side, events: WorldEvent[]): void {
  squad.forEach((m, i) => {
    if (!alive(m)) return;
    const growth = grow(m.defId, m.xp, gained, world.commitment[side]);
    let from = m.defId;
    for (const to of growth.evolvedInto) {
      events.push({ type: "evolved", side, from, to });
      from = to;
    }
    if (growth.levels > 0) {
      const leveled = { ...m, xp: growth.xp, level: m.level + growth.levels };
      events.push({ type: "leveled", side, defId: m.defId, level: leveled.level });
      squad[i] = { ...leveled, hp: maxHpOf(leveled, leader) };
      return;
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
    const share = (resting ? CAPITOL_HEALING : 0) + (leader && leader.fellOnTurn === null ? squadHealingOf(leader) : 0);
    if (share === 0) continue;
    squad.forEach((m, i) => {
      if (!alive(m)) return;
      const max = maxHpOf(m, leader);
      squad[i] = { ...m, hp: Math.min(max, m.hp + Math.ceil(max * share)) };
    });
  }
  for (const leader of world.leaders) if (leader.side === side) leader.movement = movementOf(leader);
  if (side === 0) regrowCamps(world, events);
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

/** Provisional (#19): cleared camps regrow, stronger as the game goes on, so XP never runs dry. */
function regrowCamps(world: World, events: WorldEvent[]): void {
  const strength: Strength = world.turn >= CAMP_STRONG_FROM ? "strong" : world.turn >= CAMP_MEDIUM_FROM ? "medium" : "weak";
  for (const lair of world.lairs) {
    if (lair.regrowsOn === null || lair.regrowsOn > world.turn || leaderAt(world, lair.hex)) continue;
    lair.guards = banditGroup(strength);
    lair.regrowsOn = null;
    events.push({ type: "regrew", lairId: lair.id });
  }
}

export const cityUpgradeCost = (city: City): number => CITY_UPGRADE_COST * (city.tier + 1);

export function upgradeCityProblem(world: World, cityId: string): string | null {
  const city = cityById(world, cityId);
  if (city.owner !== world.activeSide) return "not your city";
  if (city.tier >= CITY_MAX_TIER) return "already at the highest tier";
  if (world.gold[world.activeSide] < cityUpgradeCost(city)) return "not enough gold";
  return null;
}
