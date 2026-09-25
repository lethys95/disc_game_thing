import { applyAction, createBattle, effectiveStats, legalActions } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import { allowedUnits, commit, openBranches } from "#rules/doctrine";
import { grow } from "#rules/progression";
import type { Battle, BattleEvent, Col, Row } from "#rules/battle/types";
import { describe, expect, test } from "vitest";

const p = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });
const start = (a: Placement[], b: Placement[]) => createBattle([a, b]).battle;
const key = (c: { anchor: { side: number; tile: { row: number; col: number } } }) => `${c.anchor.side}.${c.anchor.tile.row}.${c.anchor.tile.col}`;

function act(battle: Battle, abilityId: string, anchor?: string): { battle: Battle; events: readonly BattleEvent[] } {
  const option = legalActions(battle).find((a) => a.abilityId === abilityId);
  if (!option) throw new Error(`${abilityId} is not legal for ${battle.current?.unitId}`);
  const choice = anchor === undefined ? 0 : option.choices.findIndex((c) => key(c) === anchor);
  if (choice < 0) throw new Error(`${abilityId} has no choice anchored at ${anchor}`);
  return applyAction(battle, { abilityId, choice });
}

function until(battle: Battle, id: string): Battle {
  let b = battle;
  for (let i = 0; i < 50 && b.current?.unitId !== id; i++) {
    b = act(b, legalActions(b).some((a) => a.abilityId === "wait") ? "wait" : "defend").battle;
  }
  if (b.current?.unitId !== id) throw new Error(`${id} never got a turn`);
  return b;
}

const unit = (battle: Battle, id: string) => {
  const found = battle.units[id];
  if (!found) throw new Error(`no unit ${id}`);
  return found;
};

describe("Nexus forks", () => {
  test("scheme vs overload is one faction-wide fork", () => {
    expect(openBranches("nexus", [])).toEqual(["scheme", "overload"]);
    expect(openBranches("nexus", commit("nexus", [], "scheme"))).toEqual([]);
    expect(allowedUnits("nexus", ["scheme"])).toEqual(["custodian", "battery", "arcane_engineer", "apprentice", "justiciar"]);
    expect(grow("custodian", 0, 100, ["overload"]).defId).toBe("mutant");
    expect(grow("apprentice", 0, 100, ["overload"]).defId).toBe("thaumaturge");
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
    expect(lightning?.choices.find((c) => key(c) === "1.0.0")?.affected).toEqual(["0.0.1", "1.0.0", "1.0.2"]);
    expect(lightning?.choices.find((c) => key(c) === "1.1.1")?.affected).toEqual(["1.1.1"]);
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
