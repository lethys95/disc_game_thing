import { paramsOf } from "#rules/abilities/index";
import { levelBonusPercent } from "#rules/world/record";
import { forkOptions } from "#rules/forks";
import { FACTION_ROOTS, UNITS } from "#rules/units/index";
import { legalActions } from "#rules/battle/engine";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Grove's melee line (the user's design, 2026-09-29). Numbers provisional. */
describe("Grove melee line", () => {
  test("tier 1 (the Sproutling) recruits and forks into Regrowth and Decay; each branch goes on to tier 3", () => {
    expect(FACTION_ROOTS.grove).toEqual(["sproutling", "grove_support_1", "grove_mage_1"]);
    expect(forkOptions("sproutling")).toEqual(["regrowth_2", "moldling"]);
    expect(UNITS["regrowth_3"]?.tier).toBe(3);
    expect(UNITS["deadwood"]?.tier).toBe(3);
  });

  test("Regrowth: heals a share of its max HP at the start of its turns", () => {
    let battle = until(start([p("congregant", 0, 1)], [{ ...p("sproutling", 0, 1), hp: 50 }]), "1.0.1");
    expect(unit(battle, "1.0.1").hp).toBe(50 + Math.round(121 * 0.06));
    battle = act(battle, "defend").battle;
    expect(unit(battle, "1.0.1").hp).toBeGreaterThan(50);
  });

  test("Decay: a share of a hit rots in and is lost over its next turns, not at once; no regeneration", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("moldling", 0, 1)]), "0.0.1");
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    // A Congregant alone hits for 20: 40% (8) rots in and 12 lands now; as its turn starts, a third of the rot,
    // rounded up (3), is lost, and 5 remain for its next two turns.
    expect((UNITS["moldling"]?.stats.maxHp ?? 0) - unit(battle, "1.0.1").hp).toBe(12 + 3);
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "rotting")).toMatchObject({ amount: 5, stacks: 2 });
    expect(UNITS["moldling"]?.abilities.some((a) => a.id === "regrowth")).toBe(false);
  });

  test("Withering: an enemy that hits a tier-3 Decay deals less damage from then on, up to a cap", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("deadwood", 0, 1)]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "0.0.1").effects.find((e) => e.def === "withered")?.amount).toBe(5);
  });

  test("Grove mend: an ally regrows at the start of its next turns", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("regrowth_3", 0, 1), { ...p("sproutling", 0, 0), hp: 40 }]), "1.0.1");
    battle = until(act(battle, "grove_mend", "1.0.0").battle, "1.0.0");
    // Its turn has started: 40 regrown (on top of its own regrowth), two more turns to come.
    expect(unit(battle, "1.0.0").hp).toBeGreaterThanOrEqual(40 + 40);
    expect(unit(battle, "1.0.0").effects.find((e) => e.def === "mending")?.stacks).toBe(2);
  });

  test("the Grove gains 50% more per level past the end of its line than others (the user's ramp)", () => {
    expect(levelBonusPercent("deadwood")).toBe(levelBonusPercent("paladin") * 1.5);
  });
});

describe("Decay tier 4: Lash out", () => {
  test("deals the rot inside it to the whole enemy front row; the rot stays and its countdown starts over", () => {
    let battle = until(start([p("bog_giant", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.0.1");
    const rot = { def: "rotting", source: null, stacks: 1, amount: 30 };
    battle = { ...battle, units: { ...battle.units, "0.0.1": { ...unit(battle, "0.0.1"), effects: [...unit(battle, "0.0.1").effects, rot] } } };
    const after = act(battle, "lash_out", "1.0.1").battle;
    for (const id of ["1.0.0", "1.0.1", "1.0.2"]) expect(90 - unit(after, id).hp).toBe(30);
    expect(unit(after, "0.0.1").effects.find((e) => e.def === "rotting")).toMatchObject({ amount: 30, stacks: 3 });
  });

  test("can't lash out with nothing rotting inside it", () => {
    const battle = until(start([p("bog_giant", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("lash_out");
  });
});

describe("Decay tier 4: the Mulch Gorger (user, 2026-10-04)", () => {
  test("the Deadwood forks into Bog Giant and the Mulch Gorger, and the line ends there", () => {
    expect(forkOptions("deadwood")).toEqual(["bog_giant", "mulch_gorger"]);
    expect(forkOptions("mulch_gorger")).toEqual([]);
  });

  test("Gorge: every death, of either side, heals it and adds damage for the rest of combat, without limit", () => {
    let battle = until(start([{ ...p("mulch_gorger", 0, 1), hp: 100 }, { ...p("sproutling", 0, 0), hp: 1 }], [p("congregant", 0, 0), { ...p("congregant", 0, 1), hp: 1 }]), "0.0.1");
    const base = UNITS["mulch_gorger"]?.stats.damage ?? 0;
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "0.0.1").hp).toBe(100 + (paramsOf({ id: "gorge" }, UNITS["mulch_gorger"]?.stats.abilityPower ?? 0)["heal"] ?? 0));
    expect(unit(battle, "0.0.1").effects.find((e) => e.def === "gorged")?.amount).toBe(6);
    // An ally falls too: another meal.
    battle = until(battle, "1.0.0");
    battle = act(battle, "attack", "0.0.0").battle;
    expect(unit(battle, "0.0.0").alive).toBe(false);
    expect(unit(battle, "0.0.1").effects.find((e) => e.def === "gorged")?.amount).toBe(12);
    expect(UNITS["mulch_gorger"]?.stats.damage).toBe(base);
  });

  test("Gorge: a corpse used up or burst feeds it as well", () => {
    let battle = until(start([p("decay_support_2", 2, 1), p("mulch_gorger", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.2.1");
    battle = { ...battle, units: { ...battle.units, "1.0.1": { ...unit(battle, "1.0.1"), alive: false, hp: 0 } } };
    const after = act(battle, "corpse_explosion", "1.0.1").battle;
    expect(unit(after, "0.0.1").effects.find((e) => e.def === "gorged")?.amount).toBe(6);
  });
});

describe("the Grove's backline and corpses (user, 2026-09-29)", () => {
  /** A battle where the enemy's front middle has just died, leaving a corpse. */
  const withCorpse = () => {
    const battle = until(start([p("decay_support_2", 2, 1), { ...p("sproutling", 0, 1), hp: 40 }], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.2.1");
    const dead = { ...unit(battle, "1.0.1"), alive: false, hp: 0 };
    return { ...battle, units: { ...battle.units, "1.0.1": dead } };
  };

  test("Witherbloom: an ally regrows over its next turns, and an enemy that hits it while it blooms withers", () => {
    let battle = until(start([p("decay_support_2", 2, 1), { ...p("sproutling", 0, 1), hp: 40 }], [p("congregant", 0, 1)]), "0.2.1");
    battle = act(battle, "witherbloom", "0.0.1").battle;
    const bloomed = unit(battle, "0.0.1");
    expect(bloomed.effects.map((e) => e.def)).toEqual(expect.arrayContaining(["mending", "witherblooming"]));
    battle = until(battle, "1.0.1");
    battle = act(battle, "attack", "0.0.1").battle;
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "withered")?.amount).toBe(5);
  });

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
    let battle = until(start([p("grove_mage_1", 2, 1), p("bog_giant", 0, 1)], [p("congregant", 0, 1)]), "0.2.1");
    // Its turn starts right after: 40 taken, 13 healed back.
    const onEnemy = until(act(battle, "cycle", "1.0.1").battle, "1.0.1");
    expect(unit(onEnemy, "1.0.1").hp).toBe(90 - 40 + 13);
    battle = act(battle, "cycle", "0.0.1").battle;
    expect(unit(battle, "0.0.1").effects.find((e) => e.def === "rotting")?.amount).toBe(12);
  });
});

describe("the Spiritess branch (user, 2026-09-29)", () => {
  test("Spirit bloom heals now and over time; HoTs from different healers run side by side", () => {
    let battle = until(start([p("spiritess_2", 2, 1), { ...p("regrowth_3", 0, 1), hp: 100 }], [p("congregant", 2, 1)]), "0.2.1");
    battle = act(battle, "spirit_bloom", "0.0.1").battle;
    expect(unit(battle, "0.0.1").hp).toBeGreaterThanOrEqual(125);
    expect(unit(battle, "0.0.1").effects.filter((e) => e.def === "mending")).toHaveLength(1);
  });

  test("Burst mend consumes the HoTs at once for more than they'd heal, and counts a Regrowth melee's regeneration", () => {
    const base = until(start([p("spiritess_2", 2, 1), { ...p("regrowth_3", 0, 1), hp: 60 }], [p("congregant", 2, 1)]), "0.2.1");
    const hot = { def: "mending", source: "x", stacks: 3, amount: 10 };
    const battle = { ...base, units: { ...base.units, "0.0.1": { ...unit(base, "0.0.1"), effects: [hot] } } };
    const after = act(battle, "burst_mend", "0.0.1").battle;
    // 30 pending from the HoT + 3 turns of 12% of 260 (94) = 124, at 150%: 186.
    expect(unit(after, "0.0.1").hp).toBeGreaterThanOrEqual(60 + 186);
    expect(unit(after, "0.0.1").effects.some((e) => e.def === "mending")).toBe(false);
  });

  test("Spiritwalk: the unit leaves the field (not a target, doesn't hold its line), then returns healed; the battle doesn't end while it's away", () => {
    let battle = until(start([p("psychopomp", 2, 1)], [{ ...p("congregant", 0, 1), hp: 30 }, p("cleric", 2, 1)]), "0.2.1");
    battle = act(battle, "spiritwalk", "1.0.1").battle;
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "spiritwalking")).toBe(true);
    expect(battle.outcome).toBeNull();
    // Nobody may target it while it's away.
    const later = until(battle, "0.2.1");
    const targets = legalActions(later).flatMap((a) => a.choices.flatMap((c) => c.affected));
    expect(targets).not.toContain("1.0.1");
    // It comes back after two round starts, healed 40% of 90.
    let back = later;
    for (let i = 0; i < 40 && unit(back, "1.0.1").effects.some((e) => e.def === "spiritwalking") && !back.outcome; i++) back = act(back, legalActions(back).some((a) => a.abilityId === "wait") ? "wait" : "defend").battle;
    expect(unit(back, "1.0.1").hp).toBeGreaterThanOrEqual(30 + 36);
  });

  test("a side whose only unit is spiritwalking hasn't lost", () => {
    const battle = until(start([p("psychopomp", 2, 1)], [p("congregant", 0, 1)]), "0.2.1");
    expect(act(battle, "spiritwalk", "1.0.1").battle.outcome).toBeNull();
  });
});
