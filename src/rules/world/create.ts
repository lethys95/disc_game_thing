import { LEADER_MOVEMENT, STARTING_GOLD } from "#rules/balance";
import type { Placement } from "#rules/battle/engine";
import type { Commitment } from "#rules/forks";
import { sameHex } from "#rules/hex";
import { generateMap } from "#rules/map";
import type { Side } from "#rules/battle/types";
import { GUARDIAN_ID } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { startTurn } from "#rules/world/economy";
import { defaultColors } from "#rules/world/colors";
import type { PlayerColor } from "#rules/world/colors";
import { banditGroup, DUNGEON_REWARDS, member, strengthAt } from "#rules/world/state";
import type { City, Lair, Leader, World } from "#rules/world/state";

/** Setting up a new game on a generated map. */

export function createWorld(
  seed: number,
  squads: readonly [readonly Placement[], readonly Placement[]],
  commitment: readonly [Commitment, Commitment],
  factions: readonly [Playable, Playable],
  colors: readonly [PlayerColor, PlayerColor] = defaultColors(factions),
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
      experience: 0,
      skills: {},
      fellOnTurn: null,
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
      owner,
      garrison: site.kind === "capitol" ? [member(GUARDIAN_ID, { row: 0, col: 1 })] : banditGroup(strengthAt(map, site.hex, "medium")),
      tier: 1,
    };
  });
  const lairs = map.lairs.map((site, index): Lair => ({
    id: site.id,
    kind: site.kind,
    hex: site.hex,
    guards: banditGroup(strengthAt(map, site.hex, site.kind === "dungeon" ? "medium" : "weak")),
    reward: site.kind === "dungeon" ? (DUNGEON_REWARDS[index % DUNGEON_REWARDS.length] ?? null) : null,
    looted: false,
    regrowsOn: null,
  }));
  const world: World = {
    map,
    leaders,
    cities,
    nodes: map.sites.flatMap((site) => site.nodes).map((n, index) => ({ id: `node${index}`, kind: n.kind, hex: n.hex, level: 1 })),
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
    colors: [colors[0], colors[1]],
    upgrades: [[], []],
    research: [[], []],
  };
  startTurn(world, []);
  return world;
}
