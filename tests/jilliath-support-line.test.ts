import { effectiveStats, legalActions } from "#rules/battle/engine";
import type { Battle } from "#rules/battle/types";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Jilliath support line past tier 1, the angels (faction-stuff/jilliath/support.md). Numbers are provisional. */

describe("the vengeance angels", () => {
  test("the Paragon's Atonement heals its most wounded ally for more than it dealt", () => {
    const battle = until(start([p("paragon", 1, 1), { ...p("congregant", 0, 0), hp: 20 }, { ...p("congregant", 0, 2), hp: 60 }], [p("congregant", 0, 1)]), "0.1.1");
    const after = act(battle, "atonement", "1.0.1").battle;
    // 15 at ability power 200 is 30; 150% of it is 45.
    expect(90 - unit(after, "1.0.1").hp).toBe(30);
    expect(unit(after, "0.0.0").hp).toBe(20 + 45);
    expect(unit(after, "0.0.2").hp).toBe(60);
  });

  test("the Empyreal's Atonement heals its three most wounded allies", () => {
    const wounded = [{ ...p("congregant", 0, 0), hp: 20 }, { ...p("congregant", 0, 1), hp: 30 }, { ...p("congregant", 0, 2), hp: 40 }];
    const battle = until(start([p("empyreal", 1, 1), ...wounded], [p("templar", 2, 1)]), "0.1.1");
    const after = act(battle, "atonement", "1.2.1").battle;
    // 15 at 300 is 45, a quarter off for the Templar's 20 armor: 34, healed to each.
    for (const [id, hp] of [["0.0.0", 20], ["0.0.1", 30], ["0.0.2", 40]] as const) expect(unit(after, id).hp).toBe(hp + 34);
  });

  test("the Reclaimer's Transfusion heals hard and costs her half of it; Reclaim heals her for what it deals", () => {
    const battle = until(start([p("reclaimer", 1, 1), { ...p("templar", 0, 1), hp: 10 }], [p("congregant", 2, 1)]), "0.1.1");
    const healed = act(battle, "transfusion", "0.0.1").battle;
    // 60 at 300 is 180.
    expect(unit(healed, "0.0.1").hp).toBe(190);
    expect(unit(healed, "0.1.1").hp).toBe(160 - 90);
    const hurt = until(start([{ ...p("reclaimer", 1, 1), hp: 50 }], [p("congregant", 2, 1)]), "0.1.1");
    const drained = act(hurt, "reclaim", "1.2.1").battle;
    expect(unit(drained, "0.1.1").hp).toBe(50 + 60);
  });
});

/** Everyone else defends (never waits, so their turns are spent) until `id` is up. */
function defendUntil(battle: Battle, id: string): Battle {
  let b = battle;
  for (let i = 0; i < 50 && b.current?.unitId !== id; i++) b = act(b, "defend").battle;
  return b;
}

describe("the guardian angels", () => {
  test("the Emissary's Prayer heals every ally a little", () => {
    const battle = until(start([p("emissary", 1, 1), { ...p("congregant", 0, 0), hp: 20 }, { ...p("congregant", 0, 2), hp: 60 }], [p("congregant", 2, 1)]), "0.1.1");
    const after = act(battle, "prayer").battle;
    // 10 at ability power 200 is 20.
    expect(unit(after, "0.0.0").hp).toBe(40);
    expect(unit(after, "0.0.2").hp).toBe(80);
  });

  test("the Guardian's Shield gives one ally 30 armor until its next turn, once", () => {
    // The Congregant is faster and has already defended this round, so the shield lasts into the next one.
    const battle = defendUntil(start([p("guardian", 1, 1), p("congregant", 0, 1)], [p("congregant", 2, 1)]), "0.1.1");
    const shielded = act(battle, "guardians_shield", "0.0.1").battle;
    expect(effectiveStats(shielded, "0.0.1").armor).toBe(30);
    const later = defendUntil(shielded, "0.0.1");
    expect(effectiveStats(later, "0.0.1").armor).toBe(0);
    expect(legalActions(until(later, "0.1.1")).map((a) => a.abilityId)).not.toContain("guardians_shield");
  });

  test("the Shepherd's Prayer also gives every ally 5 armor until its next turn", () => {
    const battle = defendUntil(start([p("shepherd", 1, 1), p("congregant", 0, 1)], [p("congregant", 2, 1)]), "0.1.1");
    const after = act(battle, "prayer").battle;
    expect(effectiveStats(after, "0.0.1").armor).toBe(5);
  });

  test("the Godkin's Resurrection raises a fallen ally at half its health, once, and never a destroyed one", () => {
    const fallen = { ...p("congregant", 0, 1), hp: 1, effects: [{ def: "burning", amount: 5, stacks: 1 }] };
    let battle = start([p("godkin", 1, 1), fallen, { ...p("congregant", 0, 0), hp: 1, effects: [{ def: "burning", amount: 5, stacks: 1 }] }], [p("paladin", 2, 1)]);
    battle = until(battle, "0.1.1");
    expect(unit(battle, "0.0.1").alive).toBe(false);
    battle = { ...battle, units: { ...battle.units, "0.0.0": { ...unit(battle, "0.0.0"), corpse: "destroyed" } } };
    const choices = legalActions(battle).find((a) => a.abilityId === "resurrection")?.choices.flatMap((c) => c.affected);
    expect(choices).toEqual(["0.0.1"]);
    const risen = act(battle, "resurrection", "0.0.1").battle;
    expect(unit(risen, "0.0.1")).toMatchObject({ alive: true, hp: 45, effects: [] });
    expect(legalActions(until(risen, "0.1.1")).map((a) => a.abilityId)).not.toContain("resurrection");
  });
});
