import type { EffectDef } from "#rules/battle/types";
import { CORE_EFFECTS } from "#rules/effects/core";
import { JILLIATH_EFFECTS } from "#rules/effects/jilliath";
import { NEXUS_EFFECTS } from "#rules/effects/nexus";
import { GROVE_EFFECTS } from "#rules/effects/grove";
import { KEYWORDS_EFFECTS } from "#rules/effects/keywords";
import { NEUTRAL_EFFECTS } from "#rules/effects/neutral";
import { WORLD_EFFECTS } from "#rules/effects/world";

/**
 * Effect definitions, by faction (`effects/<faction>.ts`). An effect on a unit is plain data (`EffectInstance`); what it
 * does lives in its definition as hooks. The engine never checks for a particular effect.
 */
const effects: readonly EffectDef[] = [...CORE_EFFECTS, ...JILLIATH_EFFECTS, ...NEXUS_EFFECTS, ...GROVE_EFFECTS, ...KEYWORDS_EFFECTS, ...NEUTRAL_EFFECTS, ...WORLD_EFFECTS];

export const EFFECTS: ReadonlyMap<string, EffectDef> = new Map(
  effects.map((e) => {
    if (effects.filter((other) => other.id === e.id).length > 1) throw new Error(`effect "${e.id}" is defined twice`);
    return [e.id, e];
  }),
);

export function effectDef(id: string): EffectDef {
  const found = EFFECTS.get(id);
  if (!found) throw new Error(`unknown effect: ${id}`);
  return found;
}
