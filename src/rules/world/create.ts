import { LEADER_MOVEMENT, STARTING_GOLD } from "#rules/balance";
import type { Placement } from "#rules/battle/engine";
import type { Commitment } from "#rules/forks";
import { defaultMapSize, generateMap } from "#rules/map";
import type { MapSize } from "#rules/map";
import type { StructureSite } from "#rules/map";
import { spellsOf } from "#rules/spells";
import { MERCENARY_STOCKS, MERCHANT_RESTOCK_TURNS, merchantWares } from "#rules/structures";
import { GUARDIAN_ID } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { hexDistance } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { startTurn } from "#rules/world/economy";
import { noMana } from "#rules/factions";
import { updateVision } from "#rules/world/vision";
import type { PlayerColor } from "#rules/world/colors";
import { DUNGEON_REWARDS, emptyMemory, member, neutralGroup, strengthAt, tribeAt } from "#rules/world/state";
import type { City, Lair, Leader, Player, Structure, World } from "#rules/world/state";

/** Setting up a new game on a generated map. */

/** What a player brings to a new game: a starting warband and its faction, choices and color. */
export interface PlayerSetup {
  readonly squad: readonly Placement[];
  readonly faction: Playable;
  readonly commitment: Commitment;
  readonly color: PlayerColor;
}

/** A game for two or more players; each starts at its own Capitol, player 0 moves first. */
export function createWorld(seed: number, setups: readonly PlayerSetup[], size: MapSize = defaultMapSize(setups.length)): World {
  const map = generateMap(seed, setups.length, size);
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
    const owner = site.kind === "capitol" ? site.start : null;
    return {
      id: site.id,
      kind: site.kind,
      hex: site.hex,
      owner,
      garrison: site.kind === "capitol" ? [member(GUARDIAN_ID, { row: 0, col: 1 })] : neutralGroup("bandits", strengthAt(map, site.hex, "medium")),
      tier: 1,
      enchantments: [],
    };
  });
  // Rewards cycle over the dungeons in order (camps have none).
  const dungeons = map.lairs.filter((l) => l.kind === "dungeon");
  const lairs = map.lairs.map((site): Lair => {
    const base = { id: site.id, hex: site.hex };
    if (site.kind === "camp") return { ...base, kind: "camp", guards: neutralGroup(tribeAt(map, site.hex), strengthAt(map, site.hex, "weak")), regrowsOn: null };
    const reward = DUNGEON_REWARDS[dungeons.indexOf(site) % DUNGEON_REWARDS.length];
    if (!reward) throw new Error("no dungeon rewards");
    return { ...base, kind: "dungeon", guards: neutralGroup(tribeAt(map, site.hex), strengthAt(map, site.hex, "medium")), reward, looted: false };
  });
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
      mana: noMana(),
      spells: [],
      cast: [],
      explored: [],
      memory: emptyMemory(),
    }),
  );
  const world: World = {
    map,
    leaders,
    cities,
    nodes: map.sites.flatMap((site) => site.nodes).map((n, index) => ({ id: `node${index}`, kind: n.kind, hex: n.hex, cityId: nearestCity(cities, n.hex).id, level: 1 })),
    lairs,
    structures: map.structures.map((site): Structure => structureAt(site, map.structures)),
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

/** A structure with its starting stock: mercenary camps take the stock lists in turn. */
function structureAt(site: StructureSite, all: readonly StructureSite[]): Structure {
  const base = { id: site.id, hex: site.hex };
  switch (site.kind) {
    case "mercenaries": {
      const camps = all.filter((s) => s.kind === "mercenaries");
      return { ...base, kind: "mercenaries", stock: [...(MERCENARY_STOCKS[camps.indexOf(site) % MERCENARY_STOCKS.length] ?? [])] };
    }
    case "merchant":
      return { ...base, kind: "merchant", wares: merchantWares(site.id, 1), restocksOn: 1 + MERCHANT_RESTOCK_TURNS };
    case "mage":
      return { ...base, kind: "mage", stock: spellsOf("neutral").map((s) => s.id) };
  }
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
