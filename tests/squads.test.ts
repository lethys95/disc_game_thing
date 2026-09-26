import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { neighbors, sameHex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { GUARDIAN_ID } from "#rules/units/index";
import { applyWorldAction } from "#rules/world/actions";
import { createWorld } from "#rules/world/create";
import { recruitProblem } from "#rules/world/economy";
import { transferProblem } from "#rules/world/squads";
import { capitolOf, leaderById } from "#rules/world/state";
import type { Leader, SquadRef, World } from "#rules/world/state";
import { describe, expect, test } from "vitest";

/** Units trade between squads that meet (pillars.md, "Cities" and "Warbands meeting"). */

const three: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const world = (): World => ({ ...createWorld(1, [three, three], [{}, {}], ["jilliath", "jilliath"]), gold: [1000, 1000] });

const band: SquadRef = { kind: "warband", leaderId: "leader0" };
const garrison: SquadRef = { kind: "garrison", cityId: "capitol0" };

function withLeader(w: World, id: string, change: Partial<Leader>): World {
  return { ...w, leaders: w.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) };
}

const move = (w: World, from: SquadRef, fromCol: 0 | 1 | 2, to: SquadRef, toCol: 0 | 1 | 2, fromRow: 0 | 1 | 2 = 0, toRow: 0 | 1 | 2 = 0) =>
  applyWorldAction(w, { type: "transfer", from, fromTile: { row: fromRow, col: fromCol }, to, toTile: { row: toRow, col: toCol } }).world;

describe("transfers", () => {
  test("a warband in its city trades with the garrison; moving onto a unit swaps them", () => {
    let w = move(world(), band, 1, garrison, 0, 0, 2);
    expect(leaderById(w, "leader0").squad.map((m) => m.tile.col)).toEqual([0, 2]);
    expect(capitolOf(w, 0)?.garrison.map((m) => m.defId)).toEqual([GUARDIAN_ID, "congregant"]);
    w = move(w, garrison, 0, band, 2, 2, 0);
    expect(leaderById(w, "leader0").squad.find((m) => m.tile.col === 2)?.defId).toBe("congregant");
  });

  test("the leader stays with its warband and the Guardian with its Capitol, but both can be rearranged", () => {
    const w = world();
    const guardian = capitolOf(w, 0)?.garrison[0]?.tile;
    if (!guardian) throw new Error("no Guardian");
    expect(transferProblem(w, { from: band, fromTile: { row: 0, col: 0 }, to: garrison, toTile: { row: 2, col: 2 } })).toMatch(/leader stays/);
    expect(transferProblem(w, { from: garrison, fromTile: guardian, to: band, toTile: { row: 2, col: 2 } })).toMatch(/Guardian/);
    const moved = move(w, band, 0, band, 1, 0, 2);
    expect(leaderById(moved, "leader0").leaderTile).toEqual({ row: 2, col: 1 });
  });

  test("squads apart don't meet; neighbouring warbands do", () => {
    const start = world();
    const away = neighbors(start.map.starts[0]).find((h) => stepCost(start.map, h) !== null && !start.cities.some((c) => sameHex(c.hex, h)));
    if (!away) throw new Error("no free neighbour");
    const apart = withLeader(start, "leader0", { hex: start.map.starts[1] });
    expect(transferProblem(apart, { from: band, fromTile: { row: 0, col: 1 }, to: garrison, toTile: { row: 2, col: 2 } })).toMatch(/together/);

    const second: Leader = { ...leaderById(start, "leader0"), id: "leaderX", hex: away, squad: [{ defId: "congregant", tile: { row: 0, col: 0 }, hp: 90, xp: 0, marks: [], level: 0 }], leaderTile: { row: 0, col: 0 } };
    const pair: World = { ...start, leaders: [...start.leaders, second] };
    const traded = move(pair, band, 1, { kind: "warband", leaderId: "leaderX" }, 1);
    expect(leaderById(traded, "leaderX").squad.length).toBe(2);
  });
});

describe("recruiting by tile", () => {
  test("a recruit goes where it's put, in any city you hold; a taken spot is refused", () => {
    let w = applyWorldAction(world(), { type: "recruit", defId: "congregant", into: garrison, tile: { row: 2, col: 2 } }).world;
    expect(capitolOf(w, 0)?.garrison.some((m) => m.tile.row === 2 && m.tile.col === 2)).toBe(true);
    expect(recruitProblem(w, "congregant", garrison, { row: 2, col: 2 })).toBe("that spot is taken");
    const city = w.cities.find((c) => c.kind === "city");
    if (!city) throw new Error("no city");
    expect(recruitProblem(w, "congregant", { kind: "garrison", cityId: city.id })).toBe("not your squad");
    w = { ...w, cities: w.cities.map((c) => (c.id === city.id ? { ...c, owner: 0, garrison: [] } : c)) };
    expect(recruitProblem(w, "congregant", { kind: "garrison", cityId: city.id })).toBeNull();
  });
});
