import { autoplay } from "#rules/ai";
import type { Placement } from "#rules/battle/engine";
import { hexagon, hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { findPath, generateMap, stepCost, TERRAIN_COST } from "#rules/map";
import { doctrine } from "#rules/doctrine";
import { GUARDIAN_ID } from "#rules/units/index";
import {
  applyWorldAction,
  CAPITOL_INCOME,
  capitolOf,
  chooseWorldAction,
  concludeBattle,
  createWorld,
  income,
  leaderById,
  MINE_INCOME,
  planMove,
  STARTING_GOLD,
} from "#rules/world";
import type { Leader, World } from "#rules/world";
import { describe, expect, test } from "vitest";

const squad: Placement[] = [
  { defId: "paladin", tile: { row: 0, col: 1 } },
  { defId: "congregant", tile: { row: 1, col: 1 } },
];

/** A fully evolved army: early and mid armies lose to a Guardian, late ones win (tuned by simulation). */
const army: Placement[] = [
  { defId: "torturer", tile: { row: 0, col: 0 } },
  { defId: "torturer", tile: { row: 0, col: 1 } },
  { defId: "torturer", tile: { row: 0, col: 2 } },
  { defId: "punisher", tile: { row: 1, col: 0 } },
  { defId: "punisher", tile: { row: 1, col: 1 } },
  { defId: "punisher", tile: { row: 1, col: 2 } },
];

const both = (key: string) => [doctrine("jilliath", key).commitment, doctrine("jilliath", key).commitment] as const;

function withLeader(world: World, id: string, change: Partial<Leader>): World {
  return { ...world, leaders: world.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) };
}

function walkableNeighbour(world: World, hex: Hex): Hex {
  const found = neighbors(hex).find((n) => stepCost(world.map, n) !== null && !world.cities.some((c) => sameHex(c.hex, n)));
  if (!found) throw new Error("no walkable neighbour");
  return found;
}

describe("map", () => {
  test("a radius-4 map has 61 hexes, inside the 50-80 the design asks for", () => {
    expect(hexagon(4)).toHaveLength(61);
  });

  test("generation is a pure function of the seed; capitols sit on the starts; every site is reachable", () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      const map = generateMap(seed);
      expect(generateMap(seed)).toEqual(map);
      const capitols = map.sites.filter((s) => s.kind === "capitol").map((s) => s.hex);
      expect(capitols).toEqual([...map.starts]);
      for (const site of map.sites.filter((s) => s.kind === "city")) {
        expect(site.goldMines).toHaveLength(1);
        expect(findPath(map, map.starts[0], site.hex, () => false)).not.toBeNull();
        expect(findPath(map, map.starts[1], site.hex, () => false)).not.toBeNull();
      }
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
  test("each side starts with a Capitol guarded by its Guardian, and earns income at the start of its turn", () => {
    const world = createWorld(1, [squad, squad], both("preserve"), ["jilliath", "jilliath"]);
    expect(capitolOf(world, 0)?.garrison.map((m) => m.defId)).toEqual([GUARDIAN_ID]);
    expect(world.gold).toEqual([STARTING_GOLD + CAPITOL_INCOME, STARTING_GOLD]);
    const next = applyWorldAction(world, { type: "endTurn" }).world;
    expect(next.gold[1]).toBe(STARTING_GOLD + CAPITOL_INCOME);
  });

  test("neutral cities are guarded; once emptied, walking in captures the city and its gold mine", () => {
    const world = createWorld(1, [squad, squad], both("preserve"), ["jilliath", "jilliath"]);
    const city = world.cities.find((c) => c.kind === "city");
    if (!city) throw new Error("no neutral city");
    const near = withLeader(world, "leader0", { hex: walkableNeighbour(world, city.hex) });
    expect(planMove(near, "leader0", city.hex)?.target).toEqual({ kind: "garrison", cityId: city.id });

    const empty = { ...near, cities: near.cities.map((c) => (c.id === city.id ? { ...c, garrison: [] } : c)) };
    const step = applyWorldAction(empty, { type: "move", leaderId: "leader0", to: city.hex });
    expect(step.events).toContainEqual({ type: "captured", cityId: city.id, side: 0 });
    expect(income(step.world, 0)).toBe(CAPITOL_INCOME + MINE_INCOME);
    expect(leaderById(step.world, "leader0").hex).toEqual(city.hex);
  });

  test("beating a bandit camp clears it and pays XP; bandits never enter a graveyard", () => {
    const world = createWorld(1, [army, squad], both("punishment"), ["jilliath", "jilliath"]);
    const camp = world.lairs.find((l) => l.kind === "camp");
    if (!camp) throw new Error("no camp");
    const ready = withLeader(world, "leader0", { hex: walkableNeighbour(world, camp.hex) });
    const engaged = applyWorldAction(ready, { type: "move", leaderId: "leader0", to: camp.hex }).world;
    const battle = engaged.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const step = concludeBattle(engaged, autoplay(battle));
    expect(step.world.lairs.some((l) => l.id === camp.id)).toBe(false);
    expect(step.events.some((e) => e.type === "xp" && e.side === 0)).toBe(true);
    expect(step.world.graveyard[1]).toEqual([]);
  });

  test("clearing a dungeon's guards claims its one-time reward", () => {
    const world = createWorld(1, [army, squad], both("punishment"), ["jilliath", "jilliath"]);
    const dungeon = world.lairs.find((l) => l.kind === "dungeon" && l.reward?.joins);
    if (!dungeon?.reward) throw new Error("no dungeon with a unit reward");
    const thin = withLeader(world, "leader0", { hex: walkableNeighbour(world, dungeon.hex) });
    const leader = leaderById(thin, "leader0");
    const roomy = withLeader(thin, "leader0", { squad: leader.squad.slice(0, 4) });
    const engaged = applyWorldAction(roomy, { type: "move", leaderId: "leader0", to: dungeon.hex }).world;
    const battle = engaged.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const step = concludeBattle(engaged, autoplay(battle));
    expect(step.events).toContainEqual({ type: "looted", lairId: dungeon.id, side: 0, gold: dungeon.reward.gold, joins: dungeon.reward.joins });
    expect(leaderById(step.world, "leader0").squad.some((m) => m.defId === dungeon.reward?.joins)).toBe(true);
    expect(step.world.gold[0]).toBe(roomy.gold[0] + dungeon.reward.gold);
  });

  test("recruiting costs gold and needs the leader in the Capitol", () => {
    const world = createWorld(1, [squad, squad], both("preserve"), ["jilliath", "jilliath"]);
    const step = applyWorldAction(world, { type: "recruit", defId: "congregant", into: { kind: "leader", leaderId: "leader0" } });
    expect(step.world.gold[0]).toBe(world.gold[0] - 40);
    expect(leaderById(step.world, "leader0").squad).toHaveLength(3);
    const away = withLeader(world, "leader0", { hex: walkableNeighbour(world, world.map.starts[0]) });
    expect(() => applyWorldAction(away, { type: "recruit", defId: "congregant", into: { kind: "leader", leaderId: "leader0" } })).toThrow(/Capitol/);
  });

  test("a garrison unit can be elevated to lead a new squad, but never the Guardian", () => {
    let world = createWorld(1, [squad, squad], both("preserve"), ["jilliath", "jilliath"]);
    world = applyWorldAction(world, { type: "recruit", defId: "congregant", into: { kind: "garrison" } }).world;
    world = withLeader(world, "leader0", { hex: walkableNeighbour(world, world.map.starts[0]) });
    const recruit = capitolOf(world, 0)?.garrison.find((m) => m.defId === "congregant");
    const guardian = capitolOf(world, 0)?.garrison.find((m) => m.defId === GUARDIAN_ID);
    if (!recruit || !guardian) throw new Error("garrison missing");
    expect(() => applyWorldAction(world, { type: "elevate", tile: guardian.tile })).toThrow(/Guardian/);
    const step = applyWorldAction(world, { type: "elevate", tile: recruit.tile });
    const created = step.world.leaders.find((l) => l.id === "leader2");
    expect(created?.squad.map((m) => m.defId)).toEqual(["congregant"]);
    expect(created?.hex).toEqual(world.map.starts[0]);
  });

  test("wounded units resting in their Capitol heal at the start of their turn", () => {
    let world = createWorld(1, [squad, squad], both("preserve"), ["jilliath", "jilliath"]);
    const leader = leaderById(world, "leader0");
    world = withLeader(world, "leader0", { squad: leader.squad.map((m) => ({ ...m, hp: 10 })) });
    world = applyWorldAction(applyWorldAction(world, { type: "endTurn" }).world, { type: "endTurn" }).world;
    expect(leaderById(world, "leader0").squad.map((m) => m.hp)).toEqual([10 + 38, 10 + 23]);
  });

  test("storming the enemy Capitol and killing its Guardian wins the game", () => {
    const world = createWorld(1, [army, squad], both("punishment"), ["jilliath", "jilliath"]);
    const enemyCapitol = world.map.starts[1];
    const ready = withLeader(
      { ...world, leaders: world.leaders.filter((l) => l.side === 0) },
      "leader0",
      { hex: walkableNeighbour(world, enemyCapitol) },
    );
    const plan = planMove(ready, "leader0", enemyCapitol);
    expect(plan?.target).toEqual({ kind: "garrison", cityId: "capitol1" });
    const engaged = applyWorldAction(ready, { type: "move", leaderId: "leader0", to: enemyCapitol }).world;
    const battle = engaged.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const done = concludeBattle(engaged, autoplay(battle));
    expect(done.world.outcome).toEqual({ winner: 0 });
  });

  test("with the AI on both sides, a clearly stronger side marches on and wins the whole game", () => {
    let world = createWorld(3, [army, squad], both("punishment"), ["jilliath", "jilliath"]);
    for (let i = 0; i < 600 && !world.outcome; i++) {
      const battle = world.engagement?.battle;
      world = battle ? concludeBattle(world, autoplay(battle)).world : applyWorldAction(world, chooseWorldAction(world)).world;
    }
    expect(world.outcome).toEqual({ winner: 0 });
  }, 60_000);
});
