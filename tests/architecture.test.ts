import { createBattle, effectiveStats, legalActions } from "#rules/battle/engine";
import type { BattleContext } from "#rules/battle/engine";
import type { BattleEvent } from "#rules/battle/types";
import { act, anchorKey, p, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/**
 * The hard cases from docs/design/architecture.md: each is expressed through effect definitions, ability params
 * and battle context, with no mechanic named in the engine.
 */

const blacksmith = (bonus: number): BattleContext => ({ sideEffects: [[{ def: "blacksmith", amount: bonus }], []] });

const damageTo = (events: readonly BattleEvent[], unitId: string) =>
  events.filter((e) => e.type === "damage" && e.unitId === unitId && e.source !== null).reduce((sum, e) => sum + (e.type === "damage" ? e.amount : 0), 0);

describe("world context reaches the battle as effects", () => {
  test("a Blacksmith adds damage to every damaging ability, fixed-power spells included", () => {
    const plain = act(createBattle([[p("congregant", 0, 1)], [p("congregant", 0, 1)]]).battle, "attack", "1.0.1");
    const smithed = act(createBattle([[p("congregant", 0, 1)], [p("congregant", 0, 1)]], blacksmith(10)).battle, "attack", "1.0.1");
    expect(damageTo(smithed.events, "1.0.1")).toBe(damageTo(plain.events, "1.0.1") + 10);

    const burst = act(until(createBattle([[p("apprentice", 1, 1)], [p("congregant", 1, 1)]], blacksmith(10)).battle, "0.1.1"), "plus_burst", "1.1.1");
    expect(damageTo(burst.events, "1.1.1")).toBe(40 + 10);
  });

  test("it's not a stat: heals scaled on damage don't grow, and the unit card's damage is unchanged", () => {
    const battle = createBattle([[p("paladin", 0, 1)], [p("congregant", 2, 2)]], blacksmith(10)).battle;
    expect(effectiveStats(battle, "0.0.1").damage).toBe(40);
  });

  test("the enemy side isn't affected", () => {
    const battle = createBattle([[p("congregant", 2, 2)], [p("congregant", 0, 1)]], blacksmith(10)).battle;
    expect(battle.units["1.0.1"]?.effects).toEqual([]);
  });
});

describe("typed pools", () => {
  test("a fire shield soaks fire and nothing else", () => {
    const shielded = [p("congregant", 0, 0, [{ def: "fire_shield", amount: 15 }]), p("congregant", 0, 1)];
    const mage = until(createBattle([[p("hedge_mage", 1, 1)], shielded]).battle, "0.1.1");
    const step = act(mage, "area_2x2", "1.0.0");
    expect(step.events).toContainEqual({ type: "absorbed", unitId: "1.0.0", amount: 15, by: "fire_shield" });
    expect(damageTo(step.events, "1.0.0")).toBe(20 - 15);
    expect(damageTo(step.events, "1.0.1")).toBe(20);
    expect(step.battle.units["1.0.0"]?.effects.some((e) => e.def === "fire_shield")).toBe(false);

    const blade = createBattle([[p("congregant", 0, 0)], [p("congregant", 0, 0, [{ def: "fire_shield", amount: 15 }])]]).battle;
    const cut = act(blade, "attack", "1.0.0");
    expect(damageTo(cut.events, "1.0.0")).toBe(20);
  });
});

describe("params instead of variants", () => {
  test("Divine Lay on Hands is Lay on Hands with two charges that can also reach allies", () => {
    const battle = until(createBattle([[p("immortal", 0, 1), p("congregant", 0, 0)], [p("congregant", 2, 2)]]).battle, "0.0.1");
    const heal = legalActions(battle).find((a) => a.abilityId === "lay_on_hands");
    expect(heal?.name).toBe("Divine Lay on Hands");
    expect(heal?.choices.map((c) => [anchorKey(c), c.cost])).toEqual([["0.0.1", "free"], ["0.0.0", "main"]]);
  });
});

describe("stacking and lifetimes", () => {
  test("loans from different lenders are tracked apart and each perishes on its own lender's turn", () => {
    let battle = createBattle([[p("cyclops", 0, 0), p("cyclops", 0, 2), p("congregant", 0, 1)], [p("congregant", 2, 2)]]).battle;
    const lenders = ["0.0.0", "0.0.2"];
    for (const lender of lenders) battle = act(until(battle, lender), "equalize", "0.0.1").battle;
    const loans = battle.units["0.0.1"]?.effects.filter((e) => e.def === "lent_shield").map((e) => [e.source, e.amount]);
    expect(loans).toEqual([["0.0.0", 80], ["0.0.2", 40]]);
  });
});
