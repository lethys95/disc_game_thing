import { applyAction, createBattle, legalActions } from "#rules/battle/engine";
import type { Battle, Col, Row } from "#rules/battle/types";
import { asKnown, masked } from "#view/secrecy";
import { describe, expect, test } from "vitest";

const p = (defId: string, row: Row, col: Col) => ({ defId, tile: { row, col } });

/** The enemy (side 1) Justiciar marks the player's Paladin. */
function marked(): { battle: Battle; events: ReturnType<typeof applyAction>["events"] } {
  // The Justiciar is faster than the Paladin, so it acts first.
  const battle = createBattle([[p("paladin", 0, 1)], [p("justiciar", 1, 1)]]).battle;
  if (!legalActions(battle).some((a) => a.abilityId === "counter")) throw new Error("counter not legal");
  return applyAction(battle, { abilityId: "counter", choice: 0 });
}

describe("the Justiciar's mark is secret", () => {
  test("the marked side sees the cast but not the target or the mark", () => {
    const { battle, events } = marked();
    const seen = masked(events, battle, 0);
    expect(seen.find((e) => e.type === "ability" && e.abilityId === "counter")).toMatchObject({ targets: [] });
    expect(seen.some((e) => e.type === "effect" && e.effect === "countered")).toBe(false);
  });

  test("the marking side sees everything", () => {
    const { battle, events } = marked();
    expect(masked(events, battle, 1)).toEqual(events);
  });

  test("the marked side's view of the battle has no mark, so previews can't leak it", () => {
    const { battle } = marked();
    expect(battle.units["0.0.1"]?.effects).toContainEqual(expect.objectContaining({ def: "countered" }));
    expect(asKnown(battle, 0).units["0.0.1"]?.effects).not.toContainEqual(expect.objectContaining({ def: "countered" }));
  });
});
