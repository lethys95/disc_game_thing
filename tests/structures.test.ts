import type { Placement } from "#rules/battle/engine";
import { COLS, ROWS } from "#rules/battle/grid";
import { hexDistance } from "#rules/hex";
import { findPath, generateMap, stepCost } from "#rules/map";
import { itemById } from "#rules/items";
import { spellById } from "#rules/spells";
import { hireCost, MERCENARY_STOCKS, MERCHANT_RESTOCK_TURNS, MERCHANT_STAPLES, resalePrice, STRUCTURE_KINDS, structuresPerKind } from "#rules/structures";
import { applyWorldAction } from "#rules/world/actions";
import { createWorld } from "#rules/world/create";
import { maxHpOf } from "#rules/world/record";
import { leaderById, member, playerOf } from "#rules/world/state";
import type { Merchant, Structure, World } from "#rules/world/state";
import { hireProblem, sellItemProblem } from "#rules/world/structures";
import { useItemProblem } from "#rules/world/items";
import { knownWorld } from "#rules/world/vision";
import { twoPlayers, withGold, withLeader } from "#tests/helpers";
import { describe, expect, test } from "vitest";

/** Map structures (user, 2026-09-27): mercenary camps, merchants, mage merchants. Stocks and prices are provisional. */

const two: Placement[] = [{ defId: "congregant", tile: { row: 0, col: 0 } }, { defId: "congregant", tile: { row: 0, col: 1 } }];
const fresh = (): World => withGold(createWorld(1, twoPlayers([two, two], [{}, {}], ["jilliath", "nexus"])), [1000, 1000]);

function structure<K extends Structure["kind"]>(w: World, kind: K): Structure {
  const found = w.structures.find((s) => s.kind === kind);
  if (!found) throw new Error(`no ${kind}`);
  return found;
}

function merchantOf(w: World): Merchant {
  const found = w.structures.flatMap((s) => (s.kind === "merchant" ? [s] : []))[0];
  if (!found) throw new Error("no merchant");
  return found;
}

/** Player 0's warband standing on the structure of this kind. */
const visiting = (w: World, kind: Structure["kind"]): World => withLeader(w, "leader0", { hex: structure(w, kind).hex });

describe("placement", () => {
  test("every map has each kind, more on bigger maps, on walkable contested ground every player can reach", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      for (const players of [2, 3, 4]) {
        const map = generateMap(seed, players);
        for (const kind of STRUCTURE_KINDS) expect(map.structures.some((s) => s.kind === kind)).toBe(true);
        const target = structuresPerKind(Object.keys(map.tiles).length);
        for (const kind of STRUCTURE_KINDS) expect(map.structures.filter((s) => s.kind === kind).length).toBeLessThanOrEqual(target);
        for (const s of map.structures) {
          expect(stepCost(map, s.hex)).not.toBeNull();
          const [nearest, next] = map.starts.map((start) => hexDistance(start, s.hex)).sort((a, b) => a - b);
          expect(nearest).toBeGreaterThanOrEqual(3);
          // The first of each kind is on contested ground.
          if (s.id.endsWith("0")) expect((next ?? 0) - (nearest ?? 0)).toBeLessThanOrEqual(1);
          for (const start of map.starts) expect(findPath(map, start, s.hex, () => false)).not.toBeNull();
        }
      }
    }
    // A bigger map has room for more (as many as fit).
    expect(generateMap(3, 3).structures.length).toBeGreaterThan(generateMap(3, 2).structures.length);
  });
});

describe("mercenary camp", () => {
  test("hires a unit into the warband standing there, seasoned and at full health, and never runs out", () => {
    const w = visiting(fresh(), "mercenaries");
    const [first] = MERCENARY_STOCKS[0] ?? [];
    if (!first) throw new Error("no stock");
    const step = applyWorldAction(w, { type: "hire", leaderId: "leader0", index: 0 });
    const squad = leaderById(step.world, "leader0").squad;
    const hired = squad.find((m) => m.defId === first.defId);
    expect(hired?.level).toBe(first.level);
    expect(hired && hired.hp).toBe(hired && maxHpOf(hired, undefined));
    expect(playerOf(step.world, 0).gold).toBe(1000 - hireCost(first));
    expect(step.events).toContainEqual({ type: "hired", leaderId: "leader0", defId: first.defId });
    const camp = structure(step.world, "mercenaries");
    expect(camp.kind === "mercenaries" && camp.stock).toEqual(MERCENARY_STOCKS[0]);
    const again = applyWorldAction(step.world, { type: "hire", leaderId: "leader0", index: 0 }).world;
    expect(leaderById(again, "leader0").squad.filter((m) => m.defId === first.defId)).toHaveLength(2);
  });

  test("only for a warband standing there, with gold and room", () => {
    const w = fresh();
    expect(hireProblem(w, "leader0", 0)).toBe("the warband must stand there");
    expect(hireProblem(withGold(visiting(w, "mercenaries"), [10, 10]), "leader0", 0)).toBe("not enough gold");
    const five = ROWS.flatMap((row) => COLS.map((col) => member("congregant", { row, col }))).slice(0, 5);
    const full = withLeader(visiting(w, "mercenaries"), "leader0", { squad: five });
    expect(hireProblem(full, "leader0", 0)).toMatch(/squad full/);
  });
});

describe("merchant", () => {
  test("a ware is sold once into the leader's bag; bought back for half its price, it's a ware again", () => {
    const w = visiting(fresh(), "merchant");
    const item = merchantOf(w).wares[0] ?? "";
    const bought = applyWorldAction(w, { type: "buyItem", leaderId: "leader0", item }).world;
    expect(leaderById(bought, "leader0").bag).toContain(item);
    expect(playerOf(bought, 0).gold).toBe(1000 - itemById(item).price);
    expect(merchantOf(bought).wares).not.toContain(item);

    const sold = applyWorldAction(bought, { type: "sellItem", leaderId: "leader0", item });
    expect(leaderById(sold.world, "leader0").bag).not.toContain(item);
    expect(playerOf(sold.world, 0).gold).toBe(1000 - itemById(item).price + resalePrice(itemById(item).price));
    expect(merchantOf(sold.world).wares).toContain(item);
  });

  test("staples never run out", () => {
    let w = visiting(fresh(), "merchant");
    const potion = MERCHANT_STAPLES[0] ?? "";
    for (let i = 0; i < 3; i++) w = applyWorldAction(w, { type: "buyItem", leaderId: "leader0", item: potion }).world;
    expect(leaderById(w, "leader0").bag.filter((i) => i === potion)).toHaveLength(3);
  });

  test("new wares replace the old every few rounds, differently each time and at each merchant", () => {
    let w = fresh();
    const first = merchantOf(w).wares;
    expect(first.length).toBeGreaterThan(0);
    expect(first.some((i) => MERCHANT_STAPLES.includes(i))).toBe(false);
    const seen = new Set([first.join()]);
    for (let restock = 0; restock < 3; restock++) {
      for (let turn = 0; turn < MERCHANT_RESTOCK_TURNS * 2; turn++) w = applyWorldAction(w, { type: "endTurn" }).world;
      seen.add(merchantOf(w).wares.join());
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(merchantOf(w).restocksOn).toBeGreaterThan(w.turn);
  });

  test("a worn item must come off before it sells", () => {
    const w = withLeader(visiting(fresh(), "merchant"), "leader0", { worn: ["iron_helm"] });
    expect(sellItemProblem(w, "leader0", "iron_helm")).toBe("take it off first");
  });
});

describe("potions", () => {
  test("a healing potion heals every living unit of the warband, up to its max, and is used up", () => {
    const w = fresh();
    const leader = leaderById(w, "leader0");
    const hurt = withLeader(w, "leader0", { bag: ["healing_potion"], squad: leader.squad.map((m) => ({ ...m, hp: 10 })) });
    const healed = applyWorldAction(hurt, { type: "useItem", leaderId: "leader0", item: "healing_potion" }).world;
    const after = leaderById(healed, "leader0");
    expect(after.squad.every((m) => m.hp === 60)).toBe(true);
    expect(after.bag).toEqual([]);
    expect(useItemProblem(withLeader(w, "leader0", { bag: ["healing_potion"] }), "leader0", "healing_potion")).toBe("nobody is wounded");
  });

  test("a resurrection potion raises the most recently fallen unit into the warband, anywhere, at 1 HP", () => {
    const w = fresh();
    const dead = { ...w, players: w.players.map((p, i) => (i === 0 ? { ...p, graveyard: [{ defId: "congregant", fellOnTurn: 1, marks: [], level: 0 }, { defId: "paladin", fellOnTurn: 2, marks: [], level: 1 }] } : p)) };
    const ready = withLeader(dead, "leader0", { bag: ["resurrection_potion"] });
    const raised = applyWorldAction(ready, { type: "useItem", leaderId: "leader0", item: "resurrection_potion" }).world;
    expect(leaderById(raised, "leader0").squad.find((m) => m.defId === "paladin")).toMatchObject({ hp: 1, level: 1 });
    expect(playerOf(raised, 0).graveyard.map((f) => f.defId)).toEqual(["congregant"]);
  });
});

describe("mage merchant", () => {
  test("teaches spells no faction's Capitol does; they're cast with the caster's own mana", () => {
    const w = visiting(fresh(), "mage");
    const mage = structure(w, "mage");
    const spell = mage.kind === "mage" ? mage.stock[0] : undefined;
    if (!spell) throw new Error("no spell for sale");
    expect(() => applyWorldAction(w, { type: "learnSpell", spell })).toThrow(/mage merchants/);
    const learned = applyWorldAction(w, { type: "buySpell", leaderId: "leader0", spell }).world;
    expect(playerOf(learned, 0).spells).toContain(spell);
    expect(playerOf(learned, 0).gold).toBe(1000 - spellById(spell).learnCost);
    expect(() => applyWorldAction(learned, { type: "buySpell", leaderId: "leader0", spell })).toThrow(/already learned/);
  });
});

describe("fog", () => {
  test("a structure out of sight shows its wares as last seen", () => {
    const w = visiting(fresh(), "merchant");
    const ware = merchantOf(w).wares[0] ?? "";
    const hired = applyWorldAction(w, { type: "buyItem", leaderId: "leader0", item: ware }).world;
    const home = createWorld(1, twoPlayers([two, two], [{}, {}], ["jilliath", "nexus"])).leaders[0]?.hex;
    if (!home) throw new Error("no start");
    // Player 1 hasn't been near: it knows nothing of the merchant.
    expect(knownWorld(hired, 1).structures.some((s) => s.kind === "merchant")).toBe(false);
    // Player 0 walks away, and remembers the wares it left.
    const away = withLeader(hired, "leader0", { hex: home });
    expect(merchantOf(knownWorld(away, 0)).wares).toEqual(merchantOf(hired).wares);
  });
});
