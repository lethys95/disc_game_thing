import { describe, expect, test } from "vitest";
import { BEHAVIORS } from "#rules/abilities/index";
import { EVOLUTIONS, FACTION_ROOTS, LINE_ARCHETYPE, RECRUIT_COST, UNITS } from "#rules/units/index";

/** The catalogue holds together (the code review, 2026-10-11): every name points at something that exists. */
describe("the unit catalogue", () => {
  test("every unit's key is its id", () => {
    expect(Object.entries(UNITS).filter(([key, def]) => key !== def.id).map(([key]) => key)).toEqual([]);
  });

  test("every evolution starts and ends at a unit of the same faction", () => {
    const broken = Object.entries(EVOLUTIONS).flatMap(([from, steps]) =>
      steps.filter((s) => !UNITS[from] || !UNITS[s.to] || UNITS[s.to]?.faction !== UNITS[from]?.faction).map((s) => `${from} → ${s.to}`),
    );
    expect(broken).toEqual([]);
  });

  test("every root is a tier-1 unit of its faction with a price and a kind of line", () => {
    const broken = Object.entries(FACTION_ROOTS).flatMap(([faction, roots]) =>
      roots.filter((r) => UNITS[r]?.faction !== faction || UNITS[r]?.tier !== 1 || RECRUIT_COST[r] === undefined || LINE_ARCHETYPE[r] === undefined),
    );
    expect(broken).toEqual([]);
  });

  test("every ability a unit names exists", () => {
    const broken = Object.values(UNITS).flatMap((def) => def.abilities.filter((a) => !BEHAVIORS[a.id]).map((a) => `${def.id}: ${a.id}`));
    expect(broken).toEqual([]);
  });
});
