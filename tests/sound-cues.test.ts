import { existsSync, readFileSync } from "node:fs";
import { MUSIC, SOUNDS } from "#view/sound";
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
    const march = [{ type: "moved" as const, leaderId: "leader0", path: [] }];
    expect(worldCues(march, 0, 0).map((c) => c.key)).toEqual(["map/march"]);
    expect(worldCues(march, 0, 1)).toEqual([]);
    expect(worldCues([{ type: "recruited", defId: "congregant", into: { kind: "garrison", cityId: "capitol0" } }], 0, 0).map((c) => c.key)).toEqual(["ui/coins"]);
  });
});

describe("sound files", () => {
  test("every slot with a recorded source has its file, and every file is a slot", () => {
    const sources = readFileSync("assets/audio/SOURCES.md", "utf8");
    const listed = [...sources.matchAll(/^\| `([^`]+)`/gm)].map((m) => m[1] ?? "");
    for (const key of listed) expect(existsSync(`assets/audio/${key}.ogg`)).toBe(true);
    const slots: readonly string[] = [...SOUNDS, ...MUSIC.map((t) => `music/${t}`)];
    for (const key of listed) expect(slots).toContain(key);
  });
});
