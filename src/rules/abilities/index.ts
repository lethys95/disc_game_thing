import { core } from "#rules/abilities/core";
import { jilliath } from "#rules/abilities/jilliath";
import { neutral } from "#rules/abilities/neutral";
import { nexus } from "#rules/abilities/nexus";
import type { AbilityRef, Behavior, Params } from "#rules/battle/types";

export const BEHAVIORS: Readonly<Record<string, Behavior>> = { ...core, ...jilliath, ...nexus, ...neutral };

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
