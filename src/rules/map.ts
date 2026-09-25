import { hexagon, hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";

/** Provisional terrain (docs/design/pillars.md leaves terrain to the map model): costs are placeholders. */
export type Terrain = "plain" | "forest" | "hills" | "mountain" | "water";

export const TERRAIN_COST: Readonly<Record<Terrain, number | null>> = {
  plain: 1,
  forest: 2,
  hills: 2,
  mountain: null,
  water: null,
};

export interface MapTile {
  readonly hex: Hex;
  readonly terrain: Terrain;
}

/** A city on the map. Nodes belong to their city (Warlords 3 style): whoever holds the city holds them. */
export interface Site {
  readonly id: string;
  readonly kind: "capitol" | "city";
  readonly hex: Hex;
  readonly goldMines: readonly Hex[];
}

/** A neutral group's spot: a camp (just the group) or a dungeon (a group guarding a one-time reward). */
export interface LairSite {
  readonly id: string;
  readonly kind: "camp" | "dungeon";
  readonly hex: Hex;
}

export interface WorldMap {
  readonly radius: number;
  readonly tiles: Readonly<Record<string, MapTile>>;
  readonly starts: readonly [Hex, Hex];
  readonly sites: readonly Site[];
  readonly lairs: readonly LairSite[];
}

/** Provisional counts for a radius-4 map. */
const CAMPS = 2;
const DUNGEONS = 2;

/** Provisional: three neutral cities on a radius-4 map. */
const NEUTRAL_CITIES = 3;

export function tileAt(map: WorldMap, hex: Hex): MapTile | undefined {
  return map.tiles[hexKey(hex)];
}

export function stepCost(map: WorldMap, hex: Hex): number | null {
  const tile = tileAt(map, hex);
  return tile ? TERRAIN_COST[tile.terrain] : null;
}

/** Deterministic integer hash noise in [0, 1): the map is a pure function of its seed. */
function noise(seed: number, q: number, r: number): number {
  let h = (seed ^ Math.imul(q, 374761393) ^ Math.imul(r, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** Noise smoothed over a hex and its neighbours, so terrain comes in patches rather than speckles. */
function smooth(seed: number, hex: Hex): number {
  const around = neighbors(hex).map((n) => noise(seed, n.q, n.r));
  return (noise(seed, hex.q, hex.r) * 2 + around.reduce((a, b) => a + b, 0)) / (2 + around.length);
}

function terrainFor(seed: number, hex: Hex, radius: number): Terrain {
  const height = smooth(seed, hex);
  const wet = smooth(seed + 7919, hex);
  if (hexDistance(hex, { q: 0, r: 0 }) === radius && height > 0.62) return "mountain";
  if (height > 0.66) return "mountain";
  if (height > 0.57) return "hills";
  if (wet > 0.64) return "water";
  if (wet > 0.53) return "forest";
  return "plain";
}

/** Opposite corners, pushed onto plain ground: each side starts on a walkable hex. */
function startHexes(radius: number): [Hex, Hex] {
  return [
    { q: -radius + 1, r: radius - 1 },
    { q: radius - 1, r: -radius + 1 },
  ];
}

export function generateMap(seed: number, radius = 4): WorldMap {
  const starts = startHexes(radius);
  for (let attempt = 0; ; attempt++) {
    const variant = seed + attempt * 104729;
    const tiles: Record<string, MapTile> = {};
    for (const hex of hexagon(radius)) {
      const clear = starts.some((s) => hexDistance(s, hex) <= 1);
      tiles[hexKey(hex)] = { hex, terrain: clear ? "plain" : terrainFor(variant, hex, radius) };
    }
    const bare: WorldMap = { radius, tiles, starts, sites: [], lairs: [] };
    if (!findPath(bare, starts[0], starts[1], () => false)) continue;
    const sites = placeSites(bare, variant);
    const lairs = placeLairs(bare, sites, variant);
    const map: WorldMap = { ...bare, sites, lairs };
    const spots = [...sites.map((s) => s.hex), ...lairs.map((l) => l.hex)];
    const everyoneReaches = spots.every((hex) => starts.every((start) => sameHex(start, hex) || findPath(map, start, hex, () => false)));
    if (everyoneReaches) return map;
  }
}

/** Capitols on the starts; neutral cities spread over the middle ground, each with one gold mine beside it. */
function placeSites(map: WorldMap, seed: number): Site[] {
  const sites: Site[] = map.starts.map((hex, side) => ({ id: `capitol${side}`, kind: "capitol", hex, goldMines: [] }));
  const walkable = (hex: Hex) => stepCost(map, hex) !== null;
  const taken = (hex: Hex) => sites.some((s) => sameHex(s.hex, hex) || s.goldMines.some((m) => sameHex(m, hex)));
  const candidates = Object.values(map.tiles)
    .map((t) => t.hex)
    .filter((hex) => walkable(hex) && map.starts.every((s) => hexDistance(s, hex) >= 3))
    .sort((a, b) => noise(seed + 31, a.q, a.r) - noise(seed + 31, b.q, b.r));
  for (const hex of candidates) {
    if (sites.filter((s) => s.kind === "city").length >= NEUTRAL_CITIES) break;
    if (sites.some((s) => hexDistance(s.hex, hex) < 3)) continue;
    const mine = neighbors(hex)
      .filter((n) => walkable(n) && !taken(n) && !map.starts.some((s) => sameHex(s, n)))
      .sort((a, b) => noise(seed + 37, a.q, a.r) - noise(seed + 37, b.q, b.r))[0];
    if (!mine) continue;
    sites.push({ id: `city${sites.length - 1}`, kind: "city", hex, goldMines: [mine] });
  }
  return sites;
}

/** Camps and dungeons on free walkable hexes, away from the Capitols and from each other. */
function placeLairs(map: WorldMap, sites: readonly Site[], seed: number): LairSite[] {
  const lairs: LairSite[] = [];
  const used = (hex: Hex) =>
    sites.some((s) => hexDistance(s.hex, hex) < 2 || s.goldMines.some((m) => sameHex(m, hex))) || lairs.some((l) => hexDistance(l.hex, hex) < 2);
  const candidates = Object.values(map.tiles)
    .map((t) => t.hex)
    .filter((hex) => stepCost(map, hex) !== null && map.starts.every((s) => hexDistance(s, hex) >= 2))
    .sort((a, b) => noise(seed + 53, a.q, a.r) - noise(seed + 53, b.q, b.r));
  for (const hex of candidates) {
    if (used(hex)) continue;
    const camps = lairs.filter((l) => l.kind === "camp").length;
    const dungeons = lairs.filter((l) => l.kind === "dungeon").length;
    if (camps < CAMPS) lairs.push({ id: `camp${camps}`, kind: "camp", hex });
    else if (dungeons < DUNGEONS) lairs.push({ id: `dungeon${dungeons}`, kind: "dungeon", hex });
    else break;
  }
  return lairs;
}

export interface Path {
  readonly hexes: readonly Hex[];
  readonly cost: number;
}

/**
 * Cheapest path by terrain cost (A*). `blocked` hexes can't be entered, except the goal itself, so a
 * path can end on an enemy to attack it.
 */
export function findPath(map: WorldMap, from: Hex, to: Hex, blocked: (hex: Hex) => boolean): Path | null {
  if (stepCost(map, to) === null) return null;
  const open = new Map<string, { hex: Hex; cost: number; estimate: number }>([[hexKey(from), { hex: from, cost: 0, estimate: hexDistance(from, to) }]]);
  const came = new Map<string, Hex>();
  const best = new Map<string, number>([[hexKey(from), 0]]);
  while (open.size > 0) {
    let currentKey = "";
    let current: { hex: Hex; cost: number; estimate: number } | undefined;
    for (const [k, node] of open) {
      if (!current || node.estimate < current.estimate || (node.estimate === current.estimate && k < currentKey)) {
        current = node;
        currentKey = k;
      }
    }
    if (!current) break;
    open.delete(currentKey);
    if (sameHex(current.hex, to)) {
      const hexes = [to];
      let step = came.get(hexKey(to));
      while (step && !sameHex(step, from)) {
        hexes.unshift(step);
        step = came.get(hexKey(step));
      }
      return { hexes, cost: current.cost };
    }
    for (const next of neighbors(current.hex)) {
      const cost = stepCost(map, next);
      if (cost === null) continue;
      if (!sameHex(next, to) && blocked(next)) continue;
      const total = current.cost + cost;
      const k = hexKey(next);
      if (total >= (best.get(k) ?? Infinity)) continue;
      best.set(k, total);
      came.set(k, current.hex);
      open.set(k, { hex: next, cost: total, estimate: total + hexDistance(next, to) });
    }
  }
  return null;
}
