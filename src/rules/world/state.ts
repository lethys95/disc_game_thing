import type { Placement } from "#rules/battle/engine";
import type { Battle, Side, Tile } from "#rules/battle/types";
import type { Commitment } from "#rules/doctrine";
import { hexDistance, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { WorldMap } from "#rules/map";
import type { CityNode } from "#rules/nodes";
import { UNITS } from "#rules/units/index";
import type { Branch, Playable } from "#rules/units/index";

/** The world's data (warbands, cities, lairs, graveyards) and lookups over it. */

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
  readonly nodes: readonly CityNode[];
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
  | { type: "leaderFell"; leaderId: string; side: Side }
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


export const fullHp = (defId: string) => UNITS[defId]?.stats.maxHp ?? 0;

export const member = (defId: string, tile: Tile): SquadMember => ({ defId, tile, hp: fullHp(defId), xp: 0 });

export type Strength = "weak" | "medium" | "strong";

/** Provisional bandit groups (the user's bandit units; formations and sizes are placeholders). */
const BANDIT_GROUPS: Readonly<Record<Strength, readonly [string, Tile][]>> = {
  weak: [["brigand", { row: 0, col: 1 }], ["bandit", { row: 1, col: 1 }]],
  medium: [["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["bandit", { row: 1, col: 1 }]],
  strong: [
    ["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["brigand", { row: 0, col: 2 }],
    ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }],
  ],
};

export const banditGroup = (strength: Strength): SquadMember[] => BANDIT_GROUPS[strength].map(([defId, tile]) => member(defId, tile));

/** Stronger the further from both Capitols: easy fights near home, harder ones in the middle. */
export function strengthAt(map: WorldMap, hex: Hex, atLeast: Strength): Strength {
  const near = Math.min(...map.starts.map((s) => hexDistance(s, hex)));
  const byDistance: Strength = near <= 3 ? "weak" : near <= 4 ? "medium" : "strong";
  const order: readonly Strength[] = ["weak", "medium", "strong"];
  return order[Math.max(order.indexOf(byDistance), order.indexOf(atLeast))] ?? atLeast;
}

/** Provisional dungeon rewards, alternating between gold and a unit that joins. */
export const DUNGEON_REWARDS: readonly Reward[] = [{ gold: 200, joins: null }, { gold: 50, joins: "hedge_mage" }];

export function unitId(side: Side, tile: Tile): string {
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
