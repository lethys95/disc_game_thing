import { spellById } from "#rules/spells";
import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { CAPITOL_MANA } from "#rules/balance";
import { neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { applyWorldAction } from "#rules/world/actions";
import { createWorld } from "#rules/world/create";
import { castProblem } from "#rules/world/spells";
import { capitolOf, leaderById, playerOf } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { updateVision } from "#rules/world/vision";
import { twoPlayers } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Overworld spells (pillars.md, "Spells"); the spells themselves are provisional placeholders. */

const three: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));

/** Player 0 plays `faction`, rich in gold and mana, and knows every spell of its faction. */
function world(faction: "jilliath" | "nexus", spells: string[]): World {
  const w = createWorld(1, twoPlayers([three, three], [{}, {}], [faction, "jilliath"]));
  return { ...w, players: w.players.map((p, i) => (i === 0 ? { ...p, gold: 1000, mana: { red: 100, teal: 100 }, spells } : p)) };
}

function withLeader(w: World, id: string, change: Partial<Leader>): World {
  const next = structuredClone({ ...w, leaders: w.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) });
  updateVision(next);
  return next;
}

/** A free hex next to `hex`. */
function beside(w: World, hex: Hex): Hex {
  const free = neighbors(hex).find((h) => stepCost(w.map, h) !== null && !w.cities.some((c) => sameHex(c.hex, h)) && !w.leaders.some((l) => sameHex(l.hex, h)) && !w.lairs.some((l) => sameHex(l.hex, h)));
  if (!free) throw new Error("no free hex");
  return free;
}

describe("mana and learning", () => {
  test("a Capitol yields its owner's color each turn", () => {
    const w = createWorld(1, twoPlayers([three, three], [{}, {}], ["jilliath", "nexus"]));
    const next = applyWorldAction(w, { type: "endTurn" }).world;
    expect(playerOf(next, 1).mana).toEqual({ red: 0, teal: CAPITOL_MANA });
  });

  test("learning costs gold, only at a Capitol, only your faction's spells", () => {
    const w = world("jilliath", []);
    const learned = applyWorldAction(w, { type: "learnSpell", spell: "bless_warband" }).world;
    expect(playerOf(learned, 0).spells).toEqual(["bless_warband"]);
    expect(playerOf(learned, 0).gold).toBe(1000 - 150);
    expect(() => applyWorldAction(w, { type: "learnSpell", spell: "lightning_strike" })).toThrow(/another faction/);
  });
});

describe("casting", () => {
  test("Lightning strike hits an enemy warband in sight and can kill; once per turn; not out of sight", () => {
    let w = world("nexus", ["lightning_strike"]);
    const enemyHex = leaderById(w, "leader1").hex;
    expect(castProblem(w, "lightning_strike", enemyHex)).toBe("out of sight");
    w = withLeader(w, "leader0", { hex: beside(w, enemyHex) });
    // The second Congregant is nearly dead; the first is the leader.
    w = withLeader(w, "leader1", { squad: leaderById(w, "leader1").squad.map((m, i) => (i === 1 ? { ...m, hp: 10 } : m)) });
    const step = applyWorldAction(w, { type: "castSpell", spell: "lightning_strike", at: enemyHex });
    const cast = step.world;
    expect(leaderById(cast, "leader1").squad.map((m) => m.hp)).toEqual([60, 60]);
    expect(playerOf(cast, 1).graveyard.map((f) => f.defId)).toEqual(["congregant"]);
    expect(step.events).toContainEqual({ type: "fell", player: 1, defId: "congregant" });
    expect(playerOf(cast, 0).mana.teal).toBe(100 - spellById("lightning_strike").cost);
    expect(castProblem(cast, "lightning_strike", enemyHex)).toBe("already cast this turn");
  });

  test("a warband whose leader dies to a spell keeps its fallen leader; one with nobody left falls", () => {
    let w = world("nexus", ["lightning_strike"]);
    const enemyHex = leaderById(w, "leader1").hex;
    w = withLeader(w, "leader0", { hex: beside(w, enemyHex) });
    const weak = (hp: number) => withLeader(w, "leader1", { squad: leaderById(w, "leader1").squad.map((m, i) => (i === 0 ? { ...m, hp: 10 } : { ...m, hp })) });
    const leaderDown = applyWorldAction(weak(90), { type: "castSpell", spell: "lightning_strike", at: enemyHex }).world;
    expect(leaderById(leaderDown, "leader1").fellOnTurn).toBe(leaderDown.turn);
    const wiped = applyWorldAction(weak(10), { type: "castSpell", spell: "lightning_strike", at: enemyHex });
    expect(wiped.world.leaders.some((l) => l.id === "leader1")).toBe(false);
    expect(wiped.events).toContainEqual({ type: "leaderFell", leaderId: "leader1", player: 1 });
  });

  test("Lightning storm hits every enemy group around the hex, never your own", () => {
    let w = world("nexus", ["lightning_storm"]);
    const enemyHex = leaderById(w, "leader1").hex;
    const near = beside(w, enemyHex);
    w = withLeader(w, "leader0", { hex: near });
    const cast = applyWorldAction(w, { type: "castSpell", spell: "lightning_storm", at: enemyHex }).world;
    expect(leaderById(cast, "leader1").squad.every((m) => m.hp === 75)).toBe(true);
    expect(leaderById(cast, "leader0").squad.every((m) => m.hp === 90)).toBe(true);
  });

  test("Break walls: the city's defenders fight with less armor while it lasts", () => {
    let w = world("jilliath", ["break_walls"]);
    const capitol = capitolOf(w, 1);
    if (!capitol) throw new Error("no Capitol");
    w = withLeader(w, "leader0", { hex: beside(w, capitol.hex) });
    w = applyWorldAction(w, { type: "castSpell", spell: "break_walls", at: capitol.hex }).world;
    const battle = applyWorldAction(w, { type: "move", leaderId: "leader0", to: capitol.hex }).world.engagement?.battle;
    const guardian = Object.values(battle?.units ?? {}).find((u) => u.side === 1);
    expect(guardian?.effects.some((e) => e.def === "sundered")).toBe(true);
  });

  test("Bless warband lasts its turns, then wears off", () => {
    let w = world("jilliath", ["bless_warband"]);
    w = applyWorldAction(w, { type: "castSpell", spell: "bless_warband", at: leaderById(w, "leader0").hex }).world;
    expect(leaderById(w, "leader0").enchantments).toHaveLength(1);
    for (let round = 0; round < 2; round++) w = applyWorldAction(applyWorldAction(w, { type: "endTurn" }).world, { type: "endTurn" }).world;
    expect(leaderById(w, "leader0").enchantments).toHaveLength(0);
  });
});
