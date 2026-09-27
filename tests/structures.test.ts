import type { Placement } from "#rules/battle/engine";
import { COLS, ROWS } from "#rules/battle/grid";
import { hexDistance } from "#rules/hex";
import { findPath, generateMap, stepCost } from "#rules/map";
import { itemById } from "#rules/items";
import { spellById } from "#rules/spells";
import { hireCost, MERCENARY_STOCKS, MERCHANT_STOCK, resalePrice, STRUCTURE_KINDS } from "#rules/structures";
import { applyWorldAction } from "#rules/world/actions";
import { createWorld } from "#rules/world/create";
import { maxHpOf } from "#rules/world/record";
import { leaderById, member, playerOf } from "#rules/world/state";
import type { Structure, World } from "#rules/world/state";
import { hireProblem, sellItemProblem } from "#rules/world/structures";
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

/** Player 0's warband standing on the structure of this kind. */
const visiting = (w: World, kind: Structure["kind"]): World => withLeader(w, "leader0", { hex: structure(w, kind).hex });

describe("placement", () => {
  test("every map has one of each, on walkable contested ground every player can reach", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      for (const players of [2, 3, 4]) {
        const map = generateMap(seed, players);
        expect(map.structures.map((s) => s.kind).sort()).toEqual([...STRUCTURE_KINDS].sort());
        for (const s of map.structures) {
          expect(stepCost(map, s.hex)).not.toBeNull();
          const [nearest, next] = map.starts.map((start) => hexDistance(start, s.hex)).sort((a, b) => a - b);
          expect((next ?? 0) - (nearest ?? 0)).toBeLessThanOrEqual(1);
          for (const start of map.starts) expect(findPath(map, start, s.hex, () => false)).not.toBeNull();
        }
      }
    }
  });
});

describe("mercenary camp", () => {
  test("hires a unit from its stock into the warband standing there, seasoned and at full health, once", () => {
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
    expect(camp.kind === "mercenaries" && camp.stock.length).toBe((MERCENARY_STOCKS[0]?.length ?? 0) - 1);
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
  test("sells an item into the leader's bag, and buys one back for half its price", () => {
    const w = visiting(fresh(), "merchant");
    const item = MERCHANT_STOCK[0] ?? "";
    const bought = applyWorldAction(w, { type: "buyItem", leaderId: "leader0", item }).world;
    expect(leaderById(bought, "leader0").bag).toContain(item);
    expect(playerOf(bought, 0).gold).toBe(1000 - itemById(item).price);
    const shop = structure(bought, "merchant");
    expect(shop.kind === "merchant" && shop.stock.includes(item)).toBe(false);

    const sold = applyWorldAction(bought, { type: "sellItem", leaderId: "leader0", item });
    expect(leaderById(sold.world, "leader0").bag).not.toContain(item);
    expect(playerOf(sold.world, 0).gold).toBe(1000 - itemById(item).price + resalePrice(itemById(item).price));
    const after = structure(sold.world, "merchant");
    expect(after.kind === "merchant" && after.stock.includes(item)).toBe(true);
  });

  test("a worn item must come off before it sells", () => {
    const w = withLeader(visiting(fresh(), "merchant"), "leader0", { worn: ["iron_helm"] });
    expect(sellItemProblem(w, "leader0", "iron_helm")).toBe("take it off first");
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
  test("a structure out of sight shows its stock as last seen", () => {
    const w = visiting(fresh(), "mercenaries");
    const hired = applyWorldAction(w, { type: "hire", leaderId: "leader0", index: 0 }).world;
    const home = createWorld(1, twoPlayers([two, two], [{}, {}], ["jilliath", "nexus"])).leaders[0]?.hex;
    if (!home) throw new Error("no start");
    // Player 1 hasn't been near: it knows nothing of the camp.
    expect(knownWorld(hired, 1).structures.some((s) => s.kind === "mercenaries")).toBe(false);
    // Player 0 walks away, and remembers the stock it left.
    const away = withLeader(hired, "leader0", { hex: home });
    const camp = knownWorld(away, 0).structures.find((s) => s.kind === "mercenaries");
    expect(camp?.kind === "mercenaries" && camp.stock.length).toBe((MERCENARY_STOCKS[0]?.length ?? 0) - 1);
  });
});
