import { levelBonus } from "#rules/balance";
import type { Battle, EffectSeed, Side, Tile } from "#rules/battle/types";
import type { Commitment } from "#rules/forks";
import type { PlayerColor } from "#rules/world/colors";
import { hexDistance, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { WorldMap } from "#rules/map";
import type { CityNode } from "#rules/nodes";
import { UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";

/** The world's data (warbands, cities, lairs, graveyards) and lookups over it. */

/** Where a unit's difference from its baseline came from: the track record (docs/design/pillars.md). */
export type MarkSource =
  | { readonly kind: "leaderTree"; readonly skill: string }
  | { readonly kind: "upgrade"; readonly upgrade: string }
  | { readonly kind: "levels"; readonly levels: number };

/** A lasting difference from the unit's baseline: an effect it brings into every battle, and its source. */
export interface Mark {
  readonly effect: EffectSeed;
  readonly source: MarkSource;
}

/** A unit in a squad on the map; its HP, XP and marks carry from one battle to the next. */
export interface SquadMember {
  readonly defId: string;
  readonly tile: Tile;
  readonly hp: number;
  readonly xp: number;
  readonly marks: readonly Mark[];
  /** Levels gained past the end of its line (pillars.md). */
  readonly level: number;
}

/** A unit in its side's graveyard, waiting for resurrection at the Capitol. */
export interface Fallen {
  readonly defId: string;
  readonly fellOnTurn: number;
  /** Marks and levels survive death: a resurrected unit keeps its track record. */
  readonly marks: readonly Mark[];
  readonly level: number;
}

export interface Leader {
  readonly id: string;
  readonly side: Side;
  hex: Hex;
  movement: number;
  /** XP the leader has earned in all; it buys points in the leader tree. */
  experience: number;
  /** Ranks learned in the leader tree, by skill id (`world/leaders.ts`). */
  skills: Record<string, number>;
  /**
   * When the leader's own unit fell while its squad won: it stays in the squad at 0 HP, fields no bonuses, and
   * waits to be revived at the Capitol (as in D2). Null while it lives.
   */
  fellOnTurn: number | null;
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
  /** Upgraded with gold: garrison slots and armor for defenders (balance.ts, CITY_SLOTS). Kept when captured. */
  tier: number;
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
  /** A cleared camp's turn to regrow (provisional, questions.md #19); null while guarded, and for dungeons. */
  regrowsOn: number | null;
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
  /** Who owns what, on screen (`world/colors.ts`). */
  colors: [PlayerColor, PlayerColor];
  commitment: [Commitment, Commitment];
  graveyard: [Fallen[], Fallen[]];
  /** Unit-type upgrades each side has bought (`rules/upgrades.ts`). */
  upgrades: [string[], string[]];
}

/** A squad on the map: a city's garrison, or a warband (`world/squads.ts`). */
export type SquadRef = { readonly kind: "garrison"; readonly cityId: string } | { readonly kind: "warband"; readonly leaderId: string };

export type WorldAction =
  | { type: "move"; leaderId: string; to: Hex }
  | { type: "endTurn" }
  /** `tile` picks the spot; without it, the first free one. */
  | { type: "recruit"; defId: string; into: SquadRef; tile?: Tile }
  /** Move a unit between squads that meet, or within one; onto an occupied tile, the two swap. */
  | { type: "transfer"; from: SquadRef; fromTile: Tile; to: SquadRef; toTile: Tile }
  | { type: "elevate"; tile: Tile }
  /** Choose a branch at a fork: free and permanent, for every unit of that kind. */
  | { type: "choose"; fork: string; to: string }
  | { type: "resurrect"; index: number; into: SquadRef; tile?: Tile }
  | { type: "learn"; leaderId: string; skill: string }
  /** Revive a warband's fallen leader at the Capitol. */
  | { type: "revive"; leaderId: string }
  /** Raise a city you hold one tier. */
  | { type: "upgradeCity"; cityId: string }
  /** Buy a unit-type upgrade: units that become that type from now on receive it. */
  | { type: "upgrade"; upgrade: string };

export type WorldEvent =
  | { type: "moved"; leaderId: string; path: readonly Hex[] }
  | { type: "engaged"; attackerId: string; defender: Defender }
  | { type: "captured"; cityId: string; side: Side }
  | { type: "turnStarted"; side: Side; turn: number; income: number }
  | { type: "recruited"; defId: string; into: SquadRef }
  | { type: "transferred"; from: SquadRef; to: SquadRef }
  | { type: "elevated"; leaderId: string }
  | { type: "leaderFell"; leaderId: string; side: Side }
  | { type: "xp"; side: Side; pool: number; each: number }
  | { type: "evolved"; side: Side; from: string; to: string }
  | { type: "leveled"; side: Side; defId: string; level: number }
  | { type: "fell"; side: Side; defId: string }
  | { type: "chose"; side: Side; fork: string; to: string }
  | { type: "cleared"; lairId: string; side: Side }
  | { type: "regrew"; lairId: string }
  | { type: "looted"; lairId: string; side: Side; gold: number; joins: string | null }
  | { type: "resurrected"; side: Side; defId: string }
  | { type: "learned"; leaderId: string; skill: string }
  | { type: "revived"; leaderId: string }
  | { type: "cityUpgraded"; cityId: string; tier: number }
  | { type: "upgraded"; side: Side; upgrade: string }
  | { type: "worldEnd"; winner: Side };

export interface WorldStep {
  readonly world: World;
  readonly events: readonly WorldEvent[];
}


export const fullHp = (defId: string) => UNITS[defId]?.stats.maxHp ?? 0;

/** Only a fallen leader stays in its squad at 0 HP; every other dead unit leaves for the graveyard. */
export const alive = (m: SquadMember) => m.hp > 0;

export const leaderUnit = (leader: Leader): SquadMember | undefined => leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col);

export const member = (defId: string, tile: Tile): SquadMember => ({ defId, tile, hp: fullHp(defId), xp: 0, marks: [], level: 0 });

export type Strength = "weak" | "medium" | "strong";

/** Provisional bandit groups (the user's bandit units; formations and sizes are placeholders). */
/**
 * Provisional bandit groups (the user's bandit units; formations, sizes and levels are placeholders). The user:
 * neutrals should be a challenge from the start. Stronger groups are bigger and seasoned (levels, pillars.md).
 */
const BANDIT_GROUPS: Readonly<Record<Strength, { readonly level: number; readonly units: readonly [string, Tile][] }>> = {
  weak: {
    level: 0,
    units: [["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }]],
  },
  medium: {
    level: 2,
    units: [
      ["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["brigand", { row: 0, col: 2 }],
      ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }],
    ],
  },
  strong: {
    level: 4,
    units: [
      ["marauder", { row: 0, col: 0 }], ["brigand", { row: 0, col: 1 }], ["marauder", { row: 0, col: 2 }],
      ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }], ["bandit", { row: 1, col: 2 }],
    ],
  },
};

export function banditGroup(strength: Strength): SquadMember[] {
  const { level, units } = BANDIT_GROUPS[strength];
  return units.map(([defId, tile]) => {
    const hp = fullHp(defId);
    return { ...member(defId, tile), level, hp: hp + levelBonus(hp, level) };
  });
}

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
