import { BEHAVIORS } from "#rules/abilities/index";
import { effectiveStatsOf, legalActions, strongestHits } from "#rules/battle/engine";
import { UNITS } from "#rules/units/index";
import { act, affectedBy, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Drawn, Claude's moth-folk tribe (2026-10-04). Numbers provisional (#64). */
describe("the Drawn", () => {
  test("Flit: a Dustwing flies over the front line to strike the back row", () => {
    const battle = until(start([p("dustwing", 0, 1)], [p("congregant", 0, 1), p("seraph", 2, 1)]), "0.0.1");
    expect(affectedBy(battle, "flit", "1.2.1")).toEqual(["1.2.1"]);
  });

  test("Dust: the enemy whose hit kills a Dustwing has its next hit land as nothing", () => {
    let battle = until(start([{ ...p("dustwing", 0, 1), hp: 5 }], [p("congregant", 0, 1)]), "1.0.1");
    battle = act(battle, "attack", "0.0.1").battle;
    expect(unit(battle, "0.0.1").alive).toBe(false);
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "dusted")).toBe(true);
    const next = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "dusted", source: null }])]), "1.0.1");
    const after = act(next, "attack", "0.0.1").battle;
    expect(unit(after, "0.0.1").hp).toBe(90);
    expect(unit(after, "1.0.1").effects.some((e) => e.def === "dusted")).toBe(false);
  });

  test("Metamorphosis: a Chrysalis can't attack until its third turn, then emerges healed, stronger and flying", () => {
    let battle = until(start([{ ...p("chrysalis", 0, 1), hp: 50 }], [p("congregant", 0, 1)]), "0.0.1");
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("flit");
    battle = until(act(battle, "defend").battle, "0.0.1");
    battle = until(act(battle, "defend").battle, "0.0.1");
    const chrysalis = unit(battle, "0.0.1");
    expect(chrysalis.effects.some((e) => e.def === "emerged")).toBe(true);
    expect(chrysalis.hp).toBe(UNITS["chrysalis"]?.stats.maxHp);
    expect(strongestHits(battle)["0.0.1"]).toBe(BEHAVIORS["metamorphosis"]?.defaults?.["flit"]);
    expect(legalActions(battle).map((a) => a.abilityId)).toContain("flit");
  });

  test("Drink the light: an enemy loses what its own side gave it and its shield; the Lightdrinker heals", () => {
    const blessed = [{ def: "mending", amount: 10, stacks: 3, source: "1.0.0" }];
    let battle = until(start([{ ...p("lightdrinker", 2, 1), hp: 5 }], [p("custodian", 0, 1, blessed), p("congregant", 0, 0)]), "0.2.1");
    const shield = unit(battle, "1.0.1").shield;
    expect(shield).toBeGreaterThan(0);
    battle = act(battle, "drink_light", "1.0.1").battle;
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "mending")).toBe(false);
    expect(unit(battle, "1.0.1").shield).toBe(0);
    expect(unit(battle, "0.2.1").hp).toBe(Math.min(UNITS["lightdrinker"]?.stats.maxHp ?? 0, 5 + 10 + Math.floor(shield / 2)));
  });

  test("Mesmerize: the target loses its next turn, unless it's hurt first", () => {
    const battle = until(start([p("eyespot", 2, 1)], [p("congregant", 0, 1)]), "0.2.1");
    const { events } = act(battle, "mesmerize", "1.0.1");
    expect(events).toContainEqual({ type: "skipped", unitId: "1.0.1", reason: "lostTurn" });
    // Hurt before its turn: it wakes.
    const woken = until(start([p("eyespot", 2, 1), p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "mesmerized", source: "0.2.1" }])]), "0.0.1");
    expect(unit(woken, "1.0.1").effects.some((e) => e.def === "mesmerized")).toBe(true);
    const hit = act(woken, "attack", "1.0.1").battle;
    expect(unit(hit, "1.0.1").effects.some((e) => e.def === "mesmerized")).toBe(false);
  });

  test("Dust veil: the Pale Mother's brood has more armor; two mothers don't add up", () => {
    const one = start([p("pale_mother", 0, 1), p("dustwing", 0, 0)], [p("congregant", 0, 1)]);
    expect(effectiveStatsOf(one)["0.0.0"]?.armor).toBe(5);
    const two = start([p("pale_mother", 0, 1), p("pale_mother", 0, 2), p("dustwing", 0, 0)], [p("congregant", 0, 1)]);
    expect(effectiveStatsOf(two)["0.0.0"]?.armor).toBe(5);
  });
});
