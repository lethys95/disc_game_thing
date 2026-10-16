import { hexDistance, hexKey } from "#rules/hex";
import { exits, findPath, generateMap, stepCost } from "#rules/map";
import type { NodeKind } from "#rules/nodes";
import { applyWorldAction } from "#rules/world/actions";
import { engage } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { autoplay } from "#rules/ai";
import { ITEMS } from "#rules/items";
import type { Tile } from "#rules/battle/types";
import type { Hex } from "#rules/hex";
import { concludeBattle } from "#rules/world/battles";
import { cityUpgradeCost, investNodeProblem, raisesDeadAt, recruitCost, recruitProblem, resurrectionCost, startTurn } from "#rules/world/economy";
import { maxHpOf } from "#rules/world/record";
import { NODES } from "#rules/nodes";
import { spellById } from "#rules/spells";
import { MERCHANT_POOLS, merchantWares, resalePrice } from "#rules/structures";
import { tradePrice } from "#rules/world/structures";
import { castProblem, knownSpells, spellCost } from "#rules/world/spells";
import { capacityOf } from "#rules/world/squads";
import { movementOf } from "#rules/world/leaders";
import { changeHands, cityById, leaderById, playerOf, tribeAt, tribeRecruitsOf, tribeUnits } from "#rules/world/state";
import type { City, World } from "#rules/world/state";
import { knownWorld, sightOf, watched } from "#rules/world/vision";
import { reachable, warbandStepCost } from "#rules/world/movement";
import type { Placement } from "#rules/battle/engine";
import { COLS, ROWS } from "#rules/battle/grid";
import { act, beside, p, start, startOf, twoPlayers, unit, until, withGold, withGraveyard, withLeader } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** The user's node picks (design/nodes.md, 2026-09-28): the marks their recruits carry. Numbers provisional. */

/** What a hit took off `target` (health and shield together) when `attacker` attacks it. */
function hit(attacker: Placement, target: Placement): number {
  const battle = until(start([attacker], [target]), "0.0.1");
  const before = unit(battle, "1.0.1");
  const after = unit(act(battle, "attack", "1.0.1").battle, "1.0.1");
  return before.hp + before.shield - (after.hp + after.shield);
}

describe("recruit marks", () => {
  test("Foundry: extra shield at the start of a battle, mending at the start of its bearer's turns", () => {
    let battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "foundry", amount: 12 }])]), "0.0.1");
    expect(unit(battle, "1.0.1").shield).toBe(12);
    // The shield soaks 12 of the 20; the rest reaches health. When its turn starts, a third of the plating mends.
    battle = until(act(battle, "attack", "1.0.1").battle, "1.0.1");
    expect(unit(battle, "1.0.1").hp).toBe(90 - 8);
    expect(unit(battle, "1.0.1").shield).toBe(4);
  });

  test("Leech pits: heals a share of the damage dealt", () => {
    const battle = until(start([{ ...p("congregant", 0, 1, [{ def: "leech", amount: 20 }]), hp: 50 }], [p("brigand", 0, 1)]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "0.0.1").hp).toBe(54);
  });

  test("Tannery: the first hit to reach it is softened, the rest aren't", () => {
    const battle = until(start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "tannery", amount: 15 }])]), "0.0.1");
    const first = act(battle, "attack", "1.0.1").battle;
    expect(90 - unit(first, "1.0.1").hp).toBe(5);
    const second = act(until(first, "0.0.1"), "attack", "1.0.1").battle;
    expect(unit(first, "1.0.1").hp - unit(second, "1.0.1").hp).toBe(20);
  });

  test("Siege workshop: the first attack on a city's defenders goes through their walls; later ones don't", () => {
    const walled = p("congregant", 0, 1, [{ def: "fortified", amount: 10 }]);
    // 10 armor takes a seventh off a Congregant's 20; the siege-trained hit goes through it.
    expect(hit(p("congregant", 0, 1), walled)).toBe(17);
    expect(hit(p("congregant", 0, 1, [{ def: "siege", amount: 1 }]), walled)).toBe(20);
    let battle = until(start([p("congregant", 0, 1, [{ def: "siege", amount: 1 }])], [walled]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    const before = unit(until(battle, "0.0.1"), "1.0.1").hp;
    const after = unit(act(until(battle, "0.0.1"), "attack", "1.0.1").battle, "1.0.1").hp;
    expect(before - after).toBe(17);
    // Against a target without walls it isn't spent.
    expect(hit(p("congregant", 0, 1, [{ def: "siege", amount: 1 }]), p("congregant", 0, 1))).toBe(20);
  });

  test("Stables: a warband with a unit bred there moves one farther; several don't add up, a fallen one gives nothing", () => {
    const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
    const world = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
    const leader = leaderById(world, "leader0");
    const base = movementOf(leader);
    const bred = { effect: { def: "stables", amount: 1 }, source: { kind: "node" as const, node: "stables" as const, cityId: "city1" } };
    const marked = (count: number, hp = 90) => ({ ...leader, squad: leader.squad.map((m, i) => (i < count ? { ...m, hp, marks: [bred] } : m)) });
    expect(movementOf(marked(1))).toBe(base + 1);
    expect(movementOf(marked(3))).toBe(base + 1);
    expect(movementOf(marked(1, 0))).toBe(base);
  });
});

const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));

/** A fresh world whose first neutral city is player 0's, with one node of `kind` (at `level`). */
function holding(kind: NodeKind, level = 1): { world: World; city: City } {
  const world = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
  const city = world.cities.find((c) => c.kind === "city" && world.nodes.some((n) => n.cityId === c.id));
  if (!city) throw new Error("no city with a node");
  const node = world.nodes.find((n) => n.cityId === city.id);
  const next: World = {
    ...world,
    cities: world.cities.map((c) => (c.id === city.id ? { ...c, owner: 0, garrison: [] } : c)),
    // Its only node: the others a map deals it would mix their gifts in.
    nodes: world.nodes.flatMap((n) => (n === node ? [{ ...n, kind, level }] : n.cityId === city.id ? [] : [n])),
  };
  return { world: next, city: cityById(next, city.id) };
}

describe("city nodes", () => {
  test("Quarry: the city's upgrades cost less, and its defenders stand behind thicker walls", () => {
    const plain = holding("gold");
    const quarry = holding("quarry");
    expect(cityUpgradeCost(quarry.world, quarry.city)).toBe(Math.round(cityUpgradeCost(plain.world, plain.city) * 0.8));
    const walled = { ...quarry.world, cities: quarry.world.cities.map((c) => (c.id === quarry.city.id ? { ...c, garrison: [{ defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 90, xp: 0, marks: [], level: 0 }] } : c)) };
    const battle = engage(walled, leaderById(walled, "leader1"), { kind: "garrison", cityId: quarry.city.id }).battle;
    expect(unit(battle, "1.0.1").effects.find((e) => e.def === "fortified")?.amount).toBe(2);
  });

  test("Ossuary: the dead rise in its city without the research, at the Capitol's price", () => {
    const { world, city } = holding("ossuary");
    const fallen = withGraveyard(world, 0, [{ defId: "congregant", fellOnTurn: 1, marks: [], level: 0 }]);
    expect(raisesDeadAt(fallen, 0, city)).toBe(true);
    const capitol = fallen.cities.find((c) => c.kind === "capitol" && c.owner === 0);
    expect(resurrectionCost(fallen, 0, 0, city)).toBe(resurrectionCost(fallen, 0, 0, capitol));
    expect(raisesDeadAt(holding("gold").world, 0, holding("gold").city)).toBe(false);
  });

  test("Watchtower: its holder sees around it", () => {
    const { world } = holding("watchtower");
    const tower = world.nodes.find((n) => n.kind === "watchtower");
    if (!tower) throw new Error("no tower");
    const seen = sightOf(world, 0);
    for (const tile of Object.values(world.map.tiles)) if (hexDistance(tile.hex, tower.hex) <= 3) expect(seen.has(hexKey(tile.hex))).toBe(true);
  });

  test("Bell tower: an enemy ending a march near the city rings its bells; its defenders act first in the first round", () => {
    const { world, city } = holding("bell_tower");
    // Somewhere two hexes from the city, walkable, that player 1's warband can reach from three hexes out.
    const near = Object.values(world.map.tiles).find((t) => hexDistance(t.hex, city.hex) === 2 && stepCost(world.map, t.hex) !== null);
    const far = Object.values(world.map.tiles).find((t) => near && hexDistance(t.hex, city.hex) === 3 && hexDistance(t.hex, near.hex) === 1 && stepCost(world.map, t.hex) !== null);
    if (!near || !far) throw new Error("no spots");
    const set = { ...withLeader(world, "leader1", { hex: far.hex, movement: 10 }), activePlayer: 1 as const };
    const step = applyWorldAction(set, { type: "move", leaderId: "leader1", to: near.hex });
    expect(step.events).toContainEqual({ type: "alarm", cityId: city.id, leaderId: "leader1", player: 0 });

    // Slower defenders still act first in round one, then initiative decides again.
    const battle = start([p("congregant", 0, 1)], [p("congregant", 0, 1, [{ def: "forewarned" }, { def: "extra_initiative", amount: -20 }])]);
    expect(battle.current?.unitId).toBe("1.0.1");
    let later = battle;
    while (later.round === 1 && later.outcome === null) later = act(later, "defend").battle;
    expect(later.current?.unitId).toBe("0.0.1");
  });
});

describe("Tribal outpost", () => {
  test("its city recruits its land's tribe, more kinds with each level; they take no garrison slot", () => {
    const { world, city } = holding("tribal_outpost", 1);
    const rich = withGold(world, [1000, 1000]);
    const garrison = { kind: "garrison" as const, cityId: city.id };
    const [first, second, third] = tribeUnits(tribeAt(world.map, city.hex));
    if (!first || !second || !third) throw new Error("a tribe of fewer than three kinds");
    expect(tribeRecruitsOf(rich, city)).toEqual([first, second]);
    expect(recruitProblem(rich, first, garrison)).toBeNull();
    expect(recruitProblem(rich, third, garrison)).toMatch(/Tribal outpost/);
    expect(recruitProblem(withGold(holding("tribal_outpost", 2).world, [1000, 1000]), third, garrison)).toBeNull();
    expect(recruitProblem(withGold(holding("gold").world, [1000, 1000]), first, garrison)).toMatch(/Tribal outpost/);

    const slots = capacityOf(rich, garrison);
    const after = applyWorldAction(rich, { type: "recruit", defId: first, into: garrison }).world;
    expect(cityById(after, city.id).garrison.map((m) => m.defId)).toEqual([first]);
    expect(capacityOf(after, garrison)).toBe(slots + 1);
    expect(after.players[0]?.gold).toBe(1000 - (recruitCost(rich, first, city) ?? 0));

    // Slots aside, a full grid takes no one more.
    const tiles = ROWS.flatMap((row) => COLS.map((col) => ({ row, col })));
    const packed = { ...rich, cities: rich.cities.map((c) => (c.id === city.id ? { ...c, garrison: tiles.map((tile) => ({ defId: first, tile, hp: 60, xp: 0, marks: [], level: 0 })) } : c)) };
    expect(recruitProblem(packed, first, garrison)).toBe("garrison full");
  });

  test("an outpost in another biome recruits that biome's tribe", () => {
    const { world, city } = holding("tribal_outpost", 3);
    for (const biome of ["desert", "haunted"] as const) {
      const moved = { ...world, map: { ...world.map, tiles: { ...world.map.tiles, [hexKey(city.hex)]: { hex: city.hex, terrain: "plain" as const, biome } } } };
      const tribe = tribeAt(moved.map, city.hex);
      expect(["gnolls", "carnival", "herd", "drawn"]).toContain(tribe);
      expect(tribeRecruitsOf(moved, city)).toEqual(tribeUnits(tribe).slice(0, 4));
    }
  });
});

describe("portals", () => {
  test("every map has one; a path takes it when that's shorter; fog hides it until both ends are seen", () => {
    for (const seed of [1, 2, 3]) {
      const map = generateMap(seed, 2);
      expect(map.portals.length).toBeGreaterThan(0);
      for (const portal of map.portals) expect(hexDistance(portal.a, portal.b)).toBeGreaterThanOrEqual(4);
    }
    const map = generateMap(1, 2);
    const portal = map.portals[0];
    if (!portal) throw new Error("no portal");
    expect(exits(map, portal.a)).toContainEqual(portal.b);
    const path = findPath(map, portal.a, portal.b, () => false);
    expect(path?.hexes).toEqual([portal.b]);

    const world = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
    const onPortal = withLeader(world, "leader0", { hex: world.map.portals[0]?.a ?? portal.a, movement: 10 });
    const known = knownWorld(onPortal, 0);
    const far = world.map.portals[0]?.b ?? portal.b;
    const seenBoth = known.map.portals.length > 0;
    expect(seenBoth).toBe(onPortal.players[0]?.explored.includes(hexKey(far)) ?? false);
    const revealed = { ...onPortal, players: onPortal.players.map((pl, i) => (i === 0 ? { ...pl, explored: Object.keys(onPortal.map.tiles) } : pl)) };
    expect(reachable(revealed, "leader0").has(hexKey(far))).toBe(true);
    // Standing on a portal, a warband sees its other end: a march never steps into what it can't see.
    expect(sightOf(onPortal, 0).has(hexKey(far))).toBe(true);
  });
});

/** The second review's nodes (user, 2026-10-15, design/nodes.md). Numbers provisional (#84). */
describe("recruit marks, second review", () => {
  test("Venom distillery: the first hit in a battle envenoms; the mark is spent", () => {
    const battle = until(start([p("congregant", 0, 1, [{ def: "distilled_venom", amount: 4 }])], [p("congregant", 0, 1)]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "1.0.1").effects.find((e) => e.def === "envenomed")?.amount).toBe(4);
    expect(unit(after, "0.0.1").effects.some((e) => e.def === "distilled_venom")).toBe(false);
  });

  test("Witch hut: whoever kills a hexed unit is Punished", () => {
    const battle = until(start([p("congregant", 0, 1)], [{ ...p("congregant", 0, 1, [{ def: "hexed", stacks: 2 }]), hp: 5 }]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "1.0.1").alive).toBe(false);
    expect(unit(after, "0.0.1").effects.find((e) => e.def === "punished")?.stacks).toBe(2);
  });

  test("Hunting lodge: more damage to neutral units, the same to others", () => {
    expect(hit(p("congregant", 0, 1, [{ def: "hunter", amount: 20 }]), p("brigand", 0, 1))).toBeGreaterThan(hit(p("congregant", 0, 1), p("brigand", 0, 1)));
    expect(hit(p("congregant", 0, 1, [{ def: "hunter", amount: 20 }]), p("congregant", 0, 1))).toBe(hit(p("congregant", 0, 1), p("congregant", 0, 1)));
  });
});

describe("city nodes, second review", () => {
  const garrisonOf = (city: City) => ({ kind: "garrison" as const, cityId: city.id });

  test("Training yard: recruits arrive a level up, at full health", () => {
    const { world, city } = holding("training_yard");
    const after = applyWorldAction(withGold(world, [1000, 1000]), { type: "recruit", defId: "congregant", into: garrisonOf(city) }).world;
    const [recruit] = cityById(after, city.id).garrison;
    expect(recruit?.level).toBe(1);
    expect(recruit && recruit.hp).toBe(recruit && maxHpOf(recruit, undefined));
  });

  test("Bog iron: the city's recruits cost less", () => {
    const { world, city } = holding("bog_iron");
    const full = recruitCost(world, "congregant", undefined) ?? 0;
    expect(recruitCost(world, "congregant", city)).toBe(Math.round(full * 0.9));
    const after = applyWorldAction(withGold(world, [1000, 1000]), { type: "recruit", defId: "congregant", into: garrisonOf(city) }).world;
    expect(after.players[0]?.gold).toBe(1000 - Math.round(full * 0.9));
  });

  test("Caravanserai: its holder buys and hires cheaper, and nothing sells back for more than it cost", () => {
    const { world } = holding("caravanserai", 3);
    expect(tradePrice(world, 0, 100)).toBe(75);
    expect(tradePrice(world, 1, 100)).toBe(100);
    for (const item of ITEMS) expect(resalePrice(item.price)).toBeLessThanOrEqual(tradePrice(world, 0, item.price));
  });

  test("Granary: the garrison heals twice as fast; upgrades cost less", () => {
    const healed = (kind: NodeKind) => {
      const { world, city } = holding(kind);
      const wounded = { defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 1, xp: 0, marks: [], level: 0 };
      const next = structuredClone({ ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: [wounded] } : c)) });
      startTurn(next, []);
      return (cityById(next, city.id).garrison[0]?.hp ?? 0) - 1;
    };
    // Twice the share, rounded up as healing is.
    expect(healed("gold")).toBeGreaterThan(0);
    expect(healed("granary")).toBeGreaterThanOrEqual(2 * healed("gold") - 1);
    const plain = holding("gold");
    const granary = holding("granary");
    expect(cityUpgradeCost(granary.world, granary.city)).toBe(Math.round(cityUpgradeCost(plain.world, plain.city) * 0.9));
  });

  test("Oasis: its recruits heal twice as fast anywhere, and so does anyone resting in the city", () => {
    const { world, city } = holding("oasis");
    const recruited = applyWorldAction(withGold(world, [1000, 1000]), { type: "recruit", defId: "congregant", into: garrisonOf(city) }).world;
    expect(cityById(recruited, city.id).garrison[0]?.marks.map((m) => m.effect.def)).toContain("oasis_born");

    const restingIn = (kind: NodeKind) => {
      const held = holding(kind);
      const leader = leaderById(held.world, "leader0");
      const next = structuredClone(withLeader(held.world, "leader0", { hex: held.city.hex, squad: leader.squad.map((m) => ({ ...m, hp: 1 })) }));
      startTurn(next, []);
      return (leaderById(next, "leader0").squad[0]?.hp ?? 0) - 1;
    };
    expect(restingIn("gold")).toBeGreaterThan(0);
    expect(restingIn("oasis")).toBeGreaterThanOrEqual(2 * restingIn("gold") - 1);
  });

  test("Waystation: a warband starting its turn next to it heals; farther off it doesn't", () => {
    const { world } = holding("waystation");
    const station = world.nodes.find((n) => n.kind === "waystation");
    if (!station) throw new Error("no waystation");
    const at = (hex: Hex) => {
      const leader = leaderById(world, "leader0");
      const next = structuredClone(withLeader(world, "leader0", { hex, squad: leader.squad.map((m) => ({ ...m, hp: 1 })) }));
      startTurn(next, []);
      return (leaderById(next, "leader0").squad[0]?.hp ?? 0) - 1;
    };
    expect(at(beside(world, station.hex))).toBe(Math.ceil(90 * 0.25));
    const away = Object.values(world.map.tiles).find((t) => hexDistance(t.hex, station.hex) >= 3 && world.cities.every((c) => hexDistance(c.hex, t.hex) > 0));
    if (!away) throw new Error("nowhere away");
    expect(at(away.hex)).toBe(0);
  });

  test("Gallows: attackers who die at the city never reach their graveyard", () => {
    const graveAfterStorming = (kind: NodeKind) => {
      const { world, city } = holding(kind);
      const guards = COLS.flatMap((col) => [0, 1].map((row) => ({ defId: "punisher", tile: { row, col } as Tile, hp: 200, xp: 0, marks: [], level: 0 })));
      const walled = withLeader({ ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: guards } : c)) }, "leader1", { hex: beside(world, city.hex) });
      const next = applyWorldAction({ ...walled, activePlayer: 1 }, { type: "move", leaderId: "leader1", to: city.hex }).world;
      const battle = next.engagement?.battle;
      if (!battle) throw new Error("no battle");
      return playerOf(concludeBattle(next, autoplay(battle)).world, 1).graveyard.length;
    };
    expect(graveAfterStorming("gold")).toBeGreaterThan(0);
    expect(graveAfterStorming("gallows")).toBe(0);
  });

  test("Dog yard: a warband starting its turn near the city crosses forest and hills at plain cost", () => {
    const { world, city } = holding("dog_yard");
    const rough = Object.values(world.map.tiles).find((t) => t.terrain === "forest" || t.terrain === "hills");
    if (!rough) throw new Error("no rough ground");
    const near = structuredClone(withLeader(world, "leader0", { hex: city.hex }));
    startTurn(near, []);
    expect(warbandStepCost(near, leaderById(near, "leader0"), rough.hex)).toBe(1);
    const far = structuredClone(withLeader(world, "leader0", { hex: startOf(world, 0) }));
    startTurn(far, []);
    expect(warbandStepCost(far, leaderById(far, "leader0"), rough.hex)).toBe(2);
  });
});

describe("Waystone (the user's own)", () => {
  test("any held city elevates a leader; with a Waystone, Way portal brings that warband back to it, until the city is taken", () => {
    const { world, city } = holding("waystone");
    const recruit = { defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 90, xp: 0, marks: [], level: 0 };
    let next: World = { ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: [recruit] } : c)) };
    next = withLeader(next, "leader0", { hex: startOf(world, 0) });
    expect(knownSpells(next, 0)).toContain("way_portal");
    expect(knownSpells(next, 1)).not.toContain("way_portal");

    next = applyWorldAction(next, { type: "elevate", cityId: city.id, tile: recruit.tile }).world;
    const raised = next.leaders.find((l) => l.elevatedIn === city.id);
    if (!raised) throw new Error("no leader elevated");
    expect(raised.hex).toEqual(city.hex);

    // Out in the field, the portal brings it home; in the city already, there's nothing to cast.
    const away = { ...withLeader(next, raised.id, { hex: beside(next, city.hex) }), players: next.players.map((pl) => ({ ...pl, mana: 100 })) };
    expect(castProblem({ ...away, leaders: next.leaders }, "way_portal", city.hex)).toBe("not a valid target");
    const step = applyWorldAction(away, { type: "castSpell", spell: "way_portal", at: beside(next, city.hex) });
    expect(leaderById(step.world, raised.id).hex).toEqual(city.hex);
    expect(step.events).toContainEqual({ type: "recalled", leaderId: raised.id, cityId: city.id });

    // A warband that wasn't elevated there can't use it.
    expect(castProblem(withLeader(away, "leader0", { hex: beside(next, city.hex) }), "way_portal", leaderById(away, "leader0").hex)).toBe("not a valid target");

    // Taken: no one counts as elevated there any more.
    const taken = structuredClone(away);
    changeHands(taken, cityById(taken, city.id), 1);
    expect(leaderById(taken, raised.id).elevatedIn).toBeNull();
    expect(knownSpells(taken, 0)).not.toContain("way_portal");
  });
});

/** The third review's clauses (user, 2026-10-16, design/nodes.md "Third review"). Numbers provisional (#86). */
describe("node levels and clauses", () => {
  test("every level of every node says something new; investing stops at the node's own last level", () => {
    for (const def of Object.values(NODES)) for (let level = 1; level < def.maxLevel; level++) expect(def.describe(level + 1)).not.toBe(def.describe(level));
    const { world } = holding("waystone", 2);
    const stone = world.nodes.find((n) => n.kind === "waystone");
    if (!stone) throw new Error("no waystone");
    expect(investNodeProblem(withGold(world, [1000, 1000]), stone.id)).toMatch(/highest level/);
  });

  test("Cathedral: Holy Water heals more each level and cleanses at the last", () => {
    const water = (level: number) => NODES.cathedral.recruitEffects(level, "congregant")[0]?.ability;
    expect(water(2)?.params?.["amount"]).toBeGreaterThan(water(1)?.params?.["amount"] ?? Infinity);
    const ability = water(3);
    if (!ability) throw new Error("no holy water");
    const hurt = { ...p("congregant", 0, 0, [{ def: "punished", stacks: 2 }, { def: "bleeding", amount: 5 }, { def: "mutated", amount: 5 }]), hp: 50 };
    let battle = until(start([p("congregant", 0, 1, [{ def: "carries", ability }]), hurt], [p("congregant", 0, 1)]), "0.0.1");
    battle = act(battle, "holy_water", "0.0.0").battle;
    expect(unit(battle, "0.0.0").effects.map((e) => e.def)).toEqual(["mutated"]);
  });

  test("Blacksmith's clause pierces armor; Leech pits' feeds on a kill", () => {
    const armored = p("congregant", 0, 1, [{ def: "extra_armor", amount: 20 }]);
    expect(hit(p("congregant", 0, 1, [{ def: "armor_piercing", amount: 5 }]), armored)).toBeGreaterThan(hit(p("congregant", 0, 1), armored));
    const battle = until(start([{ ...p("congregant", 0, 1, [{ def: "leech_feast" }]), hp: 40 }], [{ ...p("congregant", 0, 1), hp: 10 }]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "0.0.1").hp).toBe(50);
  });

  test("Foundry's clause: half of a heal past full health goes into the shield, never past its most", () => {
    const shieldAfterHeal = (effects: { def: string; amount?: number }[]) => {
      const water = { def: "carries", ability: { id: "holy_water", params: { amount: 30 } } };
      let battle = until(start([p("congregant", 0, 1, effects), p("congregant", 1, 1, [water])], [p("congregant", 0, 1)]), "1.0.1");
      battle = until(act(battle, "attack", "0.0.1").battle, "0.1.1");
      battle = act(battle, "holy_water", "0.0.1").battle;
      return unit(battle, "0.0.1").shield;
    };
    expect(shieldAfterHeal([{ def: "foundry", amount: 12 }])).toBeLessThanOrEqual(4);
    expect(shieldAfterHeal([{ def: "foundry", amount: 12 }, { def: "overflow_plating", amount: 50 }])).toBeGreaterThanOrEqual(11);
    expect(shieldAfterHeal([{ def: "foundry", amount: 12 }, { def: "overflow_plating", amount: 50 }])).toBeLessThanOrEqual(12);
  });

  test("Venom distillery's clause: every later hit on an envenomed target adds a dose; without it, the first hit only", () => {
    const venom = (stacks: number) => {
      let battle = until(start([p("congregant", 0, 1, [{ def: "distilled_venom", amount: 4, stacks }])], [p("templar", 0, 1)]), "0.0.1");
      battle = act(battle, "attack", "1.0.1").battle;
      battle = act(until(battle, "0.0.1"), "attack", "1.0.1").battle;
      return unit(battle, "1.0.1").effects.find((e) => e.def === "envenomed")?.amount;
    };
    expect(venom(1)).toBe(4);
    expect(venom(2)).toBe(8);
  });

  test("Witch hut's clause: the curse passes on to the killer", () => {
    const battle = until(start([p("congregant", 0, 1)], [{ ...p("congregant", 0, 1, [{ def: "hexed", stacks: 2, amount: 1 }]), hp: 5 }]), "0.0.1");
    const after = act(battle, "attack", "1.0.1").battle;
    expect(unit(after, "0.0.1").effects.map((e) => e.def)).toEqual(expect.arrayContaining(["punished", "hexed"]));
  });

  test("Siege workshop: more attacks go through the walls with each level", () => {
    const walled = p("congregant", 0, 1, [{ def: "fortified", amount: 10 }]);
    let battle = until(start([p("congregant", 0, 1, [{ def: "siege", amount: 2 }])], [walled]), "0.0.1");
    battle = act(battle, "attack", "1.0.1").battle;
    const second = unit(until(battle, "0.0.1"), "1.0.1").hp - unit(act(until(battle, "0.0.1"), "attack", "1.0.1").battle, "1.0.1").hp;
    expect(second).toBe(20);
  });

  test("the Scriptorium: each faction's casters get their own gift; melee recruits get none", () => {
    expect(NODES.scriptorium.recruitEffects(1, "congregant")).toEqual([]);
    expect(NODES.scriptorium.recruitEffects(1, "apprentice")).toEqual([{ def: "scriptorium_nexus" }]);
    // Ral-Vitahl: an extra spell charge.
    const charges = (effects: { def: string }[]) => unit(start([p("apprentice", 1, 1, effects)], [p("congregant", 0, 1)]), "0.1.1").spellCharges;
    expect(charges([{ def: "scriptorium_nexus" }])).toBe(charges([]) + 1);
    // Jilliath: the first price paid in health is waived.
    const paid = (effects: { def: string }[]) => {
      let battle = until(start([p("reclaimer", 1, 1, effects), { ...p("congregant", 0, 1), hp: 30 }], [p("congregant", 0, 1)]), "0.1.1");
      battle = act(battle, "transfusion", "0.0.1").battle;
      return unit(battle, "0.1.1").hp;
    };
    expect(paid([{ def: "scriptorium_jilliath" }])).toBeGreaterThan(paid([]));
    // The Grove: mending lasts a turn longer.
    const mending = (effects: { def: string }[]) => {
      let battle = until(start([p("grove_support_1", 1, 1, effects), { ...p("congregant", 0, 1), hp: 30 }], [p("congregant", 0, 1)]), "0.1.1");
      battle = act(battle, "bloom", "0.0.1").battle;
      return unit(battle, "0.0.1").effects.find((e) => e.def === "mending")?.stacks ?? 0;
    };
    expect(mending([{ def: "scriptorium_grove" }])).toBe(mending([]) + 1);
  });

  test("Stables: two levels, the second a second hex of movement", () => {
    expect(NODES.stables.maxLevel).toBe(2);
    expect(NODES.stables.recruitEffects(2, "congregant")).toEqual([{ def: "stables", amount: 2 }]);
  });
});

describe("city clauses", () => {
  test("Mana node: the first spell of a turn aimed near the city costs half", () => {
    const { world, city } = holding("mana", 3);
    const near = { ...world, players: world.players.map((pl, i) => (i === 0 ? { ...pl, spells: ["harden_warband"] } : pl)) };
    expect(spellCost(near, "harden_warband", city.hex)).toBe(Math.ceil(spellById("harden_warband").cost / 2));
    const far = Object.values(world.map.tiles).find((t) => hexDistance(t.hex, city.hex) > 3);
    if (!far) throw new Error("nowhere far");
    expect(spellCost(near, "harden_warband", far.hex)).toBe(spellById("harden_warband").cost);
    const cast = { ...near, players: near.players.map((pl, i) => (i === 0 ? { ...pl, cast: ["firebolt"] } : pl)) };
    expect(spellCost(cast, "harden_warband", city.hex)).toBe(spellById("harden_warband").cost);
  });

  test("Caravanserai: its holder sees a known merchant's wares as they are now", () => {
    const { world } = holding("caravanserai", 3);
    const merchant = world.structures.find((s) => s.kind === "merchant");
    if (!merchant || merchant.kind !== "merchant") throw new Error("no merchant");
    const stale = { ...merchant, wares: [] };
    const remembered = { ...world, players: world.players.map((pl, i) => (i === 0 ? { ...pl, memory: { ...pl.memory, structures: [stale] } } : pl)) };
    const seen = knownWorld(remembered, 0).structures.find((s) => s.id === merchant.id);
    expect(seen).toEqual(merchant);
    const plain = { ...remembered, nodes: remembered.nodes.map((n) => (n.kind === "caravanserai" ? { ...n, level: 1 } : n)) };
    expect(knownWorld(plain, 0).structures.find((s) => s.id === merchant.id)).toEqual(sightOf(plain, 0).has(hexKey(merchant.hex)) ? merchant : stale);
  });

  test("Bog iron: enemies fighting at the city rust", () => {
    const { world, city } = holding("bog_iron", 3);
    const walled = { ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: [{ defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 90, xp: 0, marks: [], level: 0 }] } : c)) };
    const battle = engage(walled, leaderById(walled, "leader1"), { kind: "garrison", cityId: city.id }).battle;
    expect(unit(battle, "0.0.1").effects.some((e) => e.def === "rusted")).toBe(true);
    expect(unit(battle, "1.0.1").effects.some((e) => e.def === "rusted")).toBe(false);
  });

  test("Granary: a warband that rested there carries provisions for two more turns", () => {
    const { world, city } = holding("granary", 3);
    let next = structuredClone(withLeader(world, "leader0", { hex: city.hex }));
    startTurn(next, []);
    expect(leaderById(next, "leader0").provisions?.turns).toBe(2);
    const away = Object.values(next.map.tiles).find((t) => hexDistance(t.hex, city.hex) >= 3 && next.cities.every((c) => hexDistance(c.hex, t.hex) > 0) && next.nodes.every((n) => hexDistance(n.hex, t.hex) > 1));
    if (!away) throw new Error("nowhere away");
    const leader = leaderById(next, "leader0");
    next = structuredClone(withLeader(next, "leader0", { hex: away.hex, squad: leader.squad.map((m) => ({ ...m, hp: 1 })) }));
    startTurn(next, []);
    expect(leaderById(next, "leader0").squad[0]?.hp).toBeGreaterThan(1);
    expect(leaderById(next, "leader0").provisions?.turns).toBe(1);
  });

  test("Training yard: its garrison drills a little each turn", () => {
    const { world, city } = holding("training_yard", 3);
    const next = structuredClone({ ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: [{ defId: "congregant", tile: { row: 0, col: 1 } as const, hp: 90, xp: 0, marks: [], level: 0 }] } : c)) });
    startTurn(next, []);
    expect(cityById(next, city.id).garrison[0]?.xp).toBe(5);
  });

  test("Watchtower: at its last level, it sees enemy warbands' items and last move", () => {
    const { world } = holding("watchtower", 3);
    const tower = world.nodes.find((n) => n.kind === "watchtower");
    if (!tower) throw new Error("no tower");
    expect(watched(world, 0, tower.hex)).toBe(true);
    expect(watched(world, 1, tower.hex)).toBe(false);
    const low = { ...world, nodes: world.nodes.map((n) => (n.kind === "watchtower" ? { ...n, level: 2 } : n)) };
    expect(watched(low, 0, tower.hex)).toBe(false);
  });

  test("Waystation: at its last level, warbands starting next to it get a hex more", () => {
    const { world } = holding("waystation", 3);
    const station = world.nodes.find((n) => n.kind === "waystation");
    if (!station) throw new Error("no waystation");
    const next = structuredClone(withLeader(world, "leader0", { hex: beside(world, station.hex) }));
    startTurn(next, []);
    expect(leaderById(next, "leader0").movement).toBe(movementOf(leaderById(next, "leader0")) + 1);
  });

  test("Oasis: at its last level, enemy warbands near it regenerate nothing", () => {
    const { world, city } = holding("oasis", 3);
    const near = beside(world, city.hex);
    const leader = leaderById(world, "leader1");
    const thirsty = structuredClone({ ...withLeader(world, "leader1", { hex: near, squad: leader.squad.map((m) => ({ ...m, hp: 1 })), skills: { healing: 1 } }), activePlayer: 1 as const });
    startTurn(thirsty, []);
    expect(leaderById(thirsty, "leader1").squad[0]?.hp).toBe(1);
  });

  test("Waystone: at its second level, Way portal sends the warband on with a hex more", () => {
    const { world, city } = holding("waystone", 2);
    const away = { ...withLeader(world, "leader0", { hex: beside(world, city.hex), elevatedIn: city.id, movement: 0 }), players: world.players.map((pl) => ({ ...pl, mana: 100 })) };
    const step = applyWorldAction(away, { type: "castSpell", spell: "way_portal", at: beside(world, city.hex) });
    expect(leaderById(step.world, "leader0").movement).toBe(1);
  });

  test("Gallows: at its second level, a warband wiped out storming the city leaves its items to the holder", () => {
    const { world, city } = holding("gallows", 2);
    const guards = COLS.flatMap((col) => [0, 1].map((row) => ({ defId: "punisher", tile: { row, col } as Tile, hp: 200, xp: 0, marks: [], level: 0 })));
    let walled = withLeader({ ...world, cities: world.cities.map((c) => (c.id === city.id ? { ...c, garrison: guards } : c)) }, "leader1", { hex: beside(world, city.hex), worn: ["iron_helm"] });
    walled = withLeader(walled, "leader0", { hex: beside(world, startOf(world, 0)) });
    const next = applyWorldAction({ ...walled, activePlayer: 1 }, { type: "move", leaderId: "leader1", to: city.hex }).world;
    const battle = next.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const after = concludeBattle(next, autoplay(battle)).world;
    expect(after.leaders.some((l) => l.id === "leader1")).toBe(false);
    expect(leaderById(after, "leader0").bag).toContain("iron_helm");
  });

  test("Hunting lodge: at its last level, a hunter's warband earns gold for each neutral it kills", () => {
    const hunter = { effect: { def: "hunter", amount: 25, stacks: 2 }, source: { kind: "node" as const, node: "hunting_lodge" as const, cityId: "city1" } };
    const { world } = holding("gold");
    const lair = world.lairs.find((l) => l.kind === "camp");
    if (!lair) throw new Error("no camp");
    const leader = leaderById(world, "leader0");
    const strong = withLeader(world, "leader0", { hex: beside(world, lair.hex), squad: leader.squad.map((m) => ({ ...m, defId: "templar", hp: 400, level: 6, marks: [hunter] })) });
    const next = applyWorldAction(strong, { type: "move", leaderId: "leader0", to: lair.hex }).world;
    const battle = next.engagement?.battle;
    if (!battle) throw new Error("no battle");
    const step = concludeBattle(next, autoplay(battle));
    expect(step.events.some((e) => e.type === "trophies" && e.gold > 0)).toBe(true);
  });

  test("merchants lay out only their biome's list and the anywhere list", () => {
    for (const biome of ["temperate", "desert", "swamp", "tundra", "haunted"] as const) {
      const pool = [...MERCHANT_POOLS[biome], ...MERCHANT_POOLS.anywhere];
      for (let turn = 1; turn < 30; turn += 6) for (const ware of merchantWares("merchant0", turn, biome)) expect(pool).toContain(ware);
    }
  });
});
