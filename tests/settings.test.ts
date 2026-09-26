import { DEFAULT_SETTINGS, keyFor, parseSettings, withHotkey } from "#view/settings";
import { describe, expect, test } from "vitest";

describe("settings", () => {
  test("stored settings are read field by field; anything broken falls back to the default", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("not json")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.stringify({ speed: "warp", rotate: 99, zoom: "x", hotkeys: { defend: "q", nonsense: "z", wait: "long" } }))).toEqual({
      speed: "normal",
      rotate: 2.5,
      zoom: 1,
      hotkeys: { defend: "q" },
    });
  });

  test("abilities keep their own keys until changed; taking a key in use swaps the two", () => {
    expect(keyFor(DEFAULT_SETTINGS, "defend")).toBe("d");
    const moved = withHotkey(DEFAULT_SETTINGS, "defend", "x");
    expect([keyFor(moved, "defend"), keyFor(moved, "wait")]).toEqual(["x", "w"]);
    const swapped = withHotkey(moved, "wait", "x");
    expect([keyFor(swapped, "defend"), keyFor(swapped, "wait")]).toEqual(["w", "x"]);
  });
});
