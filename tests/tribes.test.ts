import { paramsOf } from "#rules/abilities/index";
import { effectiveStatsOf, strongestHits } from "#rules/battle/engine";
import { UNITS } from "#rules/units/index";
import { act, affectedBy, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** A unit type's param for one of its abilities, at its ability power: the tests read the tuned numbers, never pin them. */
function param(defId: string, abilityId: string, key: string): number {
  const def = UNITS[defId];
  const ref = def?.abilities.find((a) => a.id === abilityId);
  const value = def && ref ? paramsOf(ref, def.stats.abilityPower)[key] : undefined;
  if (value === undefined) throw new Error(`${defId} has no ${abilityId}.${key}`);
  return value;
}
const hp = (defId: string) => UNITS[defId]?.stats.maxHp ?? 0;

/** Claude's five tribes at the user's invitation (2026-10-11). Numbers provisional (#81). */
describe("the Wild", () => {
  test("Pounce: a wolf leaps from anywhere to any enemy within a column of it, back row included", () => {
    const battle = until(start([p("congregant", 0, 1), p("grey_wolf", 1, 1)], [p("congregant", 0, 1), p("congregant", 2, 0), p("congregant", 2, 2)]), "0.1.1");
    expect(unit(act(battle, "pounce", "1.2.0").battle, "1.2.0").hp).toBe(90 - param("grey_wolf", "pounce", "power"));
    const far = until(start([p("grey_wolf", 0, 0)], [p("congregant", 0, 1), p("congregant", 2, 2)]), "0.0.0");
    expect(affectedBy(far, "pounce", "1.2.2")).toBeUndefined();
    // With no enemy within a column, the nearest are in reach, as for melee.
    const alone = until(start([p("grey_wolf", 0, 0)], [p("congregant", 2, 2)]), "0.0.0");
    expect(affectedBy(alone, "pounce", "1.2.2")).toEqual(["1.2.2"]);
  });

  test("Gore: the unit it hits bleeds at the start of each of its turns", () => {
    let battle = until(start([p("boar", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    expect(unit(battle, "1.0.1").hp).toBe(90 - param("boar", "attack", "power") - param("boar", "gore", "bleed"));
  });

  test("Wounded fury: below half its health the bear hits much harder", () => {
    const power = param("cave_bear", "attack", "power");
    expect(strongestHits(start([p("cave_bear", 0, 1)], [p("congregant", 0, 1)]))["0.0.1"]).toBe(power);
    const furious = strongestHits(start([{ ...p("cave_bear", 0, 1), hp: Math.floor(hp("cave_bear") / 2) - 1 }], [p("congregant", 0, 1)]))["0.0.1"];
    expect(furious).toBe(Math.round((power * (100 + param("cave_bear", "wounded_fury", "percent"))) / 100));
  });

  test("Peck the eyes: the unit the crows hit deals less on its next turn", () => {
    const battle = act(until(start([p("carrion_murder", 2, 1)], [p("congregant", 0, 1)]), "0.2.1"), "shoot", "1.0.1").battle;
    expect(strongestHits(battle)["1.0.1"]).toBe(Math.round((20 * (100 - param("carrion_murder", "peck_the_eyes", "percent"))) / 100));
  });

  test("Howl: once a fight, every ally's next hit bites deeper", () => {
    let battle = until(start([p("old_grey", 0, 1), p("grey_wolf", 0, 0)], [p("congregant", 0, 0)]), "0.0.1");
    battle = until(act(battle, "howl").battle, "0.0.0");
    battle = act(battle, "pounce", "1.0.0").battle;
    expect(unit(battle, "1.0.0").hp).toBe(90 - param("grey_wolf", "pounce", "power") - param("old_grey", "howl", "bonus"));
    expect(unit(battle, "0.0.0").effects.some((e) => e.def === "howled")).toBe(false);
  });
});

describe("the Tuskclans", () => {
  test("Kick them while they're down: a cutthroat deals more to a unit below half its health", () => {
    const battle = until(start([p("goblin_cutthroat", 2, 1)], [{ ...p("congregant", 0, 1), hp: 40 }]), "0.2.1");
    const kicked = Math.round((param("goblin_cutthroat", "shoot", "power") * (100 + param("goblin_cutthroat", "kick_them_down", "percent"))) / 100);
    expect(unit(act(battle, "shoot", "1.0.1").battle, "1.0.1").hp).toBe(40 - kicked);
  });

  test("Bloodlust: each kill feeds the ravager", () => {
    const battle = until(start([p("orc_ravager", 0, 1)], [{ ...p("congregant", 0, 1), hp: 1 }, p("congregant", 0, 0)]), "0.0.1");
    expect(strongestHits(act(battle, "attack", "1.0.1").battle)["0.0.1"]).toBe(param("orc_ravager", "attack", "power") + param("orc_ravager", "bloodlust", "bonus"));
  });

  test("Regenerate: the troll knits its wounds each turn, unless fire touched it", () => {
    const hurt = until(start([{ ...p("troll", 0, 1), hp: 100 }], [p("congregant", 0, 1)]), "0.0.1");
    expect(unit(hurt, "0.0.1").hp).toBe(100 + Math.round((hp("troll") * param("troll", "regenerate", "percent")) / 100));
    const burnt = start([p("hedge_mage", 2, 1)], [{ ...p("troll", 0, 1), hp: 100 }]);
    const { battle, events } = act(until(burnt, "0.2.1"), "area_2x2", "1.0.1");
    // The action has already moved on to the troll's turn: fire marked it, so this turn it didn't heal.
    expect(events.some((e) => e.type === "effect" && e.effect === "seared")).toBe(true);
    expect(battle.current?.unitId).toBe("1.0.1");
    expect(unit(battle, "1.0.1").hp).toBe(100 - param("hedge_mage", "area_2x2", "power"));
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "seared")).toBe(false);
  });

  test("Frenzy: an ally hits harder and takes more until the end of the next round", () => {
    const battle = act(until(start([p("goblin_hexer", 2, 1), p("orc_ravager", 0, 1)], [p("congregant", 0, 1)]), "0.2.1"), "frenzy", "0.0.1").battle;
    expect(strongestHits(battle)["0.0.1"]).toBe(param("orc_ravager", "attack", "power") + param("goblin_hexer", "frenzy", "bonus"));
  });

  test("Cleave: the warchief hits its target and the enemies beside it", () => {
    const battle = until(start([p("ogre_warchief", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2)]), "0.0.1");
    expect(affectedBy(battle, "cleave", "1.0.1")).toEqual(["1.0.1", "1.0.0", "1.0.2"]);
    const after = act(battle, "cleave", "1.0.1").battle;
    for (const id of ["1.0.0", "1.0.1", "1.0.2"]) expect(unit(after, id).hp).toBe(90 - param("ogre_warchief", "cleave", "power"));
  });
});

describe("the Scaled", () => {
  test("Venom: the envenomed lose health each turn, heal only half, and doses cap at three", () => {
    let battle = until(start([p("scaleblade", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    const dose = param("scaleblade", "venom", "venom");
    expect(unit(battle, "1.0.1").hp).toBe(90 - param("scaleblade", "attack", "power") - dose);
    const capped = until(start([p("scaleblade", 0, 1)], [p("congregant", 0, 1, [{ def: "envenomed", amount: dose * 3, source: "0.0.1" }])]), "0.0.1");
    expect(unit(act(capped, "attack", "1.0.1").battle, "1.0.1").effects.find((e) => e.def === "envenomed")?.amount).toBe(dose * 3);
  });

  test("Constrict: the held unit loses its turns until the naga's next turn", () => {
    let battle = until(start([p("naga_coiler", 0, 1)], [p("congregant", 0, 1)]), "0.0.1");
    battle = act(battle, "constrict", "1.0.1").battle;
    expect(unit(battle, "1.0.1").hp).toBe(90 - param("naga_coiler", "constrict", "power"));
    battle = until(battle, "0.0.1");
    expect(unit(battle, "0.0.1").hp).toBe(hp("naga_coiler"));
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "constricted")).toBe(false);
  });

  test("Shed skin: an ally sheds what the enemy laid on it, and heals", () => {
    const venom = [{ def: "envenomed", amount: 10, source: "1.0.1" }];
    const battle = until(start([p("shedskin", 2, 1), { ...p("scaleblade", 0, 1, venom), hp: 50 }], [p("congregant", 0, 1)]), "0.2.1");
    // The Scaleblade's turn came first and the venom took its 10.
    expect(unit(battle, "0.0.1").hp).toBe(40);
    const after = act(battle, "shed_skin", "0.0.1").battle;
    expect(unit(after, "0.0.1").effects.some((e) => e.def === "envenomed")).toBe(false);
    expect(unit(after, "0.0.1").hp).toBe(40 + param("shedskin", "shed_skin", "amount"));
  });

  test("Stone gaze: the stone unit loses its next turn and takes half damage meanwhile", () => {
    let battle = until(start([p("medusa", 2, 1), p("congregant", 0, 1)], [p("congregant", 0, 1)]), "0.2.1");
    battle = act(battle, "stone_gaze", "1.0.1").battle;
    battle = until(battle, "0.0.1");
    expect(unit(act(battle, "attack", "1.0.1").battle, "1.0.1").hp).toBe(90 - 10);
  });
});

describe("the Herd", () => {
  test("Skirmish: melee hits on an outrider deal half", () => {
    const battle = until(start([p("congregant", 0, 1)], [p("outrider", 0, 1)]), "0.0.1");
    expect(unit(act(battle, "attack", "1.0.1").battle, "1.0.1").hp).toBe(hp("outrider") - 10);
  });

  test("Run through: the lance hits its target and, for half, the enemy behind it", () => {
    const battle = until(start([p("lancer", 0, 1)], [p("congregant", 0, 1), p("congregant", 1, 1)]), "0.0.1");
    const after = act(battle, "run_through", "1.0.1").battle;
    const power = param("lancer", "run_through", "power");
    expect(unit(after, "1.0.1").hp).toBe(90 - power);
    expect(unit(after, "1.1.1").hp).toBe(90 - Math.floor(power / 2));
  });

  test("Rear and kick: a defending unit takes more and loses its defence", () => {
    // A troll is slower than the Hoofbreaker, so it is still defending when the kick comes.
    const battle = until(start([p("hoofbreaker", 0, 1)], [p("troll", 0, 1, [{ def: "defending" }])]), "0.0.1");
    const { battle: after, events } = act(battle, "attack", "1.0.1");
    expect(events.find((e) => e.type === "damage")).toMatchObject({ unitId: "1.0.1", amount: param("hoofbreaker", "attack", "power") + param("hoofbreaker", "rear_and_kick", "bonus") });
    expect(unit(after, "1.0.1").effects.some((e) => e.def === "defending")).toBe(false);
  });

  test("Read the stars: the next hit on a warned ally misses", () => {
    const battle = until(start([p("congregant", 0, 1)], [p("lancer", 0, 1, [{ def: "starwarned", source: "1.2.1" }])]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "1.0.1").hp).toBe(hp("lancer"));
    expect(unit(after, "1.0.1").effects.some((e) => e.def === "starwarned")).toBe(false);
  });

  test("Thundering charge: once a fight, the khan hits every unit in the enemy front line", () => {
    const battle = until(start([p("herd_khan", 0, 1)], [p("congregant", 0, 0), p("congregant", 0, 2), p("congregant", 1, 1)]), "0.0.1");
    const after = act(battle, "thundering_charge").battle;
    const charge = param("herd_khan", "thundering_charge", "power");
    expect(unit(after, "1.0.0").hp).toBe(90 - charge);
    expect(unit(after, "1.0.2").hp).toBe(90 - charge);
    expect(unit(after, "1.1.1").hp).toBe(90);
  });
});

describe("the barbarian clans", () => {
  test("Last stand: the first killing blow leaves a berserker at 1 HP, hitting harder; the second kills it", () => {
    let battle = until(start([p("congregant", 0, 1)], [{ ...p("berserker", 0, 1), hp: 5 }]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    expect(unit(battle, "1.0.1")).toMatchObject({ alive: true, hp: 1 });
    expect(strongestHits(battle)["1.0.1"]).toBe(param("berserker", "attack", "power") + param("berserker", "last_stand", "bonus"));
    battle = act(until(battle, "0.0.1"), "attack", "1.0.1").battle;
    expect(unit(battle, "1.0.1").alive).toBe(false);
  });

  test("Set spears: a defending spearwarden hurts its melee attackers", () => {
    const battle = until(start([p("congregant", 0, 1)], [p("spearwarden", 0, 1, [{ def: "defending" }])]), "0.0.1");
    expect(unit(act(battle, "attack", "1.0.1").battle, "0.0.1").hp).toBe(90 - param("spearwarden", "set_spears", "power"));
  });

  test("Piercing shot: a hunter's arrows ignore armor", () => {
    const battle = until(start([p("hunter", 2, 1)], [p("paladin", 0, 1)]), "0.2.1");
    expect(unit(act(battle, "shoot", "1.0.1").battle, "1.0.1").hp).toBe(150 - param("hunter", "shoot", "power"));
  });

  test("Blood oath: the bound ally hits harder, and half its wounds go to the shamaness", () => {
    let battle = until(start([p("shamaness", 2, 1), p("berserker", 0, 1)], [p("congregant", 0, 1)]), "0.2.1");
    battle = act(battle, "blood_oath", "0.0.1").battle;
    expect(strongestHits(battle)["0.0.1"]).toBe(param("berserker", "attack", "power") + param("shamaness", "blood_oath", "bonus"));
    battle = act(until(battle, "1.0.1"), "attack", "0.0.1").battle;
    expect(unit(battle, "0.0.1").hp).toBe(hp("berserker") - 10);
    expect(unit(battle, "0.2.1").hp).toBe(hp("shamaness") - 10);
  });

  test("War cry: once a fight, every ally deals more until the end of the next round", () => {
    const battle = act(until(start([p("warlord", 0, 1), p("berserker", 0, 0)], [p("congregant", 0, 1)]), "0.0.1"), "war_cry").battle;
    expect(effectiveStatsOf(battle)["0.0.0"]?.hitBonus).toBe(param("warlord", "war_cry", "bonus"));
  });
});
