import { autoplay } from "#rules/ai";
import { createBattle } from "#rules/battle";
import type { Placement } from "#rules/battle";
import { commit, INVESTMENT_COST, openBranches, SQUAD_LIMIT } from "#rules/doctrine";
import type { Commitment } from "#rules/doctrine";
import { COLS, ROWS, sameTile } from "#rules/grid";
import { hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { findPath, generateMap, stepCost } from "#rules/map";
import type { Path, WorldMap } from "#rules/map";
import type { Battle, Side, Tile } from "#rules/types";
import { grow, xpValue } from "#rules/progression";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units";
import type { Branch, Playable } from "#rules/units";

/** A unit in a squad on the map; its HP and XP carry from one battle to the next. */
export interface SquadMember extends Placement {
  readonly hp: number;
  readonly xp: number;
}

/** A unit in its side's graveyard, waiting for resurrection at the Capitol. */
export interface Fallen {
  readonly defId: string;
  readonly fellOnTurn: number;
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

export interface City {
  readonly id: string;
  readonly kind: "capitol" | "city";
  readonly hex: Hex;
  readonly goldMines: readonly Hex[];
  owner: Side | null;
  /** The leaderless fortification squad. A Capitol's includes its Guardian. */
  garrison: SquadMember[];
}

/** A one-time dungeon reward (user's 2024 design: gold, a creature that joins you; items once they exist). */
export interface Reward {
  readonly gold: number;
  readonly joins: string | null;
}

/** A neutral group on the map: a camp, or the guards of a dungeon and its reward. */
export interface Lair {
  readonly id: string;
  readonly kind: "camp" | "dungeon";
  readonly hex: Hex;
  guards: SquadMember[];
  readonly reward: Reward | null;
  looted: boolean;
}

export type Defender = { kind: "leader"; leaderId: string } | { kind: "garrison"; cityId: string } | { kind: "lair"; lairId: string };

export interface Engagement {
  readonly attackerId: string;
  readonly defender: Defender;
  readonly battle: Battle;
}

export interface World {
  readonly map: WorldMap;
  leaders: Leader[];
  cities: City[];
  lairs: Lair[];
  gold: [number, number];
  turn: number;
  activeSide: Side;
  engagement: Engagement | null;
  outcome: { winner: Side } | null;
  nextLeader: number;
  factions: [Playable, Playable];
  commitment: [Commitment, Commitment];
  graveyard: [Fallen[], Fallen[]];
}

export type RecruitInto = { kind: "garrison" } | { kind: "leader"; leaderId: string };

export type WorldAction =
  | { type: "move"; leaderId: string; to: Hex }
  | { type: "endTurn" }
  | { type: "recruit"; defId: string; into: RecruitInto }
  | { type: "elevate"; tile: Tile }
  | { type: "invest"; branch: Branch }
  | { type: "resurrect"; index: number; into: RecruitInto };

export type WorldEvent =
  | { type: "moved"; leaderId: string; path: readonly Hex[] }
  | { type: "engaged"; attackerId: string; defender: Defender }
  | { type: "captured"; cityId: string; side: Side }
  | { type: "turnStarted"; side: Side; turn: number; income: number }
  | { type: "recruited"; defId: string; into: RecruitInto }
  | { type: "elevated"; leaderId: string }
  | { type: "leaderFell"; leaderId: string }
  | { type: "xp"; side: Side; pool: number; each: number }
  | { type: "evolved"; side: Side; from: string; to: string }
  | { type: "fell"; side: Side; defId: string }
  | { type: "invested"; side: Side; branch: Branch }
  | { type: "cleared"; lairId: string; side: Side }
  | { type: "looted"; lairId: string; side: Side; gold: number; joins: string | null }
  | { type: "resurrected"; side: Side; defId: string }
  | { type: "worldEnd"; winner: Side };

export interface WorldStep {
  readonly world: World;
  readonly events: readonly WorldEvent[];
}

// Provisional numbers: canon has none yet (docs/questions.md).
export const LEADER_MOVEMENT = 4;
export const STARTING_GOLD = 100;
export const CAPITOL_INCOME = 50;
export const MINE_INCOME = 25;
/** Share of max HP restored at the start of its side's turn to every unit resting in its own Capitol. */
export const CAPITOL_HEALING = 0.25;
/** Garrison size, Guardian included. */
export const GARRISON_LIMIT = 6;
/** Resurrection's floor price per tier (the Congregant's canon 40 gold at tier 1). */
export const RESURRECTION_BASE = 40;
/** Canon: immediate resurrection is expensive and the price decays each turn you wait. Provisional: 3× base, minus one base per turn. */
export const RESURRECTION_PREMIUM = 3;

const fullHp = (defId: string) => UNITS[defId]?.stats.maxHp ?? 0;

const member = (defId: string, tile: Tile): SquadMember => ({ defId, tile, hp: fullHp(defId), xp: 0 });

type Strength = "weak" | "medium" | "strong";

/** Provisional bandit groups (the user's bandit units; formations and sizes are placeholders). */
const BANDIT_GROUPS: Readonly<Record<Strength, readonly [string, Tile][]>> = {
  weak: [["brigand", { row: 0, col: 1 }], ["bandit", { row: 1, col: 1 }]],
  medium: [["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["bandit", { row: 1, col: 1 }]],
  strong: [
    ["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["brigand", { row: 0, col: 2 }],
    ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }],
  ],
};

const banditGroup = (strength: Strength): SquadMember[] => BANDIT_GROUPS[strength].map(([defId, tile]) => member(defId, tile));

/** Stronger the further from both Capitols: easy fights near home, harder ones in the middle. */
function strengthAt(map: WorldMap, hex: Hex, atLeast: Strength): Strength {
  const near = Math.min(...map.starts.map((s) => hexDistance(s, hex)));
  const byDistance: Strength = near <= 3 ? "weak" : near <= 4 ? "medium" : "strong";
  const order: readonly Strength[] = ["weak", "medium", "strong"];
  return order[Math.max(order.indexOf(byDistance), order.indexOf(atLeast))] ?? atLeast;
}

/** Provisional dungeon rewards, alternating between gold and a unit that joins. */
const DUNGEON_REWARDS: readonly Reward[] = [{ gold: 200, joins: null }, { gold: 50, joins: "hedge_mage" }];

export function createWorld(
  seed: number,
  squads: readonly [readonly Placement[], readonly Placement[]],
  commitment: readonly [Commitment, Commitment],
  factions: readonly [Playable, Playable],
): World {
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
      squad: squad.map((p) => member(p.defId, p.tile)),
      leaderTile: first.tile,
    };
  });
  const cities = map.sites.map((site): City => {
    const owner: Side | null = site.kind === "capitol" ? (sameHex(site.hex, map.starts[0]) ? 0 : 1) : null;
    return {
      id: site.id,
      kind: site.kind,
      hex: site.hex,
      goldMines: site.goldMines,
      owner,
      garrison: site.kind === "capitol" ? [member(GUARDIAN_ID, { row: 0, col: 1 })] : banditGroup(strengthAt(map, site.hex, "medium")),
    };
  });
  const lairs = map.lairs.map((site, index): Lair => ({
    id: site.id,
    kind: site.kind,
    hex: site.hex,
    guards: banditGroup(strengthAt(map, site.hex, site.kind === "dungeon" ? "medium" : "weak")),
    reward: site.kind === "dungeon" ? (DUNGEON_REWARDS[index % DUNGEON_REWARDS.length] ?? null) : null,
    looted: false,
  }));
  const world: World = {
    map,
    leaders,
    cities,
    lairs,
    gold: [STARTING_GOLD, STARTING_GOLD],
    turn: 1,
    activeSide: 0,
    engagement: null,
    outcome: null,
    nextLeader: 2,
    factions: [factions[0], factions[1]],
    commitment: [commitment[0], commitment[1]],
    graveyard: [[], []],
  };
  startTurn(world, []);
  return world;
}

function unitId(side: Side, tile: Tile): string {
  return `${side}.${tile.row}.${tile.col}`;
}

export function leaderById(world: World, id: string): Leader {
  const leader = world.leaders.find((l) => l.id === id);
  if (!leader) throw new Error(`unknown leader: ${id}`);
  return leader;
}

export function cityById(world: World, id: string): City {
  const city = world.cities.find((c) => c.id === id);
  if (!city) throw new Error(`unknown city: ${id}`);
  return city;
}

export function leaderAt(world: World, hex: Hex): Leader | undefined {
  return world.leaders.find((l) => sameHex(l.hex, hex));
}

/** A lair whose guards still stand. Looted dungeons and cleared camps don't block anything. */
export function lairAt(world: World, hex: Hex): Lair | undefined {
  return world.lairs.find((l) => sameHex(l.hex, hex) && l.guards.length > 0);
}

export function lairById(world: World, id: string): Lair {
  const lair = world.lairs.find((l) => l.id === id);
  if (!lair) throw new Error(`unknown lair: ${id}`);
  return lair;
}

export function cityAt(world: World, hex: Hex): City | undefined {
  return world.cities.find((c) => sameHex(c.hex, hex));
}

export function capitolOf(world: World, side: Side): City | undefined {
  return world.cities.find((c) => c.kind === "capitol" && c.owner === side);
}

export function income(world: World, side: Side): number {
  const mines = world.cities.filter((c) => c.owner === side).reduce((sum, c) => sum + c.goldMines.length, 0);
  return (capitolOf(world, side) ? CAPITOL_INCOME : 0) + mines * MINE_INCOME;
}

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
export function destination(world: World, side: Side, hex: Hex): MoveTarget | null | "blocked" {
  const leader = leaderAt(world, hex);
  if (leader) return leader.side === side ? "blocked" : { kind: "leader", leaderId: leader.id };
  const lair = lairAt(world, hex);
  if (lair) return { kind: "lair", lairId: lair.id };
  const city = cityAt(world, hex);
  if (!city || city.owner === side) return null;
  return city.garrison.length > 0 ? { kind: "garrison", cityId: city.id } : { kind: "capture", cityId: city.id };
}

export function planMove(world: World, leaderId: string, to: Hex): MovePlan | null {
  const leader = leaderById(world, leaderId);
  const goal = destination(world, leader.side, to);
  if (goal === "blocked") return null;
  // Other leaders and cities not your own can only be a march's goal, never a waypoint.
  const blocked = (hex: Hex) => destination(world, leader.side, hex) !== null;
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
    for (const next of neighbors(hex)) {
      const cost = stepCost(world.map, next);
      if (cost === null || destination(world, leader.side, next) !== null) continue;
      const total = spent + cost;
      if (total > leader.movement || total >= (costs.get(hexKey(next)) ?? Infinity)) continue;
      costs.set(hexKey(next), total);
      frontier.push(next);
    }
  }
  return costs;
}

function freeTile(squad: readonly SquadMember[]): Tile | null {
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

export function investProblem(world: World, branch: Branch): string | null {
  const side = world.activeSide;
  if (!openBranches(world.factions[side], world.commitment[side]).includes(branch)) return "not an open fork";
  return world.gold[side] < INVESTMENT_COST[branch] ? "not enough gold" : null;
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

function roomProblem(world: World, capitol: City, into: RecruitInto): string | null {
  if (into.kind === "garrison") return capitol.garrison.length >= GARRISON_LIMIT ? "garrison full" : null;
  const leader = leaderById(world, into.leaderId);
  if (leader.side !== world.activeSide || !sameHex(leader.hex, capitol.hex)) return "leader not in the Capitol";
  return leader.squad.length >= SQUAD_LIMIT ? "squad full" : null;
}

function squadFor(world: World, into: RecruitInto): SquadMember[] | undefined {
  return into.kind === "garrison" ? capitolOf(world, world.activeSide)?.garrison : leaderById(world, into.leaderId).squad;
}

/** Every squad a side owns: its warbands and its garrisons. */
function squadsOf(world: World, side: Side): SquadMember[][] {
  return [...world.leaders.filter((l) => l.side === side).map((l) => l.squad), ...world.cities.filter((c) => c.owner === side).map((c) => c.garrison)];
}

/** Evolves members in place; the new form arrives at full health (provisional). */
function growSquad(squad: SquadMember[], gained: number, side: Side, commitment: Commitment, events: WorldEvent[]): void {
  squad.forEach((m, i) => {
    const growth = grow(m.defId, m.xp, gained, commitment);
    let from = m.defId;
    for (const to of growth.evolvedInto) {
      events.push({ type: "evolved", side, from, to });
      from = to;
    }
    squad[i] = growth.evolvedInto.length > 0 ? { ...m, defId: growth.defId, xp: growth.xp, hp: fullHp(growth.defId) } : { ...m, xp: growth.xp };
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

export function applyWorldAction(world: World, action: WorldAction): WorldStep {
  if (world.outcome || world.engagement) throw new Error("the world is not taking orders");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  const side = draft.activeSide;
  switch (action.type) {
    case "move": {
      const leader = leaderById(draft, action.leaderId);
      if (leader.side !== side) throw new Error(`${leader.id} cannot move on the other side's turn`);
      const plan = planMove(draft, leader.id, action.to);
      if (!plan) throw new Error(`no path for ${leader.id}`);
      const walked = plan.path.hexes.slice(0, plan.steps);
      for (const hex of walked) leader.movement -= stepCost(draft.map, hex) ?? 0;
      const last = walked[walked.length - 1];
      if (last) leader.hex = last;
      if (walked.length > 0) events.push({ type: "moved", leaderId: leader.id, path: walked });
      const target = plan.target;
      if (target?.kind === "capture") {
        const city = cityById(draft, target.cityId);
        city.owner = side;
        events.push({ type: "captured", cityId: city.id, side });
      } else if (target) {
        leader.movement = 0;
        const defender = defenderOf(target);
        draft.engagement = { attackerId: leader.id, defender, battle: engagementBattle(draft, leader, defender) };
        events.push({ type: "engaged", attackerId: leader.id, defender });
      }
      break;
    }
    case "endTurn": {
      draft.activeSide = side === 0 ? 1 : 0;
      if (draft.activeSide === 0) draft.turn += 1;
      startTurn(draft, events);
      break;
    }
    case "recruit": {
      const problem = recruitProblem(draft, action.defId, action.into);
      if (problem) throw new Error(`cannot recruit: ${problem}`);
      const squad = squadFor(draft, action.into);
      const tile = squad ? freeTile(squad) : null;
      if (!squad || !tile) throw new Error("no room");
      squad.push(member(action.defId, tile));
      draft.gold[side] -= RECRUIT_COST[action.defId] ?? 0;
      events.push({ type: "recruited", defId: action.defId, into: action.into });
      break;
    }
    case "elevate": {
      const problem = elevateProblem(draft, action.tile);
      const capitol = capitolOf(draft, side);
      const unit = capitol?.garrison.find((m) => sameTile(m.tile, action.tile));
      if (problem || !capitol || !unit) throw new Error(`cannot elevate: ${problem}`);
      capitol.garrison = capitol.garrison.filter((m) => m !== unit);
      const tile = { row: 0, col: 1 } as const;
      const id = `leader${draft.nextLeader}`;
      draft.nextLeader += 1;
      draft.leaders.push({ id, side, hex: capitol.hex, movement: LEADER_MOVEMENT, squad: [{ ...unit, tile }], leaderTile: tile });
      events.push({ type: "elevated", leaderId: id });
      break;
    }
    case "invest": {
      const problem = investProblem(draft, action.branch);
      if (problem) throw new Error(`cannot invest: ${problem}`);
      draft.gold[side] -= INVESTMENT_COST[action.branch];
      draft.commitment[side] = commit(draft.factions[side], draft.commitment[side], action.branch);
      events.push({ type: "invested", side, branch: action.branch });
      for (const squad of squadsOf(draft, side)) growSquad(squad, 0, side, draft.commitment[side], events);
      break;
    }
    case "resurrect": {
      const problem = resurrectProblem(draft, action.index, action.into);
      const cost = resurrectionCost(draft, side, action.index);
      const fallen = draft.graveyard[side][action.index];
      const squad = squadFor(draft, action.into);
      const tile = squad ? freeTile(squad) : null;
      if (problem || cost === null || !fallen || !squad || !tile) throw new Error(`cannot resurrect: ${problem}`);
      draft.gold[side] -= cost;
      draft.graveyard[side].splice(action.index, 1);
      squad.push({ defId: fallen.defId, tile, hp: 1, xp: 0 });
      events.push({ type: "resurrected", side, defId: fallen.defId });
      break;
    }
  }
  return { world: draft, events };
}

function startTurn(world: World, events: WorldEvent[]): void {
  const side = world.activeSide;
  const earned = income(world, side);
  world.gold[side] += earned;
  const capitol = capitolOf(world, side);
  if (capitol) {
    const resting = [capitol.garrison, ...world.leaders.filter((l) => l.side === side && sameHex(l.hex, capitol.hex)).map((l) => l.squad)];
    for (const squad of resting) {
      squad.forEach((m, i) => {
        const max = fullHp(m.defId);
        squad[i] = { ...m, hp: Math.min(max, m.hp + Math.ceil(max * CAPITOL_HEALING)) };
      });
    }
  }
  for (const leader of world.leaders) if (leader.side === side) leader.movement = LEADER_MOVEMENT;
  events.push({ type: "turnStarted", side, turn: world.turn, income: earned });
}

function defenderOf(target: Exclude<MoveTarget, { kind: "capture" }>): Defender {
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

function engagementBattle(world: World, attacker: Leader, defender: Defender): Battle {
  const defending = defendingSquad(world, defender, attacker.side);
  const squads: [SquadMember[], SquadMember[]] = attacker.side === 0 ? [attacker.squad, defending.squad] : [defending.squad, attacker.squad];
  return createBattle(squads).battle;
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
    events.push({ type: "leaderFell", leaderId: leader.id });
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

/** The battle a move would start, played out by the AI on both sides. Deterministic, so it's a true forecast. */
export function forecast(world: World, leaderId: string, target: MoveTarget): Battle | null {
  if (target.kind === "capture") return null;
  return autoplay(engagementBattle(world, leaderById(world, leaderId), defenderOf(target)));
}

/** Would an enemy leader be able to reach `hex` next turn and win the fight there? */
function threatened(world: World, leader: Leader, hex: Hex): boolean {
  const moved: World = { ...world, leaders: world.leaders.map((l) => (l.id === leader.id ? { ...l, hex } : l)) };
  return moved.leaders.some((enemy) => {
    if (enemy.side === leader.side) return false;
    const fresh = { ...moved, leaders: moved.leaders.map((l) => (l.id === enemy.id ? { ...l, movement: LEADER_MOVEMENT } : l)) };
    const plan = planMove(fresh, enemy.id, hex);
    if (plan?.target?.kind !== "leader") return false;
    return forecast(fresh, enemy.id, plan.target)?.outcome?.winner === enemy.side;
  });
}

/** Provisional AI taste: the doctrine pnpm sim rates strongest first. */
const AI_BRANCH_PREFERENCE: readonly Branch[] = ["consume", "punishment", "preserve", "sacrifice"];

const strength = (squad: readonly SquadMember[]) => squad.reduce((sum, m) => sum + m.hp, 0);
const fullStrength = (squad: readonly SquadMember[]) => squad.reduce((sum, m) => sum + fullHp(m.defId), 0);

/**
 * Map AI: fill the Capitol, raise a leader when it has none (or gold to spare), then march each leader on the
 * nearest target it can take. It uses deterministic battle forecasts both ways: it skips fights it would lose and
 * won't stop where an enemy could reach it next turn and win. Badly wounded leaders go home to heal.
 */
export function chooseWorldAction(world: World): WorldAction {
  const side = world.activeSide;
  const capitol = capitolOf(world, side);
  const mine = world.leaders.filter((l) => l.side === side);
  const roots = FACTION_ROOTS[world.factions[side]];
  const cost = Math.min(...roots.map((r) => RECRUIT_COST[r] ?? Infinity));
  // Recruit whichever root unit the target squad has fewest of, for a mixed army.
  const pick = (squad: readonly SquadMember[]) =>
    [...roots].sort((a, b) => squad.filter((m) => m.defId === a).length - squad.filter((m) => m.defId === b).length)[0] ?? roots[0] ?? "";

  if (capitol) {
    const home = mine.find((l) => sameHex(l.hex, capitol.hex));
    // Commit at the next fork as soon as it's affordable; save for it otherwise (unless there's no army at all).
    const open = AI_BRANCH_PREFERENCE.filter((b) => openBranches(world.factions[side], world.commitment[side]).includes(b));
    const branch = open[0];
    if (branch && !investProblem(world, branch)) return { type: "invest", branch };
    const reserve = branch && mine.length > 0 ? INVESTMENT_COST[branch] : 0;
    const spare = (price: number) => world.gold[side] - price >= reserve;

    const into: RecruitInto = home ? { kind: "leader", leaderId: home.id } : { kind: "garrison" };
    const bargain = world.graveyard[side]
      .map((fallen, index) => ({ index, tier: UNITS[fallen.defId]?.tier ?? 1, cost: resurrectionCost(world, side, index) ?? Infinity }))
      .filter((f) => f.tier >= 2 && f.cost === RESURRECTION_BASE * f.tier && spare(f.cost) && !resurrectProblem(world, f.index, into))
      .sort((a, b) => b.tier - a.tier)[0];
    if (bargain) return { type: "resurrect", index: bargain.index, into };

    if (home) {
      const defId = pick(home.squad);
      if (spare(RECRUIT_COST[defId] ?? Infinity) && !recruitProblem(world, defId, { kind: "leader", leaderId: home.id })) {
        return { type: "recruit", defId, into: { kind: "leader", leaderId: home.id } };
      }
    }
    // Under threat, recruits stand with the Guardian; a fresh leader in the Capitol would only be picked off.
    const underThreat = world.leaders.some((l) => l.side !== side && planMove({ ...world, leaders: world.leaders.map((x) => (x.id === l.id ? { ...x, movement: LEADER_MOVEMENT } : x)) }, l.id, capitol.hex)?.target);
    const guard = pick(capitol.garrison);
    if (underThreat && !recruitProblem(world, guard, { kind: "garrison" })) {
      return { type: "recruit", defId: guard, into: { kind: "garrison" } };
    }
    const rich = world.gold[side] >= cost * (SQUAD_LIMIT + 1);
    if (!home && !underThreat && (mine.length === 0 || rich)) {
      const spare = capitol.garrison.find((m) => m.defId !== GUARDIAN_ID);
      if (spare && !elevateProblem(world, spare.tile)) return { type: "elevate", tile: spare.tile };
      if (!recruitProblem(world, guard, { kind: "garrison" })) return { type: "recruit", defId: guard, into: { kind: "garrison" } };
    }
  }

  for (const leader of mine) {
    if (leader.movement <= 0) continue;
    const atHome = capitol !== undefined && sameHex(leader.hex, capitol.hex);
    // A thin squad waits at home for recruits while gold keeps coming in.
    if (atHome && leader.squad.length < 3 && income(world, side) >= cost) continue;
    if (strength(leader.squad) < 0.5 * fullStrength(leader.squad) && capitol && !atHome && !leaderAt(world, capitol.hex)) {
      const plan = planMove(world, leader.id, capitol.hex);
      if (plan && plan.steps > 0) return { type: "move", leaderId: leader.id, to: capitol.hex };
      continue;
    }
    const goals: Hex[] = [
      ...world.leaders.filter((l) => l.side !== side).map((l) => l.hex),
      ...world.cities.filter((c) => c.owner !== side).map((c) => c.hex),
      ...world.lairs.filter((l) => l.guards.length > 0).map((l) => l.hex),
    ];
    const options = goals
      .map((hex) => ({ hex, plan: planMove(world, leader.id, hex) }))
      .filter((o): o is { hex: Hex; plan: MovePlan } => o.plan !== null && (o.plan.steps > 0 || o.plan.target !== null))
      .filter(({ hex }) => {
        const goal = destination(world, side, hex);
        if (goal === null || goal === "blocked" || goal.kind === "capture") return true;
        return forecast(world, leader.id, goal)?.outcome?.winner === side;
      })
      .filter(({ plan }) => {
        const stop = plan.steps > 0 ? plan.path.hexes[plan.steps - 1] : leader.hex;
        return (plan.target !== null && plan.target.kind !== "capture") || !stop || !threatened(world, leader, stop);
      })
      .sort((a, b) => a.plan.path.cost - b.plan.path.cost);
    const best = options[0];
    if (best) return { type: "move", leaderId: leader.id, to: best.hex };
  }
  return { type: "endTurn" };
}
