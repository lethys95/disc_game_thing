import { LEADER_XP_PER_POINT, MAX_LEADERSHIP, STARTING_LEADERSHIP } from "#rules/balance";
import { effectiveStats } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { applyWorldAction } from "#rules/world/actions";
import { engagementBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { learnSkillProblem } from "#rules/world/economy";
import { LEADER_SKILLS, leadershipOf, unspentPoints } from "#rules/world/leaders";
import { maxHpOf, recordOf } from "#rules/world/record";
import { leaderById } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { describe, expect, test } from "vitest";

const congregants: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));

const fresh = (): World => createWorld(1, [congregants, congregants], [{}, {}], ["jilliath", "jilliath"]);

function withLeader(world: World, id: string, change: Partial<Leader>): World {
  return { ...world, leaders: world.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) };
}

const learn = (world: World, skill: string) => applyWorldAction(world, { type: "learn", leaderId: "leader0", skill }).world;

describe("leader tree", () => {
  test("experience buys points; a skill needs a point, its prerequisites, and room below its highest rank", () => {
    let world = fresh();
    expect(learnSkillProblem(world, "leader0", "health")).toBe("no points to spend");
    world = withLeader(world, "leader0", { experience: 3 * LEADER_XP_PER_POINT });
    expect(unspentPoints(leaderById(world, "leader0"))).toBe(3);
    expect(learnSkillProblem(world, "leader0", "healing")).toMatch(/needs Health/);
    world = learn(world, "health");
    expect(learnSkillProblem(world, "leader0", "health")).toBe("already at its highest rank");
    world = learn(world, "healing");
    expect(unspentPoints(leaderById(world, "leader0"))).toBe(1);
    expect(learnSkillProblem(world, "leader1", "health")).toBe("not your leader");
  });

  test("Leadership grows the warband up to the whole grid", () => {
    let world = withLeader(fresh(), "leader0", { experience: 10 * LEADER_XP_PER_POINT });
    for (let i = 0; i < MAX_LEADERSHIP - STARTING_LEADERSHIP; i++) world = learn(world, "leadership");
    expect(leadershipOf(leaderById(world, "leader0"))).toBe(MAX_LEADERSHIP);
    expect(learnSkillProblem(world, "leader0", "leadership")).toBe("already at its highest rank");
  });

  test("movement learned mid-turn can be walked at once", () => {
    const world = withLeader(fresh(), "leader0", { experience: LEADER_XP_PER_POINT });
    const before = leaderById(world, "leader0").movement;
    expect(leaderById(learn(world, "movement"), "leader0").movement).toBe(before + 1);
  });

  test("extra health is the leader's alone, on the map and in battle, and shows in its track record", () => {
    const world = learn(withLeader(fresh(), "leader0", { experience: LEADER_XP_PER_POINT }), "health");
    const leader = leaderById(world, "leader0");
    const [first, second] = leader.squad;
    if (!first || !second) throw new Error("squad too small");
    expect(maxHpOf(first, leader)).toBe(99);
    expect(maxHpOf(second, leader)).toBe(90);
    expect(recordOf(first, leader)).toEqual([{ effect: { def: "extra_health", amount: 10 }, source: { kind: "leaderTree", skill: "health" } }]);
    expect(recordOf(second, leader)).toEqual([]);

    const healed = withLeader(world, "leader0", { squad: leader.squad.map((m) => ({ ...m, hp: 99 })) });
    const battle = engagementBattle(healed, leaderById(healed, "leader0"), { kind: "leader", leaderId: "leader1" });
    expect(battle.units["0.0.0"]?.hp).toBe(99);
    expect(battle.units["0.0.1"]?.hp).toBe(90);
  });

  test("the aura adds damage to the leader's side, not the enemy's", () => {
    const skills = Object.fromEntries(Object.entries(LEADER_SKILLS).map(([id]) => [id, 1]));
    const world = withLeader(fresh(), "leader0", { skills, experience: 100 * LEADER_XP_PER_POINT });
    const plain = fresh();
    const withAura = engagementBattle(world, leaderById(world, "leader0"), { kind: "leader", leaderId: "leader1" });
    const without = engagementBattle(plain, leaderById(plain, "leader0"), { kind: "leader", leaderId: "leader1" });
    const damage = (battle: typeof withAura, id: string) => effectiveStats(battle, id).damage;
    expect(damage(withAura, "0.0.1")).toBe(damage(without, "0.0.1") + 1);
    expect(damage(withAura, "1.0.1")).toBe(damage(without, "1.0.1"));
  });

  test("squad healing mends the whole warband at the start of its turn, wherever it stands", () => {
    const away = fresh().cities.find((c) => c.kind === "city")?.hex;
    if (!away) throw new Error("no neutral city");
    let world = withLeader(fresh(), "leader0", { skills: { health: 1, healing: 1 }, hex: away });
    world = withLeader(world, "leader0", { squad: leaderById(world, "leader0").squad.map((m) => ({ ...m, hp: 50 })) });
    world = applyWorldAction(applyWorldAction(world, { type: "endTurn" }).world, { type: "endTurn" }).world;
    expect(leaderById(world, "leader0").squad.map((m) => m.hp)).toEqual([60, 59, 59]);
  });
});
