import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { FACTIONS } from "#rules/factions";
import { NODES } from "#rules/nodes";
import { STRUCTURE_KINDS } from "#rules/structures";
import { modelSlots } from "#view/models";
import { describe, expect, test } from "vitest";

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : entry.name.endsWith(".glb") ? [join(dir, entry.name)] : []));

describe("model slots", () => {
  test("every model file belongs to a slot, so a rename can't orphan a model silently", () => {
    const slots = new Set(modelSlots(Object.keys(FACTIONS), STRUCTURE_KINDS, Object.keys(NODES)));
    const orphans = files("assets/models").map((f) => relative("assets/models", f).replace(/\.glb$/, "")).filter((key) => !slots.has(key));
    expect(orphans).toEqual([]);
  });
});
