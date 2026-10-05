import { autoplay, chooseTarotCards } from "#rules/ai";
import { chooseTarot, createBattle, effectiveStatsOf, NO_CONTEXT } from "#rules/battle/engine";
import type { TarotHand } from "#rules/battle/tarot";
import type { Battle, EffectSeed } from "#rules/battle/types";
import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Tarot (the user, 2026-10-05). Tasks, rewards and numbers provisional (#66). */
const tarot = (cards: number): EffectSeed => ({ def: "carries", ability: { id: "tarot", params: { cards } } });

/** The battle with its tarot hands replaced: a chosen card of our own making. */
const holding = (battle: Battle, hand: Omit<TarotHand, "chosen" | "state" | "progress">): Battle => ({
  ...battle,
  tarot: [{ ...hand, chosen: 0, state: "open", progress: 0 }],
});

describe("tarot", () => {
  test("Tarot x deals x cards as the fight begins, each a different task; the same seed deals the same hand", () => {
    const squads = [[p("congregant", 0, 1, [tarot(3)])], [p("congregant", 0, 1)]] as const;
    const one = createBattle(squads, { ...NO_CONTEXT, seed: 7 }).battle;
    expect(one.tarot).toHaveLength(1);
    expect(one.tarot[0]?.cards).toHaveLength(3);
    expect(new Set(one.tarot[0]?.cards.map((c) => c.task.kind)).size).toBe(3);
    expect(createBattle(squads, { ...NO_CONTEXT, seed: 7 }).battle.tarot).toEqual(one.tarot);
    const hands = [1, 2, 3, 4, 5].map((seed) => JSON.stringify(createBattle(squads, { ...NO_CONTEXT, seed }).battle.tarot[0]?.cards));
    expect(new Set(hands).size).toBeGreaterThan(1);
  });

  test("a side picks one card, once", () => {
    const battle = createBattle([[p("congregant", 0, 1, [tarot(3)])], [p("congregant", 0, 1)]]).battle;
    const { battle: picked, events } = chooseTarot(battle, "0.0.1", 2);
    expect(picked.tarot[0]?.chosen).toBe(2);
    expect(events).toEqual([{ type: "tarotChosen", side: 0, unitId: "0.0.1" }]);
    expect(() => chooseTarot(picked, "0.0.1", 0)).toThrow();
  });

  test("Death: kill an enemy in time, and the reward pays the whole side", () => {
    let battle = until(start([p("zealot", 0, 1), p("congregant", 0, 0)], [{ ...p("congregant", 0, 1), hp: 1 }, p("congregant", 0, 2)]), "0.0.1");
    battle = holding(battle, { side: 0, unitId: "0.0.0", cards: [{ task: { kind: "killBefore", round: 2 }, reward: { kind: "might", percent: 25 } }] });
    const before = effectiveStatsOf(battle)["0.0.0"]?.damage ?? 0;
    const { battle: after, events } = act(battle, "attack", "1.0.1");
    expect(events).toContainEqual({ type: "tarot", side: 0, unitId: "0.0.0", card: 0, state: "fulfilled" });
    expect(after.tarot[0]?.state).toBe("fulfilled");
    expect(effectiveStatsOf(after)["0.0.0"]?.damage).toBe(Math.round(before * 1.25));
  });

  test("Strength: losing someone too early fails the card, and nothing is paid", () => {
    let battle = until(start([{ ...p("congregant", 0, 1), hp: 1 }, p("congregant", 0, 0)], [p("zealot", 0, 1)]), "1.0.1");
    battle = holding(battle, { side: 0, unitId: "0.0.0", cards: [{ task: { kind: "noLossBefore", round: 3 }, reward: { kind: "smite", damage: 25 } }] });
    const { battle: after, events } = act(battle, "attack", "0.0.1");
    expect(events).toContainEqual({ type: "tarot", side: 0, unitId: "0.0.0", card: 0, state: "failed" });
    expect(unit(after, "1.0.1").hp).toBe(unit(battle, "1.0.1").hp - 35);
  });

  test("the AI picks a card for every hand, and a fight with tarot plays to its end", () => {
    const battle = createBattle([[p("congregant", 0, 1, [tarot(3)])], [p("congregant", 0, 1, [tarot(2)])]], { ...NO_CONTEXT, seed: 3 }).battle;
    expect(chooseTarotCards(battle).tarot.every((h) => h.chosen !== null)).toBe(true);
    expect(chooseTarotCards(battle, 1).tarot.map((h) => h.chosen === null)).toEqual([true, false]);
    expect(autoplay(battle).outcome).not.toBeNull();
  });
});
