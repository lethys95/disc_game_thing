import { existsSync } from "node:fs";
import { allSoundSlots } from "#view/sound-slots";

/**
 * `pnpm audio`: every sound slot the game has content for (`src/view/sound-slots.ts`), and what it plays: its own
 * file, a family fallback, or nothing. Like `pnpm art report`.
 */
const has = (key: string) => existsSync(`assets/audio/${key}.ogg`);
const rows = allSoundSlots().map(({ key, chain }) => {
  const via = chain.find(has);
  return { key, state: has(key) ? "own" : via ? `→ ${via}` : "silent" };
});
const groups = [...new Set(rows.map((r) => r.key.split("/")[0] ?? ""))];
const summary = groups.map((g) => {
  const mine = rows.filter((r) => r.key.startsWith(`${g}/`));
  const own = mine.filter((r) => r.state === "own").length;
  const silent = mine.filter((r) => r.state === "silent").length;
  return `${g.padEnd(9)} ${own}/${mine.length} own, ${mine.length - own - silent} fall back, ${silent} silent`;
});
const detail = rows.filter((r) => r.state !== "own").map((r) => `  ${r.key.padEnd(34)} ${r.state}`);
console.log([...summary, "", "Without their own sound:", ...detail].join("\n"));
