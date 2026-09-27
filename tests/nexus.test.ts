import { UNITS } from "#rules/units/index";
import { applyAction, effectiveStats, legalActions } from "#rules/battle/engine";
import { allowedUnits, choose, openForks } from "#rules/forks";
import { grow } from "#rules/progression";
import { act, anchorKey, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

describe("Nexus forks", () => {
  test("scheme vs overload is chosen per line: Custodians going Scheme says nothing about Apprentices", () => {
    expect(openForks("nexus", {})).toEqual(["custodian", "apprentice", "justiciar"]);
    const scheming = choose({}, "custodian", "cyclops");
    expect(openForks("nexus", scheming)).toEqual(["apprentice", "justiciar"]);
    expect(allowedUnits("nexus", scheming)).toEqual(["custodian", "cyclops", "technician", "apprentice", "justiciar", "etherborn", "backlasher", "thaumaturge", "maelstrom"]);
    expect(grow("custodian", 0, 100, { custodian: "mutant" }).defId).toBe("mutant");
    expect(grow("apprentice", 0, 100, { ...scheming, apprentice: "thaumaturge" }).defId).toBe("thaumaturge");
  });
});

describe("Justiciar", () => {
  test("Counter is a free action; the marked unit's next ability fizzles but still spends its turn", () => {
    let battle = start([p("justiciar", 1, 1)], [p("paladin", 0, 1)]);
    battle = act(battle, "counter", "1.0.1").battle;
    expect(battle.current?.unitId).toBe("0.1.1");
    battle = act(battle, "defend").battle;
    const step = act(battle, "lay_on_hands");
    expect(step.events).toContainEqual({ type: "countered", unitId: "1.0.1", abilityId: "lay_on_hands" });
    expect(unit(step.battle, "1.0.1").chargesUsed["lay_on_hands"]).toBe(1);
    expect(legalActions(step.battle).map((a) => a.abilityId)).not.toContain("counter");
  });
});

describe("Thaumaturge", () => {
  test("homing lightning strikes one enemy; overloaded, every unit with the target's name, on both sides", () => {
    const battle = until(start([p("thaumaturge", 1, 1), p("brigand", 0, 1)], [p("brigand", 0, 0), p("brigand", 0, 2), p("bandit", 1, 1)]), "0.1.1");
    const lightning = legalActions(battle).filter((a) => a.abilityId === "homing_lightning");
    const plain = lightning.find((a) => a.enhancement.kind === "none");
    const overloaded = lightning.find((a) => a.enhancement.kind === "overload");
    expect(plain?.choices.find((c) => anchorKey(c) === "1.0.0")?.affected).toEqual(["1.0.0"]);
    expect(overloaded?.choices.find((c) => anchorKey(c) === "1.0.0")?.affected).toEqual(["0.0.1", "1.0.0", "1.0.2"]);
    expect([plain?.spellCost, overloaded?.spellCost]).toEqual([1, 2]);
  });
});

describe("spell charges (docs/design/factions/ral-vitahl.md)", () => {
  test("an overloaded Burst hits every enemy and draws its extra cost from the caster's battery", () => {
    const battle = until(start([p("thaumaturge", 1, 1)], [p("congregant", 0, 0), p("congregant", 0, 2), p("congregant", 2, 2)]), "0.1.1");
    const overloaded = legalActions(battle).find((a) => a.abilityId === "plus_burst" && a.enhancement.kind === "overload");
    if (!overloaded) throw new Error("no overloaded Burst");
    const step = applyAction(battle, { abilityId: "plus_burst", choice: 0, enhancement: { kind: "overload" } });
    expect(step.events.filter((e) => e.type === "damage").map((e) => (e.type === "damage" ? e.unitId : ""))).toEqual(["1.0.0", "1.0.2", "1.2.2"]);
    expect(unit(step.battle, "0.1.1").spellCharges).toBe(4 - 2);
  });

  test("a replicated Counter marks several enemies with one free action; each copy needs its own target", () => {
    const battle = start([p("justiciar", 1, 1)], [p("paladin", 0, 0), p("paladin", 0, 2)]);
    const counter = legalActions(battle).find((a) => a.abilityId === "counter" && a.enhancement.kind === "replicate");
    if (!counter || counter.enhancement.kind !== "replicate") throw new Error("no replicated Counter");
    expect(counter.enhancement.copies).toBe(1);
    const step = applyAction(battle, { abilityId: "counter", choice: 0, enhancement: counter.enhancement, copies: [1] });
    expect(["1.0.0", "1.0.2"].every((id) => unit(step.battle, id).effects.some((e) => e.def === "countered"))).toBe(true);
    expect(unit(step.battle, "0.1.1").spellCharges).toBe(4 - 2);
    expect(() => applyAction(battle, { abilityId: "counter", choice: 0, enhancement: counter.enhancement, copies: [0] })).toThrow(/illegal/);
  });

  test("an empty battery leaves only the weak default attack", () => {
    let battle = until(start([p("apprentice", 1, 1)], [p("custodian", 0, 1), p("custodian", 0, 0)]), "0.1.1");
    for (let i = 0; i < 2; i++) battle = until(act(battle, "plus_burst", "1.0.1").battle, "0.1.1");
    expect(unit(battle, "0.1.1").spellCharges).toBe(0);
    expect(legalActions(battle).map((a) => a.abilityId)).toEqual(expect.arrayContaining(["bolt"]));
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("plus_burst");
  });
});

describe("Cyclops", () => {
  test("Equalize evens out shields, and the lent part perishes when the Cyclops's next turn starts", () => {
    let battle = until(start([p("cyclops", 0, 1), p("custodian", 0, 0)], [p("congregant", 2, 2)]), "0.0.1");
    battle = act(battle, "equalize", "0.0.0").battle;
    const shield = UNITS["custodian"]?.stats.shield ?? 0;
    const lent = Math.floor((160 - shield) / 2);
    expect(unit(battle, "0.0.1").shield).toBe(160 - lent);
    expect(unit(battle, "0.0.0").shield).toBe(shield + lent);
    battle = until(battle, "0.0.1");
    expect(unit(battle, "0.0.0").shield).toBe(shield);
  });
});

describe("Mutant", () => {
  test("restoring a shield that's already full mutates it: +10 damage each time", () => {
    let battle = until(start([p("mutant", 0, 1), p("technician", 1, 1)], [p("congregant", 2, 2)]), "0.1.1");
    battle = act(battle, "restore_shield", "0.0.1").battle;
    expect(effectiveStats(battle, "0.0.1").damage).toBe(50);
  });
});
