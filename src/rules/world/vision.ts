import { CAPITOL_SIGHT, CITY_SIGHT, WARBAND_SIGHT } from "#rules/balance";
import { hexDistance, hexKey } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { MapTile, WorldMap } from "#rules/map";
import { playerOf } from "#rules/world/state";
import type { Player, PlayerId, World } from "#rules/world/state";

/**
 * Fog of war (pillars.md): unexplored hexes are hidden; explored ones out of sight show what was there when last
 * seen. Each player's explored hexes and memory live in the world, so the rules, the AI and the view agree on what
 * a player knows. The AI plans from `knownWorld`, never from the world itself.
 */

/** The hexes a player sees now: around its warbands and the cities it holds. */
export function sightOf(world: World, player: PlayerId): Set<string> {
  const eyes: [Hex, number][] = [
    ...world.leaders.filter((l) => l.player === player).map((l): [Hex, number] => [l.hex, WARBAND_SIGHT]),
    ...world.cities.filter((c) => c.owner === player).map((c): [Hex, number] => [c.hex, c.kind === "capitol" ? CAPITOL_SIGHT : CITY_SIGHT]),
  ];
  const seen = new Set<string>();
  for (const tile of Object.values(world.map.tiles)) {
    if (eyes.some(([hex, range]) => hexDistance(hex, tile.hex) <= range)) seen.add(hexKey(tile.hex));
  }
  return seen;
}

/** What a player sees now and has ever seen, for drawing the fog. */
export interface Vision {
  readonly visible: ReadonlySet<string>;
  readonly explored: ReadonlySet<string>;
}

export function visionOf(world: World, player: PlayerId): Vision {
  return { visible: sightOf(world, player), explored: new Set(playerOf(world, player).explored) };
}

/**
 * Updates a player's explored hexes and memory from what it sees now (on a draft world). A city the player held
 * and lost is updated too, wherever it is: losing a city is news that reaches you.
 */
export function see(world: World, player: PlayerId): void {
  const me = playerOf(world, player);
  const visible = sightOf(world, player);
  const explored = new Set(me.explored);
  for (const key of visible) if (!explored.has(key)) me.explored.push(key);
  const inSight = (hex: Hex) => visible.has(hexKey(hex));
  const lost = new Set(me.memory.cities.filter((c) => c.owner === player).map((c) => c.id));
  me.memory = {
    cities: remember(me.memory.cities, world.cities.filter((c) => inSight(c.hex) || lost.has(c.id))),
    lairs: remember(me.memory.lairs, world.lairs.filter((l) => inSight(l.hex))),
    nodes: remember(me.memory.nodes, world.nodes.filter((n) => inSight(n.hex))),
  };
}

/** Every player still in the game sees what it sees now. Called after anything that changes the world. */
export function updateVision(world: World): void {
  world.players.forEach((p, id) => {
    if (!p.eliminated) see(world, id);
  });
}

function remember<T extends { readonly id: string }>(memory: readonly T[], seen: readonly T[]): T[] {
  const fresh = new Set(seen.map((s) => s.id));
  return [...memory.filter((m) => !fresh.has(m.id)), ...structuredClone(seen)];
}

/**
 * The world as a player knows it: its own warbands and cities as they are, other warbands only in sight, places
 * out of sight as last seen, and nothing it hasn't explored. Unexplored terrain reads as plain: a march into the
 * unknown is planned blind and stops when it sees what's really there (`world/actions.ts`).
 */
export function knownWorld(world: World, player: PlayerId): World {
  const me = playerOf(world, player);
  const visible = sightOf(world, player);
  const explored = new Set(me.explored);
  const recall = <T extends { readonly id: string; readonly hex: Hex }>(truth: readonly T[], memory: readonly T[]): T[] =>
    truth.flatMap((t) => (visible.has(hexKey(t.hex)) ? [t] : memory.filter((m) => m.id === t.id)));
  return {
    ...world,
    // Other players show only what anyone could see: faction, color, whether they're still in the game.
    players: world.players.map((p, id) => (id === player ? p : hidden(p))),
    map: blindMap(world.map, explored),
    leaders: world.leaders.filter((l) => l.player === player || visible.has(hexKey(l.hex))),
    cities: world.cities.flatMap((c) => (c.owner === player ? [c] : recall([c], me.memory.cities))),
    lairs: recall(world.lairs, me.memory.lairs),
    nodes: recall(world.nodes, me.memory.nodes),
  };
}

function hidden(p: Player): Player {
  return {
    ...p,
    gold: 0,
    mana: { red: 0, teal: 0 },
    commitment: {},
    graveyard: [],
    upgrades: [],
    research: [],
    spells: [],
    cast: [],
    explored: [],
    memory: { cities: [], lairs: [], nodes: [] },
  };
}

function blindMap(map: WorldMap, explored: ReadonlySet<string>): WorldMap {
  const tiles = Object.values(map.tiles);
  if (tiles.every((t) => explored.has(hexKey(t.hex)))) return map;
  const known: Record<string, MapTile> = {};
  for (const tile of tiles) known[hexKey(tile.hex)] = explored.has(hexKey(tile.hex)) ? tile : { hex: tile.hex, terrain: "plain" };
  return { ...map, tiles: known };
}
