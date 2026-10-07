import { carnival } from "#rules/abilities/carnival";
import { core } from "#rules/abilities/core";
import { drawn } from "#rules/abilities/drawn";
import { gnolls } from "#rules/abilities/gnolls";
import { grove } from "#rules/abilities/grove";
import { jilliath } from "#rules/abilities/jilliath";
import { keywords } from "#rules/abilities/keywords";
import { neutral } from "#rules/abilities/neutral";
import { nexus } from "#rules/abilities/nexus";
import type { AbilityRef, Behavior, DamageType, Params, UnitDef } from "#rules/battle/types";

const SETS: readonly Readonly<Record<string, Behavior>>[] = [core, keywords, jilliath, nexus, grove, neutral, gnolls, drawn, carnival];

/** Every ability by id. Two sets naming the same id would silently replace one (it happened: the Jilliath support's Mend). */
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

/** A stretch of rules text: plain, or a number ability power grew (`base` is its value at 100). */
export type TextPart = { readonly text: string } | { readonly text: string; readonly base: number; readonly abilityPower: number };

/** Stands in for a scaled number while the text is written, so it can be found again. Far above any real number. */
const MARKER = 987_000;

/**
 * An ability's rules text in parts, its scaled numbers marked: the text is written once with each scaled param
 * replaced by a marker, which is then swapped back for the real number.
 */
export function describeParts(ref: AbilityRef, abilityPower: number): TextPart[] {
  const b = behavior(ref.id);
  const scaled = paramsOf(ref, abilityPower);
  const base = paramsOf(ref, 100);
  const keys = (b.scales ?? []).filter((key) => scaled[key] !== undefined);
  const marked: Record<string, number> = { ...scaled };
  keys.forEach((key, i) => (marked[key] = MARKER + i));
  const parts: TextPart[] = [];
  for (const piece of b.describe(marked).split(new RegExp(`(${keys.map((_, i) => MARKER + i).join("|") || "$^"})`))) {
    const key = keys[Number(piece) - MARKER];
    if (key === undefined) parts.push({ text: piece });
    else parts.push({ text: String(scaled[key]), base: base[key] ?? 0, abilityPower });
  }
  return parts.filter((part) => part.text !== "");
}

/** Uses per combat, if the ability is limited: not a magnitude, so ability power never changes it. */
export const chargesOf = (ref: AbilityRef): number | undefined => ref.params?.["charges"] ?? behavior(ref.id).defaults?.["charges"];


/** A unit type's hardest hit, from its damaging abilities at its ability power (cards, the codex, XP worth). */
export function strongestHitOf(def: UnitDef): number {
  const hits = def.abilities.flatMap((ref) => {
    const b = behavior(ref.id);
    const power = b.kind === "active" && b.tags.includes("damage") ? paramsOf(ref, def.stats.abilityPower)["power"] : undefined;
    return power === undefined ? [] : [power];
  });
  return Math.max(0, ...hits);
}

/** The damage types a unit type's abilities deal, other than weapon: what its card and figure show. */
export function elementsOf(def: UnitDef): DamageType[] {
  const types = def.abilities.flatMap((ref) => {
    const b = behavior(ref.id);
    return b.kind === "active" && b.tags.includes("damage") ? [ref.damageType ?? b.damageType ?? "weapon"] : [];
  });
  return [...new Set(types)].filter((t) => t !== "weapon");
}
