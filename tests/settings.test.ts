import { DEFAULT_SETTINGS, keyFor, parseSettings, rootFontSize, withHotkey } from "#view/settings";
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
      showFrameRate: false,
      showFormulas: false,
      uiScale: 1,
    });
    expect(parseSettings(JSON.stringify({ uiScale: 9 })).uiScale).toBe(1.6);
    expect(parseSettings(JSON.stringify({ showFrameRate: true })).showFrameRate).toBe(true);
    expect(parseSettings(JSON.stringify({ showFormulas: true })).showFormulas).toBe(true);
    expect(parseSettings(JSON.stringify({ bounceLight: false })).bounceLight).toBe(false);
    expect(parseSettings(JSON.stringify({ bounceLight: "off" })).bounceLight).toBe(true);
    expect(parseSettings(JSON.stringify({ masterVolume: 3, effectsVolume: -1 }))).toMatchObject({ masterVolume: 1, effectsVolume: 0 });
    expect(parseSettings(JSON.stringify({ hotkeys: { defend: "3" }, slotKeys: false }))).toMatchObject({ hotkeys: {}, slotKeys: false });
  });

  test("the interface's root size follows the window's height, within limits, times the player's scale", () => {
    expect(rootFontSize(800, 1)).toBe(16);
    expect(rootFontSize(1600, 1)).toBe(32);
    expect(rootFontSize(300, 1)).toBe(12);
    expect(rootFontSize(800, 1.25)).toBe(20);
  });

  test("abilities keep their own keys until changed; taking a key in use swaps the two", () => {
    expect(keyFor(DEFAULT_SETTINGS, "defend")).toBe("d");
    const moved = withHotkey(DEFAULT_SETTINGS, "defend", "x");
    expect([keyFor(moved, "defend"), keyFor(moved, "wait")]).toEqual(["x", "w"]);
    const swapped = withHotkey(moved, "wait", "x");
    expect([keyFor(swapped, "defend"), keyFor(swapped, "wait")]).toEqual(["w", "x"]);
  });
});
