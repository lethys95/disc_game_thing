import { applyAction, legalActions } from "#rules/battle/engine";
import { act, p, start, unit, until } from "#tests/helpers";
import { asKnown, masked } from "#view/secrecy";
import { describe, expect, test } from "vitest";

/** Nexus's tier-3 mages (the user's mage sheet, 2026-09-26). */

describe("Backlasher", () => {
  test("Backlash cancels the marked unit's next ability and hits it", () => {
    let battle = until(start([p("backlasher", 1, 1)], [p("paladin", 0, 1)]), "0.1.1");
    battle = act(battle, "counter", "1.0.1").battle;
    battle = act(battle, "defend").battle;
    battle = until(battle, "1.0.1");
    const before = unit(battle, "1.0.1").hp;
    const step = act(battle, "lay_on_hands");
    expect(step.events).toContainEqual({ type: "countered", unitId: "1.0.1", abilityId: "lay_on_hands" });
    expect(unit(step.battle, "1.0.1").hp).toBeLessThan(before);
  });
});

describe("Etherborn", () => {
  test("Negate on an ally turns the next hit on it into healing, once", () => {
    let battle = until(start([p("etherborn", 1, 1), { ...p("congregant", 0, 1), hp: 40 }], [p("congregant", 0, 1)]), "0.1.1");
    battle = act(battle, "negate", "0.0.1").battle;
    battle = until(battle, "1.0.1");
    battle = act(battle, "attack", "0.0.1").battle;
    expect(unit(battle, "0.0.1").hp).toBeGreaterThan(40);
    expect(unit(battle, "0.0.1").effects.some((e) => e.def === "negated")).toBe(false);
  });

  test("Negate on an enemy turns its next shield restoration into a drain", () => {
    let battle = until(start([p("etherborn", 1, 1)], [p("custodian", 0, 1), p("technician", 1, 1)]), "0.1.1");
    battle = act(battle, "negate", "1.0.1").battle;
    battle = until(battle, "1.1.1");
    const full = unit(battle, "1.0.1").shield;
    battle = act(battle, "restore_shield", "1.0.1").battle;
    expect(unit(battle, "1.0.1").shield).toBe(full - 40);
  });

  test("Absorb on an enemy weakens its next hit, and the Etherborn drinks what was prevented", () => {
    let battle = until(start([{ ...p("etherborn", 1, 1), hp: 50 }, p("custodian", 0, 1)], [p("congregant", 0, 1)]), "0.1.1");
    battle = act(battle, "absorb", "1.0.1").battle;
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "absorbing_hit")).toBe(true);
    battle = until(battle, "1.0.1");
    battle = act(battle, "attack", "0.0.1").battle;
    expect(unit(battle, "0.1.1").hp).toBe(65);
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "absorbing_hit")).toBe(false);
  });

  test("a Negate on its own ally stays secret from the other side", () => {
    const battle = until(start([p("etherborn", 1, 1), p("congregant", 0, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const step = act(battle, "negate", "0.0.1");
    expect(masked(step.events, step.battle, 1).some((e) => e.type === "effect" && e.effect === "negated")).toBe(false);
    expect(masked(step.events, step.battle, 0).some((e) => e.type === "effect" && e.effect === "negated")).toBe(true);
    expect(asKnown(step.battle, 1).units["0.0.1"]?.effects.some((e) => e.def === "negated")).toBe(false);
    expect(asKnown(step.battle, 0).units["0.0.1"]?.effects.some((e) => e.def === "negated")).toBe(true);
  });
});

describe("Maelstrom", () => {
  test("Combustion makes its spells free actions until its turn ends", () => {
    let battle = until(start([p("maelstrom", 1, 1)], [p("brigand", 0, 0), p("brigand", 0, 2), p("bandit", 1, 1)]), "0.1.1");
    battle = act(battle, "combustion").battle;
    const spells = legalActions(battle).filter((a) => a.spellCost > 0);
    expect(spells.length).toBeGreaterThan(0);
    expect(spells.every((a) => a.choices.every((c) => c.cost === "free"))).toBe(true);
    battle = act(battle, "homing_lightning", "1.1.1").battle;
    battle = act(battle, "plus_burst", "1.0.0").battle;
    expect(battle.current?.unitId).toBe("0.1.1");
    const charges = unit(battle, "0.1.1").spellCharges;
    expect(charges).toBe(6 - 3);
    battle = applyAction(battle, { abilityId: "bolt", choice: 0 }).battle;
    expect(unit(battle, "0.1.1").effects.some((e) => e.def === "combusting")).toBe(false);
  });
});
