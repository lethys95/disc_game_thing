/**
 * How each faction's opening squad fares on the map's first targets (`pnpm tsx scripts/balance/openings.ts`): as the
 * attacker against every tribe's groups, and against the other factions' opening squads. Written for the gameplay
 * audit (2026-10-06, `docs/design/audit-2026-10-06.md`): in whole AI games the side that can take more fights early
 * snowballs, and Ral-Vitahl attacked about 2.5 times as often as Jilliath.
 */
import { autoplay } from "#rules/ai";
import { createBattle } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import { FACTIONS } from "#rules/factions";
import type { Playable } from "#rules/units/index";
import { FORMATIONS } from "#rules/units/presets";
import { placementOf } from "#rules/world/record";
import { neutralGroup, TRIBES } from "#rules/world/state";
import type { Strength } from "#rules/world/state";

const strengths: readonly Strength[] = ["weak", "medium", "strong"];
const factions = Object.keys(FACTIONS).filter((f): f is Playable => f in FACTIONS);
const opening = (faction: Playable): readonly Placement[] => FORMATIONS[faction][0]?.squad ?? [];

/** The attacker (side 0) wins, and how much of its health it keeps. */
function attack(attacker: readonly Placement[], defender: readonly Placement[]): { won: boolean; kept: number } {
  const done = autoplay(createBattle([attacker, defender]).battle);
  const mine = Object.values(done.units).filter((u) => u.side === 0);
  const max = mine.reduce((sum, u) => sum + u.base.maxHp, 0);
  const left = mine.reduce((sum, u) => sum + Math.max(0, u.hp), 0);
  return { won: done.outcome?.winner === 0, kept: max === 0 ? 0 : left / max };
}

for (const faction of factions) {
  const rows: string[] = [];
  for (const tribe of TRIBES) {
    const cells = strengths.map((strength) => {
      const { won, kept } = attack(opening(faction), neutralGroup(tribe, strength).map((m) => placementOf(m, undefined)));
      return won ? `won (${Math.round(kept * 100)}% left)` : "lost";
    });
    rows.push(`  ${tribe.padEnd(9)} ${cells.join(" · ")}`);
  }
  for (const other of factions) {
    const { won, kept } = attack(opening(faction), opening(other));
    rows.push(`  vs ${FACTIONS[other].name.padEnd(10)} ${won ? `won (${Math.round(kept * 100)}% left)` : "lost"}`);
  }
  console.log(`${FACTIONS[faction].name} (${opening(faction).map((p) => p.defId).join(", ")})\n${rows.join("\n")}`);
}
