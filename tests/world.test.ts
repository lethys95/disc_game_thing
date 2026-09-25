import { chooseAction } from "#rules/ai";
import { applyAction, createBattle } from "#rules/battle";
import type { Placement } from "#rules/battle";
import { hexagon, hexDistance, hexKey, neighbors } from "#rules/hex";
import { findPath, generateMap, TERRAIN_COST } from "#rules/map";
import type { WorldMap } from "#rules/map";
import type { Battle } from "#rules/types";
import { applyWorldAction, chooseWorldAction, concludeBattle, createWorld, leaderById, planMove } from "#rules/world";
import type { World } from "#rules/world";
import { describe, expect, test } from "vitest";

const squad: Placement[] = [
  { defId: "paladin", tile: { row: 0, col: 1 } },
  { defId: "congregant", tile: { row: 1, col: 1 } },
];

function flatMap(): WorldMap {
  const tiles = Object.fromEntries(hexagon(4).map((hex) => [hexKey(hex), { hex, terrain: "plain" as const }]));
  return { radius: 4, tiles, starts: [{ q: -3, r: 3 }, { q: 3, r: -3 }] };
}

function flatWorld(): World {
  const world = createWorld(1, [squad, squad]);
  return { ...world, map: flatMap(), leaders: world.leaders.map((l, i) => ({ ...l, hex: flatMap().starts[i === 0 ? 0 : 1] })) };
}

function placeLeader(world: World, index: number, hex: { q: number; r: number }): World {
  return { ...world, leaders: world.leaders.map((l, i) => (i === index ? { ...l, hex } : l)) };
}

function autoplay(battle: Battle): Battle {
  while (!battle.outcome) {
    const action = chooseAction(battle);
    if (!action) throw new Error("stuck");
    battle = applyAction(battle, action).battle;
  }
  return battle;
}

describe("map", () => {
  test("a radius-4 map has 61 hexes, inside the 50-80 the design asks for", () => {
    expect(hexagon(4)).toHaveLength(61);
  });

  test("generation is a pure function of the seed, and the two starts are connected", () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      const map = generateMap(seed);
      expect(generateMap(seed)).toEqual(map);
      expect(findPath(map, map.starts[0], map.starts[1], () => false)).not.toBeNull();
    }
    expect(generateMap(1)).not.toEqual(generateMap(2));
  });

  test("paths never cross impassable terrain and cost what their terrain costs", () => {
    const map = generateMap(7);
    const path = findPath(map, map.starts[0], map.starts[1], () => false);
    if (!path) throw new Error("no path");
    let cost = 0;
    let previous = map.starts[0];
    for (const hex of path.hexes) {
      expect(hexDistance(previous, hex)).toBe(1);
      const step = TERRAIN_COST[map.tiles[hexKey(hex)]?.terrain ?? "water"];
      expect(step).not.toBeNull();
      cost += step ?? 0;
      previous = hex;
    }
    expect(path.cost).toBe(cost);
  });
});

describe("world", () => {
  test("a leader walks as far as its movement allows toward a distant hex", () => {
    const world = flatWorld();
    const plan = planMove(world, "leader0", { q: 3, r: -3 });
    expect(plan?.steps).toBe(4);
    expect(plan?.attacks).toBeNull();
    const moved = applyWorldAction(world, { type: "move", leaderId: "leader0", to: { q: 3, r: -3 } }).world;
    expect(hexDistance(leaderById(moved, "leader0").hex, { q: -3, r: 3 })).toBe(4);
    expect(moved.engagement).toBeNull();
  });

  test("walking into an enemy leader starts a battle with both squads", () => {
    const next = neighbors({ q: 3, r: -3 })[3];
    if (!next) throw new Error("no neighbour");
    const world = placeLeader(flatWorld(), 0, next);
    const step = applyWorldAction(world, { type: "move", leaderId: "leader0", to: { q: 3, r: -3 } });
    expect(step.events).toContainEqual({ type: "engaged", attackerId: "leader0", defenderId: "leader1" });
    expect(Object.keys(step.world.engagement?.battle.units ?? {})).toHaveLength(4);
  });

  test("wounds carry into the next battle, and a wiped-out squad loses the game", () => {
    let world = placeLeader(flatWorld(), 0, { q: 2, r: -3 });
    world = applyWorldAction(world, { type: "move", leaderId: "leader0", to: { q: 3, r: -3 } }).world;
    const battle = world.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const concluded = concludeBattle(world, autoplay(battle));
    const winner = concluded.world.outcome?.winner;
    expect(winner).toBeDefined();
    expect(concluded.world.leaders).toHaveLength(1);
    const survivor = concluded.world.leaders[0];
    if (!survivor) throw new Error("no survivor");
    const wounded = createBattle(survivor.side === 0 ? [survivor.squad, []] : [[], survivor.squad]).battle;
    for (const member of survivor.squad) {
      expect(wounded.units[`${survivor.side}.${member.tile.row}.${member.tile.col}`]?.hp).toBe(member.hp);
    }
  });

  test("the map AI closes in and forces a battle", () => {
    let world = createWorld(3, [squad, squad]);
    for (let i = 0; i < 40 && !world.engagement; i++) {
      world = applyWorldAction(world, chooseWorldAction(world)).world;
    }
    expect(world.engagement).not.toBeNull();
  });
});
