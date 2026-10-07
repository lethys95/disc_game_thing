import type { Battle, EffectSeed } from "#rules/battle/types";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Keywords any unit can carry (the user, 2026-10-05). Granted here through the `carries` effect. Provisional #65. */
const carries = (id: string, params: Record<string, number> = {}): EffectSeed => ({ def: "carries", ability: { id, params } });

/** The same battle with one unit's abilities dealing another damage type. */
const dealing = (battle: Battle, id: string, type: "lightning" | "water"): Battle => {
  const dealer = unit(battle, id);
  return { ...battle, units: { ...battle.units, [id]: { ...dealer, abilities: dealer.abilities.map((a) => ({ ...a, damageType: type })) } } };
};

describe("crit and evasion: counted, never rolled", () => {
  test("Crit 2: every second hit it lands deals double", () => {
    let battle = until(start([p("congregant", 0, 1, [carries("crit", { every: 2 })])], [p("paladin", 0, 1)]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    // The Paladin's 20 armor floors a Congregant's 20 at 1; doubled, the hit is 40 before armor.
    expect(150 - unit(battle, "1.0.1").hp).toBe(1);
    battle = until(battle, "0.0.1");
    const { battle: after, events } = act(battle, "attack", "1.0.1");
    expect(unit(battle, "1.0.1").hp - unit(after, "1.0.1").hp).toBe(40 - 20);
    expect(events).toContainEqual({ type: "crit", unitId: "0.0.1", target: "1.0.1" });
  });

  test("Evasion 2: every second hit against it misses entirely", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [carries("evasion", { every: 2 })])]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    const once = unit(battle, "1.0.1").hp;
    expect(once).toBe(90 - 20);
    battle = until(battle, "0.0.1");
    const { battle: after, events } = act(battle, "attack", "1.0.1");
    expect(unit(after, "1.0.1").hp).toBe(unit(battle, "1.0.1").hp);
    expect(events).toContainEqual({ type: "evaded", unitId: "1.0.1" });
  });
});

describe("Explode", () => {
  test("it dies, the enemy front row takes a share of its max HP, and nothing is left to raise", () => {
    const battle = until(start([p("paladin", 0, 1, [carries("explode", { percent: 50 })])], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.0.1");
    const after = act(battle, "explode", "1.0.0").battle;
    for (const id of ["1.0.0", "1.0.1", "1.0.2"]) expect(90 - unit(after, id).hp).toBe(75);
    expect(unit(after, "0.0.1").alive).toBe(false);
    expect(unit(after, "0.0.1").corpse).toBe("destroyed");
  });
});

describe("statuses that react to damage types", () => {
  test("Ignite: the target burns at the start of its turns; a wet one doesn't catch", () => {
    let battle = until(start([p("congregant", 0, 1, [carries("ignite", { burn: 8, turns: 3 })])], [p("congregant", 0, 1)]), "0.0.1");
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    // Its turn has started: one burn of three gone.
    expect(unit(battle, "1.0.1").hp).toBe(90 - 20 - 8);
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "burning")).toMatchObject({ amount: 8, stacks: 2 });
    const wet = until(start([p("congregant", 0, 1, [carries("ignite")])], [p("congregant", 0, 1, [{ def: "wet", stacks: 2 }])]), "0.0.1");
    expect(unit(act(wet, "attack", "1.0.1").battle, "1.0.1").effects.some((e) => e.def === "burning")).toBe(false);
  });

  test("Soak: the target gets wet and stops burning", () => {
    let battle = until(start([p("congregant", 0, 1, [carries("soak")])], [p("congregant", 0, 1, [{ def: "burning", amount: 8, stacks: 3 }])]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "burning")).toBe(false);
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "wet")).toBe(true);
  });

  test("lightning on a wet unit hits half again as hard and electrocutes it; fire dries it", () => {
    const soaked = [{ def: "wet", stacks: 2 }];
    let battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, soaked)]), "0.0.1");
    battle = dealing(battle, "0.0.1", "lightning");
    const { battle: after, events } = act(battle, "attack", "1.0.1");
    expect(90 - unit(after, "1.0.1").hp).toBe(30);
    expect(events).toContainEqual({ type: "skipped", unitId: "1.0.1", reason: "lostTurn" });
    const dried = until(start([p("hedge_mage", 1, 1)], [p("congregant", 0, 1, soaked)]), "0.1.1");
    const burnt = act(dried, "area_2x2", "1.0.1").battle;
    expect(unit(burnt, "1.0.1").effects.some((e) => e.def === "wet")).toBe(false);
  });

  test("water puts out a burning unit", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "burning", amount: 8, stacks: 3 }])]), "0.0.1");
    battle = dealing(battle, "0.0.1", "water");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "burning")).toBe(false);
  });
});
