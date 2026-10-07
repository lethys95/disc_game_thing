import { readFileSync, readdirSync } from "node:fs";
import { BEHAVIORS } from "#rules/abilities/index";
import { EFFECTS } from "#rules/effects";
import { describe, expect, test } from "vitest";

/** Each behavior's source, by id: from its `id: {` line to the next behavior's. */
function sources(): Map<string, string> {
  const found = new Map<string, string>();
  for (const file of readdirSync("src/rules/abilities").filter((f) => f.endsWith(".ts"))) {
    const text = readFileSync(`src/rules/abilities/${file}`, "utf8");
    const starts = [...text.matchAll(/\n {2}(\w+): \{\n {4}kind:/g)];
    starts.forEach((match, i) => found.set(match[1] ?? "", text.slice(match.index, starts[i + 1]?.index ?? text.length)));
  }
  return found;
}

describe("what abilities apply (the codex's links)", () => {
  test("every effect an ability names in its code is in its `applies`", () => {
    for (const [id, source] of sources()) {
      const named = [...source.matchAll(/def: "(\w+)"/g)].map((m) => m[1]);
      for (const effect of named) expect(BEHAVIORS[id]?.applies ?? [], `${id} applies ${effect}`).toContain(effect);
    }
  });

  test("every effect in an `applies` exists", () => {
    for (const [id, b] of Object.entries(BEHAVIORS)) for (const effect of b.applies ?? []) expect(EFFECTS.has(effect), `${id}: ${effect}`).toBe(true);
    for (const def of EFFECTS.values()) for (const effect of def.applies ?? []) expect(EFFECTS.has(effect), `${def.id}: ${effect}`).toBe(true);
  });
});
