import { behavior } from "#rules/abilities/index";
import type { Battle, BattleEvent, Side } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

/** Visibility comes from the definitions: no effect or ability is named here. */
const secret = (abilityId: string) => {
  const b = behavior(abilityId);
  return b.kind === "active" && b.secretTarget === true;
};

/** Whether a player sees this effect: public ones always, secret ones only if their own side applied it. */
export function sees(battle: Battle, playerSide: Side | null, effect: string, source: string | null): boolean {
  if (playerSide === null || effectDef(effect).visibility === "public") return true;
  return source !== null && battle.units[source]?.side === playerSide;
}

/**
 * What a player may see: secret effects the other side applied (a Justiciar's mark, an Etherborn's Negate) and the
 * targets of enemy secret-target abilities stay out of the log and animations until they fire.
 */
export function masked(events: readonly BattleEvent[], battle: Battle, playerSide: Side | null): BattleEvent[] {
  if (playerSide === null) return [...events];
  const own = (id: string) => battle.units[id]?.side === playerSide;
  return events.flatMap((e): BattleEvent[] => {
    if ((e.type === "effect" || e.type === "effectEnded") && !sees(battle, playerSide, e.effect, e.source)) return [];
    if (e.type === "ability" && secret(e.abilityId) && !own(e.unitId)) return [{ ...e, targets: [] }];
    return [e];
  });
}

/** The battle as the player knows it: without the other side's secret effects. */
export function asKnown(battle: Battle, playerSide: Side | null): Battle {
  if (playerSide === null) return battle;
  const units = Object.fromEntries(Object.entries(battle.units).map(([id, u]) => [id, { ...u, effects: u.effects.filter((e) => sees(battle, playerSide, e.def, e.source)) }]));
  return { ...battle, units };
}
