import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { BEHAVIORS } from "#rules/abilities/index";
import { EFFECTS } from "#rules/effects";
import { UNITS } from "#rules/units/index";
import { promptFor } from "#scripts/art/prompts";
import { allSlots, fallbackKeys, slotKey } from "#view/art-slots";
import { describe, expect, test } from "vitest";

const ART = "assets/art";

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]));
}

describe("art slots", () => {
  test("every unit, ability and effect has a slot", () => {
    const keys = allSlots().map(slotKey);
    for (const id of Object.keys(UNITS)) expect(keys).toContain(`portrait/${id}`);
    for (const id of Object.keys(BEHAVIORS)) expect(keys).toContain(`ability/${id}`);
    for (const id of EFFECTS.keys()) expect(keys).toContain(`effect/${id}`);
  });

  test("every art file belongs to a slot or a family default, so a rename can't orphan art silently", () => {
    const known = new Set(allSlots().flatMap(fallbackKeys));
    const orphans = files(ART)
      .filter((f) => f.endsWith(".webp"))
      .map((f) => relative(ART, f).replace(/\.webp$/, ""))
      .filter((key) => !known.has(key));
    expect(orphans).toEqual([]);
  });

  test("an ability falls back through its tags, a portrait through its faction", () => {
    expect(fallbackKeys({ kind: "ability", id: "flail" })).toEqual(["ability/flail", "ability/_attack", "ability/_melee", "ability/_damage", "ability/_area", "ability/_active"]);
    expect(fallbackKeys({ kind: "portrait", id: "zealot" })).toEqual(["portrait/zealot", "portrait/_jilliath"]);
  });

  test("every slot has a prompt, and the user's own looks are used", () => {
    for (const slot of allSlots()) expect(promptFor(slot).prompt.length).toBeGreaterThan(100);
    expect(promptFor({ kind: "portrait", id: "zealot" }).prompt).toContain("featureless mask");
  });
});
