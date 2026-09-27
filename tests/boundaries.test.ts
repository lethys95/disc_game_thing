import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

/** `src/rules/` is pure (CLAUDE.md): only rules and plain data, nothing that draws, plays, or rolls dice. */

const RULES = "src/rules";

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });

const imports = (text: string): string[] => [...text.matchAll(/(?:from|import)\s*\(?\s*"([^"]+)"/g)].flatMap((m) => (m[1] ? [m[1]] : []));

describe("the rules stay pure", () => {
  const files = sources(RULES).map((path) => ({ path, text: readFileSync(path, "utf8") }));

  test("they import only other rules", () => {
    const outside = files.flatMap(({ path, text }) => imports(text).filter((i) => !i.startsWith("#rules/")).map((i) => `${path}: ${i}`));
    expect(outside).toEqual([]);
  });

  test("nothing in them is random or reads the clock", () => {
    const impure = files.filter(({ text }) => /Math\.random|Date\.now|performance\.now|new Date\(/.test(text)).map(({ path }) => path);
    expect(impure).toEqual([]);
  });
});
