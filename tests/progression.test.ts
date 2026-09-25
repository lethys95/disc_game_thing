import { autoplay } from "#rules/ai";
import type { Placement } from "#rules/battle/engine";
import { allowedUnits, commitmentOf, openForks } from "#rules/forks";
import type { Commitment } from "#rules/forks";
import { COLS } from "#rules/battle/grid";
import { neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { grow, xpValue } from "#rules/progression";
import { RESURRECTION_BASE } from "#rules/balance";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { resurrectionCost, waitingForks } from "#rules/world/economy";
import { capitolOf, leaderById } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { describe, expect, test } from "vitest";

const uncommitted: Commitment = {};
const preserve: Commitment = { congregant: "paladin" };
const punishment: Commitment = { congregant: "zealot", zealot: "punisher" };

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

describe("forks", () => {
  test("undecided forks keep both branches open; a choice closes the other", () => {
    expect(allowedUnits("jilliath", preserve)).toEqual(["congregant", "paladin", "templar", "immortal"]);
    expect(allowedUnits("jilliath", punishment)).toEqual(["congregant", "zealot", "punisher", "torturer"]);
    expect(allowedUnits("jilliath", { congregant: "zealot" })).toEqual(["congregant", "zealot", "punisher", "torturer", "fanatic", "chosen", "avatar_of_vengeance"]);
    expect(openForks("jilliath", uncommitted)).toEqual(["congregant", "zealot"]);
    expect(openForks("jilliath", preserve)).toEqual([]);
  });

  test("a set of units implies the choices on their way, and two branches of one fork conflict", () => {
    expect(commitmentOf(["congregant", "torturer"])).toEqual(punishment);
    expect(commitmentOf(["paladin", "zealot"])).toBeNull();
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

  test("at an undecided fork a unit waits with a full bar, and evolves the moment its owner chooses, for free", () => {
    expect(grow("congregant", 0, 500, uncommitted)).toEqual({ defId: "congregant", xp: 100, evolvedInto: [] });
    let world = createWorld(1, [congregants, congregants], [uncommitted, uncommitted], ["jilliath", "jilliath"]);
    world = withLeader(world, "leader0", { squad: leaderById(world, "leader0").squad.map((m) => ({ ...m, xp: 100 })) });
    world = { ...world, gold: [500, 500] };
    expect(waitingForks(world, 0)).toEqual(["congregant"]);
    const step = applyWorldAction(world, { type: "choose", fork: "congregant", to: "zealot" });
    expect(waitingForks(step.world, 0)).toEqual([]);
    expect(step.world.gold[0]).toBe(500);
    expect(leaderById(step.world, "leader0").squad.map((m) => m.defId)).toEqual(["zealot", "zealot", "zealot"]);
    expect(() => applyWorldAction(step.world, { type: "choose", fork: "congregant", to: "paladin" })).toThrow(/open fork/);
  });

  test("the winners split the fallen enemies' worth; the fallen go to the graveyard", () => {
    const world = createWorld(1, [congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"]);
    const step = fight(world);
    expect(step.events).toContainEqual({ type: "xp", side: 1, pool: 3 * 65, each: 65 });
    expect(step.world.graveyard[0].map((f) => f.defId)).toEqual(["congregant", "congregant", "congregant"]);
    expect(leaderById(step.world, "leader1").squad.every((m) => m.xp === 65)).toBe(true);
    expect(leaderById(step.world, "leader1").experience).toBe(65);
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
