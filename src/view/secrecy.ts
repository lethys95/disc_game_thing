import { behavior } from "#rules/abilities/index";
import type { Battle, BattleEvent, Side } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

/** Visibility comes from the definitions: no effect or ability is named here. */
const hidden = (effect: string) => effectDef(effect).visibility === "hiddenFromBearerSide";
const secret = (abilityId: string) => {
  const b = behavior(abilityId);
  return b.kind === "active" && b.secretTarget === true;
};

/**
 * What a player may see: effects hidden from their bearer's side (a Justiciar's mark) and the targets of enemy
 * secret-target abilities stay out of the log and animations until they fire.
 */
export function masked(events: readonly BattleEvent[], battle: Battle, playerSide: Side | null): BattleEvent[] {
  if (playerSide === null) return [...events];
  const own = (id: string) => battle.units[id]?.side === playerSide;
  return events.flatMap((e): BattleEvent[] => {
    if ((e.type === "effect" || e.type === "effectEnded") && hidden(e.effect) && own(e.unitId)) return [];
    if (e.type === "ability" && secret(e.abilityId) && !own(e.unitId)) return [{ ...e, targets: [] }];
    return [e];
  });
}

/** The battle as the player knows it: without secret marks on their own units. */
export function asKnown(battle: Battle, playerSide: Side | null): Battle {
  if (playerSide === null) return battle;
  const units = Object.fromEntries(
    Object.entries(battle.units).map(([id, u]) => [id, u.side === playerSide ? { ...u, effects: u.effects.filter((e) => !hidden(e.def)) } : u]),
  );
  return { ...battle, units };
}
