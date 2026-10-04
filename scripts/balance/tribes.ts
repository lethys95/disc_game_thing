/**
 * Neutral groups against the factions' presets (`pnpm tsx scripts/balance/tribes.ts`): how often each tribe's
 * group at each strength beats a faction squad, both seatings. The gnolls (2026-10-04) were tuned to sit near the
 * bandits, not to match them unit for unit.
 */
import { autoplay } from "#rules/ai";
import { createBattle } from "#rules/battle/engine";
import { FORMATIONS } from "#rules/units/presets";
import { placementOf } from "#rules/world/record";
import { neutralGroup } from "#rules/world/state";
import type { Strength, Tribe } from "#rules/world/state";
import type { Outcome } from "#rules/battle/types";

/** Side `side` won outright (not by the round limit, not a mutual wipe). */
const won = (outcome: Outcome | null, side: 0 | 1) => outcome !== null && outcome.winner === side && !("withdrew" in outcome && outcome.withdrew);

const strengths: readonly Strength[] = ["weak", "medium", "strong"];
const tribes: readonly Tribe[] = ["bandits", "gnolls"];
const squads = Object.values(FORMATIONS).flatMap((list) => list.map((preset) => preset.squad));
for (const strength of strengths) {
  const row = tribes.map((tribe) => {
    const guards = neutralGroup(tribe, strength).map((m) => placementOf(m, undefined));
    let wins = 0;
    for (const squad of squads) {
      for (const seat of [0, 1] as const) {
        const sides = seat === 0 ? [squad, guards] : [guards, squad];
        const outcome = autoplay(createBattle([sides[0] ?? [], sides[1] ?? []]).battle).outcome;
        if (won(outcome, seat === 0 ? 1 : 0)) wins += 1;
      }
    }
    return `${tribe} ${Math.round((100 * wins) / (squads.length * 2))}%`;
  });
  console.log(`${strength.padEnd(7)} ${row.join("  ")}  (the tribe's wins over ${squads.length} faction presets)`);
}

// Head to head at each strength: the gnolls' wins over the bandits, both seatings.
for (const strength of strengths) {
  const [bandits, gnolls] = tribes.map((tribe) => neutralGroup(tribe, strength).map((m) => placementOf(m, undefined)));
  const first = autoplay(createBattle([gnolls ?? [], bandits ?? []]).battle).outcome;
  const second = autoplay(createBattle([bandits ?? [], gnolls ?? []]).battle).outcome;
  const wins = (won(first, 0) ? 1 : 0) + (won(second, 1) ? 1 : 0);
  console.log(`${strength.padEnd(7)} gnolls beat bandits ${wins}/2`);
}
