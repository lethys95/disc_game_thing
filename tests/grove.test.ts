import { levelBonusPercent } from "#rules/world/record";
import { forkOptions } from "#rules/forks";
import { FACTION_ROOTS, UNITS } from "#rules/units/index";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Grove's melee line (the user's design, 2026-09-29). Numbers provisional. */
describe("Grove melee line", () => {
  test("tier 1 recruits and forks into Regrowth and Decay; each branch goes on to tier 3", () => {
    expect(FACTION_ROOTS.grove).toEqual(["grove_melee_1"]);
    expect(forkOptions("grove_melee_1")).toEqual(["regrowth_2", "decay_2"]);
    expect(UNITS["regrowth_3"]?.tier).toBe(3);
    expect(UNITS["decay_3"]?.tier).toBe(3);
  });

  test("Regrowth: heals a share of its max HP at the start of its turns", () => {
    let battle = until(start([p("congregant", 0, 1)], [{ ...p("grove_melee_1", 0, 1), hp: 50 }]), "1.0.1");
    expect(unit(battle, "1.0.1").hp).toBe(50 + Math.round(121 * 0.06));
    battle = act(battle, "defend").battle;
    expect(unit(battle, "1.0.1").hp).toBeGreaterThan(50);
  });

  test("Decay: a share of a hit rots in and is lost over its next turns, not at once; no regeneration", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("decay_2", 0, 1)]), "0.0.1");
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    // A Congregant alone hits for 20: 40% (8) rots in and 12 lands now; as its turn starts, a third of the rot,
    // rounded up (3), is lost, and 5 remain for its next two turns.
    expect(190 - unit(battle, "1.0.1").hp).toBe(12 + 3);
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "rotting")).toMatchObject({ amount: 5, stacks: 2 });
    expect(UNITS["decay_2"]?.abilities.some((a) => a.id === "regrowth")).toBe(false);
  });

  test("Withering: an enemy that hits a tier-3 Decay deals less damage from then on, up to a cap", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("decay_3", 0, 1)]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "0.0.1").effects.find((e) => e.def === "withered")?.amount).toBe(5);
  });

  test("Grove mend: an ally regrows at the start of its next turns", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("regrowth_3", 0, 1), { ...p("grove_melee_1", 0, 0), hp: 40 }]), "1.0.1");
    battle = until(act(battle, "grove_mend", "1.0.0").battle, "1.0.0");
    // Its turn has started: 40 regrown (on top of its own regrowth), two more turns to come.
    expect(unit(battle, "1.0.0").hp).toBeGreaterThanOrEqual(40 + 40);
    expect(unit(battle, "1.0.0").effects.find((e) => e.def === "mending")?.stacks).toBe(2);
  });

  test("the Grove gains 50% more per level past the end of its line than others (the user's ramp)", () => {
    expect(levelBonusPercent("decay_3")).toBe(levelBonusPercent("paladin") * 1.5);
  });
});
