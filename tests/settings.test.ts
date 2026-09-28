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
      slotKeys: true,
      masterVolume: DEFAULT_SETTINGS.masterVolume,
      effectsVolume: DEFAULT_SETTINGS.effectsVolume,
      musicVolume: DEFAULT_SETTINGS.musicVolume,
      bounceLight: true,
    });
    expect(parseSettings(JSON.stringify({ bounceLight: false })).bounceLight).toBe(false);
    expect(parseSettings(JSON.stringify({ bounceLight: "off" })).bounceLight).toBe(true);
    expect(parseSettings(JSON.stringify({ masterVolume: 3, effectsVolume: -1 }))).toMatchObject({ masterVolume: 1, effectsVolume: 0 });
    expect(parseSettings(JSON.stringify({ hotkeys: { defend: "3" }, slotKeys: false }))).toMatchObject({ hotkeys: {}, slotKeys: false });
  });

  test("abilities keep their own keys until changed; taking a key in use swaps the two", () => {
    expect(keyFor(DEFAULT_SETTINGS, "defend")).toBe("d");
    const moved = withHotkey(DEFAULT_SETTINGS, "defend", "x");
    expect([keyFor(moved, "defend"), keyFor(moved, "wait")]).toEqual(["x", "w"]);
    const swapped = withHotkey(moved, "wait", "x");
    expect([keyFor(swapped, "defend"), keyFor(swapped, "wait")]).toEqual(["w", "x"]);
  });
});
