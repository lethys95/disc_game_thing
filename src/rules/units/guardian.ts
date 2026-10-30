import { kit } from "#rules/units/kit";
import type { UnitDef } from "#rules/battle/types";
import type { Playable } from "#rules/units/index";

/**
 * A faction's Capitol Guardian (canon: exists, never leaves the Capitol, its fall ends the game). Each faction has its
 * own, doing "largely the same" (the user, 2026-10-26); until the user sets them apart they share this one stat line.
 * The name is a placeholder until the user names each.
 */
export const capitolGuardian = (id: string, faction: Playable): UnitDef => ({
  id, name: "Capitol Guardian", faction, tier: 0,
  // Provisional, tuned by simulation: beats early and most mid armies, falls to fully evolved ones.
  stats: { maxHp: 1500, shield: 0, armor: 25, initiative: 60, abilityPower: 100 },
  abilities: [{ id: "attack", params: { power: 80 } }, ...kit("defend", "wait")],
});
