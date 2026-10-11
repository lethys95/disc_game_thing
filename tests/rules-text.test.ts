import { describe, expect, test } from "vitest";
import { describeItem, itemById } from "#rules/items";
import { NODES } from "#rules/nodes";
import { describeSpell, SPELLS } from "#rules/spells";

/** Rules text outside battle is computed from the rule's own data (the code review, 2026-10-11): it can't drift. */
describe("rules text follows the rules", () => {
  test("an item's carried ability is described at its leader's ability power", () => {
    expect(describeItem(itemById("hatchet"), 100)).toContain("for 30");
    expect(describeItem(itemById("hatchet"), 150)).toContain("for 45");
  });

  test("a node's mark reads its effect's numbers at each level", () => {
    expect(NODES.foundry.describe(1)).toContain("+12 shield");
    expect(NODES.foundry.describe(2)).toContain("+18 shield");
  });

  test("every spell has a text with its effect's number", () => {
    for (const spell of SPELLS) {
      const amount = spell.effect.kind === "damage" ? spell.effect.amount : (spell.effect.effect.amount ?? 0);
      expect(describeSpell(spell)).toContain(String(amount));
    }
  });
});
