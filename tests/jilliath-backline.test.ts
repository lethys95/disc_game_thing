import { legalActions } from "#rules/battle/engine";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Jilliath's tier-1 backline (user, 2026-09-26): the Cleric and the first mage. Numbers are provisional. */

describe("Cleric", () => {
  test("heals a wounded ally for more the more it is missing, and only wounded allies", () => {
    let battle = until(start([p("cleric", 1, 1), { ...p("congregant", 0, 0), hp: 30 }, { ...p("congregant", 0, 2), hp: 80 }, p("congregant", 0, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const targets = legalActions(battle).find((a) => a.abilityId === "mend")?.choices.flatMap((c) => c.affected);
    expect(targets).toEqual(expect.arrayContaining(["0.0.0", "0.0.2"]));
    expect(targets).not.toContain("0.0.1");
    battle = act(battle, "mend", "0.0.0").battle;
    // 20 + 30% of the 60 it was missing.
    expect(unit(battle, "0.0.0").hp).toBe(30 + 20 + 18);
  });

  test("has a weak attack of its own", () => {
    const battle = until(start([p("cleric", 1, 1)], [p("congregant", 2, 2)]), "0.1.1");
    expect(legalActions(battle).map((a) => a.abilityId)).toContain("shoot");
  });
});

describe("Jilliath mage 1", () => {
  test("Condemn hits harder the more health the target is missing", () => {
    const fresh = until(start([p("jilliath_mage_1", 1, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const hurt = until(start([p("jilliath_mage_1", 1, 1)], [{ ...p("congregant", 0, 1), hp: 50 }]), "0.1.1");
    const dealt = (b: typeof fresh) => {
      const before = unit(b, "1.0.1").hp;
      return before - unit(act(b, "condemn", "1.0.1").battle, "1.0.1").hp;
    };
    expect(dealt(fresh)).toBe(25);
    expect(dealt(hurt)).toBe(25 + 12);
  });
});
