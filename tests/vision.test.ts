import type { Placement } from "#rules/battle/engine";
import { COLS } from "#rules/battle/grid";
import { WARBAND_SIGHT } from "#rules/balance";
import { hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { findPath, stepCost } from "#rules/map";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import { createWorld } from "#rules/world/create";
import { capitolOf, leaderById, playerOf } from "#rules/world/state";
import type { World } from "#rules/world/state";
import { knownWorld, sightOf, updateVision } from "#rules/world/vision";
import { startOf, twoPlayers, withLeader } from "#tests/helpers";
import { newsText } from "#view/map-text";
import { describe, expect, test } from "vitest";

/** Fog of war (pillars.md): unexplored hidden; explored-not-visible shows last-known state. */

const squad: Placement[] = COLS.map((col) => ({ defId: "congregant", tile: { row: 0, col } }));
const world = (): World => createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));

/** The world with a leader changed, and everyone's sight brought up to date. */

const free = (w: World, hex: Hex) => stepCost(w.map, hex) !== null && !w.cities.some((c) => sameHex(c.hex, hex)) && !w.lairs.some((l) => sameHex(l.hex, hex)) && !w.leaders.some((l) => sameHex(l.hex, hex));

describe("fog of war", () => {
  test("a new game shows each player only its own corner: no enemy warband, no enemy Capitol", () => {
    const w = world();
    const known = knownWorld(w, 0);
    expect(known.leaders.map((l) => l.player)).toEqual([0]);
    expect(known.cities.some((c) => c.owner === 1)).toBe(false);
    expect(playerOf(w, 0).explored.length).toBeLessThan(Object.keys(w.map.tiles).length);
    expect(playerOf(w, 0).explored).toContain(hexKey(startOf(w, 0)));
    expect(playerOf(w, 0).explored).not.toContain(hexKey(startOf(w, 1)));
  });

  test("unexplored terrain reads as plain; explored terrain as it is", () => {
    const w = world();
    const known = knownWorld(w, 0);
    const explored = new Set(playerOf(w, 0).explored);
    for (const [key, tile] of Object.entries(w.map.tiles)) {
      expect(known.map.tiles[key]?.terrain).toBe(explored.has(key) ? tile.terrain : "plain");
    }
  });

  test("a place out of sight shows as last seen, and a lost city is news wherever it is", () => {
    let w = world();
    const capitol = capitolOf(w, 1);
    if (!capitol) throw new Error("no Capitol");
    const beside = neighbors(capitol.hex).find((h) => free(w, h));
    if (!beside) throw new Error("no free hex by the enemy Capitol");
    w = withLeader(w, "leader0", { hex: beside });
    expect(knownWorld(w, 0).cities.find((c) => c.id === capitol.id)?.garrison).toHaveLength(1);
    // Player 0 walks away; the enemy recruits behind its back.
    w = withLeader(w, "leader0", { hex: startOf(w, 0) });
    w = { ...w, cities: w.cities.map((c) => (c.id === capitol.id ? { ...c, garrison: [...c.garrison, { ...c.garrison[0]!, defId: "congregant", tile: { row: 0, col: 0 } }] } : c)) };
    expect(knownWorld(w, 0).cities.find((c) => c.id === capitol.id)?.garrison).toHaveLength(1);
    expect(knownWorld(w, 1).cities.find((c) => c.id === capitol.id)?.garrison).toHaveLength(2);

    const home = capitolOf(w, 0);
    if (!home) throw new Error("no Capitol");
    const lost = structuredClone({ ...w, leaders: w.leaders.filter((l) => l.player !== 0), cities: w.cities.map((c) => (c.id === home.id ? { ...c, owner: 1 } : c)) });
    updateVision(lost);
    expect(knownWorld(lost, 0).cities.find((c) => c.id === home.id)?.owner).toBe(1);
  });

  test("a march stops when it sights a warband it hadn't seen", () => {
    let w = world();
    const mover = leaderById(w, "leader0");
    // A hex just out of sight, reached the same way on the real map as through the fog (so only the sighting can
    // stop the march), with an enemy hidden on it.
    const sameRoute = (far: Hex) => {
      const real = findPath(w.map, mover.hex, far, () => false);
      const blind = findPath(knownWorld(w, 0).map, mover.hex, far, () => false);
      return real !== null && blind !== null && JSON.stringify(real.hexes) === JSON.stringify(blind.hexes) && real.hexes.every((h) => free(w, h));
    };
    const route = [...Object.values(w.map.tiles)]
      .map((t) => t.hex)
      .filter((h) => free(w, h) && hexDistance(h, mover.hex) === WARBAND_SIGHT + 2)
      .find((far) => !sightOf(w, 0).has(hexKey(far)) && knownWorld(w, 0).leaders.length === 1 && sameRoute(far));
    if (!route) throw new Error("no hex out of sight");
    w = withLeader(w, "leader1", { hex: route });
    expect(knownWorld(w, 0).leaders.some((l) => l.id === "leader1")).toBe(false);
    const step = applyWorldAction(w, { type: "move", leaderId: "leader0", to: route });
    const moved = step.events.find((e) => e.type === "moved");
    expect(moved?.type === "moved" && moved.path.length).toBeLessThan(hexDistance(mover.hex, route));
    expect(step.world.engagement).toBeNull();
    expect(knownWorld(step.world, 0).leaders.some((l) => l.id === "leader1")).toBe(true);
  });

  test("the AI plans from what it knows: with nothing in sight, it goes exploring", () => {
    let w = world();
    // Nothing to recruit with, so its first order is a march; and every lair it knows is gone.
    w = { ...w, players: w.players.map((p) => ({ ...p, gold: 0 })), lairs: [] };
    const before = new Set(playerOf(w, 0).explored);
    let explored = before.size;
    for (let i = 0; i < 6; i++) {
      const action = chooseWorldAction(w);
      if (action.type === "endTurn") break;
      w = applyWorldAction(w, action).world;
      explored = playerOf(w, 0).explored.length;
    }
    expect(explored).toBeGreaterThan(before.size);
  });

  test("news of other players reaches you only from where you can see", () => {
    const w = world();
    const far = w.cities.find((c) => c.owner === null && !sightOf(w, 0).has(hexKey(c.hex)));
    const near = w.cities.find((c) => c.owner === null && sightOf(w, 0).has(hexKey(c.hex)));
    if (!far) throw new Error("no city out of sight");
    expect(newsText([{ type: "captured", cityId: far.id, player: 1 }], w, 0)).toBe("");
    expect(newsText([{ type: "captured", cityId: far.id, player: 0 }], w, 0)).toBe("You take the city.");
    if (near) expect(newsText([{ type: "captured", cityId: near.id, player: 1 }], w, 0)).toBe("The enemy takes the city.");
  });
});

describe("what a player knows of the others", () => {
  test("only their faction, color and whether they're out; never their gold, spells or research", () => {
    const w = createWorld(1, twoPlayers([squad, squad], [{}, {}], ["jilliath", "jilliath"]));
    const rich = { ...w, players: w.players.map((pl, i) => (i === 1 ? { ...pl, gold: 999, research: ["city_resurrection"], spells: ["bless_warband"] } : pl)) };
    const seen = playerOf(knownWorld(rich, 0), 1);
    expect([seen.gold, seen.research, seen.spells, seen.faction]).toEqual([0, [], [], "jilliath"]);
    expect(playerOf(knownWorld(rich, 1), 1).gold).toBe(999);
  });
});
