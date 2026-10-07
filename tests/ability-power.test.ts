import { BEHAVIORS, describeAbility, describeParts, paramsOf } from "#rules/abilities/index";
import { effectiveStats, legalActions } from "#rules/battle/engine";
import { EVOLUTIONS, UNITS } from "#rules/units/index";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

const veteran = (percent: number) => [{ def: "veteran", amount: percent }];

describe("ability power", () => {
  test("a unit never loses ability power by evolving", () => {
    for (const [from, steps] of Object.entries(EVOLUTIONS)) {
      for (const step of steps) expect(UNITS[step.to]?.stats.abilityPower ?? 0, `${from} → ${step.to}`).toBeGreaterThanOrEqual(UNITS[from]?.stats.abilityPower ?? 0);
    }
  });

  test("levels raise it like the other stats, and an active ability's magnitudes grow with it", () => {
    let battle = until(start([p("cleric", 1, 1, veteran(50)), { ...p("congregant", 0, 0), hp: 30 }], [p("congregant", 0, 1)]), "0.1.1");
    expect(effectiveStats(battle, "0.1.1").abilityPower).toBe(150);
    battle = act(battle, "mend", "0.0.0").battle;
    // 20 × 150% + 30% of the 60 it was missing (a percentage doesn't scale).
    expect(unit(battle, "0.0.0").hp).toBe(30 + 30 + 18);
  });

  test("a passive ability's magnitudes grow with it too", () => {
    let battle = until(start([p("fire_eater", 0, 1, veteran(50))], [p("congregant", 0, 1)]), "0.0.1");
    const attack = legalActions(battle).find((a) => a.abilityId === "spit_fire") ?? legalActions(battle).find((a) => a.abilityId === "attack");
    if (!attack) throw new Error("the Fire Eater has no attack");
    battle = act(battle, attack.abilityId).battle;
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "burning")?.amount).toBe(12);
  });

  test("there is no damage stat: what a unit hits for is its ability's power, grown by its ability power", () => {
    const battle = until(start([p("paladin", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    const power = paramsOf(UNITS["paladin"]?.abilities.find((a) => a.id === "attack") ?? { id: "attack" }, 200)["power"] ?? 0;
    expect(unit(after, "1.0.1").hp).toBe(90 - power);
  });

  test("damage types belong to abilities: a unit's use can set one, else the ability's own, else weapon", () => {
    const chosen = UNITS["chosen"]?.abilities.find((a) => a.id === "attack");
    expect(chosen?.damageType).toBe("fire");
    expect(BEHAVIORS["homing_lightning"]?.kind === "active" && BEHAVIORS["homing_lightning"].damageType).toBe("lightning");
  });

  test("the rules text shows the scaled numbers", () => {
    expect(describeAbility({ id: "mend" }, 150)).toContain("for 30,");
    expect(describeAbility({ id: "mend" }, 150)).toContain("30%");
  });

  test("every magnitude a behavior scales is one of its params", () => {
    for (const [id, b] of Object.entries(BEHAVIORS)) {
      const known = new Set([...Object.keys(b.defaults ?? {}), ...Object.values(UNITS).flatMap((u) => u.abilities.filter((r) => r.id === id).flatMap((r) => Object.keys(r.params ?? {})))]);
      for (const key of b.scales ?? []) expect(known.has(key), `${id}: ${key}`).toBe(true);
    }
  });
});

describe("rules text marks what ability power grew", () => {
  test("every scaled number an ability's text shows is found and marked, with its value at 100", () => {
    for (const [id, b] of Object.entries(BEHAVIORS)) {
      const parts = describeParts({ id }, 200);
      expect(parts.map((part) => part.text).join(""), id).toBe(describeAbility({ id }, 200));
      expect(parts.some((part) => /98\d{4}/.test(part.text)), id).toBe(false);
      for (const part of parts) if ("base" in part) expect(Number(part.text), id).toBe(Math.round((part.base * 200) / 100));
      if ((b.scales ?? []).some((key) => paramsOf({ id }, 100)[key] !== undefined)) expect(parts.some((part) => "base" in part), id).toBe(true);
    }
  });
});
