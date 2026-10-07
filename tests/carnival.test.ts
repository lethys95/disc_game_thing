import { paramsOf } from "#rules/abilities/index";
import { chooseTarot, createBattle, strongestHits } from "#rules/battle/engine";
import { itemById } from "#rules/items";
import type { TarotHand } from "#rules/battle/tarot";
import type { Battle } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import { act, affectedBy, hitOf, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The user's designs of 2026-10-05: the Grove's water primary fire, and the carnival. Numbers provisional (#67). */
const holding = (battle: Battle, hand: Omit<TarotHand, "chosen" | "state" | "progress">): Battle => ({ ...battle, tarot: [{ ...hand, chosen: 0, state: "open", progress: 0 }] });

describe("Wellspring: the Grove's healing support's primary fire", () => {
  test("on an enemy: its damage as water, and it's wet", () => {
    const battle = until(start([p("grove_support_1", 2, 1)], [p("congregant", 0, 1)]), "0.2.1");
    const after = act(battle, "wellspring", "1.0.1").battle;
    expect(unit(after, "1.0.1").hp).toBe(90 - hitOf("grove_support_1"));
    expect(unit(after, "1.0.1").effects.some((e) => e.def === "wet")).toBe(true);
  });

  test("on an ally: a much bigger heal, and no wet unless it was burning", () => {
    const battle = until(start([p("grove_support_1", 2, 1), { ...p("sproutling", 0, 1), hp: 30 }], [p("congregant", 0, 1)]), "0.2.1");
    const healed = act(battle, "wellspring", "0.0.1").battle;
    expect(unit(healed, "0.0.1").hp - unit(battle, "0.0.1").hp).toBe(paramsOf({ id: "wellspring" }, UNITS["grove_support_1"]?.stats.abilityPower ?? 0)["heal"]);
    expect(unit(healed, "0.0.1").effects.some((e) => e.def === "wet")).toBe(false);
    const burning = until(start([p("grove_support_1", 2, 1), { ...p("sproutling", 0, 1, [{ def: "burning", amount: 8, stacks: 3 }]), hp: 30 }], [p("congregant", 0, 1)]), "0.2.1");
    const doused = act(burning, "wellspring", "0.0.1").battle;
    expect(unit(doused, "0.0.1").effects.some((e) => e.def === "burning")).toBe(false);
    expect(unit(doused, "0.0.1").effects.some((e) => e.def === "wet")).toBe(true);
  });
});

describe("the carnival", () => {
  test("Soothsayer: Tarot 5 as the fight begins", () => {
    const battle = start([p("soothsayer", 1, 1)], [p("congregant", 0, 1)]);
    expect(battle.tarot[0]?.cards).toHaveLength(5);
  });

  test("Foretell: the hit lands at the start of her next turn, not now", () => {
    let battle = until(start([p("soothsayer", 1, 1)], [p("congregant", 0, 1)]), "0.1.1");
    battle = act(battle, "foretell", "1.0.1").battle;
    expect(unit(battle, "1.0.1").hp).toBe(90);
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "foretold")).toBe(true);
    battle = until(battle, "0.1.1");
    expect(unit(battle, "1.0.1").hp).toBe(90 - hitOf("soothsayer"));
  });

  test("Curse: the target deals 35% less for its next three turns, then recovers", () => {
    let battle = until(start([p("soothsayer", 1, 1)], [p("congregant", 0, 1)]), "0.1.1");
    battle = act(battle, "curse", "1.0.1").battle;
    expect(strongestHits(battle)["1.0.1"]).toBe(20 - 7);
    for (let turn = 0; turn < 3; turn++) {
      battle = until(battle, "1.0.1");
      expect(strongestHits(battle)["1.0.1"]).toBe(13);
      battle = act(battle, "defend").battle;
    }
    battle = until(battle, "1.0.1");
    expect(strongestHits(battle)["1.0.1"]).toBe(20);
  });

  test("Spit fire: three front tiles across and the middle one behind the centre; from a side, the far front tile is spared", () => {
    const enemies = [p("congregant", 0, 0), p("congregant", 0, 1), p("congregant", 0, 2), p("congregant", 1, 0), p("congregant", 1, 1), p("congregant", 1, 2)];
    const centre = until(start([p("fire_eater", 0, 1)], enemies), "0.0.1");
    expect([...(affectedBy(centre, "spit_fire", "1.0.1") ?? [])].sort()).toEqual(["1.0.0", "1.0.1", "1.0.2", "1.1.1"]);
    const side = until(start([p("fire_eater", 0, 0)], enemies), "0.0.0");
    expect([...(affectedBy(side, "spit_fire", "1.0.0") ?? [])].sort()).toEqual(["1.0.0", "1.0.1", "1.1.0"]);
    const after = act(centre, "spit_fire", "1.0.1").battle;
    expect(unit(after, "1.1.1").effects.some((e) => e.def === "burning")).toBe(true);
  });

  test("Omen: a card his action fulfils pays twice, and each kill draws three more cards", () => {
    let battle = until(start([p("omen", 1, 1), p("congregant", 0, 1)], [{ ...p("congregant", 0, 1), hp: 1 }, p("congregant", 0, 2)]), "0.1.1");
    battle = holding(battle, { side: 0, unitId: "0.0.1", cards: [{ task: { kind: "killBefore", round: 2 }, reward: { kind: "smite", damage: 15 } }] });
    const { battle: after, events } = act(battle, "shoot", "1.0.1");
    expect(events).toContainEqual({ type: "tarot", side: 0, hand: 0, state: "fulfilled", payouts: 2 });
    expect(unit(after, "1.0.2").hp).toBe(90 - 30);
    // One kill: a new hand of three for his side, waiting for a pick.
    expect(after.tarot).toHaveLength(2);
    expect(after.tarot[1]).toMatchObject({ side: 0, unitId: "0.1.1", chosen: null });
    expect(after.tarot[1]?.cards).toHaveLength(3);
    expect(chooseTarot(after, 1, 0).battle.tarot[1]?.chosen).toBe(0);
  });

  test("Cutpurse: every fourth hit it lands is a crit", () => {
    expect(UNITS["cutpurse"]?.abilities.find((a) => a.id === "crit")?.params).toEqual({ every: 4 });
    expect(UNITS["cutpurse"]?.stats.initiative).toBeGreaterThanOrEqual(65);
  });

  test("Snakeoiler: a healing draught for an ally, a small explosive for one enemy anywhere", () => {
    let battle = until(start([p("snakeoiler", 1, 1), { ...p("congregant", 0, 1), hp: 30 }], [p("congregant", 0, 1), p("seraph", 2, 1)]), "0.1.1");
    const healed = act(battle, "healing_draught", "0.0.1").battle;
    expect(unit(healed, "0.0.1").hp - unit(battle, "0.0.1").hp).toBe(30);
    battle = act(battle, "explosive_flask", "1.2.1").battle;
    expect(unit(battle, "1.2.1").hp).toBe(70 - 18);
  });

  test("Snakeoiler: the sleep potion, once: asleep, the target loses its next turn; hurt first, it wakes and acts", () => {
    const battle = until(start([p("snakeoiler", 1, 1)], [p("congregant", 0, 1)]), "0.1.1");
    const { battle: after, events } = act(battle, "sleep_potion", "1.0.1");
    expect(events).toContainEqual({ type: "skipped", unitId: "1.0.1", reason: "lostTurn" });
    expect(after.units["0.1.1"]?.chargesUsed["sleep_potion"]).toBe(1);
    const asleep = until(start([p("snakeoiler", 1, 1), p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "asleep", source: "0.1.1" }])]), "0.0.1");
    const woken = act(asleep, "attack", "1.0.1").battle;
    expect(unit(woken, "1.0.1").effects.some((e) => e.def === "asleep")).toBe(false);
  });

  test("Deck of cards: the leader wearing it carries Tarot 4", () => {
    const deck = itemById("deck_of_cards");
    const battle = createBattle([[p("congregant", 0, 1, [...deck.worn])], [p("congregant", 0, 1)]]).battle;
    expect(battle.tarot[0]?.cards).toHaveLength(4);
  });
});
