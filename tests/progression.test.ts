import { autoplay } from "#rules/ai";
import type { Placement } from "#rules/battle/engine";
import { allowedUnits, commitmentOf, openForks } from "#rules/forks";
import type { Commitment } from "#rules/forks";
import { COLS } from "#rules/battle/grid";
import { neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { grow, xpToLevel, xpValue } from "#rules/progression";
import { LEVEL_BONUS_PERCENT, RESURRECTION_BASE } from "#rules/balance";
import { GUARDIAN_ID } from "#rules/units/index";
import { maxHpOf, recordOf } from "#rules/world/record";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { growSquad, resurrectionCost, waitingForks } from "#rules/world/economy";
import { playerOf, capitolOf, leaderById } from "#rules/world/state";
import type { Leader, World, WorldEvent } from "#rules/world/state";
import { withGold, twoPlayers } from "#tests/helpers";
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
  next = applyWorldAction({ ...next, activePlayer: 1 }, { type: "move", leaderId: "leader1", to: target }).world;
  const battle = next.engagement?.battle;
  if (!battle) throw new Error("no battle");
  return concludeBattle(next, autoplay(battle));
}

describe("forks", () => {
  test("undecided forks keep both branches open; a choice closes the other", () => {
    const backline = ["cleric", "jilliath_mage_1"];
    expect(allowedUnits("jilliath", preserve)).toEqual(["congregant", "paladin", "templar", "immortal", ...backline]);
    expect(allowedUnits("jilliath", punishment)).toEqual(["congregant", "zealot", "punisher", "torturer", ...backline]);
    expect(allowedUnits("jilliath", { congregant: "zealot" })).toEqual(["congregant", "zealot", "punisher", "torturer", "fanatic", "chosen", "avatar_of_vengeance", ...backline]);
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
    expect(grow("congregant", 40, 60, preserve)).toEqual({ defId: "paladin", xp: 0, evolvedInto: ["paladin"], levels: 0 });
    expect(grow("congregant", 40, 30, preserve)).toEqual({ defId: "congregant", xp: 70, evolvedInto: [], levels: 0 });
    expect(grow("immortal", 0, 5000, preserve).evolvedInto).toEqual([]);
  });

  test("at an undecided fork a unit waits with a full bar, and evolves the moment its owner chooses, for free", () => {
    expect(grow("congregant", 0, 500, uncommitted)).toEqual({ defId: "congregant", xp: 100, evolvedInto: [], levels: 0 });
    let world = createWorld(1, twoPlayers([congregants, congregants], [uncommitted, uncommitted], ["jilliath", "jilliath"]));
    world = withLeader(world, "leader0", { squad: leaderById(world, "leader0").squad.map((m) => ({ ...m, xp: 100 })) });
    world = withGold(world, [500, 500]);
    expect(waitingForks(world, 0)).toEqual(["congregant"]);
    const step = applyWorldAction(world, { type: "choose", fork: "congregant", to: "zealot" });
    expect(waitingForks(step.world, 0)).toEqual([]);
    expect(playerOf(step.world, 0).gold).toBe(500);
    expect(leaderById(step.world, "leader0").squad.map((m) => m.defId)).toEqual(["zealot", "zealot", "zealot"]);
    expect(() => applyWorldAction(step.world, { type: "choose", fork: "congregant", to: "paladin" })).toThrow(/open fork/);
  });

  test("the winners split the fallen enemies' worth; the fallen go to the graveyard", () => {
    const world = createWorld(1, twoPlayers([congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"]));
    const step = fight(world);
    expect(step.events).toContainEqual({ type: "xp", player: 1, pool: 3 * 65, each: 65 });
    expect(playerOf(step.world, 0).graveyard.map((f) => f.defId)).toEqual(["congregant", "congregant", "congregant"]);
    expect(leaderById(step.world, "leader1").squad.every((m) => m.xp === 65)).toBe(true);
    expect(leaderById(step.world, "leader1").experience).toBe(65);
  });
});

describe("graveyard", () => {
  test("resurrection is dear at once and cheaper for each turn you wait, down to its base", () => {
    let world = fight(createWorld(1, twoPlayers([congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"]))).world;
    const base = RESURRECTION_BASE;
    expect(resurrectionCost(world, 0, 0)).toBe(3 * base);
    world = { ...world, turn: world.turn + 1 };
    expect(resurrectionCost(world, 0, 0)).toBe(2 * base);
    world = { ...world, turn: world.turn + 5 };
    expect(resurrectionCost(world, 0, 0)).toBe(base);
  });

  test("the resurrected return to the Capitol at 1 HP", () => {
    let world = fight(createWorld(1, twoPlayers([congregants, punishers], [uncommitted, punishment], ["jilliath", "jilliath"]))).world;
    world = withGold({ ...world, activePlayer: 0 }, [1000, 0]);
    const step = applyWorldAction(world, { type: "resurrect", index: 0, into: { kind: "garrison", cityId: "capitol0" } });
    expect(capitolOf(step.world, 0)?.garrison.find((m) => m.defId === "congregant")?.hp).toBe(1);
    expect(playerOf(step.world, 0).graveyard).toHaveLength(2);
    expect(playerOf(step.world, 0).gold).toBe(1000 - 3 * RESURRECTION_BASE);
  });
});

describe("levels past the end of a line (pillars.md, D2's rule)", () => {
  test("a unit that can't evolve keeps leveling at a fixed requirement; a unit waiting at a fork doesn't", () => {
    expect(grow("immortal", 0, 2500, preserve)).toEqual({ defId: "immortal", xp: 500, evolvedInto: [], levels: 2 });
    expect(xpToLevel("immortal")).toBe(1000);
    expect(xpToLevel("hedge_mage")).toBe(100);
    expect(xpToLevel("avatar_of_vengeance")).toBe(1000);
    expect(xpToLevel("congregant")).toBeNull();
    expect(xpToLevel(GUARDIAN_ID)).toBeNull();
    expect(grow("congregant", 0, 5000, uncommitted).levels).toBe(0);
  });

  test("each level adds a share of the base stats, heals fully, shows in the track record and survives death", () => {
    const immortals: Placement[] = [{ defId: "immortal", tile: { row: 0, col: 1 } }];
    let world = createWorld(1, twoPlayers([immortals, immortals], [preserve, preserve], ["jilliath", "jilliath"]));
    world = withLeader(world, "leader0", { squad: leaderById(world, "leader0").squad.map((m) => ({ ...m, hp: 10, xp: 900 })) });
    const draft = structuredClone(world);
    const leader = leaderById(draft, "leader0");
    const events: WorldEvent[] = [];
    growSquad(draft, { squad: leader.squad, leader }, 1100, 0, events);
    const veteran = leader.squad[0];
    if (!veteran) throw new Error("no immortal");
    expect(events).toContainEqual({ type: "leveled", player: 0, defId: "immortal", level: 2 });
    expect(veteran.xp).toBe(0);
    const bonus = 2 * LEVEL_BONUS_PERCENT;
    expect(maxHpOf(veteran, undefined)).toBe(260 + Math.round((260 * bonus) / 100));
    expect(veteran.hp).toBe(maxHpOf(veteran, leader));
    expect(recordOf(veteran, undefined)).toEqual([{ effect: { def: "veteran", amount: bonus }, source: { kind: "levels", levels: 2 } }]);
  });
});
