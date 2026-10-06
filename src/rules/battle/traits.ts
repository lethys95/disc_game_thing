import { behavior, paramsOf } from "#rules/abilities/index";
import type { Ctx, Trait } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

/**
 * The traits on one unit: its effects first, then its passive abilities (own and granted). Effects come first so
 * that, for example, an existing reprieve prevents a death before a once-per-combat ability spends its charge.
 * The context caches them (`Ctx.traits`); this builds them.
 */
export function buildTraits(ctx: Ctx, unitId: string): Trait[] {
  const unit = ctx.unit(unitId);
  const traits: Trait[] = unit.effects.map((effect) => {
    const def = effectDef(effect.def);
    return { hooks: def.hooks, self: { unitId, params: {}, effect }, absorbPriority: def.absorbPriority ?? 0 };
  });
  for (const id of ctx.abilityIds(unitId)) {
    const b = behavior(id);
    if (b.kind !== "passive") continue;
    const ref = ctx.abilityRef(unitId, id);
    traits.push({ hooks: b.hooks, self: { unitId, params: paramsOf(ref, ctx.abilityPower(unitId)), effect: null }, absorbPriority: 0 });
  }
  return traits;
}

export const traitsOn = (ctx: Ctx, unitId: string): readonly Trait[] => ctx.traits(unitId);

/** Every trait on the battlefield: what stats, grants and restrictions ask, so auras can reach other units. */
export const allTraits = (ctx: Ctx): readonly Trait[] => ctx.allTraits();
