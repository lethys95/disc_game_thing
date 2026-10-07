import { effectiveStatsOf, legalActions, strongestHits, traitValues } from "#rules/battle/engine";
import { createWorld } from "#rules/world/create";
import { neutralGroup, tribeAt } from "#rules/world/state";
import { act, p, start, twoPlayers, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The gnoll tribe (Claude's pitch, accepted by the user 2026-10-04). Numbers provisional (#63). */
describe("gnolls", () => {
  test("Prey: the pack hits a marked unit harder, until the end of the next round", () => {
    let battle = until(start([p("packstalker", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "prey")).toMatchObject({ amount: 8, stacks: 2 });
    const marked = until(start([p("brigand", 0, 1)], [p("congregant", 0, 1, [{ def: "prey", amount: 8, stacks: 2, source: "0.0.1" }])]), "0.0.1");
    expect(unit(act(marked, "attack", "1.0.1").battle, "1.0.1").hp).toBe(90 - 20 - 8);
  });

  test("Crack: each hit takes armor away for the rest of combat", () => {
    let battle = until(start([p("bonecracker", 0, 1)], [p("paladin", 0, 1)]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(effectiveStatsOf(battle)["1.0.1"]?.armor).toBe(20 - 4);
  });

  test("Hamstring: a hit slows the target for a while", () => {
    let battle = until(start([p("hamstringer", 2, 1)], [p("congregant", 0, 1)]), "0.2.1");
    battle = act(battle, "shoot", "1.0.1").battle;
    expect(effectiveStatsOf(battle)["1.0.1"]?.initiative).toBe(50 - 5);
  });

  test("Cackle: a goaded enemy can only attack on its next turn; then it's free again", () => {
    let battle = until(start([p("cackler", 2, 1)], [p("cleric", 2, 1)]), "0.2.1");
    battle = until(act(battle, "cackle", "1.2.1").battle, "1.2.1");
    expect(legalActions(battle).map((a) => a.abilityId)).toEqual(["shoot"]);
    battle = act(battle, "shoot", "0.2.1").battle;
    expect(unit(battle, "1.2.1").effects.some((e) => e.def === "goaded")).toBe(false);
  });

  test("the AI sees a goaded healer or caster as a win, and a goaded fighter as nothing", () => {
    const goaded = [{ def: "goaded", source: "0.2.1" }];
    const values = traitValues(start([p("cackler", 2, 1)], [p("cleric", 2, 0, goaded), p("congregant", 0, 1, goaded)]));
    expect(values["1.2.0"]).toBeLessThan(0);
    expect(values["1.0.1"]).toBe(0);
  });

  test("Run them down: while a Cackler or the Matriarch is in the fight, enemies can't retreat", () => {
    const free = until(start([p("congregant", 0, 1)], [p("packstalker", 0, 1)]), "0.0.1");
    expect(legalActions(free).map((a) => a.abilityId)).toContain("retreat");
    const run = until(start([p("congregant", 0, 1)], [p("cackler", 2, 1)]), "0.0.1");
    expect(legalActions(run).map((a) => a.abilityId)).not.toContain("retreat");
  });

  test("Pecking order: the pack hits harder for the Matriarch; when she falls, the healthiest gnoll leads at half", () => {
    const battle = until(start([p("zealot", 0, 1)], [{ ...p("matriarch", 0, 1), hp: 1 }, p("packstalker", 0, 0), { ...p("bonecracker", 0, 2), hp: 30 }]), "0.0.1");
    expect(strongestHits(battle)["1.0.0"]).toBe(20 + 8);
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "1.0.1").alive).toBe(false);
    expect(unit(after, "1.0.0").effects.some((e) => e.def === "next_in_line")).toBe(true);
    expect(strongestHits(after)["1.0.2"]).toBe(24 + 4);
  });

  test("camps and dungeons in the desert are guarded by gnolls, elsewhere by bandits", () => {
    const squad = [p("paladin", 0, 1)];
    let gnollCamps = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const world = createWorld(seed, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
      for (const lair of world.lairs) {
        const tribe = tribeAt(world.map, lair.hex);
        const ids = new Set([...neutralGroup(tribe, "weak"), ...neutralGroup(tribe, "medium"), ...neutralGroup(tribe, "strong")].map((m) => m.defId));
        expect(lair.guards.every((m) => ids.has(m.defId))).toBe(true);
        if (tribe === "gnolls") gnollCamps += 1;
      }
    }
    expect(gnollCamps).toBeGreaterThan(0);
  });
});
