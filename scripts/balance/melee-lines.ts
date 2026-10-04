/** 3v3 melee-line duels at each tier (the user's method for tuning the Grove, 2026-09-29): `pnpm tsx scripts/balance/melee-lines.ts`. Deterministic: both sides take each role once. */
import { autoplay } from "#rules/ai";
import { createBattle } from "#rules/battle/engine";
const three = (id: string) => [0, 1, 2].map((col) => ({ defId: id, tile: { row: 0 as const, col: col as 0 | 1 | 2 } }));
const duel = (a: string, b: string) => {
  let w = 0;
  for (const [x, y, me] of [[a, b, 0], [b, a, 1]] as const) {
    const r = autoplay(createBattle([three(x), three(y)]).battle);
    if (r.outcome?.winner === me && !r.outcome.withdrew) w++;
  }
  return `${b} ${w}/2`;
};
const tiers: [string[], string[]][] = [
  [["sproutling"], ["congregant", "custodian"]],
  [["regrowth_2", "moldling"], ["paladin", "zealot", "cyclops", "mutant"]],
  [["regrowth_3", "bog_giant"], ["templar", "punisher", "fanatic"]],
  [["deadwood", "mulch_gorger"], ["immortal", "torturer", "chosen"]],
];
for (const [grove, others] of tiers) for (const g of grove) console.log(g.padEnd(14), others.map((o) => duel(g, o)).join("  "));
