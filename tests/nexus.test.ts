import { effectiveStats, legalActions } from "#rules/battle/engine";
import { allowedUnits, choose, openForks } from "#rules/forks";
import { grow } from "#rules/progression";
import { act, anchorKey, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

describe("Nexus forks", () => {
  test("scheme vs overload is chosen per line: Custodians going Scheme says nothing about Apprentices", () => {
    expect(openForks("nexus", {})).toEqual(["custodian", "apprentice"]);
    const scheming = choose({}, "custodian", "battery");
    expect(openForks("nexus", scheming)).toEqual(["apprentice"]);
    expect(allowedUnits("nexus", scheming)).toEqual(["custodian", "battery", "arcane_engineer", "apprentice", "justiciar", "thaumaturge"]);
    expect(grow("custodian", 0, 100, { custodian: "mutant" }).defId).toBe("mutant");
    expect(grow("apprentice", 0, 100, { ...scheming, apprentice: "thaumaturge" }).defId).toBe("thaumaturge");
  });
});

describe("Justiciar", () => {
  test("Negate is a free action; the marked unit's next ability fizzles but still spends its turn", () => {
    let battle = start([p("justiciar", 1, 1)], [p("paladin", 0, 1)]);
    battle = act(battle, "negate", "1.0.1").battle;
    expect(battle.current?.unitId).toBe("0.1.1");
    battle = act(battle, "defend").battle;
    const step = act(battle, "lay_on_hands");
    expect(step.events).toContainEqual({ type: "negated", unitId: "1.0.1", abilityId: "lay_on_hands" });
    expect(unit(step.battle, "1.0.1").abilities.find((a) => a.ref.id === "lay_on_hands")?.chargesUsed).toBe(1);
    expect(legalActions(step.battle).map((a) => a.abilityId)).not.toContain("negate");
  });
});

describe("Thaumaturge", () => {
  test("homing lightning strikes every unit with the target's name, on both sides", () => {
    const battle = until(start([p("thaumaturge", 1, 1), p("brigand", 0, 1)], [p("brigand", 0, 0), p("brigand", 0, 2), p("bandit", 1, 1)]), "0.1.1");
    const lightning = legalActions(battle).find((a) => a.abilityId === "homing_lightning");
    expect(lightning?.choices.find((c) => anchorKey(c) === "1.0.0")?.affected).toEqual(["0.0.1", "1.0.0", "1.0.2"]);
    expect(lightning?.choices.find((c) => anchorKey(c) === "1.1.1")?.affected).toEqual(["1.1.1"]);
  });
});

describe("Battery", () => {
  test("Equalize evens out shields, and the lent part perishes when the Battery's next turn starts", () => {
    let battle = until(start([p("battery", 0, 1), p("custodian", 0, 0)], [p("congregant", 2, 2)]), "0.0.1");
    battle = act(battle, "equalize", "0.0.0").battle;
    expect(unit(battle, "0.0.1").shield).toBe(160 - 35);
    expect(unit(battle, "0.0.0").shield).toBe(90 + 35);
    battle = until(battle, "0.0.1");
    expect(unit(battle, "0.0.0").shield).toBe(90);
  });
});

describe("Mutant", () => {
  test("restoring a shield that's already full mutates it: +10 damage each time", () => {
    let battle = until(start([p("mutant", 0, 1), p("arcane_engineer", 1, 1)], [p("congregant", 2, 2)]), "0.1.1");
    battle = act(battle, "restore_shield", "0.0.1").battle;
    expect(effectiveStats(battle, "0.0.1").damage).toBe(50);
  });
});
