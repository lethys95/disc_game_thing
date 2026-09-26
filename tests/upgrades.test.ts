import type { Placement } from "#rules/battle/engine";
import { effectiveStats } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { UPGRADES } from "#rules/upgrades";
import { applyWorldAction } from "#rules/world/actions";
import { engagementBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { growSquad, upgradeProblem } from "#rules/world/economy";
import { capitolOf, leaderById } from "#rules/world/state";
import type { Leader, Mark, World } from "#rules/world/state";
import { describe, expect, test } from "vitest";

/** The timing rule (docs/design/pillars.md): an upgrade reaches units that become its type after the purchase. */

const pair: Placement[] = COLS.slice(0, 2).map((col) => ({ defId: "congregant", tile: { row: 0, col } }));

const rich = (): World => ({ ...createWorld(1, [pair, pair], [{ congregant: "paladin" }, {}], ["jilliath", "nexus"]), gold: [1000, 1000] });

const buy = (world: World, upgrade: string) => applyWorldAction(world, { type: "upgrade", upgrade }).world;

const recruit = (world: World) => applyWorldAction(world, { type: "recruit", defId: "congregant", into: { kind: "leader", leaderId: "leader0" } }).world;

/** The member at `index` reaches its evolution now, the way XP from a fight would bring it. */
function evolve(world: World, index: number): World {
  const draft = structuredClone(world);
  const leader = leaderById(draft, "leader0");
  leader.squad = leader.squad.map((m, i) => (i === index ? { ...m, xp: 100 } : m));
  growSquad(draft, { squad: leader.squad, leader }, 0, 0, []);
  return draft;
}

function withLeader(world: World, change: Partial<Leader>): World {
  return { ...world, leaders: world.leaders.map((l) => (l.id === "leader0" ? { ...l, ...change } : l)) };
}

const upgradesOn = (world: World) => leaderById(world, "leader0").squad.map((m) => m.marks.map((mark: Mark) => (mark.source.kind === "upgrade" ? mark.source.upgrade : "")));

describe("unit-type upgrades", () => {
  test("bought once, with gold, for your own faction's units", () => {
    const world = buy(rich(), "congregant_damage");
    expect(world.gold[0]).toBe(1000 - (UPGRADES.get("congregant_damage")?.price ?? 0));
    expect(upgradeProblem(world, "congregant_damage")).toBe("already bought");
    expect(upgradeProblem(world, "custodian_damage")).toBe("another faction's unit");
    expect(upgradeProblem({ ...world, gold: [0, 0] }, "paladin_damage")).toBe("not enough gold");
  });

  test("not retroactive: units you have keep their baseline, recruits after the purchase get it", () => {
    const world = recruit(buy(rich(), "congregant_damage"));
    expect(upgradesOn(world)).toEqual([[], [], ["congregant_damage"]]);
  });

  test("a unit gets an upgrade for the type it becomes only if bought first, and keeps what it had", () => {
    let world = recruit(buy(rich(), "congregant_damage"));
    world = evolve(world, 0);
    world = buy(world, "paladin_damage");
    world = evolve(evolve(world, 1), 2);
    expect(leaderById(world, "leader0").squad.map((m) => m.defId)).toEqual(["paladin", "paladin", "paladin"]);
    expect(upgradesOn(world)).toEqual([[], ["paladin_damage"], ["congregant_damage", "paladin_damage"]]);
  });

  test("marks survive death and come back with a resurrected unit", () => {
    const world = recruit(buy(rich(), "congregant_damage"));
    const fallen = leaderById(world, "leader0").squad[2];
    if (!fallen) throw new Error("no recruit");
    const dead: World = {
      ...withLeader(world, { squad: leaderById(world, "leader0").squad.slice(0, 2) }),
      graveyard: [[{ defId: "congregant", fellOnTurn: world.turn, marks: fallen.marks, level: 0 }], []],
    };
    const back = applyWorldAction(dead, { type: "resurrect", index: 0, into: { kind: "leader", leaderId: "leader0" } }).world;
    expect(upgradesOn(back)).toEqual([[], [], ["congregant_damage"]]);
  });
});

describe("marks in battle", () => {
  test("a marked unit hits harder", () => {
    const world = recruit(buy(rich(), "congregant_damage"));
    const leader = leaderById(world, "leader0");
    const battle = engagementBattle(world, leader, { kind: "garrison", cityId: capitolOf(world, 1)?.id ?? "" });
    const tile = leader.squad[2]?.tile;
    const plain = leader.squad[0]?.tile;
    if (!tile || !plain) throw new Error("no recruit");
    expect(effectiveStats(battle, `0.${tile.row}.${tile.col}`).damage).toBe(effectiveStats(battle, `0.${plain.row}.${plain.col}`).damage + 5);
  });
});
