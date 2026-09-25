import { chooseAction } from "#rules/ai";
import { actionsPerRound, applyAction, createBattle, effectiveStats, legalActions, PUNISHMENT_MAX_STACKS } from "#rules/battle";
import type { Placement } from "#rules/battle";
import type { Battle, BattleEvent, Col, Row } from "#rules/types";
import { squadProblems } from "#rules/doctrine";
import { COLS, ROWS } from "#rules/grid";
import { describe, expect, test } from "vitest";

const p = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

function start(first: Placement[], second: Placement[]): Battle {
  return createBattle([first, second]).battle;
}

function current(battle: Battle): string {
  const id = battle.current?.unitId;
  if (!id) throw new Error("no unit is acting");
  return id;
}

/** Performs `abilityId` with the choice that affects `targetId` (or the only choice). */
function act(battle: Battle, abilityId: string, targetId?: string): { battle: Battle; events: readonly BattleEvent[] } {
  const option = legalActions(battle).find((a) => a.abilityId === abilityId);
  if (!option) throw new Error(`${abilityId} is not legal for ${current(battle)}`);
  const choice = targetId === undefined ? 0 : option.choices.findIndex((c) => c.affected.includes(targetId));
  if (choice < 0) throw new Error(`${abilityId} cannot target ${targetId}`);
  return applyAction(battle, { abilityId, choice });
}

function hp(battle: Battle, id: string): number {
  const unit = battle.units[id];
  if (!unit) throw new Error(`no unit ${id}`);
  return unit.hp;
}

const legalIds = (battle: Battle) => legalActions(battle).map((a) => a.abilityId);

describe("initiative", () => {
  test("actions per round are initiative / 15, at least one", () => {
    expect([10, 15, 40, 50, 60].map(actionsPerRound)).toEqual([1, 1, 2, 3, 4]);
  });

  test("passes interleave, and the side that wins initiative ties alternates every pass", () => {
    let battle = start([p("paladin", 0, 0)], [p("paladin", 0, 0)]);
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      order.push(current(battle));
      battle = act(battle, "defend").battle;
    }
    expect(order).toEqual(["0.0.0", "1.0.0", "1.0.0", "0.0.0"]);
  });

  test("wait moves the unit to the end of the pass, once", () => {
    let battle = start([p("paladin", 0, 0)], [p("paladin", 0, 0)]);
    battle = act(battle, "wait").battle;
    expect(current(battle)).toBe("1.0.0");
    battle = act(battle, "defend").battle;
    expect(current(battle)).toBe("0.0.0");
    expect(legalIds(battle)).not.toContain("wait");
  });
});

describe("damage", () => {
  test("armor subtracts flat and floors at 1", () => {
    let battle = start([p("congregant", 0, 0)], [p("paladin", 0, 0)]);
    battle = act(battle, "attack", "1.0.0").battle;
    expect(hp(battle, "1.0.0")).toBe(149);
  });

  test("defend halves damage until the defender's next turn", () => {
    let battle = start([p("paladin", 0, 0)], [p("zealot", 0, 0)]);
    battle = act(battle, "defend").battle;
    battle = act(battle, "attack", "0.0.0").battle;
    expect(hp(battle, "0.0.0")).toBe(150 - 25);
  });
});

describe("melee reach", () => {
  test("back-row melee units cannot attack; front line reaches neighbouring columns", () => {
    const battle = start(
      [p("congregant", 0, 0), p("congregant", 1, 0)],
      [p("paladin", 0, 0), p("paladin", 0, 1), p("paladin", 0, 2)],
    );
    const reach = legalActions(battle).find((a) => a.abilityId === "attack")?.choices.map((c) => c.affected[0]);
    expect(reach).toEqual(["1.0.0", "1.0.1"]);
  });

  test("a gap in the enemy line falls through to the nearest column", () => {
    const battle = start([p("congregant", 0, 0)], [p("paladin", 0, 2)]);
    const reach = legalActions(battle).find((a) => a.abilityId === "attack")?.choices.map((c) => c.affected[0]);
    expect(reach).toEqual(["1.0.2"]);
  });

  test("when the front row falls, the row behind becomes the front line", () => {
    let battle = start([p("chosen", 0, 1)], [p("congregant", 0, 1), p("congregant", 1, 1)]);
    battle = act(battle, "attack", "1.0.1").battle;
    const reach = legalActions(battle).find((a) => a.abilityId === "attack")?.choices.map((c) => c.affected[0]);
    expect(reach).toEqual(["1.1.1"]);
  });
});

describe("Jilliath abilities", () => {
  test("Congregation: +10 damage per other congregant in the squad", () => {
    const battle = start([p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 2, 2)], [p("paladin", 0, 0)]);
    expect(effectiveStats(battle, "0.0.0").damage).toBe(40);
  });

  test("Lay on Hands: free self-heal for 2x damage, once per combat, then the unit still acts", () => {
    let battle = start([p("paladin", 0, 0)], [p("zealot", 0, 0)]);
    battle = act(battle, "defend").battle;
    battle = act(battle, "attack", "0.0.0").battle;
    battle = act(battle, "attack", "0.0.0").battle;
    expect(hp(battle, "0.0.0")).toBe(100);
    battle = act(battle, "lay_on_hands").battle;
    expect(hp(battle, "0.0.0")).toBe(150);
    expect(current(battle)).toBe("0.0.0");
    expect(legalIds(battle)).not.toContain("lay_on_hands");
  });

  test("Zealot must attack and pays half its damage per attack", () => {
    let battle = start([p("zealot", 0, 0)], [p("congregant", 0, 0)]);
    expect(legalIds(battle)).toEqual(["attack"]);
    battle = act(battle, "attack", "1.0.0").battle;
    expect(hp(battle, "0.0.0")).toBe(180 - 35);
  });

  test("Punisher: flail hits the whole enemy front line and Punishment stacks", () => {
    let battle = start(
      [p("punisher", 0, 1)],
      [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2), p("congregant", 1, 1)],
    );
    battle = act(battle, "flail", "1.0.0").battle;
    for (const id of ["1.0.0", "1.0.1", "1.0.2"]) expect(hp(battle, id)).toBe(90 - 45);
    expect(hp(battle, "1.1.1")).toBe(90);
    const stats = effectiveStats(battle, "1.0.0");
    expect(stats.damage).toBe(20 + 30 - 10);
    expect(actionsPerRound(stats.initiative)).toBe(2);
  });

  test("Punishment stops stacking at its cap", () => {
    let battle = start([p("punisher", 0, 1)], [p("immortal", 0, 1)]);
    for (let i = 0; i < 5; i++) {
      battle = act(battle, "flail", "1.0.1").battle;
      if (current(battle) !== "0.0.1") battle = act(battle, "defend").battle;
    }
    const stats = effectiveStats(battle, "1.0.1");
    expect(stats.damage).toBe(80 - 10 * PUNISHMENT_MAX_STACKS);
  });

  test("Torturer: half the damage becomes bleed that ticks at the start of the victim's turn", () => {
    const battle = start([p("torturer", 0, 0)], [p("paladin", 0, 0)]);
    const step = act(battle, "flail", "1.0.0");
    const damage = step.events.flatMap((e) => (e.type === "damage" ? [[e.amount, e.source]] : []));
    expect(damage).toEqual([[10, "0.0.0"], [30, null]]);
    expect(current(step.battle)).toBe("1.0.0");
  });

  test("Hook pulls the first unit behind an empty front tile forward and stuns it", () => {
    let battle = start([p("torturer", 0, 0)], [p("congregant", 0, 0), p("congregant", 2, 1)]);
    battle = act(battle, "hook", "1.2.1").battle;
    expect(battle.units["1.2.1"]?.tile).toEqual({ row: 0, col: 1 });
    const step = act(battle, "defend");
    expect(step.events).toContainEqual({ type: "skipped", unitId: "1.2.1", reason: "stunned" });
  });

  test("Hysteria: a kill grants a free extra attack at double self-damage", () => {
    let battle = start([p("fanatic", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 1)]);
    const step = act(battle, "attack", "1.0.1");
    battle = step.battle;
    expect(hp(battle, "0.0.1")).toBe(280 - 45);
    expect(current(battle)).toBe("0.0.1");
    expect(legalIds(battle)).toEqual(["attack"]);
    battle = act(battle, "attack", "1.0.0").battle;
    expect(hp(battle, "0.0.1")).toBe(280 - 45 - 90);
  });

  test("Guardian Spirit: the first killing blow leaves the Immortal at 1 HP until the round ends", () => {
    let battle = start([p("chosen", 0, 0), p("chosen", 0, 1)], [p("immortal", 0, 0)]);
    const events: BattleEvent[] = [];
    for (const [ability, target] of [["attack", "1.0.0"], ["attack", "1.0.0"], ["defend"], ["attack", "1.0.0"]]) {
      const step = act(battle, ability ?? "", target);
      events.push(...step.events);
      battle = step.battle;
    }
    expect(events.filter((e) => e.type === "deathPrevented")).toHaveLength(2);
    expect(hp(battle, "1.0.0")).toBe(1);
    expect(battle.round).toBe(1);
  });

  test("Fanaticism Aura: nobody can defend and everyone pays for the damage they deal", () => {
    let battle = start([p("avatar_of_vengeance", 2, 2), p("congregant", 0, 0)], [p("congregant", 0, 0)]);
    battle = act(battle, "wait").battle;
    expect(current(battle)).toBe("0.0.0");
    expect(legalIds(battle)).not.toContain("defend");
    battle = act(battle, "attack", "1.0.0").battle;
    expect(hp(battle, "0.0.0")).toBe(90 - 10);
  });
});

describe("whole battles", () => {
  const squad = [
    p("paladin", 0, 0), p("zealot", 0, 1), p("congregant", 0, 2),
    p("congregant", 1, 0), p("templar", 1, 1), p("punisher", 1, 2),
  ];

  function autoplay(battle: Battle): Battle {
    for (let steps = 0; !battle.outcome; steps++) {
      if (steps > 2000) throw new Error("battle did not end");
      const action = chooseAction(battle);
      if (!action) throw new Error("no action available mid-battle");
      battle = applyAction(battle, action).battle;
    }
    return battle;
  }

  test("an AI mirror match ends, and plays out identically every time", () => {
    const first = autoplay(start(squad, squad));
    const second = autoplay(start(squad, squad));
    expect(first.outcome).not.toBeNull();
    expect(second).toEqual(first);
  });
});

describe("doctrine", () => {
  test("a squad may only field units from its doctrine, at most six", () => {
    const preserve = [p("congregant", 0, 0), p("paladin", 0, 1)];
    expect(squadProblems(preserve, "preserve")).toEqual([]);
    expect(squadProblems([...preserve, p("zealot", 1, 1)], "preserve")).toEqual(["outsideDoctrine"]);
    expect(squadProblems([], "sacrifice")).toEqual(["empty"]);
    const seven = ROWS.flatMap((row) => COLS.map((col) => p("congregant", row, col))).slice(0, 7);
    expect(squadProblems(seven, "punishment")).toEqual(["tooMany"]);
  });
});
