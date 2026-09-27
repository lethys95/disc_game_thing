import type { Terrain } from "#rules/map";
import { tileAt } from "#rules/map";
import type { Hex } from "#rules/hex";
import { cityAt, cityById, lairAt, lairById, leaderById, playerOf } from "#rules/world/state";
import type { Engagement, World } from "#rules/world/state";
import { MODEL_CHAINS } from "#view/models";

/**
 * Where a battle is fought, for the arena to dress itself: the terrain of the hex fought over, and what stands there
 * as a backdrop (a city's walls, a dungeon's mouth), as a model slot chain.
 */
export interface BattleSetting {
  readonly terrain: Terrain;
  readonly backdrop: readonly string[] | null;
}

/** Skirmishes from the setup screen: open ground. */
export const OPEN_FIELD: BattleSetting = { terrain: "plain", backdrop: null };

function defenderHex(world: World, engagement: Engagement): Hex {
  const defender = engagement.defender;
  switch (defender.kind) {
    case "leader":
      return leaderById(world, defender.leaderId).hex;
    case "garrison":
      return cityById(world, defender.cityId).hex;
    case "lair":
      return lairById(world, defender.lairId).hex;
  }
}

export function battleSetting(world: World, engagement: Engagement): BattleSetting {
  const hex = defenderHex(world, engagement);
  const terrain = tileAt(world.map, hex)?.terrain ?? "plain";
  const city = cityAt(world, hex);
  if (city) {
    const owner = city.owner === null ? null : playerOf(world, city.owner).faction;
    return { terrain, backdrop: city.kind === "capitol" ? MODEL_CHAINS.capitol(owner) : MODEL_CHAINS.city() };
  }
  const lair = lairAt(world, hex);
  return { terrain, backdrop: lair?.kind === "dungeon" ? MODEL_CHAINS.dungeon() : null };
}
