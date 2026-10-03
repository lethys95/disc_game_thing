import { LEAD_COOLDOWN_MS, LEAD_MARGIN, openingLeader, standing, Tug } from "#view/battle-music";
import { Bucket } from "#view/bucket";
import { p, start } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** A fixed sequence standing in for Math.random. */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe("buckets (the user's controlled randomness)", () => {
  test("every entry comes out once before any comes out again", () => {
    const bucket = new Bucket(["a", "b", "c", "d"]);
    for (let round = 0; round < 5; round++) {
      const taken = Array.from({ length: 4 }, () => bucket.take());
      expect([...taken].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });

  test("a refilled bucket doesn't open with the entry the last one ended on", () => {
    // Always the last entry left: a, b, c in order would end on c, and the next bucket would also pick c first.
    const bucket = new Bucket(["a", "b", "c"], sequence(0.99));
    const first = [bucket.take(), bucket.take(), bucket.take()];
    const next = bucket.take();
    expect(next).not.toBe(first[2]);
  });

  test("an empty bucket gives nothing", () => {
    expect(new Bucket<string>([]).take()).toBeUndefined();
  });
});

describe("the battle music's tug of war", () => {
  test("the stronger squad is ahead; an even field is a tie", () => {
    const even = start([p("congregant", 0, 1)], [p("congregant", 0, 1)]);
    expect(standing(even)).toBeCloseTo(0.5);
    const lopsided = start([p("congregant", 0, 0), p("congregant", 0, 1)], [p("congregant", 0, 1)]);
    expect(standing(lopsided)).toBeGreaterThan(0.5 + LEAD_MARGIN);
    expect(openingLeader(standing(lopsided))).toBe(0);
  });

  test("the music turns only past the margin, and not again within the cooldown", () => {
    const tug = new Tug(0, 0);
    expect(tug.update(0.5 - LEAD_MARGIN / 2, LEAD_COOLDOWN_MS)).toBe(0);
    expect(tug.update(0.3, LEAD_COOLDOWN_MS - 1)).toBe(0);
    expect(tug.update(0.3, LEAD_COOLDOWN_MS)).toBe(1);
    expect(tug.update(0.9, LEAD_COOLDOWN_MS * 1.5)).toBe(1);
    expect(tug.update(0.9, LEAD_COOLDOWN_MS * 2)).toBe(0);
  });
});
