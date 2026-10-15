import { hexDistance, hexKey } from "#rules/hex";
import { exits, findPath, generateMap, stepCost } from "#rules/map";
import type { NodeKind } from "#rules/nodes";
import { applyWorldAction } from "#rules/world/actions";
import { engage } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { autoplay } from "#rules/ai";
import { ITEMS } from "#rules/items";
import { resalePrice } from "#rules/structures";
import type { Tile } from "#rules/battle/types";
import type { Hex } from "#rules/hex";
import { concludeBattle } from "#rules/world/battles";
import { cityUpgradeCost, raisesDeadAt, recruitCost, recruitProblem, resurrectionCost, startTurn } from "#rules/world/economy";
import { maxHpOf } from "#rules/world/record";
import { tradePrice } from "#rules/world/structures";
import { capacityOf } from "#rules/world/squads";
import { movementOf } from "#rules/world/leaders";
import { cityById, leaderById, playerOf, tribeAt, tribeRecruitsOf, tribeUnits } from "#rules/world/state";
import type { City, World } from "#rules/world/state";
import { knownWorld, sightOf } from "#rules/world/vision";
import { reachable, warbandStepCost } from "#rules/world/movement";
import type { Placement } from "#rules/battle/engine";
import { COLS, ROWS } from "#rules/battle/grid";
import { act, beside, p, start, startOf, twoPlayers, unit, until, withGold, withGraveyard, withLeader } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The user's node picks (design/nodes.md, 2026-09-28): the marks their recruits carry. Numbers provisional. */

/** What a hit took off `target` (health and shield together) when `attacker` attacks it. */
function hit(attacker: Placement, target: Placement): number {
  const battle = until(start([attacker], [target]), "0.0.1");
  const before = unit(battle, "1.0.1");
  const after = unit(act(battle, "attack", "1.0.1").battle, "1.0.1");
  return before.hp + before.shield - (after.hp + after.shield);
}

describe("recruit marks", () => {
  test("Foundry: extra shield at the start of a battle, mending at the start of its bearer's turns", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "foundry", amount: 12 }])]), "0.0.1");
    expect(unit(battle, "1.0.1").shield).toBe(12);
    // The shield soaks 12 of the 20; the rest reaches health. When its turn starts, a third of the plating mends.
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    expect(unit(battle, "1.0.1").hp).toBe(90 - 8);
    expect(unit(battle, "1.0.1").shield).toBe(4);
  });

  test("Leech pits: heals a share of the damage dealt", () => {
    const battle = until(start([{ ...p("congregant", 0, 1, [{ def: "leech", amount: 20 }]), hp: 50 }], [p("brigand", 0, 1)]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "0.0.1").hp).toBe(54);
  });

  test("Tannery: the first hit to reach it is softened, the rest aren't", () => {
    const battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "tannery", amount: 15 }])]), "0.0.1");
    const first = act(battle, "attack", "1.0.1").battle;
    expect(90 - unit(first, "1.0.1").hp).toBe(5);
    const second = act(until(first, "0.0.1"), "attack", "1.0.1").battle;
    expect(unit(first, "1.0.1").hp - unit(second, "1.0.1").hp).toBe(20);
  });

  test("Siege workshop: the first attack on a city's defenders goes through their walls; later ones don't", () => {
    const walled = p("congregant", 0, 1, [{ def: "fortified", amount: 10 }]);
    // 10 armor takes a seventh off a Congregant's 20; the siege-trained hit goes through it.
    expect(hit(p("congregant", 0, 1), walled)).toBe(17);
    expect(hit(p("congregant", 0, 1, [{ def: "siege" }]), walled)).toBe(20);
    let battle = until(start([p("congregant", 0, 1, [{ def: "siege" }])], [walled]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    const before = unit(until(battle, "0.0.1"), "1.0.1").hp;
    const after = unit(act(until(battle, "0.0.1"), "attack", "1.0.1").battle, "1.0.1").hp;
    expect(before - after).toBe(17);
    // Against a target without walls it isn't spent.
    expect(hit(p("congregant", 0, 1, [{ def: "siege" }]), p("congregant", 0, 1))).toBe(20);
  });

  test("Stables: a warband with a unit bred there moves one farther; several don't add up, a fallen one gives nothing", () => {
    const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
    const world = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
    const leader = leaderById(world, "leader0");
    const base = movementOf(leader);
    const bred = { effect: { def: "stables", amount: 1 }, source: { kind: "node" as const, node: "stables" as const, cityId: "city1" } };
    const marked = (count: number, hp = 90) => ({ ...leader, squad: leader.squad.map((m, i) => (i < count ? { ...m, hp, marks: [bred] } : m)) });
    expect(movementOf(marked(1))).toBe(base + 1);
    expect(movementOf(marked(3))).toBe(base + 1);
    expect(movementOf(marked(1, 0))).toBe(base);
  });
});

const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));

/** A fresh world whose first neutral city is player 0's, with one node of `kind` (at `level`). */
function holding(kind: NodeKind, level = 1): { world: World; city: City } {
  const world = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
  const city = world.cities.find((c) => c.kind === "city" && world.nodes.some((n) => n.cityId === c.id));
  if (!city) throw new Error("no city with a node");
  const node = world.nodes.find((n) => n.cityId === city.id);
  const next: World = {
    ...world,
    cities: world.cities.map((c) => (c.id === city.id ? { ...c, owner: 0, garrison: [] } : c)),
    // Its only node: the others a map deals it would mix their gifts in.
    nodes: world.nodes.flatMap((n) => (n === node ? [{ ...n, kind, level }] : n.cityId === city.id ? [] : [n])),
  };
  return { world: next, city: cityById(next, city.id) };
}

describe("city nodes", () => {
  test("Quarry: the city's upgrades cost less, and its defenders stand behind thicker walls", () => {
    const plain = holding("gold");
    const quarry = holding("quarry");
    expect(cityUpgradeCost(quarry.world, quarry.city)).toBe(Math.round(cityUpgradeCost(plain.world, plain.city) * 0.8));
    const walled = { ...quarry.world, cities: quarry.world.cities.map((c) => (c.id === quarry.city.id ? { ...c, garrison: [{ defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 90, xp: 0, marks: [], level: 0 }] } : c)) };
    const battle = engage(walled, leaderById(walled, "leader1"), { kind: "garrison", cityId: quarry.city.id }).battle;
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "fortified")?.amount).toBe(2);
  });

  test("Ossuary: the dead rise in its city without the research, at the Capitol's price", () => {
    const { world, city } = holding("ossuary");
    const fallen = withGraveyard(world, 0, [{ defId: "congregant", fellOnTurn: 1, marks: [], level: 0 }]);
    expect(raisesDeadAt(fallen, 0, city)).toBe(true);
    const capitol = fallen.cities.find((c) => c.kind === "capitol" && c.owner === 0);
    expect(resurrectionCost(fallen, 0, 0, city)).toBe(resurrectionCost(fallen, 0, 0, capitol));
    expect(raisesDeadAt(holding("gold").world, 0, holding("gold").city)).toBe(false);
  });

  test("Watchtower: its holder sees around it", () => {
    const { world } = holding("watchtower");
    const tower = world.nodes.find((n) => n.kind === "watchtower");
    if (!tower) throw new Error("no tower");
    const seen = sightOf(world, 0);
    for (const tile of Object.values(world.map.tiles)) if (hexDistance(tile.hex, tower.hex) <= 3) expect(seen.has(hexKey(tile.hex))).toBe(true);
  });

  test("Bell tower: an enemy ending a march near the city rings its bells; its defenders act first in the first round", () => {
    const { world, city } = holding("bell_tower");
    // Somewhere two hexes from the city, walkable, that player 1's warband can reach from three hexes out.
    const near = Object.values(world.map.tiles).find((t) => hexDistance(t.hex, city.hex) === 2 && stepCost(world.map, t.hex) !== null);
    const far = Object.values(world.map.tiles).find((t) => near && hexDistance(t.hex, city.hex) === 3 && hexDistance(t.hex, near.hex) === 1 && stepCost(world.map, t.hex) !== null);
    if (!near || !far) throw new Error("no spots");
    const set = { ...withLeader(world, "leader1", { hex: far.hex, movement: 10 }), activePlayer: 1 as const };
    const step = applyWorldAction(set, { type: "move", leaderId: "leader1", to: near.hex });
    expect(step.events).toContainEqual({ type: "alarm", cityId: city.id, leaderId: "leader1", player: 0 });

    // Slower defenders still act first in round one, then initiative decides again.
    const battle = start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "forewarned" }, { def: "extra_initiative", amount: -20 }])]);
    expect(battle.current?.unitId).toBe("1.0.1");
    let later = battle;
    while (later.round === 1 && later.outcome === null) later = act(later, "defend").battle;
    expect(later.current?.unitId).toBe("0.0.1");
  });
});

describe("Tribal outpost", () => {
  test("its city recruits its land's tribe, more kinds with each level; they take no garrison slot", () => {
    const { world, city } = holding("tribal_outpost", 1);
    const rich = withGold(world, [1000, 1000]);
    const garrison = { kind: "garrison" as const, cityId: city.id };
    const [first, second, third] = tribeUnits(tribeAt(world.map, city.hex));
    if (!first || !second || !third) throw new Error("a tribe of fewer than three kinds");
    expect(tribeRecruitsOf(rich, city)).toEqual([first, second]);
    expect(recruitProblem(rich, first, garrison)).toBeNull();
    expect(recruitProblem(rich, third, garrison)).toMatch(/Tribal outpost/);
    expect(recruitProblem(withGold(holding("tribal_outpost", 2).world, [1000, 1000]), third, garrison)).toBeNull();
    expect(recruitProblem(withGold(holding("gold").world, [1000, 1000]), first, garrison)).toMatch(/Tribal outpost/);

    const slots = capacityOf(rich, garrison);
    const after = applyWorldAction(rich, { type: "recruit", defId: first, into: garrison }).world;
    expect(cityById(after, city.id).garrison.map((m) => m.defId)).toEqual([first]);
    expect(capacityOf(after, garrison)).toBe(slots + 1);
    expect(after.players[0]?.gold).toBe(1000 - (recruitCost(rich, first, city) ?? 0));

    // Slots aside, a full grid takes no one more.
    const tiles = ROWS.flatMap((row) => COLS.map((col) => ({ row, col })));
    const packed = { ...rich, cities: rich.cities.map((c) => (c.id === city.id ? { ...c, garrison: tiles.map((tile) => ({ defId: first, tile, hp: 60, xp: 0, marks: [], level: 0 })) } : c)) };
    expect(recruitProblem(packed, first, garrison)).toBe("garrison full");
  });

  test("an outpost in another biome recruits that biome's tribe", () => {
    const { world, city } = holding("tribal_outpost", 3);
    for (const biome of ["desert", "haunted"] as const) {
      const moved = { ...world, map: { ...world.map, tiles: { ...world.map.tiles, [hexKey(city.hex)]: { hex: city.hex, terrain: "plain" as const, biome } } } };
      const tribe = tribeAt(moved.map, city.hex);
      expect(["gnolls", "carnival", "herd", "drawn"]).toContain(tribe);
      expect(tribeRecruitsOf(moved, city)).toEqual(tribeUnits(tribe).slice(0, 4));
    }
  });
});

describe("portals", () => {
  test("every map has one; a path takes it when that's shorter; fog hides it until both ends are seen", () => {
    for (const seed of [1, 2, 3]) {
      const map = generateMap(seed, 2);
      expect(map.portals.length).toBeGreaterThan(0);
      for (const portal of map.portals) expect(hexDistance(portal.a, portal.b)).toBeGreaterThanOrEqual(4);
    }
    const map = generateMap(1, 2);
    const portal = map.portals[0];
    if (!portal) throw new Error("no portal");
    expect(exits(map, portal.a)).toContainEqual(portal.b);
    const path = findPath(map, portal.a, portal.b, () => false);
    expect(path?.hexes).toEqual([portal.b]);

    const world = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
    const onPortal = withLeader(world, "leader0", { hex: world.map.portals[0]?.a ?? portal.a, movement: 10 });
    const known = knownWorld(onPortal, 0);
    const far = world.map.portals[0]?.b ?? portal.b;
    const seenBoth = known.map.portals.length > 0;
    expect(seenBoth).toBe(onPortal.players[0]?.explored.includes(hexKey(far)) ?? false);
    const revealed = { ...onPortal, players: onPortal.players.map((pl, i) => (i === 0 ? { ...pl, explored: Object.keys(onPortal.map.tiles) } : pl)) };
    expect(reachable(revealed, "leader0").has(hexKey(far))).toBe(true);
    // Standing on a portal, a warband sees its other end: a march never steps into what it can't see.
    expect(sightOf(onPortal, 0).has(hexKey(far))).toBe(true);
  });
});

/** The second review's nodes (user, 2026-10-15, design/nodes.md). Numbers provisional (#84). */
describe("recruit marks, second review", () => {
  test("Venom distillery: the first hit in a battle envenoms; the mark is spent", () => {
    const battle = until(start([p("congregant", 0, 1, [{ def: "distilled_venom", amount: 4 }])], [p("congregant", 0, 1)]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "1.0.1").effects.find((e) => e.def === "envenomed")?.amount).toBe(4);
    expect(unit(after, "0.0.1").effects.some((e) => e.def === "distilled_venom")).toBe(false);
  });

  test("Witch hut: whoever kills a hexed unit is Punished", () => {
    const battle = until(start([p("congregant", 0, 1)], [{ ...p("congregant", 0, 1, [{ def: "hexed", stacks: 2 }]), hp: 5 }]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "1.0.1").alive).toBe(false);
    expect(unit(after, "0.0.1").effects.find((e) => e.def === "punished")?.stacks).toBe(2);
  });

  test("Hunting lodge: more damage to neutral units, the same to others", () => {
    expect(hit(p("congregant", 0, 1, [{ def: "hunter", amount: 20 }]), p("brigand", 0, 1))).toBeGreaterThan(hit(p("congregant", 0, 1), p("brigand", 0, 1)));
    expect(hit(p("congregant", 0, 1, [{ def: "hunter", amount: 20 }]), p("congregant", 0, 1))).toBe(hit(p("congregant", 0, 1), p("congregant", 0, 1)));
  });
});

describe("city nodes, second review", () => {
  const garrisonOf = (city: City) => ({ kind: "garrison" as const, cityId: city.id });

  test("Training yard: recruits arrive a level up, at full health", () => {
    const { world, city } = holding("training_yard");
    const after = applyWorldAction(withGold(world, [1000, 1000]), { type: "recruit", defId: "congregant", into: garrisonOf(city) }).world;
    const [recruit] = cityById(after, city.id).garrison;
    expect(recruit?.level).toBe(1);
    expect(recruit && recruit.hp).toBe(recruit && maxHpOf(recruit, undefined));
  });

  test("Bog iron: the city's recruits cost less", () => {
    const { world, city } = holding("bog_iron");
    const full = recruitCost(world, "congregant", undefined) ?? 0;
    expect(recruitCost(world, "congregant", city)).toBe(Math.round(full * 0.9));
    const after = applyWorldAction(withGold(world, [1000, 1000]), { type: "recruit", defId: "congregant", into: garrisonOf(city) }).world;
    expect(after.players[0]?.gold).toBe(1000 - Math.round(full * 0.9));
  });

  test("Caravanserai: its holder buys and hires cheaper, and nothing sells back for more than it cost", () => {
    const { world } = holding("caravanserai", 3);
    expect(tradePrice(world, 0, 100)).toBe(75);
    expect(tradePrice(world, 1, 100)).toBe(100);
    for (const item of ITEMS) expect(resalePrice(item.price)).toBeLessThanOrEqual(tradePrice(world, 0, item.price));
  });

  test("Granary: the garrison heals twice as fast; upgrades cost less", () => {
    const healed = (kind: NodeKind) => {
      const { world, city } = holding(kind);
      const wounded = { defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 1, xp: 0, marks: [], level: 0 };
      const next = structuredClone({ ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: [wounded] } : c)) });
      startTurn(next, []);
      return (cityById(next, city.id).garrison[0]?.hp ?? 0) - 1;
    };
    // Twice the share, rounded up as healing is.
    expect(healed("gold")).toBeGreaterThan(0);
    expect(healed("granary")).toBeGreaterThanOrEqual(2 * healed("gold") - 1);
    const plain = holding("gold");
    const granary = holding("granary");
    expect(cityUpgradeCost(granary.world, granary.city)).toBe(Math.round(cityUpgradeCost(plain.world, plain.city) * 0.9));
  });

  test("Oasis: its recruits heal twice as fast anywhere, and so does anyone resting in the city", () => {
    const { world, city } = holding("oasis");
    const recruited = applyWorldAction(withGold(world, [1000, 1000]), { type: "recruit", defId: "congregant", into: garrisonOf(city) }).world;
    expect(cityById(recruited, city.id).garrison[0]?.marks.map((m) => m.effect.def)).toContain("oasis_born");

    const restingIn = (kind: NodeKind) => {
      const held = holding(kind);
      const leader = leaderById(held.world, "leader0");
      const next = structuredClone(withLeader(held.world, "leader0", { hex: held.city.hex, squad: leader.squad.map((m) => ({ ...m, hp: 1 })) }));
      startTurn(next, []);
      return (leaderById(next, "leader0").squad[0]?.hp ?? 0) - 1;
    };
    expect(restingIn("gold")).toBeGreaterThan(0);
    expect(restingIn("oasis")).toBeGreaterThanOrEqual(2 * restingIn("gold") - 1);
  });

  test("Waystation: a warband starting its turn next to it heals; farther off it doesn't", () => {
    const { world } = holding("waystation");
    const station = world.nodes.find((n) => n.kind === "waystation");
    if (!station) throw new Error("no waystation");
    const at = (hex: Hex) => {
      const leader = leaderById(world, "leader0");
      const next = structuredClone(withLeader(world, "leader0", { hex, squad: leader.squad.map((m) => ({ ...m, hp: 1 })) }));
      startTurn(next, []);
      return (leaderById(next, "leader0").squad[0]?.hp ?? 0) - 1;
    };
    expect(at(beside(world, station.hex))).toBe(Math.ceil(90 * 0.25));
    const away = Object.values(world.map.tiles).find((t) => hexDistance(t.hex, station.hex) >= 3 && world.cities.every((c) => hexDistance(c.hex, t.hex) > 0));
    if (!away) throw new Error("nowhere away");
    expect(at(away.hex)).toBe(0);
  });

  test("Gallows: attackers who die at the city never reach their graveyard", () => {
    const graveAfterStorming = (kind: NodeKind) => {
      const { world, city } = holding(kind);
      const guards = COLS.flatMap((col) => [0, 1].map((row) => ({ defId: "punisher", tile: { row, col } as Tile, hp: 200, xp: 0, marks: [], level: 0 })));
      const walled = withLeader({ ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: guards } : c)) }, "leader1", { hex: beside(world, city.hex) });
      const next = applyWorldAction({ ...walled, activePlayer: 1 }, { type: "move", leaderId: "leader1", to: city.hex }).world;
      const battle = next.engagement?.battle;
      if (!battle) throw new Error("no battle");
      return playerOf(concludeBattle(next, autoplay(battle)).world, 1).graveyard.length;
    };
    expect(graveAfterStorming("gold")).toBeGreaterThan(0);
    expect(graveAfterStorming("gallows")).toBe(0);
  });

  test("Dog yard: a warband starting its turn near the city crosses forest and hills at plain cost", () => {
    const { world, city } = holding("dog_yard");
    const rough = Object.values(world.map.tiles).find((t) => t.terrain === "forest" || t.terrain === "hills");
    if (!rough) throw new Error("no rough ground");
    const near = structuredClone(withLeader(world, "leader0", { hex: city.hex }));
    startTurn(near, []);
    expect(warbandStepCost(near, leaderById(near, "leader0"), rough.hex)).toBe(1);
    const far = structuredClone(withLeader(world, "leader0", { hex: startOf(world, 0) }));
    startTurn(far, []);
    expect(warbandStepCost(far, leaderById(far, "leader0"), rough.hex)).toBe(2);
  });
});
