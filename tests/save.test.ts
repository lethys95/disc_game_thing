import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { readSave, SAVE_VERSION, toSave, writeSave } from "#rules/save";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import { createWorld } from "#rules/world/create";
import type { World } from "#rules/world/state";
import { beside, twoPlayers, withLeader } from "#tests/helpers";
import { describe, expect, test } from "vitest";

const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const world = (): World => createWorld(3, twoPlayers([squad, squad], [{}, {}], ["jilliath", "nexus"]));
const at = new Date("2026-09-26T09:00:00Z");

/** Plays the map AI for both sides until a battle starts or `steps` orders are given. */
function play(start: World, steps: number): World {
  let w = start;
  for (let i = 0; i < steps && !w.engagement && !w.outcome; i++) w = applyWorldAction(w, chooseWorldAction(w)).world;
  return w;
}

/** Objects keyed by ids rather than by field names: their values are read as one kind, `path{}`. */
const RECORDS = new Set(["commitment", "skills", "units", "chargesUsed", "actionsThisRound", "params"]);

/** Every key path in the data, through every array element: the shape a save depends on. */
function shape(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return [`${path}[]`, ...value.flatMap((v) => shape(v, `${path}[]`))];
  if (typeof value !== "object" || value === null) return [path];
  if (RECORDS.has(path.split(".").at(-1) ?? "")) return [`${path}{}`, ...Object.values(value).flatMap((v) => shape(v, `${path}{}`))];
  return Object.entries(value).flatMap(([key, inner]) => shape(inner, path ? `${path}.${key}` : key));
}

/**
 * A world with every collection filled, by hand rather than by the AI (so the fixture doesn't change with the AI):
 * items, enchantments, skills, the dead, research and spells, a dungeon looted, and a battle under way.
 */
function fixture(): World {
  let w = world();
  const camp = w.lairs.find((l) => l.kind === "camp");
  if (!camp) throw new Error("no camp");
  const blessing = { spell: "bless_warband", effect: { def: "extra_damage", amount: 10 }, until: 3 };
  const fallen = { defId: "congregant", fellOnTurn: 1, level: 1, marks: [{ effect: { def: "extra_armor", amount: 5 }, source: { kind: "item" as const, item: "iron_helm" } }] };
  w = withLeader(w, "leader0", { hex: beside(w, camp.hex), worn: ["iron_helm", "hatchet"], bag: ["ankh"], enchantments: [blessing], skills: { movement: 1 } });
  w = {
    ...w,
    players: w.players.map((p) => ({ ...p, graveyard: [fallen], upgrades: ["congregant_damage"], research: ["city_resurrection"], spells: ["bless_warband"], cast: ["bless_warband"], commitment: { congregant: "zealot" } })),
    cities: w.cities.map((c) => ({ ...c, enchantments: [blessing] })),
    lairs: w.lairs.map((l) => (l.kind === "dungeon" ? { ...l, looted: true } : l.kind === "camp" && l.id !== camp.id ? { ...l, regrowsOn: 9 } : l)),
  };
  return applyWorldAction(withLeader(w, "leader0", {}), { type: "move", leaderId: "leader0", to: camp.hex }).world;
}

describe("saves", () => {
  test("a save reads back as the same world", () => {
    const w = play(world(), 12);
    const result = readSave(writeSave(toSave(w, 3, at)));
    expect(result.ok && result.save.world).toEqual(w);
    expect(result.ok && result.save.seed).toBe(3);
  });

  test("a loaded game plays on exactly as the original would have", () => {
    const w = play(world(), 8);
    const result = readSave(writeSave(toSave(w, 3, at)));
    if (!result.ok) throw new Error(result.problem);
    expect(play(result.save.world, 30)).toEqual(play(w, 30));
  });

  test("other versions, other files and damaged saves are refused, with a reason", () => {
    const text = writeSave(toSave(world(), 3, at));
    expect(readSave(text.replace(`"version":${SAVE_VERSION}`, `"version":${SAVE_VERSION + 1}`))).toMatchObject({ ok: false, problem: expect.stringMatching(/another version/) });
    expect(readSave("{\"hello\": 1}")).toEqual({ ok: false, problem: "not a save file" });
    expect(readSave("not json")).toEqual({ ok: false, problem: "not a save file" });
    expect(readSave(text.replace(`"seed":3`, `"seed":"3"`))).toEqual({ ok: false, problem: "damaged save file" });
  });

  test("a save naming content this game lacks (a unit renamed since) is refused, naming it", () => {
    const text = writeSave(toSave(world(), 3, at));
    const guardian = /"defId":"([a-z_0-9]+)"/.exec(text)?.[1] ?? "";
    expect(readSave(text.replaceAll(`"defId":"${guardian}"`, `"defId":"renamed"`))).toEqual({ ok: false, problem: "made by another version of the game (it has a unit renamed this game doesn't)" });
  });

  test("the saved shape is pinned to the save version: when this fails, bump SAVE_VERSION and update the snapshot", () => {
    const w = fixture();
    expect(w.engagement).not.toBeNull();
    expect({ version: SAVE_VERSION, shape: [...new Set(shape(w))].sort() }).toMatchSnapshot();
  });
});
