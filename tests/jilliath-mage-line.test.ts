import { effectiveStats, legalActions } from "#rules/battle/engine";
import type { Battle, BattleEvent } from "#rules/battle/types";
import { act, affectedBy, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Jilliath mage line past tier 1 (faction-stuff/jilliath/mage.md). Numbers are provisional. */

const effect = (battle: Battle, id: string, def: string) => unit(battle, id).effects.find((e) => e.def === def);

/** What the action itself did to `target`, before the turns after it began (a burn ticking as its bearer's turn starts). */
function took(events: readonly BattleEvent[], target: string): number {
  const end = events.findIndex((e) => e.type === "turnStart");
  return (end < 0 ? events : events.slice(0, end)).reduce((sum, e) => sum + (e.type === "damage" && e.unitId === target ? e.amount : 0), 0);
}

/** Plays every turn by `play` (the acting unit's id → an ability id and anchor) until `stop` holds; returns all events. */
function playUntil(battle: Battle, stop: (b: Battle) => boolean, play: (id: string) => [string, string?] | null): { battle: Battle; events: BattleEvent[] } {
  let b = battle;
  const events: BattleEvent[] = [];
  for (let i = 0; i < 60 && !stop(b); i++) {
    const id = b.current?.unitId ?? "";
    const [ability, anchor] = play(id) ?? [legalActions(b).some((a) => a.abilityId === "wait") ? "wait" : "defend"];
    const step = act(b, ability, anchor);
    b = step.battle;
    events.push(...step.events);
  }
  if (!stop(b)) throw new Error("never stopped");
  return { battle: b, events };
}

describe("the faith side: holy", () => {
  test("Castigation deals holy damage, and its target deals less for its next turns", () => {
    const battle = until(start([p("cleric", 1, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const { battle: after, events } = act(battle, "castigation", "1.0.1");
    expect(took(events, "1.0.1")).toBe(36);
    expect(events).toContainEqual({ type: "turnStart", unitId: "1.0.1" });
    // Its turn has begun: the first of two weakened turns.
    expect(effect(after, "1.0.1", "castigated")).toMatchObject({ amount: 30, stacks: 1 });
    expect(effectiveStats(after, "1.0.1").hitPercent).toBe(-30);
  });

  test("the Pontiff's Chant hits every enemy lightly and castigates them more weakly, never weakening a castigation", () => {
    const castigated = [{ def: "castigated", amount: 30, stacks: 1 }];
    const battle = until(start([p("pontiff", 1, 1)], [p("congregant", 0, 0, castigated), p("congregant", 0, 1), p("congregant", 2, 2)]), "0.1.1");
    const { battle: after, events } = act(battle, "chant");
    for (const id of ["1.0.0", "1.0.1", "1.2.2"]) expect(took(events, id)).toBe(18);
    expect(effect(after, "1.0.1", "castigated")?.amount).toBe(15);
    expect(effect(after, "1.0.0", "castigated")?.amount).toBe(30);
  });

  test("Repentance is a free action that takes an enemy out for three turns", () => {
    const battle = until(start([p("pontiff", 1, 1)], [p("congregant", 0, 0), p("paladin", 0, 2)]), "0.1.1");
    const repented = act(battle, "repentance", "1.0.0").battle;
    expect(repented.current?.unitId).toBe("0.1.1");
    expect(legalActions(repented).map((a) => a.abilityId)).not.toContain("repentance");
    const { events } = playUntil(repented, (b) => b.current?.unitId === "1.0.0", (id) => (id === "0.1.1" ? ["castigation", "1.0.2"] : id === "1.0.2" ? ["defend"] : null));
    const skipped = events.filter((e) => e.type === "skipped" && e.unitId === "1.0.0");
    expect(skipped).toHaveLength(3);
  });

  test("anything that damages or heals a repentant unit wakes it, a burn included", () => {
    const battle = until(start([p("pontiff", 1, 1)], [p("congregant", 0, 0), p("congregant", 0, 2, [{ def: "burning", amount: 5, stacks: 3 }])]), "0.1.1");
    let woken = act(battle, "repentance", "1.0.0").battle;
    woken = act(woken, "castigation", "1.0.0").battle;
    expect(effect(woken, "1.0.0", "repentant")).toBeUndefined();
    const burning = act(act(battle, "repentance", "1.0.2").battle, "defend").battle;
    // Its burn ticks as its turn starts, waking it in time to act.
    expect(until(burning, "1.0.2").current?.unitId).toBe("1.0.2");
  });

  test("Judgement strikes only the enemies whose last turn dealt damage", () => {
    const battle = start([p("archon", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 2)]);
    const fresh = until(battle, "0.0.1");
    expect(legalActions(fresh).map((a) => a.abilityId)).not.toContain("judgement");
    const { battle: judged } = playUntil(
      battle,
      (b) => b.current?.unitId === "0.0.1" && unit(b, "1.0.0").struck,
      (id) => (id === "1.0.0" ? ["attack", "0.0.1"] : id === "1.0.2" ? ["defend"] : null),
    );
    expect(affectedBy(judged, "judgement", "1.0.0")).toEqual(["1.0.0"]);
    const after = act(judged, "judgement", "1.0.0").battle;
    // 25 × 4 = 100, more than a Congregant has.
    expect(unit(after, "1.0.0").alive).toBe(false);
  });
});

describe("the fanaticism side: fire and burn", () => {
  test("Ignite's burns stack: a second hit adds its burn and starts the turns over", () => {
    const battle = until(start([p("doomsayer", 1, 1)], [p("congregant", 0, 1, [{ def: "burning", amount: 8, stacks: 1 }])]), "0.1.1");
    const after = act(battle, "condemn", "1.0.1").battle;
    // 8 + 10, three turns again, one of them already begun.
    expect(effect(after, "1.0.1", "burning")).toMatchObject({ amount: 18, stacks: 2 });
  });

  test("Burn at the stake grows with every ally still to act, and each of them gives up its turn", () => {
    const battle = start([p("doomsayer", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)], [p("templar", 2, 1)]);
    const ready = until(battle, "0.0.0");
    expect(ready.queue).toEqual(expect.arrayContaining(["0.0.1", "0.0.2"]));
    const { battle: after, events } = act(ready, "burn_at_the_stake", "1.2.1");
    // (20 + 25 × 2) × 2 = 140, less the Templar's 20 armor.
    expect(took(events, "1.2.1")).toBe(120);
    expect(effect(after, "0.0.1", "gave_turn")).toBeDefined();
    const rest = playUntil(after, (b) => b.round === 2, () => null);
    const skipped = [...events, ...rest.events].filter((e) => e.type === "skipped").map((e) => (e.type === "skipped" ? e.unitId : ""));
    expect(skipped).toEqual(expect.arrayContaining(["0.0.1", "0.0.2"]));
  });

  test("the tier-3 fire caster hits and burns every enemy", () => {
    const battle = until(start([p("jilliath_fire_3", 1, 1)], [p("congregant", 0, 0), p("congregant", 0, 2), p("congregant", 2, 1)]), "0.1.1");
    const { battle: after, events } = act(battle, "fire_on_all");
    for (const id of ["1.0.0", "1.0.2", "1.2.1"]) {
      expect(took(events, id)).toBe(15);
      expect(effect(after, id, "burning")?.amount).toBe(9);
    }
  });

  test("Detonate deals every burning enemy's remaining burn at once, at 150%", () => {
    const burning = [{ def: "burning", amount: 10, stacks: 2 }];
    const battle = until(start([p("jilliath_fire_4", 1, 1)], [p("congregant", 0, 0, burning), p("congregant", 0, 2)]), "0.1.1");
    expect(affectedBy(battle, "detonate", "1.0.0")).toEqual(["1.0.0"]);
    const { battle: after, events } = act(battle, "detonate", "1.0.0");
    expect(took(events, "1.0.0")).toBe(30);
    expect(unit(after, "1.0.2").hp).toBe(90);
    // The hit is the caster's own, so it catches a fresh burn from Ignite.
    expect(effect(after, "1.0.0", "burning")?.amount).toBe(12);
  });

  test("the martyr's beam runs through a column, and backfires", () => {
    const battle = until(start([p("jilliath_martyr_4", 1, 1)], [p("paladin", 0, 1), p("paladin", 1, 1), p("paladin", 2, 1), p("paladin", 0, 0)]), "0.1.1");
    expect(affectedBy(battle, "beam", "1.0.1")).toEqual(["1.0.1", "1.1.1", "1.2.1"]);
    const { battle: after, events } = act(battle, "beam", "1.0.1");
    // 25 × 4 = 100, less a Paladin's 20 armor; the backfire is half of all it dealt.
    for (const id of ["1.0.1", "1.1.1", "1.2.1"]) expect(took(events, id)).toBe(80);
    expect(160 - unit(after, "0.1.1").hp).toBe(120);
  });
});
