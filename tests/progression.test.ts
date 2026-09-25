import { autoplay } from "#rules/ai";
import type { Placement } from "#rules/battle/engine";
import { allowedUnits, doctrine, INVESTMENT_COST } from "#rules/doctrine";
import { COLS } from "#rules/battle/grid";
import { neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { grow, xpValue } from "#rules/progression";
import {
  applyWorldAction,
  capitolOf,
  concludeBattle,
  createWorld,
  leaderById,
  RESURRECTION_BASE,
  resurrectionCost,
} from "#rules/world";
import type { Leader, World } from "#rules/world";
import { describe, expect, test } from "vitest";

const uncommitted = doctrine("jilliath", "uncommitted").commitment;
const preserve = doctrine("jilliath", "preserve").commitment;
const punishment = doctrine("jilliath", "punishment").commitment;

const congregants: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const punishers: Placement[] = [
  { defId: "punisher", tile: { row: 0, col: 0 } },
  { defId: "punisher", tile: { row: 0, col: 1 } },
  { defId: "torturer", tile: { row: 0, col: 2 } },
];

function withLeader(world: World, id: string, change: Partial<Leader>): World {
  return { ...world, leaders: world.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) };
}

function besideHex(world: World, hex: Hex): Hex {
  const found = neighbors(hex).find((n) => stepCost(world.map, n) !== null && !world.cities.some((c) => sameHex(c.hex, n)));
  if (!found) throw new Error("no free neighbour");
  return found;
}

/** Leader 1 walks into leader 0, and the fight is played out by the AI. */
function fight(world: World): ReturnType<typeof concludeBattle> {
  const target = leaderById(world, "leader0").hex;
  let next = withLeader(world, "leader1", { hex: besideHex(world, target) });
  next = applyWorldAction({ ...next, activeSide: 1 }, { type: "move", leaderId: "leader1", to: target }).world;
  const battle = next.engagement?.battle;
  if (!battle) throw new Error("no battle");
  return concludeBattle(next, autoplay(battle));
}

describe("doctrine", () => {
  test("the tree a faction can field follows its investments", () => {
    expect(allowedUnits("jilliath", uncommitted)).toEqual(["congregant"]);
    expect(allowedUnits("jilliath", preserve)).toEqual(["congregant", "paladin", "templar", "immortal"]);
    expect(allowedUnits("jilliath", punishment)).toEqual(["congregant", "zealot", "punisher", "torturer"]);
    expect(allowedUnits("nexus", uncommitted)).toEqual(["custodian", "arcane_engineer", "apprentice"]);
  });
});

describe("evolution", () => {
  test("a unit is worth its stats in XP", () => {
    expect(xpValue("congregant")).toBe(65);
    expect(xpValue("paladin")).toBe(135);
  });

  test("enough XP evolves a unit along its faction's branch, and the new form arrives fresh", () => {
    expect(grow("congregant", 40, 60, preserve)).toEqual({ defId: "paladin", xp: 0, evolvedInto: ["paladin"] });
    expect(grow("congregant", 40, 30, preserve)).toEqual({ defId: "congregant", xp: 70, evolvedInto: [] });
    expect(grow("immortal", 0, 5000, preserve).evolvedInto).toEqual([]);
  });

  test("at an uninvested fork a unit waits with a full bar, and evolves when the faction commits", () => {
    expect(grow("congregant", 0, 500, uncommitted)).toEqual({ defId: "congregant", xp: 100, evolvedInto: [] });
    let world = createWorld(1, [congregants, congregants], [uncommitted, uncommitted], ["jilliath", "jilliath"]);
    world = withLeader(world, "leader0", { squad: leaderById(world, "leader0").squad.map((m) => ({ ...m, xp: 100 })) });
    world = { ...world, gold: [500, 500] };
    const step = applyWorldAction(world, { type: "invest", branch: "consume" });
    expect(step.world.gold[0]).toBe(500 - INVESTMENT_COST.consume);
    expect(leaderById(step.world, "leader0").squad.map((m) => m.defId)).toEqual(["zealot", "zealot", "zealot"]);
    expect(() => applyWorldAction(step.world, { type: "invest", branch: "preserve" })).toThrow(/fork/);
  });

  test("the winners split the fallen enemies' worth; the fallen go to the graveyard", () => {
    const world = createWorld(1, [congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"]);
    const step = fight(world);
    expect(step.events).toContainEqual({ type: "xp", side: 1, pool: 3 * 65, each: 65 });
    expect(step.world.graveyard[0].map((f) => f.defId)).toEqual(["congregant", "congregant", "congregant"]);
    expect(leaderById(step.world, "leader1").squad.every((m) => m.xp === 65)).toBe(true);
  });
});

describe("graveyard", () => {
  test("resurrection is dear at once and cheaper for each turn you wait, down to its base", () => {
    let world = fight(createWorld(1, [congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"])).world;
    const base = RESURRECTION_BASE;
    expect(resurrectionCost(world, 0, 0)).toBe(3 * base);
    world = { ...world, turn: world.turn + 1 };
    expect(resurrectionCost(world, 0, 0)).toBe(2 * base);
    world = { ...world, turn: world.turn + 5 };
    expect(resurrectionCost(world, 0, 0)).toBe(base);
  });

  test("the resurrected return to the Capitol at 1 HP", () => {
    let world = fight(createWorld(1, [congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"])).world;
    world = { ...world, activeSide: 0, gold: [1000, 0] };
    const step = applyWorldAction(world, { type: "resurrect", index: 0, into: { kind: "garrison" } });
    expect(capitolOf(step.world, 0)?.garrison.find((m) => m.defId === "congregant")?.hp).toBe(1);
    expect(step.world.graveyard[0]).toHaveLength(2);
    expect(step.world.gold[0]).toBe(1000 - 3 * RESURRECTION_BASE);
  });
});
