import { levelBonusPercent } from "#rules/world/record";
import { forkOptions } from "#rules/forks";
import { FACTION_ROOTS, UNITS } from "#rules/units/index";
import { legalActions } from "#rules/battle/engine";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Grove's melee line (the user's design, 2026-09-29). Numbers provisional. */
describe("Grove melee line", () => {
  test("tier 1 recruits and forks into Regrowth and Decay; each branch goes on to tier 3", () => {
    expect(FACTION_ROOTS.grove).toEqual(["grove_melee_1", "grove_support_1", "grove_mage_1"]);
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

describe("Decay tier 4: Lash out", () => {
  test("deals the rot inside it to the whole enemy front row; the rot stays and its countdown starts over", () => {
    let battle = until(start([p("decay_4", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.0.1");
    const rot = { def: "rotting", source: null, stacks: 1, amount: 30 };
    battle = { ...battle, units: { ...battle.units, "0.0.1": { ...unit(battle, "0.0.1"), effects: [...unit(battle, "0.0.1").effects, rot] } } };
    const after = act(battle, "lash_out", "1.0.1").battle;
    for (const id of ["1.0.0", "1.0.1", "1.0.2"]) expect(90 - unit(after, id).hp).toBe(30);
    expect(unit(after, "0.0.1").effects.find((e) => e.def === "rotting")).toMatchObject({ amount: 30, stacks: 3 });
  });

  test("can't lash out with nothing rotting inside it", () => {
    const battle = until(start([p("decay_4", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("lash_out");
  });
});

describe("the Grove's backline and corpses (user, 2026-09-29)", () => {
  /** A battle where the enemy's front middle has just died, leaving a corpse. */
  const withCorpse = () => {
    const battle = until(start([p("decay_support_2", 2, 1), { ...p("grove_melee_1", 0, 1), hp: 40 }], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.2.1");
    const dead = { ...unit(battle, "1.0.1"), alive: false, hp: 0 };
    return { ...battle, units: { ...battle.units, "1.0.1": dead } };
  };

  test("Corpse growth: every living ally heals; the corpse is used up and can't be used again", () => {
    const battle = withCorpse();
    const after = act(battle, "corpse_growth", "1.0.1").battle;
    expect(unit(after, "0.0.1").hp).toBeGreaterThanOrEqual(40 + 25);
    expect(unit(after, "1.0.1").corpse).toBe("used");
    const again = until(after, "0.2.1");
    expect(legalActions(again).find((a) => a.abilityId === "corpse_growth")?.choices ?? []).toHaveLength(0);
  });

  test("Corpse explosion: only on enemy corpses; the enemies next to it are hit and infested; the corpse is destroyed", () => {
    const battle = withCorpse();
    const after = act(battle, "corpse_explosion", "1.0.1").battle;
    expect(unit(after, "1.0.1").corpse).toBe("destroyed");
    for (const id of ["1.0.0", "1.0.2"]) {
      expect(unit(after, id).hp).toBeLessThan(90);
      expect(unit(after, id).effects.some((e) => e.def === "infested")).toBe(true);
    }
    // An allied corpse can grow, not burst.
    const own = { ...battle, units: { ...battle.units, "0.0.1": { ...unit(battle, "0.0.1"), alive: false, hp: 0 } } };
    const bursts = legalActions(own).find((a) => a.abilityId === "corpse_explosion")?.choices.map((c) => c.affected[0]) ?? [];
    expect(bursts).not.toContain("0.0.1");
  });

  test("Cycle: on an enemy it hurts and heals back a third; on an ally it heals and rots in, feeding a Decay unit's rot", () => {
    let battle = until(start([p("grove_mage_1", 2, 1), p("decay_4", 0, 1)], [p("congregant", 0, 1)]), "0.2.1");
    // Its turn starts right after: 40 taken, 13 healed back.
    const onEnemy = until(act(battle, "cycle", "1.0.1").battle, "1.0.1");
    expect(unit(onEnemy, "1.0.1").hp).toBe(90 - 40 + 13);
    battle = act(battle, "cycle", "0.0.1").battle;
    expect(unit(battle, "0.0.1").effects.find((e) => e.def === "rotting")?.amount).toBe(12);
  });
});
