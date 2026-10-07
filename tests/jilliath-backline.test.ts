import { autoplay } from "#rules/ai";
import { BATTLE_ROUND_LIMIT } from "#rules/balance";
import { legalActions } from "#rules/battle/engine";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Jilliath's tier-1 backline (user, 2026-09-26): the first support and the Acolyte. Numbers are provisional. */

describe("Seraph", () => {
  test("heals a wounded ally for more the more it is missing, and only wounded allies", () => {
    let battle = until(start([p("seraph", 1, 1), { ...p("congregant", 0, 0), hp: 30 }, { ...p("congregant", 0, 2), hp: 80 }, p("congregant", 0, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const targets = legalActions(battle).find((a) => a.abilityId === "mend")?.choices.flatMap((c) => c.affected);
    expect(targets).toEqual(expect.arrayContaining(["0.0.0", "0.0.2"]));
    expect(targets).not.toContain("0.0.1");
    battle = act(battle, "mend", "0.0.0").battle;
    // 20 + 30% of the 60 it was missing.
    expect(unit(battle, "0.0.0").hp).toBe(30 + 20 + 18);
  });

  test("has a weak attack of its own", () => {
    const battle = until(start([p("seraph", 1, 1)], [p("congregant", 2, 2)]), "0.1.1");
    expect(legalActions(battle).map((a) => a.abilityId)).toContain("shoot");
  });
});

describe("Acolyte", () => {
  test("Condemn hits harder the more health the target is missing", () => {
    const fresh = until(start([p("acolyte", 1, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const hurt = until(start([p("acolyte", 1, 1)], [{ ...p("congregant", 0, 1), hp: 50 }]), "0.1.1");
    const dealt = (b: typeof fresh) => {
      const before = unit(b, "1.0.1").hp;
      return before - unit(act(b, "condemn", "1.0.1").battle, "1.0.1").hp;
    };
    expect(dealt(fresh)).toBe(25);
    expect(dealt(hurt)).toBe(25 + 12);
  });
});

describe("the round limit (#52, provisional)", () => {
  test("a fight neither side can finish ends with the attacker withdrawing, its survivors alive", () => {
    // The pairing that stalled in `pnpm sim:t1`: the last Congregant can't break a shield the Technician refills.
    const jilliath = [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2), p("seraph", 2, 0), p("seraph", 2, 1)];
    const nexus = [p("custodian", 0, 0), p("custodian", 0, 1), p("custodian", 0, 2), p("technician", 2, 0), p("apprentice", 2, 1)];
    let battle = start(jilliath, nexus);
    battle = autoplay(battle);
    expect(battle.outcome).toEqual({ winner: 1, withdrew: true });
    expect(battle.round).toBe(BATTLE_ROUND_LIMIT);
    expect(Object.values(battle.units).some((u) => u.side === 0 && u.alive)).toBe(true);
  });
});

describe("Retreat (the user's surrender design)", () => {
  test("a unit that retreats loses its next turn, then leaves alive; the battle goes on", () => {
    let battle = until(start([p("congregant", 0, 0), p("congregant", 0, 1)], [p("congregant", 0, 1)]), "0.0.0");
    battle = act(battle, "retreat").battle;
    battle = until(battle, "0.0.1");
    // Its own next turn is lost; the one after, it's gone.
    let left = false;
    for (let i = 0; i < 20 && !left; i++) {
      const step = act(battle, "defend");
      left = step.events.some((e) => e.type === "fled" && e.unitId === "0.0.0");
      battle = step.battle;
      if (!left && battle.current?.unitId !== "0.0.1") battle = until(battle, "0.0.1");
    }
    const fled = unit(battle, "0.0.0");
    expect([fled.alive, fled.fled, fled.hp > 0]).toEqual([false, true, true]);
    expect(battle.outcome).toBeNull();
  });

  test("garrison defenders are cornered: no retreat", () => {
    const battle = until(start([p("congregant", 0, 1)], [{ ...p("congregant", 0, 1), effects: [{ def: "cornered" }] }]), "1.0.1");
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("retreat");
  });
});
