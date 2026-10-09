import { effectiveStats, legalActions } from "#rules/battle/engine";
import { UNITS } from "#rules/units/index";
import { act, affectedBy, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Custodian's shield (a tuned number, #52). */
const SHIELD = UNITS["custodian"]?.stats.shield ?? 0;

describe("shields (Custodian, Technician)", () => {
  test("a shield takes hits before health", () => {
    const battle = act(start([p("paladin", 0, 1)], [p("custodian", 0, 1)]), "attack", "1.0.1").battle;
    expect(unit(battle, "1.0.1").shield).toBe(SHIELD - 40);
    expect(unit(battle, "1.0.1").hp).toBe(60);
  });

  test("damage past the shield hits health, and Defend doesn't halve what the shield takes", () => {
    let battle = start([p("paladin", 0, 1)], [p("custodian", 0, 1)]);
    battle = act(battle, "attack", "1.0.1").battle;
    battle = act(battle, "defend").battle;
    const step = act(battle, "attack", "1.0.1");
    // The Paladin's 40 empties what's left of the shield; only the rest is halved.
    expect(unit(step.battle, "1.0.1").shield).toBe(0);
    expect(unit(step.battle, "1.0.1").hp).toBe(60 - Math.floor((40 - (SHIELD - 40)) / 2));
  });

  test("only shield restoration brings a shield back", () => {
    let battle = start([p("paladin", 0, 1)], [p("custodian", 0, 1), p("technician", 1, 1)]);
    battle = act(battle, "attack", "1.0.1").battle;
    battle = act(battle, "defend").battle;
    expect(battle.current?.unitId).toBe("1.1.1");
    battle = act(battle, "restore_shield", "1.0.1").battle;
    expect(unit(battle, "1.0.1").shield).toBe(SHIELD);
  });
});

describe("ranged and area attacks", () => {
  test("shooting reaches the back row", () => {
    const battle = start([p("bandit", 2, 2)], [p("congregant", 0, 0), p("congregant", 2, 2)]);
    const reach = legalActions(battle).find((a) => a.abilityId === "shoot")?.choices.map((c) => c.affected[0]);
    expect(reach).toEqual(["1.0.0", "1.2.2"]);
  });

  test("the Hedge Mage's spell hits the 2x2 block containing the chosen tile", () => {
    const enemies = [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 1, 1), p("congregant", 2, 2)];
    const battle = until(start([p("hedge_mage", 2, 1)], enemies), "0.2.1");
    expect(affectedBy(battle, "area_2x2", "1.0.0")).toEqual(["1.0.0", "1.0.1", "1.1.1"]);
    expect(affectedBy(battle, "area_2x2", "1.2.2")).toEqual(["1.1.1", "1.2.2"]);
  });

  test("the Apprentice's burst hits a plus shape, twice per combat", () => {
    const enemies = [p("congregant", 0, 1), p("congregant", 1, 0), p("congregant", 1, 1), p("congregant", 1, 2), p("congregant", 2, 2)];
    let battle = until(start([p("apprentice", 2, 1)], enemies), "0.2.1");
    expect(affectedBy(battle, "plus_burst", "1.1.1")).toEqual(["1.0.1", "1.1.0", "1.1.1", "1.1.2"]);
    for (let i = 0; i < 2; i++) {
      battle = act(battle, "plus_burst", "1.1.1").battle;
      battle = until(battle, "0.2.1");
    }
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("plus_burst");
  });
});

describe("bandits", () => {
  test("the Brigand stuns only the enemy directly in front, once", () => {
    const battle = until(start([p("brigand", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 1)]), "0.0.1");
    expect(legalActions(battle).find((a) => a.abilityId === "stun_front")?.choices.map((c) => c.affected[0])).toEqual(["1.0.1"]);
    const step = act(battle, "stun_front");
    expect(step.battle.units["1.0.1"]?.effects).toContainEqual(expect.objectContaining({ def: "stunned" }));
    expect(step.battle.units["0.0.1"]?.chargesUsed["stun_front"]).toBe(1);
  });

  test("the Marauder hits armored targets 10 harder", () => {
    const vsArmor = act(until(start([p("marauder", 0, 1)], [p("paladin", 0, 1)]), "0.0.1"), "attack", "1.0.1").battle;
    const vsBare = act(until(start([p("marauder", 0, 1)], [p("congregant", 0, 1)]), "0.0.1"), "attack", "1.0.1").battle;
    // 22 + 10, a quarter off for the Paladin's 20 armor.
    expect(150 - unit(vsArmor, "1.0.1").hp).toBe(24);
    expect(90 - unit(vsBare, "1.0.1").hp).toBe(22);
  });

  test("effective stats report the shield", () => {
    expect(effectiveStats(start([p("custodian", 0, 0)], [p("bandit", 0, 0)]), "0.0.0").shield).toBe(SHIELD);
  });
});
