import type { Battle, BattleEvent, Side } from "#rules/types";

/**
 * What a player may see: a Justiciar's mark on their own units, and whom an enemy Justiciar marked, stay secret
 * until the mark fires.
 */
export function masked(events: readonly BattleEvent[], battle: Battle, playerSide: Side | null): BattleEvent[] {
  if (playerSide === null) return [...events];
  const own = (id: string) => battle.units[id]?.side === playerSide;
  return events.flatMap((e): BattleEvent[] => {
    if (e.type === "effect" && e.effect === "negated" && own(e.unitId)) return [];
    if (e.type === "ability" && e.abilityId === "negate" && !own(e.unitId)) return [{ ...e, targets: [] }];
    return [e];
  });
}

/** The battle as the player knows it: without secret marks on their own units. */
export function asKnown(battle: Battle, playerSide: Side | null): Battle {
  if (playerSide === null) return battle;
  const units = Object.fromEntries(
    Object.entries(battle.units).map(([id, u]) => [id, u.side === playerSide ? { ...u, effects: u.effects.filter((e) => e.kind !== "negated") } : u]),
  );
  return { ...battle, units };
}
