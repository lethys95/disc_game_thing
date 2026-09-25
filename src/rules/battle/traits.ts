import { behavior, paramsOf } from "#rules/abilities/index";
import type { Ctx, Hooks, TraitSelf } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

/** A hook bundle together with whom it runs for. Passive abilities and effects are both traits. */
export interface Trait {
  readonly hooks: Hooks;
  readonly self: TraitSelf;
  readonly absorbPriority: number;
}

/**
 * The traits on one unit: its effects first, then its passive abilities (own and granted). Effects come first so
 * that, for example, an existing reprieve prevents a death before a once-per-combat ability spends its charge.
 */
export function traitsOn(ctx: Ctx, unitId: string): Trait[] {
  const unit = ctx.unit(unitId);
  const traits: Trait[] = unit.effects.map((effect) => {
    const def = effectDef(effect.def);
    return { hooks: def.hooks, self: { unitId, params: {}, effect }, absorbPriority: def.absorbPriority ?? 0 };
  });
  for (const id of ctx.abilityIds(unitId)) {
    const b = behavior(id);
    if (b.kind !== "passive") continue;
    const ref = unit.abilities.find((s) => s.ref.id === id)?.ref ?? { id };
    traits.push({ hooks: b.hooks, self: { unitId, params: paramsOf(ref), effect: null }, absorbPriority: 0 });
  }
  return traits;
}

/** Every trait on the battlefield: what stats, grants and restrictions ask, so auras can reach other units. */
export function allTraits(ctx: Ctx): Trait[] {
  return ctx.living().flatMap((u) => traitsOn(ctx, u.id));
}
