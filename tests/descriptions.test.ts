import { BEHAVIORS, describeAbility } from "#rules/abilities/index";
import { EFFECTS } from "#rules/effects";
import { UNITS } from "#rules/units/index";
import { describe, expect, test } from "vitest";

/** Every definition carries its own rules text; a typo in a param name would show up as "undefined" or "NaN". */
const readable = (text: string) => text.length > 0 && !/undefined|NaN/.test(text);

describe("rules text", () => {
  test("every ability describes itself with its default params, and as each unit uses it", () => {
    for (const id of Object.keys(BEHAVIORS)) expect(readable(describeAbility({ id })), id).toBe(true);
    for (const unit of Object.values(UNITS)) {
      for (const ref of unit.abilities) expect(readable(describeAbility(ref)), `${unit.id}: ${ref.id}`).toBe(true);
    }
  });

  test("every effect describes itself", () => {
    for (const def of EFFECTS.values()) {
      expect(readable(def.describe({ def: def.id, source: null, stacks: 2, amount: 30 })), def.id).toBe(true);
    }
  });
});
