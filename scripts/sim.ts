import { chooseAction } from "#rules/ai";
import { applyAction, createBattle } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import { PRESETS } from "#rules/units/presets";

/** AI-vs-AI matrix of every preset against every preset (both seatings), for balance work. */
const MAX_STEPS = 3000;
const squads: Record<string, readonly Placement[]> = { ...PRESETS };

const rows: string[] = [];
for (const [a, first] of Object.entries(squads)) {
  for (const [b, second] of Object.entries(squads)) {
    let { battle } = createBattle([first, second]);
    let steps = 0;
    while (!battle.outcome && steps < MAX_STEPS) {
      const action = chooseAction(battle);
      if (!action) break;
      battle = applyAction(battle, action).battle;
      steps++;
    }
    const winner = battle.outcome ? (battle.outcome.winner === null ? "none" : battle.outcome.winner === 0 ? `${a} (1st)` : `${b} (2nd)`) : "UNFINISHED";
    const survivors = Object.values(battle.units).filter((u) => u.alive).map((u) => `${u.name}(${u.hp})`).join(" ");
    rows.push(`${a.padEnd(11)} vs ${b.padEnd(11)} → ${winner.padEnd(17)} rounds=${String(battle.round).padStart(3)} actions=${String(steps).padStart(4)} | ${survivors}`);
  }
}
console.log(rows.join("\n"));
