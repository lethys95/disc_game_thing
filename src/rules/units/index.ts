import type { Faction, UnitDef } from "#rules/battle/types";
import { GROVE } from "#rules/units/grove";
import { JILLIATH } from "#rules/units/jilliath";
import { NEUTRAL_UNITS } from "#rules/units/neutral";
import { NEXUS } from "#rules/units/nexus";
import type { Archetype, Evolution, FactionUnits } from "#rules/units/types";

/**
 * Every faction unit can retreat (the user's design: surrender is a default action, and a unit that must not flee
 * simply lacks it). Neutrals and the Guardian don't.
 */
const canRetreat = (units: Readonly<Record<string, UnitDef>>): Record<string, UnitDef> =>
  Object.fromEntries(Object.entries(units).map(([id, def]) => [id, { ...def, abilities: [...def.abilities, { id: "retreat" }] }]));

export type Playable = Exclude<Faction, "neutral">;

/** Each playable faction's units and their lines (`units/<faction>.ts`). */
const FACTION_UNITS: Readonly<Record<Playable, FactionUnits>> = { jilliath: JILLIATH, nexus: NEXUS, grove: GROVE };

/** Records joined into one; an id that two of them share is refused rather than silently overwritten. */
function joined<T>(records: readonly Readonly<Record<string, T>>[]): Readonly<Record<string, T>> {
  const all: Record<string, T> = {};
  for (const record of records) {
    for (const [id, value] of Object.entries(record)) {
      if (id in all) throw new Error(`"${id}" is defined twice`);
      all[id] = value;
    }
  }
  return all;
}

const factions = Object.values(FACTION_UNITS);

export const UNITS: Readonly<Record<string, UnitDef>> = joined([...factions.map((f) => canRetreat(f.units)), NEUTRAL_UNITS]);

export const GUARDIAN_ID = "capitol_guardian";

export const FACTION_ROOTS: Readonly<Record<Playable, readonly string[]>> = { jilliath: JILLIATH.roots, nexus: NEXUS.roots, grove: GROVE.roots };
export const LINE_ARCHETYPE: Readonly<Record<string, Archetype>> = joined(factions.map((f) => f.archetype));
export const RECRUIT_COST: Readonly<Record<string, number>> = joined(factions.map((f) => f.recruitCost));
export const EVOLUTIONS: Readonly<Record<string, readonly Evolution[]>> = joined(factions.map((f) => f.evolutions));
