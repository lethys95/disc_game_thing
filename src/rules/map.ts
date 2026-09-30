import { hexagon, hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { NodeKind, NodeSite } from "#rules/nodes";
import { hashOf, noise } from "#rules/noise";
import { STRUCTURE_KINDS, structuresPerKind } from "#rules/structures";
import type { StructureKind } from "#rules/structures";

/** Provisional terrain (docs/design/pillars.md leaves terrain to the map model): costs are placeholders. */
export type Terrain = "plain" | "forest" | "hills" | "mountain" | "water";

export const isTerrain = (key: string): key is Terrain => key in TERRAIN_COST;

export const TERRAIN_COST: Readonly<Record<Terrain, number | null>> = {
  plain: 1,
  forest: 2,
  hills: 2,
  mountain: null,
  water: null,
};

/**
 * A region's look (user, 2026-09-30: biomes are mostly cosmetic; careful with effects): the same terrains, drawn
 * differently. It changes no rule yet. "temperate" is a placeholder name for the land the map had before biomes.
 */
export type Biome = "temperate" | "desert";

export interface MapTile {
  readonly hex: Hex;
  readonly terrain: Terrain;
  readonly biome: Biome;
}

/**
 * A city's spot; a Capitol also names the start (player) it belongs to. Nodes belong to their city (Warlords 3
 * style): whoever holds the city holds them.
 */
export type Site = {
  readonly id: string;
  readonly hex: Hex;
  readonly nodes: readonly NodeSite[];
} & ({ readonly kind: "capitol"; readonly start: number } | { readonly kind: "city" });

/** A neutral group's spot: a camp (just the group) or a dungeon (a group guarding a one-time reward). */
export interface LairSite {
  readonly id: string;
  readonly kind: "camp" | "dungeon";
  readonly hex: Hex;
}

/** A structure's spot (`rules/structures.ts`). */
export interface StructureSite {
  readonly id: string;
  readonly kind: StructureKind;
  readonly hex: Hex;
}

/**
 * A portal (user, 2026-09-28: "not unlike HoMM3"): two linked hexes; a warband on one can step to the other as if
 * they were neighbors. A map structure nobody holds.
 */
export interface Portal {
  readonly id: string;
  readonly a: Hex;
  readonly b: Hex;
}

export interface WorldMap {
  readonly radius: number;
  readonly tiles: Readonly<Record<string, MapTile>>;
  /** One start per player, where its Capitol stands. */
  readonly starts: readonly Hex[];
  readonly sites: readonly Site[];
  readonly lairs: readonly LairSite[];
  readonly structures: readonly StructureSite[];
  readonly portals: readonly Portal[];
}



export function tileAt(map: WorldMap, hex: Hex): MapTile | undefined {
  return map.tiles[hexKey(hex)];
}

export function stepCost(map: WorldMap, hex: Hex): number | null {
  const tile = tileAt(map, hex);
  return tile ? TERRAIN_COST[tile.terrain] : null;
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

/**
 * Provisional (#60): one desert per map, a patch with a wandering edge about half the map's radius across, centered
 * on a hex partway out from the middle, in a direction the seed picks.
 */
function biomeFor(seed: number, hex: Hex, radius: number): Biome {
  const angle = noise(seed + 6007, 0, 0) * Math.PI * 2;
  const out = radius * 0.45;
  const q = Math.round(out * Math.cos(angle));
  const r = Math.round(out * Math.sin(angle) - q / 2);
  const reach = radius * 0.5 + (smooth(seed + 6011, hex) - 0.5) * 3;
  return hexDistance(hex, { q, r }) <= reach ? "desert" : "temperate";
}

/**
 * One start per player on the corners of the ring just inside the edge, spread evenly (two players: opposite
 * corners). Up to six players; the start hexes are cleared to plain ground.
 */
function startHexes(radius: number, players: number): Hex[] {
  const k = radius - 1;
  const corners: Hex[] = [{ q: k, r: 0 }, { q: 0, r: k }, { q: -k, r: k }, { q: -k, r: 0 }, { q: 0, r: -k }, { q: k, r: -k }];
  if (players < 2 || players > corners.length) throw new Error(`maps hold 2 to ${corners.length} players, not ${players}`);
  return Array.from({ length: players }, (_, i) => corners[(2 + Math.floor((i * corners.length) / players)) % corners.length] ?? { q: 0, r: 0 });
}

/** Map sizes to choose at setup (user, 2026-09-27: "we should support more sizes"); radii provisional. */
export type MapSize = "small" | "medium" | "large" | "huge";

export const MAP_SIZES: Readonly<Record<MapSize, { readonly name: string; readonly radius: number }>> = {
  small: { name: "Small", radius: 5 },
  medium: { name: "Medium", radius: 6 },
  large: { name: "Large", radius: 7 },
  huge: { name: "Huge", radius: 8 },
};

export const isMapSize = (key: string): key is MapSize => key in MAP_SIZES;

/** The size a game gets unless the player picks one: bigger for more players. */
export const defaultMapSize = (players: number): MapSize => (players <= 2 ? "small" : players <= 4 ? "medium" : "large");

const hexCount = (radius: number) => 3 * radius * (radius + 1) + 1;

/**
 * A map for `players` players. On the default size for that many players (provisional): two neutral cities more
 * than there are players, a camp and a dungeon per player and one more of each; other sizes scale those counts with
 * their area. The user's playtest (2026-09-27): at radius 4 the enemy Capitol was two turns away.
 */
export function generateMap(seed: number, players = 2, size: MapSize = defaultMapSize(players)): WorldMap {
  const radius = MAP_SIZES[size].radius;
  const area = hexCount(radius) / hexCount(MAP_SIZES[defaultMapSize(players)].radius);
  const neutralCities = Math.max(players, Math.round((players + 2) * area));
  const lairsEach = Math.max(1, Math.round((players + 1) * area));
  const starts = startHexes(radius, players);
  for (let attempt = 0; ; attempt++) {
    const variant = seed + attempt * 104729;
    const tiles: Record<string, MapTile> = {};
    for (const hex of hexagon(radius)) {
      const clear = starts.some((s) => hexDistance(s, hex) <= 1);
      tiles[hexKey(hex)] = { hex, terrain: clear ? "plain" : terrainFor(variant, hex, radius), biome: biomeFor(variant, hex, radius) };
    }
    const bare: WorldMap = { radius, tiles, starts, sites: [], lairs: [], structures: [], portals: [] };
    const first = starts[0];
    if (!first || starts.some((s) => !sameHex(s, first) && !findPath(bare, first, s, () => false))) continue;
    const sites = placeSites(bare, variant, neutralCities);
    const lairs = placeLairs(bare, sites, variant, lairsEach);
    const structures = placeStructures(bare, sites, lairs, variant);
    if (STRUCTURE_KINDS.some((kind) => !structures.some((s) => s.kind === kind))) continue;
    const portals = placePortals(bare, [...sites.flatMap((s) => [s.hex, ...s.nodes.map((n) => n.hex)]), ...lairs.map((l) => l.hex), ...structures.map((s) => s.hex)], variant);
    const map: WorldMap = { ...bare, sites, lairs, structures, portals };
    const spots = [...sites.map((s) => s.hex), ...lairs.map((l) => l.hex), ...structures.map((s) => s.hex)];
    const everyoneReaches = spots.every((hex) => starts.every((start) => sameHex(start, hex) || findPath(map, start, hex, () => false)));
    if (everyoneReaches) return map;
  }
}

/** Capitols on the starts; neutral cities spread over the middle ground, each with one node beside it. */
function placeSites(map: WorldMap, seed: number, neutralCities: number): Site[] {
  const walkable = (hex: Hex) => stepCost(map, hex) !== null;
  const specials = [...SPECIAL_NODES].sort((a, b) => noise(seed + 43, hashOf(a), 0) - noise(seed + 43, hashOf(b), 0));
  // Each Capitol has a gold mine of its own (user: Capitols count as cities for nodes).
  const capitolMine = (start: Hex, side: number): NodeSite[] => {
    const spot = neighbors(start)
      .filter((n) => walkable(n) && !map.starts.some((s) => sameHex(s, n)))
      .sort((a, b) => noise(seed + 41 + side, a.q, a.r) - noise(seed + 41 + side, b.q, b.r))[0];
    return spot ? [{ kind: "gold", hex: spot }] : [];
  };
  const sites: Site[] = map.starts.map((hex, side) => ({ id: `capitol${side}`, kind: "capitol", start: side, hex, nodes: capitolMine(hex, side) }));
  const taken = (hex: Hex) => sites.some((s) => sameHex(s.hex, hex) || s.nodes.some((n) => sameHex(n.hex, hex)));
  const candidates = Object.values(map.tiles)
    .map((t) => t.hex)
    .filter((hex) => walkable(hex) && map.starts.every((s) => hexDistance(s, hex) >= 3))
    .sort((a, b) => noise(seed + 31, a.q, a.r) - noise(seed + 31, b.q, b.r));
  for (const hex of candidates) {
    const cities = sites.filter((s) => s.kind === "city").length;
    if (cities >= neutralCities) break;
    if (sites.some((s) => hexDistance(s.hex, hex) < 3)) continue;
    const spots = neighbors(hex)
      .filter((n) => walkable(n) && !taken(n) && !map.starts.some((s) => sameHex(s, n)))
      .sort((a, b) => noise(seed + 37, a.q, a.r) - noise(seed + 37, b.q, b.r));
    const [first, second] = spots;
    if (!first) continue;
    // Provisional (#56): every neutral city has an economic node (the third a mana node, the others a gold mine)
    // and, where there's room beside it, one of the special kinds, dealt from a shuffled deck so maps differ and
    // none repeats until all have been dealt.
    const economy: NodeKind = cities === 2 ? "mana" : "gold";
    const special = specials[cities % specials.length];
    const nodes: NodeSite[] = [{ kind: economy, hex: first }, ...(second && special ? [{ kind: special, hex: second }] : [])];
    sites.push({ id: `city${cities + 1}`, kind: "city", hex, nodes });
  }
  return sites;
}

/** The node kinds a neutral city can have besides gold and mana. */
export const SPECIAL_NODES: readonly NodeKind[] = [
  "blacksmith",
  "cathedral",
  "foundry",
  "leech_pits",
  "stables",
  "tannery",
  "siege_workshop",
  "quarry",
  "ossuary",
  "watchtower",
  "bell_tower",
  "tribal_outpost",
];

/** `each` camps and `each` dungeons on free walkable hexes, away from the Capitols and from each other. */
function placeLairs(map: WorldMap, sites: readonly Site[], seed: number, each: number): LairSite[] {
  const lairs: LairSite[] = [];
  const used = (hex: Hex) =>
    sites.some((s) => hexDistance(s.hex, hex) < 2 || s.nodes.some((n) => sameHex(n.hex, hex))) || lairs.some((l) => hexDistance(l.hex, hex) < 2);
  const candidates = Object.values(map.tiles)
    .map((t) => t.hex)
    .filter((hex) => stepCost(map, hex) !== null && map.starts.every((s) => hexDistance(s, hex) >= 2))
    .sort((a, b) => noise(seed + 53, a.q, a.r) - noise(seed + 53, b.q, b.r));
  for (const hex of candidates) {
    if (used(hex)) continue;
    const camps = lairs.filter((l) => l.kind === "camp").length;
    const dungeons = lairs.filter((l) => l.kind === "dungeon").length;
    if (camps < each) lairs.push({ id: `camp${camps}`, kind: "camp", hex });
    else if (dungeons < each) lairs.push({ id: `dungeon${dungeons}`, kind: "dungeon", hex });
    else break;
  }
  return lairs;
}

/**
 * Structures on free walkable hexes. Of each kind, one per so many hexes (user: more on bigger maps, #54). The first
 * of each stands on contested ground (its nearest two Capitols within a hex of the same distance, so no player has
 * it to itself); more, where contested ground runs out, anywhere at least 3 hexes from every Capitol.
 */
function placeStructures(map: WorldMap, sites: readonly Site[], lairs: readonly LairSite[], seed: number): StructureSite[] {
  const structures: StructureSite[] = [];
  const used = (hex: Hex) =>
    sites.some((s) => hexDistance(s.hex, hex) < 2 || s.nodes.some((n) => sameHex(n.hex, hex))) ||
    lairs.some((l) => hexDistance(l.hex, hex) < 2) ||
    structures.some((s) => hexDistance(s.hex, hex) < 2);
  const distances = (hex: Hex) => map.starts.map((s) => hexDistance(s, hex)).sort((a, b) => a - b);
  const open = Object.values(map.tiles)
    .map((t) => t.hex)
    .filter((hex) => stepCost(map, hex) !== null && (distances(hex)[0] ?? 0) >= 3)
    .sort((a, b) => noise(seed + 67, a.q, a.r) - noise(seed + 67, b.q, b.r));
  const contested = open.filter((hex) => {
    const [nearest, next] = distances(hex);
    return nearest !== undefined && next !== undefined && next - nearest <= 1;
  });
  const each = structuresPerKind(Object.keys(map.tiles).length);
  for (let i = 0; i < each; i++) {
    for (const kind of STRUCTURE_KINDS) {
      const hex = contested.find((h) => !used(h)) ?? (i > 0 ? open.find((h) => !used(h)) : undefined);
      if (hex) structures.push({ id: `${kind}${i}`, kind, hex });
    }
  }
  return structures;
}

/** One pair per this many hexes; the ends at least this far apart (provisional #56). */
const HEXES_PER_PORTAL = 90;
const PORTAL_REACH = 4;

/**
 * Portal pairs on free walkable hexes, each linking to the farthest free hex from its first end, away from the
 * Capitols, so a portal is a real shortcut across the map.
 */
function placePortals(map: WorldMap, taken: readonly Hex[], seed: number): Portal[] {
  const pairs = Math.max(1, Math.floor(Object.keys(map.tiles).length / HEXES_PER_PORTAL));
  const portals: Portal[] = [];
  // A portal may stand beside a city or a camp, just not on one, nor next to another portal.
  const used = (hex: Hex) => taken.some((t) => sameHex(t, hex)) || portals.some((p) => hexDistance(p.a, hex) < 2 || hexDistance(p.b, hex) < 2);
  const open = Object.values(map.tiles)
    .map((t) => t.hex)
    .filter((hex) => stepCost(map, hex) !== null && map.starts.every((s) => hexDistance(s, hex) >= 3))
    .sort((a, b) => noise(seed + 71, a.q, a.r) - noise(seed + 71, b.q, b.r));
  for (const a of open) {
    if (portals.length >= pairs) break;
    if (used(a)) continue;
    const b = open.filter((hex) => !used(hex)).sort((x, y) => hexDistance(y, a) - hexDistance(x, a))[0];
    if (b && hexDistance(a, b) >= PORTAL_REACH) portals.push({ id: `portal${portals.length}`, a, b });
  }
  return portals;
}

/** Where a warband can step from `hex`: its neighbors, and a portal's other end. */
export function exits(map: WorldMap, hex: Hex): Hex[] {
  const twins = map.portals.flatMap((p) => (sameHex(p.a, hex) ? [p.b] : sameHex(p.b, hex) ? [p.a] : []));
  return [...neighbors(hex), ...twins];
}

/** A lower bound on the steps from `a` to `b`, portals included, so A* stays exact. */
function stepsAtLeast(map: WorldMap, a: Hex, b: Hex): number {
  let best = hexDistance(a, b);
  for (const p of map.portals) {
    best = Math.min(best, hexDistance(a, p.a) + 1 + hexDistance(p.b, b), hexDistance(a, p.b) + 1 + hexDistance(p.a, b));
  }
  return best;
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
  const open = new Map<string, { hex: Hex; cost: number; estimate: number }>([[hexKey(from), { hex: from, cost: 0, estimate: stepsAtLeast(map, from, to) }]]);
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
    for (const next of exits(map, current.hex)) {
      const cost = stepCost(map, next);
      if (cost === null) continue;
      if (!sameHex(next, to) && blocked(next)) continue;
      const total = current.cost + cost;
      const k = hexKey(next);
      if (total >= (best.get(k) ?? Infinity)) continue;
      best.set(k, total);
      came.set(k, current.hex);
      open.set(k, { hex: next, cost: total, estimate: total + stepsAtLeast(map, next, to) });
    }
  }
  return null;
}
