import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { neighbors, sameHex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { reviveCost } from "#rules/world/economy";
import { equipProblem } from "#rules/world/leaders";
import { placementOf } from "#rules/world/record";
import { leaderById, playerOf } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { autoplay } from "#rules/ai";
import { updateVision } from "#rules/world/vision";
import { act, p, start, twoPlayers, unit, until, withGold } from "#tests/helpers";
import { legalActions } from "#rules/battle/engine";
import { describe, expect, test } from "vitest";

/** Items (pillars.md; the user's 2024 slots). Everything but the Ankh is a placeholder. */

const congregants: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const fresh = (): World => createWorld(1, twoPlayers([congregants, congregants], [{}, {}], ["jilliath", "jilliath"]));

function withLeader(world: World, id: string, change: Partial<Leader>): World {
  return { ...world, leaders: world.leaders.map((l) => (l.id === id ? { ...l, ...change } : l)) };
}

describe("equipment", () => {
  test("worn items reach the leader's own unit; a banner reaches the whole warband; slots fill up", () => {
    let w = withLeader(fresh(), "leader0", { bag: ["iron_helm", "war_banner", "swift_charm", "swift_charm", "swift_charm"] });
    for (const item of ["iron_helm", "war_banner", "swift_charm", "swift_charm"]) w = applyWorldAction(w, { type: "equip", leaderId: "leader0", item }).world;
    const leader = leaderById(w, "leader0");
    expect(equipProblem(leader, "swift_charm")).toBe("no free utility slot");
    const [own, other] = leader.squad.map((m) => (placementOf(m, leader).effects ?? []).map((e) => e.def));
    expect(own).toEqual(expect.arrayContaining(["extra_armor", "extra_damage", "extra_initiative"]));
    expect(other).toEqual(["extra_damage"]);
    w = applyWorldAction(w, { type: "unequip", leaderId: "leader0", item: "iron_helm" }).world;
    expect(leaderById(w, "leader0").bag).toContain("iron_helm");
  });

  test("an Ankh makes reviving its fallen leader free, and is used up", () => {
    let w = withGold(fresh(), [0, 0]);
    const leader = leaderById(w, "leader0");
    w = withLeader(w, "leader0", { bag: ["ankh"], fellOnTurn: w.turn, squad: leader.squad.map((m, i) => (i === 0 ? { ...m, hp: 0 } : m)) });
    expect(reviveCost(w, leaderById(w, "leader0"))).toBe(0);
    w = applyWorldAction(w, { type: "revive", leaderId: "leader0" }).world;
    expect(leaderById(w, "leader0").fellOnTurn).toBeNull();
    expect(leaderById(w, "leader0").bag).toEqual([]);
    expect(playerOf(w, 0).gold).toBe(0);
  });

  test("a warband wiped out by another leaves its items to the victor", () => {
    const army: Placement[] = COLS.map((col) => ({ defId: "templar", tile: { row: 0, col } }));
    let w = createWorld(1, twoPlayers([army, [{ defId: "congregant", tile: { row: 0, col: 1 } }]], [{}, {}], ["jilliath", "jilliath"]));
    const target = leaderById(w, "leader1").hex;
    const beside = neighbors(target).find((h) => stepCost(w.map, h) !== null && !w.cities.some((c) => sameHex(c.hex, h)) && !w.lairs.some((l) => sameHex(l.hex, h)));
    if (!beside) throw new Error("no free hex");
    w = withLeader(withLeader(w, "leader0", { hex: beside }), "leader1", { worn: ["iron_helm"], bag: ["ankh"] });
    const step = applyWorldAction(w, { type: "move", leaderId: "leader0", to: target }).world;
    const battle = step.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const done = concludeBattle(step, autoplay(battle));
    expect(leaderById(done.world, "leader0").bag).toEqual(["iron_helm", "ankh"]);
    expect(done.events).toContainEqual({ type: "spoils", leaderId: "leader0", items: ["iron_helm", "ankh"] });
  });
});

describe("the user's items (2026-09-27)", () => {
  test("a Hatchet lets its leader throw once per combat", () => {
    const leader = { ...leaderById(fresh(), "leader0"), worn: ["hatchet"] };
    const placement = placementOf(leader.squad[0]!, leader);
    let battle = until(start([placement], [p("congregant", 2, 2)]), "0.0.0");
    const before = unit(battle, "1.2.2").hp;
    battle = act(battle, "throw_hatchet", "1.2.2").battle;
    expect(before - unit(battle, "1.2.2").hp).toBe(30);
    battle = until(battle, "0.0.0");
    expect(legalActions(battle).map((a) => a.abilityId)).not.toContain("throw_hatchet");
  });

  test("the Outlaw's pocketwatch adds 5 to attacks, and 10 more against a shield", () => {
    const leader = { ...leaderById(fresh(), "leader0"), worn: ["outlaws_pocketwatch"] };
    const placement = placementOf(leader.squad[0]!, leader);
    const hitOn = (defId: string) => {
      const battle = until(start([{ ...placement, tile: { row: 0, col: 1 } }], [p(defId, 0, 1)]), "0.0.1");
      const target = unit(battle, "1.0.1");
      const after = unit(act(battle, "attack", "1.0.1").battle, "1.0.1");
      return target.hp + target.shield - (after.hp + after.shield);
    };
    // A Congregant hits for 20 alone (no other Congregants): +5; a Custodian still has its shield: +15.
    expect(hitOn("brigand")).toBe(20 + 5);
    expect(hitOn("custodian")).toBe(20 + 15);
  });

  test("units recruited in a Cathedral's city carry holy water", () => {
    const world = fresh();
    const cathedral = world.cities.find((c) => world.nodes.some((n) => n.kind === "cathedral" && n.cityId === c.id));
    if (!cathedral) throw new Error("no Cathedral on this map");
    let w = withGold({ ...world, cities: world.cities.map((c) => (c.id === cathedral.id ? { ...c, owner: 0, garrison: [] } : c)) }, [1000, 1000]);
    w = applyWorldAction(w, { type: "recruit", defId: "congregant", into: { kind: "garrison", cityId: cathedral.id } }).world;
    const recruit = w.cities.find((c) => c.id === cathedral.id)?.garrison[0];
    expect(recruit?.marks.map((m) => m.effect.ability?.id)).toEqual(["holy_water"]);
    const battle = until(start([{ ...placementOf(recruit!, undefined), hp: 40 }], [p("congregant", 2, 2)]), "0.0.0");
    expect(legalActions(battle).map((a) => a.abilityId)).toContain("holy_water");
  });
});

describe("deaths on the map, whoever caused them (world/fate.ts)", () => {
  test("a warband a spell wipes out leaves its items to the caster's nearest warband", () => {
    let w = createWorld(1, twoPlayers([congregants, [{ defId: "congregant", tile: { row: 0, col: 1 } }]], [{}, {}], ["nexus", "jilliath"]));
    const target = leaderById(w, "leader1").hex;
    const beside = neighbors(target).find((h) => stepCost(w.map, h) !== null && !w.cities.some((c) => sameHex(c.hex, h)) && !w.lairs.some((l) => sameHex(l.hex, h)));
    if (!beside) throw new Error("no free hex");
    w = withLeader(withLeader(w, "leader0", { hex: beside }), "leader1", { worn: ["iron_helm"], squad: [{ ...leaderById(w, "leader1").squad[0]!, hp: 5 }] });
    w = { ...w, players: w.players.map((pl, i) => (i === 0 ? { ...pl, mana: { red: 0, teal: 100 }, spells: ["lightning_strike"] } : pl)) };
    const next = structuredClone(w);
    updateVision(next);
    const step = applyWorldAction(next, { type: "castSpell", spell: "lightning_strike", at: target });
    expect(step.world.leaders.some((l) => l.id === "leader1")).toBe(false);
    expect(leaderById(step.world, "leader0").bag).toEqual(["iron_helm"]);
  });
});

describe("granted abilities", () => {
  test("a unit can carry several (a Hatchet and holy water), each with its own charge", () => {
    const leader = { ...leaderById(fresh(), "leader0"), worn: ["hatchet"] };
    const member = { ...leader.squad[0]!, marks: [{ effect: { def: "carries", ability: { id: "holy_water" } }, source: { kind: "node" as const, node: "cathedral" as const, cityId: "city4" } }] };
    const placement = { ...placementOf(member, { ...leader, squad: [member] }), hp: 40 };
    let battle = until(start([placement], [p("congregant", 2, 2)]), "0.0.0");
    const ids = () => legalActions(battle).map((a) => a.abilityId);
    expect(ids()).toEqual(expect.arrayContaining(["throw_hatchet", "holy_water"]));
    battle = act(battle, "holy_water", "0.0.0").battle;
    battle = until(battle, "0.0.0");
    expect(ids()).toContain("throw_hatchet");
    expect(ids()).not.toContain("holy_water");
  });
});
