import { hexDistance, hexKey } from "#rules/hex";
import { stepCost } from "#rules/map";
import type { NodeKind } from "#rules/nodes";
import { applyWorldAction } from "#rules/world/actions";
import { engage } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { cityUpgradeCost, raisesDeadAt, resurrectionCost } from "#rules/world/economy";
import { movementOf } from "#rules/world/leaders";
import { cityById, leaderById } from "#rules/world/state";
import type { City, World } from "#rules/world/state";
import { sightOf } from "#rules/world/vision";
import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { act, p, start, twoPlayers, unit, until, withGraveyard, withLeader } from "#tests/helpers";
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
    expect(hit(p("congregant", 0, 1), walled)).toBe(10);
    expect(hit(p("congregant", 0, 1, [{ def: "siege" }]), walled)).toBe(20);
    let battle = until(start([p("congregant", 0, 1, [{ def: "siege" }])], [walled]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    const before = unit(until(battle, "0.0.1"), "1.0.1").hp;
    const after = unit(act(until(battle, "0.0.1"), "attack", "1.0.1").battle, "1.0.1").hp;
    expect(before - after).toBe(10);
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
    nodes: world.nodes.map((n) => (n === node ? { ...n, kind, level } : n)),
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
