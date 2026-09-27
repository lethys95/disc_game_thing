import { LEADER_MOVEMENT, STARTING_GOLD } from "#rules/balance";
import type { Placement } from "#rules/battle/engine";
import type { Commitment } from "#rules/forks";
import { generateMap } from "#rules/map";
import { GUARDIAN_ID } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { hexDistance } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { startTurn } from "#rules/world/economy";
import { updateVision } from "#rules/world/vision";
import type { PlayerColor } from "#rules/world/colors";
import { banditGroup, DUNGEON_REWARDS, member, strengthAt } from "#rules/world/state";
import type { City, Lair, Leader, Player, World } from "#rules/world/state";

/** Setting up a new game on a generated map. */

/** What a player brings to a new game: a starting warband and its faction, choices and color. */
export interface PlayerSetup {
  readonly squad: readonly Placement[];
  readonly faction: Playable;
  readonly commitment: Commitment;
  readonly color: PlayerColor;
}

/** A game for two or more players; each starts at its own Capitol, player 0 moves first. */
export function createWorld(seed: number, setups: readonly PlayerSetup[]): World {
  const map = generateMap(seed, setups.length);
  const leaders = setups.map((setup, player): Leader => {
    const first = setup.squad[0];
    const start = map.starts[player];
    if (!first || !start) throw new Error("a leader needs at least one unit and a start");
    return {
      id: `leader${player}`,
      player,
      hex: start,
      movement: LEADER_MOVEMENT,
      experience: 0,
      skills: {},
      fellOnTurn: null,
      enchantments: [],
      worn: [],
      bag: [],
      squad: setup.squad.map((p) => member(p.defId, p.tile)),
      leaderTile: first.tile,
    };
  });
  const cities = map.sites.map((site): City => {
    // Capitols are generated in player order, one per start.
    const owner = site.kind === "capitol" ? Number(site.id.replace("capitol", "")) : null;
    return {
      id: site.id,
      kind: site.kind,
      hex: site.hex,
      owner,
      garrison: site.kind === "capitol" ? [member(GUARDIAN_ID, { row: 0, col: 1 })] : banditGroup(strengthAt(map, site.hex, "medium")),
      tier: 1,
      enchantments: [],
    };
  });
  // Rewards cycle over the dungeons in order (camps have none).
  const dungeons = map.lairs.filter((l) => l.kind === "dungeon");
  const lairs = map.lairs.map((site): Lair => ({
    id: site.id,
    kind: site.kind,
    hex: site.hex,
    guards: banditGroup(strengthAt(map, site.hex, site.kind === "dungeon" ? "medium" : "weak")),
    reward: site.kind === "dungeon" ? (DUNGEON_REWARDS[dungeons.indexOf(site) % DUNGEON_REWARDS.length] ?? null) : null,
    looted: false,
    regrowsOn: null,
  }));
  const players = setups.map(
    (setup): Player => ({
      faction: setup.faction,
      color: setup.color,
      gold: STARTING_GOLD,
      commitment: setup.commitment,
      graveyard: [],
      upgrades: [],
      research: [],
      eliminated: false,
      mana: { red: 0, teal: 0 },
      spells: [],
      cast: [],
      explored: [],
      memory: { cities: [], lairs: [], nodes: [] },
    }),
  );
  const world: World = {
    map,
    leaders,
    cities,
    nodes: map.sites.flatMap((site) => site.nodes).map((n, index) => ({ id: `node${index}`, kind: n.kind, hex: n.hex, cityId: nearestCity(cities, n.hex).id, level: 1 })),
    lairs,
    players,
    turn: 1,
    activePlayer: 0,
    engagement: null,
    outcome: null,
    nextLeader: setups.length,
  };
  startTurn(world, []);
  updateVision(world);
  return world;
}

/**
 * A node belongs to the nearest city, Capitols included (user, 2026-09-26). Ties go to the first city in the list,
 * so it's deterministic.
 */
function nearestCity(cities: readonly City[], hex: Hex): City {
  let best: City | undefined;
  for (const city of cities) if (!best || hexDistance(city.hex, hex) < hexDistance(best.hex, hex)) best = city;
  if (!best) throw new Error("a map without cities");
  return best;
}
