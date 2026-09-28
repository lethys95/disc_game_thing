import { createWorld } from "#rules/world/create";
import { movementOf } from "#rules/world/leaders";
import { leaderById } from "#rules/world/state";
import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { act, p, start, twoPlayers, unit, until } from "#tests/helpers";
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
