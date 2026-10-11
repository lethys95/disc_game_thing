/**
 * Neutral groups against the factions' presets (`pnpm tsx scripts/balance/tribes.ts`): how often each tribe's
 * group at each strength beats a faction squad, both seatings. The gnolls (2026-10-04) were tuned to sit near the
 * bandits, not to match them unit for unit. The AI's picks per tribe close the report: every ability should be used
 * (the user, 2026-10-05: the AI must know every mechanic).
 */
import { autoplay, chooseAction } from "#rules/ai";
import { applyAction, createBattle } from "#rules/battle/engine";
import type { Battle } from "#rules/battle/types";
import { FORMATIONS } from "#rules/units/presets";
import { placementOf } from "#rules/world/record";
import { TRIBES, neutralGroup } from "#rules/world/state";
import type { Strength, Tribe } from "#rules/world/state";
import type { Outcome } from "#rules/battle/types";

/** Side `side` won outright (not by the round limit, not a mutual wipe). */
const won = (outcome: Outcome | null, side: 0 | 1) => outcome !== null && outcome.winner === side && !("withdrew" in outcome && outcome.withdrew);

const strengths: readonly Strength[] = ["weak", "medium", "strong"];
const tribes: readonly Tribe[] = TRIBES;
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

// Head to head at each strength: each newer tribe's wins over the bandits, both seatings.
for (const strength of strengths) {
  const groupOf = (tribe: Tribe) => neutralGroup(tribe, strength).map((m) => placementOf(m, undefined));
  const row = tribes.slice(1).map((tribe) => {
    const first = autoplay(createBattle([groupOf(tribe), groupOf("bandits")]).battle).outcome;
    const second = autoplay(createBattle([groupOf("bandits"), groupOf(tribe)]).battle).outcome;
    return `${tribe} beat bandits ${(won(first, 0) ? 1 : 0) + (won(second, 1) ? 1 : 0)}/2`;
  });
  console.log(`${strength.padEnd(7)} ${row.join("  ")}`);
}

// The AI's picks for the tribe's side across the medium and strong groups' battles: which abilities, how often.
const playOut = (start: Battle, side: 0 | 1, picks: Map<string, number>) => {
  let battle = start;
  for (let steps = 0; !battle.outcome && steps < 3000; steps++) {
    const action = chooseAction(battle);
    if (!action) break;
    const actor = battle.current ? battle.units[battle.current.unitId] : undefined;
    if (actor?.side === side) picks.set(action.abilityId, (picks.get(action.abilityId) ?? 0) + 1);
    battle = applyAction(battle, action).battle;
  }
};
for (const tribe of tribes) {
  const picks = new Map<string, number>();
  for (const strength of ["medium", "strong"] as const) {
    const guards = neutralGroup(tribe, strength).map((m) => placementOf(m, undefined));
    for (const squad of squads) {
      playOut(createBattle([squad, guards]).battle, 1, picks);
      playOut(createBattle([guards, squad]).battle, 0, picks);
    }
  }
  console.log(`${tribe.padEnd(9)} ${[...picks].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id} ${n}`).join(", ")}`);
}
