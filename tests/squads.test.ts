import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { hexDistance, neighbors, sameHex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { GUARDIAN_ID } from "#rules/units/index";
import { applyWorldAction } from "#rules/world/actions";
import { createWorld } from "#rules/world/create";
import { income, investNodeProblem, recruitProblem, resurrectionCost, resurrectProblem, upgradeCityProblem } from "#rules/world/economy";
import { CITY_RESURRECTION_PREMIUM } from "#rules/research";
import { CITY_ARMOR_PER_TIER, CITY_SLOTS, CITY_UPGRADE_COST, MINE_INCOME } from "#rules/balance";
import { capacityOf, transferProblem } from "#rules/world/squads";
import { playerOf, capitolOf, cityOfNode, leaderById, nodesOf } from "#rules/world/state";
import type { Leader, SquadRef, World } from "#rules/world/state";
import { withGraveyard, startOf, withGold, twoPlayers } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Units trade between squads that meet (pillars.md, "Cities" and "Warbands meeting"). */

const three: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const world = (): World => withGold(createWorld(1, twoPlayers([three, three], [{}, {}], ["jilliath", "jilliath"])), [1000, 1000]);

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
    const away = neighbors(startOf(start, 0)).find((h) => stepCost(start.map, h) !== null && !start.cities.some((c) => sameHex(c.hex, h)));
    if (!away) throw new Error("no free neighbour");
    const apart = withLeader(start, "leader0", { hex: startOf(start, 1) });
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

describe("city tiers", () => {
  test("upgrading costs gold and adds garrison slots; the Guardian takes none", () => {
    let w = world();
    const capitol = capitolOf(w, 0);
    if (!capitol) throw new Error("no Capitol");
    expect([capitol.tier, capacityOf(w, garrison)]).toEqual([1, (CITY_SLOTS[1] ?? 0) + 1]);
    w = applyWorldAction(w, { type: "upgradeCity", cityId: capitol.id }).world;
    expect(playerOf(w, 0).gold).toBe(1000 - CITY_UPGRADE_COST * 2);
    expect(capacityOf(w, garrison)).toBe((CITY_SLOTS[2] ?? 0) + 1);
    w = applyWorldAction(withGold(w, [5000, 5000]), { type: "upgradeCity", cityId: capitol.id }).world;
    w = applyWorldAction(w, { type: "upgradeCity", cityId: capitol.id }).world;
    expect(upgradeCityProblem(w, capitol.id)).toBe("already at the highest tier");
  });

  test("the garrison, and a warband defending in its own city, fight behind the walls", () => {
    const base = world();
    const upgraded = capitolOf(base, 0);
    if (!upgraded) throw new Error("no Capitol");
    const w = applyWorldAction(base, { type: "upgradeCity", cityId: upgraded.id }).world;
    const capitol = capitolOf(w, 0);
    if (!capitol) throw new Error("no Capitol");
    const attacker = withLeader({ ...w, activePlayer: 1 }, "leader1", { hex: neighbors(capitol.hex).find((h) => stepCost(w.map, h) !== null && !w.cities.some((c) => sameHex(c.hex, h))) ?? capitol.hex });
    const battle = applyWorldAction(attacker, { type: "move", leaderId: "leader1", to: capitol.hex }).world.engagement?.battle;
    // Player 0 defends, so it stands on battle side 1.
    const walls = Object.values(battle?.units ?? {}).filter((u) => u.side === 1).map((u) => u.effects.find((e) => e.def === "fortified")?.amount);
    expect(walls.length).toBeGreaterThan(0);
    expect(walls.every((a) => a === CITY_ARMOR_PER_TIER)).toBe(true);
  });
});

describe("resurrection in cities", () => {
  test("only at the Capitol until researched; then in any city you hold, for a premium", () => {
    let w = world();
    const city = w.cities.find((c) => c.kind === "city");
    if (!city) throw new Error("no city");
    w = withGraveyard({ ...w, cities: w.cities.map((c) => (c.id === city.id ? { ...c, owner: 0, garrison: [] } : c)) }, 0, [{ defId: "paladin", fellOnTurn: w.turn - 5, marks: [], level: 0 }]);
    const there: SquadRef = { kind: "garrison", cityId: city.id };
    expect(resurrectProblem(w, 0, there)).toMatch(/only at the Capitol/);
    w = applyWorldAction(w, { type: "research", research: "city_resurrection" }).world;
    expect(resurrectProblem(w, 0, there)).toBeNull();
    const atCapitol = resurrectionCost(w, 0, 0) ?? 0;
    const inCity = resurrectionCost(w, 0, 0, w.cities.find((c) => c.id === city.id)) ?? 0;
    expect(inCity).toBe(Math.round(atCapitol * CITY_RESURRECTION_PREMIUM));
    const before = playerOf(w, 0).gold;
    w = applyWorldAction(w, { type: "resurrect", index: 0, into: there }).world;
    expect(playerOf(w, 0).gold).toBe(before - inCity);
  });
});

describe("nodes", () => {
  test("a node belongs to the nearest city, Capitols included; each Capitol has a mine of its own", () => {
    const w = world();
    for (const side of [0, 1] as const) {
      const capitol = capitolOf(w, side);
      if (!capitol) throw new Error("no Capitol");
      expect(nodesOf(w, capitol).map((n) => n.kind)).toContain("gold");
    }
    for (const node of w.nodes) {
      const owner = cityOfNode(w, node);
      expect(w.cities.every((c) => hexDistance(c.hex, node.hex) >= hexDistance(owner?.hex ?? node.hex, node.hex))).toBe(true);
    }
  });

  test("investing raises a node's level and what it yields", () => {
    let w = world();
    const capitol = capitolOf(w, 0);
    const mine = capitol ? nodesOf(w, capitol).find((n) => n.kind === "gold") : undefined;
    if (!mine) throw new Error("no Capitol mine");
    const before = income(w, 0);
    w = applyWorldAction(w, { type: "investNode", nodeId: mine.id }).world;
    expect(income(w, 0)).toBe(before + MINE_INCOME);
    const enemyMine = w.nodes.find((n) => cityOfNode(w, n)?.owner === 1);
    if (!enemyMine) throw new Error("no enemy node");
    expect(investNodeProblem(w, enemyMine.id)).toBe("its city isn't yours");
  });
});
