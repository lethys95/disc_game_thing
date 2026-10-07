import { act, p, start, unit, until } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The Jilliath support line past tier 1, the angels (faction-stuff/jilliath/support.md). Numbers are provisional. */

describe("the vengeance angels", () => {
  test("the Paragon's Atonement heals its most wounded ally for more than it dealt", () => {
    const battle = until(start([p("paragon", 1, 1), { ...p("congregant", 0, 0), hp: 20 }, { ...p("congregant", 0, 2), hp: 60 }], [p("congregant", 0, 1)]), "0.1.1");
    const after = act(battle, "atonement", "1.0.1").battle;
    // 15 at ability power 200 is 30; 150% of it is 45.
    expect(90 - unit(after, "1.0.1").hp).toBe(30);
    expect(unit(after, "0.0.0").hp).toBe(20 + 45);
    expect(unit(after, "0.0.2").hp).toBe(60);
  });

  test("the Empyreal's Atonement heals its three most wounded allies", () => {
    const wounded = [{ ...p("congregant", 0, 0), hp: 20 }, { ...p("congregant", 0, 1), hp: 30 }, { ...p("congregant", 0, 2), hp: 40 }];
    const battle = until(start([p("empyreal", 1, 1), ...wounded], [p("templar", 2, 1)]), "0.1.1");
    const after = act(battle, "atonement", "1.2.1").battle;
    // 15 at 300 is 45, less the Templar's 20 armor: 25, healed to each.
    for (const [id, hp] of [["0.0.0", 20], ["0.0.1", 30], ["0.0.2", 40]] as const) expect(unit(after, id).hp).toBe(hp + 25);
  });

  test("the Reclaimer's Transfusion heals hard and costs her half of it; Reclaim heals her for what it deals", () => {
    const battle = until(start([p("reclaimer", 1, 1), { ...p("templar", 0, 1), hp: 10 }], [p("congregant", 2, 1)]), "0.1.1");
    const healed = act(battle, "transfusion", "0.0.1").battle;
    // 60 at 300 is 180.
    expect(unit(healed, "0.0.1").hp).toBe(190);
    expect(unit(healed, "0.1.1").hp).toBe(160 - 90);
    const hurt = until(start([{ ...p("reclaimer", 1, 1), hp: 50 }], [p("congregant", 2, 1)]), "0.1.1");
    const drained = act(hurt, "reclaim", "1.2.1").battle;
    expect(unit(drained, "0.1.1").hp).toBe(50 + 60);
  });
});
