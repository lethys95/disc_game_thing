import { existsSync, readFileSync } from "node:fs";
import { musicTracks, SOUNDS } from "#view/sound";
import { battleCues, worldCues } from "#view/sound-cues";
import { describe, expect, test } from "vitest";

/** Which sounds play for what: by event and tag, never by ability id. */
describe("sound cues", () => {
  test("a melee attack swings then hits; a spell casts then hits as a spell; the end plays the viewer's stinger", () => {
    const melee = battleCues([{ type: "ability", unitId: "0.0.0", abilityId: "attack", targets: ["1.0.0"], enhancement: { kind: "none" } }, { type: "damage", unitId: "1.0.0", amount: 20, source: "0.0.0" }], 0);
    expect(melee.map((c) => c.key)).toEqual(["battle/swing", "battle/hit"]);
    const spell = battleCues([{ type: "ability", unitId: "0.1.1", abilityId: "plus_burst", targets: ["1.0.0"], enhancement: { kind: "none" } }, { type: "damage", unitId: "1.0.0", amount: 35, source: "0.1.1" }], 0);
    expect(spell.map((c) => c.key)).toEqual(["battle/cast", "battle/spell-hit"]);
    expect(battleCues([{ type: "battleEnd", outcome: { winner: 1 } }], 1).map((c) => c.key)).toEqual(["stinger/victory"]);
    expect(battleCues([{ type: "battleEnd", outcome: { winner: 1 } }], 0).map((c) => c.key)).toEqual(["stinger/defeat"]);
  });

  test("on the map, only the player's own marches and purchases make noise", () => {
    const march = [{ type: "moved" as const, leaderId: "leader0", path: [{ q: 0, r: 1 }, { q: 0, r: 2 }, { q: 1, r: 2 }] }];
    // As long as the walk: three hexes.
    expect(worldCues(march, 0, 0, 190)).toEqual([{ key: "map/march", delay: 0, duration: 570 }]);
    expect(worldCues(march, 0, 1, 190)).toEqual([]);
    expect(worldCues([{ type: "recruited", defId: "congregant", into: { kind: "garrison", cityId: "capitol0" } }], 0, 0, 190).map((c) => c.key)).toEqual(["ui/coins"]);
  });
});

describe("sound files", () => {
  test("every slot with a recorded source has its file, and every file is a slot", () => {
    const sources = readFileSync("assets/audio/SOURCES.md", "utf8");
    const listed = [...sources.matchAll(/^\| `([^`]+)`/gm)].map((m) => m[1] ?? "");
    for (const key of listed) expect(existsSync(`assets/audio/${key}.ogg`)).toBe(true);
    for (const key of listed.filter((k) => !k.startsWith("music/"))) expect(SOUNDS).toContain(key);
  });
});

describe("music", () => {
  test("each playable faction has a map theme and at least one battle track", () => {
    const tracks = musicTracks();
    for (const faction of ["jilliath", "nexus"]) {
      expect(tracks).toContain(`${faction}/map`);
      expect(tracks.some((t) => t.startsWith(`${faction}/battle-`))).toBe(true);
    }
  });
});
