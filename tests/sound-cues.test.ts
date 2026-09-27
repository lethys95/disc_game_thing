import { existsSync, readFileSync } from "node:fs";
import { start } from "#tests/helpers";
import { p } from "#tests/helpers";
import { musicTracks } from "#view/sound";
import { battleCues, worldCues } from "#view/sound-cues";
import { allSoundSlots, hitChain, useChain } from "#view/sound-slots";
import { describe, expect, test } from "vitest";

/** Which sounds play for what: slot chains by content, falling back by tag; never an ability named in code. */
describe("sound slots", () => {
  test("an ability falls back to its family, most telling tag first; a hit ends at any hit", () => {
    expect(useChain("plus_burst")).toEqual(["ability/plus_burst", "ability/_spell", "ability/_ranged", "ability/_attack"]);
    expect(hitChain("mend")).toEqual(["hit/mend", "hit/_heal", "hit/_default"]);
    expect(hitChain(null)).toEqual(["hit/_default"]);
  });

  test("a step's cues: the use, then its hits and deaths; the end plays the viewer's stinger", () => {
    const battle = start([p("congregant", 0, 1)], [p("congregant", 0, 1)]);
    const cues = battleCues(
      [
        { type: "ability", unitId: "0.0.1", abilityId: "attack", targets: ["1.0.1"], enhancement: { kind: "none" } },
        { type: "damage", unitId: "1.0.1", amount: 20, source: "0.0.1" },
        { type: "death", unitId: "1.0.1" },
      ],
      battle,
      0,
    );
    expect(cues.map((c) => c.chain[0])).toEqual(["ability/attack", "hit/attack", "death/congregant"]);
    expect(battleCues([{ type: "battleEnd", outcome: { winner: 1 } }], battle, 1).map((c) => c.chain)).toEqual([["stinger/victory"]]);
    expect(battleCues([{ type: "battleEnd", outcome: { winner: 1 } }], battle, 0).map((c) => c.chain)).toEqual([["stinger/defeat"]]);
  });

  test("on the map, only the player's own marches (as long as the walk) and purchases make noise", () => {
    const march = [{ type: "moved" as const, leaderId: "leader0", path: [{ q: 0, r: 1 }, { q: 0, r: 2 }, { q: 1, r: 2 }] }];
    expect(worldCues(march, 0, 0, 190)).toEqual([{ chain: ["map/march"], delay: 0, duration: 570 }]);
    expect(worldCues(march, 0, 1, 190)).toEqual([]);
    expect(worldCues([{ type: "recruited", defId: "congregant", into: { kind: "garrison", cityId: "capitol0" } }], 0, 0, 190).map((c) => c.chain)).toEqual([["ui/coins"]]);
  });
});

describe("sound files", () => {
  test("every slot with a recorded source has its file", () => {
    const listed = [...readFileSync("assets/audio/SOURCES.md", "utf8").matchAll(/^\| `([^`]+)`/gm)].map((m) => m[1] ?? "");
    for (const key of listed) expect(existsSync(`assets/audio/${key}.ogg`)).toBe(true);
  });

  test("every fixed slot and every family fallback the game leans on has a file", () => {
    for (const { key, chain } of allSoundSlots().filter((s) => !s.key.startsWith("ability/"))) {
      expect(chain.some((k) => existsSync(`assets/audio/${k}.ogg`)), key).toBe(true);
    }
  });

  test("each playable faction has a map theme and at least one battle track", () => {
    const tracks = musicTracks();
    for (const faction of ["jilliath", "nexus"]) {
      expect(tracks).toContain(`${faction}/map`);
      expect(tracks.some((t) => t.startsWith(`${faction}/battle-`))).toBe(true);
    }
  });
});
