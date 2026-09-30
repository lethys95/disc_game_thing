import type { Biome, Terrain } from "#rules/map";
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
  readonly biome: Biome;
  readonly backdrop: readonly string[] | null;
}

/** Skirmishes from the setup screen: open ground. */
export const OPEN_FIELD: BattleSetting = { terrain: "plain", biome: "temperate", backdrop: null };

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
  const tile = tileAt(world.map, hex);
  const terrain = tile?.terrain ?? "plain";
  const biome = tile?.biome ?? "temperate";
  const city = cityAt(world, hex);
  if (city) {
    const owner = city.owner === null ? null : playerOf(world, city.owner).faction;
    return { terrain, biome, backdrop: city.kind === "capitol" ? MODEL_CHAINS.capitol(owner) : MODEL_CHAINS.city() };
  }
  const lair = lairAt(world, hex);
  return { terrain, biome, backdrop: lair?.kind === "dungeon" ? MODEL_CHAINS.dungeon() : null };
}
