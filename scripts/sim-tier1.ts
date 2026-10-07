import { chooseAction } from "#rules/ai";
import { applyAction, createBattle } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import type { Col, Row } from "#rules/battle/types";

/**
 * Tier-1 squads of each faction against each other, both seatings, battle only (`pnpm sim:t1`). The user's balance
 * rule (2026-09-26): factions keep the same Leadership; units are tuned until tier-1 armies are even.
 */
const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });
const jilliath: Record<string, Placement[]> = {
  "3Co+Cl+Ma": [at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2), at("seraph", 2, 0), at("acolyte", 2, 1)],
  "5Co": [at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2), at("congregant", 1, 0), at("congregant", 1, 2)],
  "3Co+2Ma": [at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2), at("acolyte", 2, 0), at("acolyte", 2, 1)],
  "3Co+2Cl": [at("congregant", 0, 0), at("congregant", 0, 1), at("congregant", 0, 2), at("seraph", 2, 0), at("seraph", 2, 1)],
};
const nexus: Record<string, Placement[]> = {
  "3Cu+Te+Ap": [at("custodian", 0, 0), at("custodian", 0, 1), at("custodian", 0, 2), at("technician", 1, 0), at("apprentice", 1, 1)],
  "3Cu+2Ap": [at("custodian", 0, 0), at("custodian", 0, 1), at("custodian", 0, 2), at("apprentice", 1, 0), at("apprentice", 1, 1)],
  "5Cu": [at("custodian", 0, 0), at("custodian", 0, 1), at("custodian", 0, 2), at("custodian", 1, 0), at("custodian", 1, 2)],
};

let jWins = 0;
let games = 0;
let stalls = 0;
const rows: string[] = [];
for (const [jn, j] of Object.entries(jilliath)) {
  const cells: string[] = [];
  for (const [nn, n] of Object.entries(nexus)) {
    for (const seat of [0, 1] as const) {
      let { battle } = createBattle(seat === 0 ? [j, n] : [n, j]);
      for (let steps = 0; !battle.outcome && steps < 3000; steps++) {
        const action = chooseAction(battle);
        if (!action) break;
        battle = applyAction(battle, action).battle;
      }
      games += 1;
      const left = Object.values(battle.units).filter((u) => u.alive).length;
      // No outcome: the step limit ran out (healing and shield restores outlasting the damage).
      if (!battle.outcome) {
        stalls += 1;
        cells.push(`${nn}${seat === 0 ? "↑" : "↓"} stall`);
        continue;
      }
      const winner = battle.outcome.winner;
      const won = winner === seat;
      if (won) jWins += 1;
      cells.push(`${nn}${seat === 0 ? "↑" : "↓"} ${won ? "J" : winner === null ? "=" : "N"}${left}`);
    }
  }
  rows.push(`${jn.padEnd(10)} ${cells.join("  ")}`);
}
console.log(`${rows.join("\n")}\nJilliath wins ${jWins} of ${games}, ${stalls} never ended (↑ Jilliath attacks, ↓ defends; the number is units left standing)`);
