import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { hexDistance, neighbors, sameHex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { GUARDIAN_ID } from "#rules/units/index";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle, playersIn } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import type { PlayerSetup } from "#rules/world/create";
import { capitolOf, leaderById, nodesOf, playerOf } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { describe, expect, test } from "vitest";

/** More than two players on the map (user, 2026-09-26); every battle still has exactly two sides. */

const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const player = (color: PlayerSetup["color"]): PlayerSetup => ({ squad, faction: "jilliath", commitment: {}, color });
const three = (): World => createWorld(1, [player("red"), player("blue"), player("gold")]);

function withLeader(world: World, id: string, change: Partial<Leader>): World {
  return { ...world, leaders: world.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) };
}

/** Leader `from` walks into whatever stands on `to`, from a free neighbouring hex. */
function attack(world: World, from: string, to: { q: number; r: number }): World {
  const beside = neighbors(to).find((n) => stepCost(world.map, n) !== null && !world.cities.some((c) => sameHex(c.hex, n)) && !world.leaders.some((l) => sameHex(l.hex, n)));
  if (!beside) throw new Error("no free neighbour");
  const mover = leaderById(world, from);
  return applyWorldAction(withLeader({ ...world, activePlayer: mover.player }, from, { hex: beside }), { type: "move", leaderId: from, to }).world;
}

describe("three players", () => {
  test("each gets a Capitol with its Guardian and a mine, a warband and gold, on a larger map", () => {
    const w = three();
    expect(w.players).toHaveLength(3);
    expect(w.map.radius).toBeGreaterThan(4);
    for (const id of [0, 1, 2]) {
      const capitol = capitolOf(w, id);
      expect(capitol?.garrison.map((m) => m.defId)).toEqual([GUARDIAN_ID]);
      expect(nodesOf(w, capitol ?? w.cities[0]!).some((n) => n.kind === "gold")).toBe(true);
      expect(w.leaders.filter((l) => l.player === id)).toHaveLength(1);
    }
    const [a, b, c] = w.map.starts;
    if (!a || !b || !c) throw new Error("missing starts");
    expect(Math.min(hexDistance(a, b), hexDistance(b, c), hexDistance(a, c))).toBeGreaterThan(4);
  });

  test("turns go round the table, a new round when it wraps, skipping eliminated players", () => {
    let w = three();
    const order: number[] = [];
    for (let i = 0; i < 4; i++) {
      order.push(w.activePlayer);
      w = applyWorldAction(w, { type: "endTurn" }).world;
    }
    expect(order).toEqual([0, 1, 2, 0]);
    expect(w.turn).toBe(2);
    w = { ...w, players: w.players.map((p, i) => (i === 2 ? { ...p, eliminated: true } : p)) };
    w = applyWorldAction(w, { type: "endTurn" }).world;
    expect(w.activePlayer).toBe(0);
    expect(w.turn).toBe(3);
  });

  test("a battle between players 1 and 2 involves only them; the attacker is side 0", () => {
    const w = attack(three(), "leader1", leaderById(three(), "leader2").hex);
    const engagement = w.engagement;
    if (!engagement) throw new Error("no battle");
    expect(engagement.players).toEqual([1, 2]);
    expect(playersIn(engagement)).toEqual([1, 2]);
    expect(Object.keys(engagement.battle.units).filter((id) => id.startsWith("0.")).length).toBe(3);
  });

  test("losing the Guardian puts a player out; the game ends when one is left", () => {
    let w = three();
    const target = capitolOf(w, 2);
    if (!target) throw new Error("no Capitol");
    // Player 2's warband is out in the field, so the attack meets the garrison.
    const field = w.cities.find((c) => c.kind === "city")?.hex;
    if (!field) throw new Error("no city");
    w = withLeader(w, "leader2", { hex: field });
    w = attack(w, "leader0", target.hex);
    const battle = w.engagement?.battle;
    if (!battle) throw new Error("no battle");
    // The defenders (side 1) all fall.
    const won = { ...battle, units: Object.fromEntries(Object.entries(battle.units).map(([id, u]) => [id, u.side === 1 ? { ...u, hp: 0, alive: false } : u])), outcome: { winner: 0 as const } };
    const step = concludeBattle(w, won);
    expect(step.events).toContainEqual({ type: "eliminated", player: 2 });
    expect(playerOf(step.world, 2).eliminated).toBe(true);
    expect(step.world.leaders.some((l) => l.player === 2)).toBe(false);
    expect(step.world.outcome).toBeNull();
    expect(capitolOf(step.world, 0)?.id).toBe("capitol0");
    expect(step.world.cities.find((c) => c.id === target.id)?.owner).toBe(0);
  });
});
