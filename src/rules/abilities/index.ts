import { carnival } from "#rules/abilities/carnival";
import { core } from "#rules/abilities/core";
import { drawn } from "#rules/abilities/drawn";
import { gnolls } from "#rules/abilities/gnolls";
import { grove } from "#rules/abilities/grove";
import { jilliath } from "#rules/abilities/jilliath";
import { keywords } from "#rules/abilities/keywords";
import { neutral } from "#rules/abilities/neutral";
import { nexus } from "#rules/abilities/nexus";
import type { AbilityRef, Behavior, Params } from "#rules/battle/types";

const SETS: readonly Readonly<Record<string, Behavior>>[] = [core, keywords, jilliath, nexus, grove, neutral, gnolls, drawn, carnival];

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

/** An ability's rules text for this unit's use of it, at the unit's ability power. */
export function describeAbility(ref: AbilityRef, abilityPower: number): string {
  return behavior(ref.id).describe(paramsOf(ref, abilityPower));
}

/**
 * An ability's effective params: its behavior's defaults, overridden by the unit's own, with the magnitudes it
 * `scales` multiplied by the unit's ability power (percent).
 */
export function paramsOf(ref: AbilityRef, abilityPower: number): Params {
  const b = behavior(ref.id);
  const params: Record<string, number> = { ...b.defaults, ...ref.params };
  for (const key of b.scales ?? []) {
    const value = params[key];
    if (value !== undefined) params[key] = Math.round((value * abilityPower) / 100);
  }
  return params;
}

/** Uses per combat, if the ability is limited: not a magnitude, so ability power never changes it. */
export const chargesOf = (ref: AbilityRef): number | undefined => ref.params?.["charges"] ?? behavior(ref.id).defaults?.["charges"];

/** Whether any of these abilities grows with ability power: the views show the stat only where it does something. */
export const usesAbilityPower = (refs: readonly AbilityRef[]): boolean => refs.some((ref) => (behavior(ref.id).scales?.length ?? 0) > 0);
