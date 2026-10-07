import { targetingOf } from "#rules/battle/reach";
import { describe, expect, test } from "vitest";

/** A grid as text: `#` reachable or hit, `.` not; rows joined by spaces. */
const text = (rows: readonly (readonly boolean[])[] | undefined) => (rows ?? []).map((r) => r.map((on) => (on ? "#" : ".")).join("")).join(" ");

describe("targeting grids, read from the engine", () => {
  test("a melee attack reaches the enemy's front line, at most a column to either side", () => {
    expect(text(targetingOf("congregant", "attack")?.reach)).toBe("..... ..... .###. ..... ..... .....");
  });

  test("a ranged hit reaches every enemy tile, two columns either way from an edge", () => {
    expect(text(targetingOf("seraph", "shoot")?.reach)).toBe("##### ##### ##### ..... ..... .....");
  });

  test("a heal reaches the unit's own side, itself included", () => {
    expect(text(targetingOf("seraph", "mend")?.reach)).toBe("..... ..... ..... ##### ##### #####");
  });

  test("the area is what one use hits around its target", () => {
    expect(text(targetingOf("apprentice", "plus_burst")?.area)).toBe("..... ..#.. .###. ..#.. .....");
    expect(text(targetingOf("punisher", "flail")?.area)).toBe("..... ..... .###. ..... .....");
    expect(text(targetingOf("congregant", "attack")?.area)).toBe("..... ..... ..#.. ..... .....");
  });

  test("an ability that needs corpses is read from a board with the dead on it", () => {
    expect(text(targetingOf("decay_support_2", "corpse_explosion")?.area)).toBe("..... ..#.. .###. ..#.. .....");
  });

  test("an ability without a target has no grids", () => {
    expect(targetingOf("congregant", "congregation")).toBeNull();
  });
});
