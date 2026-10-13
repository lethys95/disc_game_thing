import type { Placement } from "#rules/battle/engine";
import { describeCarried } from "#rules/items";
import type { BattleEvent } from "#rules/battle/types";
import { COLS } from "#rules/battle/grid";
import { hexKey, neighbors, sameHex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { income, reviveCost } from "#rules/world/economy";
import { useItemProblem, wardTargets } from "#rules/world/items";
import { reachable, warbandStepCost } from "#rules/world/movement";
import { equipProblem, leadershipOf, unequipProblem } from "#rules/world/leaders";
import { placementOf } from "#rules/world/record";
import { leaderById, playerOf } from "#rules/world/state";
import type { World } from "#rules/world/state";
import { autoplay } from "#rules/ai";
import { sightOf, updateVision } from "#rules/world/vision";
import { act, anchorKey, beside, p, start, twoPlayers, unit, until, withGold, withLeader } from "#tests/helpers";
import { legalActions } from "#rules/battle/engine";
import { describe, expect, test } from "vitest";

/** Items (pillars.md; the user's 2024 slots). Everything but the Ankh is a placeholder. */

const congregants: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const fresh = (): World => createWorld(1, twoPlayers([congregants, congregants], [{}, {}], ["jilliath", "jilliath"]));


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
    const generated = fresh();
    const cathedral = generated.cities.find((c) => c.kind === "city");
    if (!cathedral) throw new Error("no neutral city");
    const world = { ...generated, nodes: generated.nodes.map((n) => (n.cityId === cathedral.id ? { ...n, kind: n === generated.nodes.find((m) => m.cityId === cathedral.id) ? ("cathedral" as const) : ("gold" as const) } : n)) };
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
    w = { ...w, players: w.players.map((pl, i) => (i === 0 ? { ...pl, mana: 100, spells: ["lightning_strike"] } : pl)) };
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

/** The user's picks from Claude's brainstorm (2026-09-29, `design/items.md`, "Taken"). */
describe("the taken items", () => {
  const wearing = (worn: string[]) => {
    const leader = { ...leaderById(fresh(), "leader0"), worn };
    return { leader, placements: leader.squad.map((m) => placementOf(m, leader)) };
  };

  test("Burial wrappings: the first killing blow leaves the leader at 1 HP, once", () => {
    const { placements } = wearing(["burial_wrappings"]);
    const battle = until(start([{ ...placements[0]!, hp: 10 }], [p("zealot", 0, 0)]), "1.0.0");
    const after = act(battle, "attack", "0.0.0").battle;
    expect(unit(after, "0.0.0").hp).toBe(1);
    expect(unit(after, "0.0.0").effects.map((e) => e.def)).not.toContain("death_ward");
  });

  test("a Seedpod reliquary heals every unit of the warband a little at the start of its turns", () => {
    const { placements } = wearing(["seedpod_reliquary"]);
    const other = placements[1]!;
    const battle = until(start([{ ...other, hp: 30 }], [p("congregant", 2, 2)]), unitAt(other));
    expect(unit(battle, unitAt(other)).hp).toBe(34);
  });

  test("a Storm capacitor gives the leader one use of shield for every ally", () => {
    const { placements } = wearing(["storm_capacitor"]);
    const battle = until(start(placements, [p("congregant", 2, 2)]), "0.0.0");
    const after = act(battle, "storm_capacitor").battle;
    for (const pl of placements) expect(unit(after, unitAt(pl)).shield).toBe(20);
    expect(legalActions(until(after, "0.0.0")).map((a) => a.abilityId)).not.toContain("storm_capacitor");
  });

  test("a Banner of the vanguard puts its leader first in the first round, whatever the initiative", () => {
    const { placements } = wearing(["banner_of_the_vanguard"]);
    const battle = start([placements[0]!], [p("justiciar", 2, 2)]);
    expect(battle.current?.unitId).toBe("0.0.0");
  });

  test("a Crown of the pretender: +1 Leadership, nobody retreats, the leader never defends; it stays on a full warband", () => {
    const { leader, placements } = wearing(["crown_of_the_pretender"]);
    expect(leadershipOf(leader)).toBe(leadershipOf({ ...leader, worn: [] }) + 1);
    const battle = start(placements, [p("congregant", 2, 2)]);
    const leaderTurn = legalActions(until(battle, "0.0.0")).map((a) => a.abilityId);
    expect(leaderTurn).not.toContain("defend");
    expect(leaderTurn).not.toContain("retreat");
    const other = legalActions(until(battle, unitAt(placements[1]!))).map((a) => a.abilityId);
    expect(other).toContain("defend");
    expect(other).not.toContain("retreat");
    const full = { ...leader, squad: Array.from({ length: leadershipOf(leader) }, (_, i) => ({ ...leader.squad[0]!, tile: { row: (i % 3) as 0 | 1 | 2, col: (Math.floor(i / 3) % 3) as 0 | 1 | 2 } })) };
    expect(unequipProblem(full, "crown_of_the_pretender")).toMatch(/too big/);
    expect(unequipProblem(leader, "crown_of_the_pretender")).toBeNull();
  });

  test("Penitent's chains: the leader takes half of a hit aimed at an ally beside it, through its own armor", () => {
    const { placements } = wearing(["penitents_chains"]);
    const [leader, beside] = [placements[0]!, placements[1]!];
    const battle = until(start([leader, beside], [p("congregant", 0, 1)]), "1.0.1");
    const before = (id: string) => unit(battle, id).hp;
    const after = act(battle, "attack", unitAt(beside)).battle;
    // A lone Congregant hits for 20: 10 goes to the leader, whose 10 armor takes a share of it; the ally takes 10.
    expect(before(unitAt(beside)) - unit(after, unitAt(beside)).hp).toBe(10);
    expect(before(unitAt(leader)) - unit(after, unitAt(leader)).hp).toBe(9);
  });

  test("Twin knives: the attack strikes its target twice at 60%", () => {
    const { placements } = wearing(["twin_knives"]);
    const battle = until(start([placements[0]!], [p("brigand", 0, 0)]), "0.0.0");
    const { battle: after, events } = act(battle, "attack", "1.0.0");
    expect(events.filter((e) => e.type === "damage" && e.unitId === "1.0.0").map((e) => (e.type === "damage" ? e.amount : 0))).toEqual([12, 12]);
    expect(unit(after, "1.0.0").hp).toBe(unit(battle, "1.0.0").hp - 24);
  });

  test("a Reaching spear reaches the line behind the enemy's front one, at half damage", () => {
    const { placements } = wearing(["reaching_spear"]);
    const battle = until(start([placements[0]!], [p("brigand", 0, 0), p("bandit", 1, 0)]), "0.0.0");
    const reachable = legalActions(battle).find((a) => a.abilityId === "attack")?.choices.map(anchorKey);
    expect(reachable).toEqual(expect.arrayContaining(["1.0.0", "1.1.0"]));
    const after = act(battle, "attack", "1.1.0").battle;
    expect(unit(battle, "1.1.0").hp - unit(after, "1.1.0").hp).toBe(10);
  });

  test("an Hourglass of borrowed time: another action now, and the first turn next round lost", () => {
    const { placements } = wearing(["hourglass_of_borrowed_time"]);
    let battle = until(start([placements[0]!], [p("custodian", 0, 0)]), "0.0.0");
    battle = act(battle, "hourglass").battle;
    battle = act(battle, "attack", "1.0.0").battle;
    expect(battle.current?.unitId).toBe("0.0.0");
    battle = act(battle, "attack", "1.0.0").battle;
    expect(battle.current?.unitId).not.toBe("0.0.0");
    const seen: BattleEvent[] = [];
    while (battle.round < 2 || !seen.some((e) => e.type === "roundStart")) {
      const step = act(battle, "defend");
      battle = step.battle;
      seen.push(...step.events);
    }
    const roundTwo = seen.slice(seen.findIndex((e) => e.type === "roundStart"));
    expect(roundTwo).toContainEqual({ type: "skipped", unitId: "0.0.0", reason: "lostTurn" });
  });

  test("a Gold item adds to its player's income while its leader stands", () => {
    const w = fresh();
    const base = income(w, 0);
    expect(income(withLeader(w, "leader0", { worn: ["gold_item"] }), 0)).toBe(base + 25);
    expect(income(withLeader(w, "leader0", { worn: ["gold_item"], fellOnTurn: w.turn }), 0)).toBe(base);
  });

  test("a Wayfinder's map: forest and hills cost its warband what plains cost", () => {
    const w = fresh();
    const rough = Object.values(w.map.tiles).find((t) => t.terrain === "forest" || t.terrain === "hills");
    if (!rough) throw new Error("no forest or hills");
    expect(warbandStepCost(w, leaderById(w, "leader0"), rough.hex)).toBe(2);
    expect(warbandStepCost(w, { ...leaderById(w, "leader0"), worn: ["wayfinders_map"] }, rough.hex)).toBe(1);
  });

  test("a Spyglass helm: the warband sees farther, and its leader gains XP for the land its march first reveals", () => {
    const w = fresh();
    expect(sightOf(withLeader(w, "leader0", { worn: ["spyglass_helm"] }), 0).size).toBeGreaterThan(sightOf(w, 0).size);
    const scouting = withLeader(w, "leader0", { worn: ["spyglass_helm"] });
    const leader = leaderById(scouting, "leader0");
    const far = [...reachable(scouting, leader.id).entries()].sort((a, b) => b[1] - a[1])[0];
    if (!far) throw new Error("nowhere to go");
    const to = scouting.map.tiles[far[0]]!.hex;
    const { world: after, events } = applyWorldAction(scouting, { type: "move", leaderId: leader.id, to });
    const scouted = events.find((e) => e.type === "scouted");
    expect(scouted).toBeDefined();
    expect(leaderById(after, leader.id).experience).toBe(scouted?.type === "scouted" ? scouted.xp : -1);
  });

  test("Salt of the old kings: a hex beside the warband nobody may enter for three turns", () => {
    let w = withLeader(fresh(), "leader0", { bag: ["salt_of_the_old_kings"] });
    const leader = leaderById(w, "leader0");
    expect(useItemProblem(w, leader.id, "salt_of_the_old_kings")).toMatch(/pick a hex/);
    const at = wardTargets(w, leader.id)[0];
    if (!at) throw new Error("no open hex");
    w = applyWorldAction(w, { type: "useItem", leaderId: leader.id, item: "salt_of_the_old_kings", at }).world;
    expect(leaderById(w, leader.id).bag).toEqual([]);
    expect(warbandStepCost(w, leaderById(w, leader.id), at)).toBeNull();
    expect(reachable(w, leader.id).has(hexKey(at))).toBe(false);
    const placed = w.turn;
    while (w.turn < placed + 3) w = applyWorldAction(w, { type: "endTurn" }).world;
    expect(w.wards).toEqual([]);
  });

  test("a Grudgebearer counts the enemy leaders its leader slays, and hits harder for each, for good", () => {
    const lone: Placement[] = [{ defId: "templar", tile: { row: 0, col: 1 } }];
    let w = createWorld(1, twoPlayers([lone, [{ defId: "congregant", tile: { row: 0, col: 1 } }]], [{}, {}], ["jilliath", "jilliath"]));
    const target = leaderById(w, "leader1").hex;
    w = withLeader(withLeader(w, "leader0", { hex: beside(w, target), worn: ["grudgebearer", "veterans_standard"] }), "leader1", {});
    const step = applyWorldAction(w, { type: "move", leaderId: "leader0", to: target }).world;
    const battle = step.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const fought = autoplay(battle);
    expect(fought.units["1.0.1"]?.killedBy).toBe("0.0.1");
    const worn = leaderById(concludeBattle(step, fought).world, "leader0").worn;
    expect(worn).toEqual(["grudgebearer:1", "veterans_standard:1"]);
    const veteran = { ...leaderById(w, "leader0"), worn: ["grudgebearer:2"] };
    expect(placementOf(veteran.squad[0]!, veteran).effects).toContainEqual({ def: "grudge", amount: 3, stacks: 2 });
    expect(describeCarried("grudgebearer:2", 100)).toContain("2 so far, +6");
  });

  test("a Veteran's standard's count stops counting toward damage at its cap", () => {
    const leader = { ...leaderById(fresh(), "leader0"), worn: ["veterans_standard:35"] };
    expect(placementOf(leader.squad[1]!, leader).effects).toContainEqual({ def: "battle_worn", amount: 1, stacks: 20 });
  });

  test("a Hollow plate stands in a free tile in every battle, whole each time, and never joins the squad", () => {
    const pair: Placement[] = [{ defId: "templar", tile: { row: 0, col: 1 } }];
    let w = createWorld(1, twoPlayers([pair, [{ defId: "congregant", tile: { row: 0, col: 1 } }]], [{}, {}], ["jilliath", "jilliath"]));
    const target = leaderById(w, "leader1").hex;
    w = withLeader(w, "leader0", { hex: beside(w, target), worn: ["hollow_plate"] });
    const step = applyWorldAction(w, { type: "move", leaderId: "leader0", to: target }).world;
    const battle = step.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const plate = Object.values(battle.units).find((u) => u.defId === "hollow_plate");
    expect(plate?.side).toBe(0);
    expect(plate?.tile).toEqual({ row: 0, col: 0 });
    const after = leaderById(concludeBattle(step, autoplay(battle)).world, "leader0");
    expect(after.squad.map((m) => m.defId)).toEqual(["templar"]);
    expect(after.worn).toEqual(["hollow_plate"]);
  });
});

const unitAt = (pl: Placement) => `0.${pl.tile.row}.${pl.tile.col}`;

