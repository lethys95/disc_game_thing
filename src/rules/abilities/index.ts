import { core } from "#rules/abilities/core";
import { drawn } from "#rules/abilities/drawn";
import { gnolls } from "#rules/abilities/gnolls";
import { grove } from "#rules/abilities/grove";
import { jilliath } from "#rules/abilities/jilliath";
import { neutral } from "#rules/abilities/neutral";
import { nexus } from "#rules/abilities/nexus";
import type { AbilityRef, Behavior, Params } from "#rules/battle/types";

const SETS: readonly Readonly<Record<string, Behavior>>[] = [core, jilliath, nexus, grove, neutral, gnolls, drawn];

/** Every ability by id. Two sets naming the same id would silently replace one (it happened: the Cleric's Mend). */
export const BEHAVIORS: Readonly<Record<string, Behavior>> = Object.assign({}, ...SETS);

/** Ability ids defined in more than one set: must be none (`tests/architecture.test.ts`). */
export const duplicateAbilityIds = (): string[] => {
  const seen = SETS.flatMap((set) => Object.keys(set));
  return seen.filter((id, i) => seen.indexOf(id) !== i);
};

export function behavior(id: string): Behavior {
  const found = BEHAVIORS[id];
  if (!found) throw new Error(`unknown ability: ${id}`);
  return found;
}

/** An ability's rules text for this unit's use of it. */
export function describeAbility(ref: AbilityRef): string {
  return behavior(ref.id).describe(paramsOf(ref));
}

/** An ability's effective params: its behavior's defaults, overridden by the unit's own. */
export function paramsOf(ref: AbilityRef): Params {
  return { ...behavior(ref.id).defaults, ...ref.params };
}
