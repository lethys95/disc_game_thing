import type { EffectDef, EffectInstance, Stacking, Stats } from "#rules/battle/types";

/** Shapes and weights shared by every faction's effects. */

/** What a point of each stat is worth to the AI, roughly in health. Rough, provisional. */
export const STAT_WORTH: Readonly<Record<keyof Stats, number>> = { maxHp: 0.5, shield: 0.5, hitBonus: 2, hitPercent: 0.4, armor: 3, initiative: 1, abilityPower: 0.5 };

/** What the AI thinks a healer's or caster's turn is worth: about one heal (provisional #63). */
export const SUPPORT_TURN_AI_VALUE = 25;

/** The bearer loses its next turn, unless something hurts it first: then it wakes and keeps its place in the queue. */
export function lostUntilHurt(id: string, name: string): EffectDef {
  return {
    id,
    name,
    describe: () => "Loses its next turn, unless it is hurt before then.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: {
      turnStart: () => "skip",
      incoming: (ctx, self, packet) => {
        if (packet.amount > 0 && self.effect) ctx.removeEffect(self.unitId, self.effect);
      },
      aiValue: (ctx, self) => -ctx.strongestHit(self.unitId),
    },
  };
}

/** Less damage for the bearer's next few turns (`stacks`, counted down as each starts): a curse, a castigation. */
export function weakened(id: string, name: string): EffectDef {
  return {
    id,
    name,
    describe: (e) => `Deals ${e.amount}% less damage for ${e.stacks} more turn${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.hitPercent -= self.effect?.amount ?? 0;
      },
      turnStart: (ctx, self) => {
        const curse = self.effect;
        if (!curse) return null;
        if (curse.stacks <= 0) ctx.removeEffect(self.unitId, curse);
        else curse.stacks -= 1;
        return null;
      },
      aiValue: (ctx, self) => -((ctx.strongestHit(self.unitId) * (self.effect?.amount ?? 0)) / 100) * STAT_WORTH.hitBonus * Math.max(1, self.effect?.stacks ?? 1),
    },
  };
}

/** More armor until the bearer's next turn starts: a guardian angel's shield, a Shepherd's prayer. */
export function armorUntilOwnTurn(id: string, name: string): EffectDef {
  return {
    id,
    name,
    describe: (e) => `+${e.amount} armor until its next turn.`,
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.armor += self.effect?.amount ?? 0;
      },
      aiValue: (_ctx, self) => (self.effect?.amount ?? 0) * STAT_WORTH.armor,
    },
  };
}

/**
 * An effect that adds its `amount` (or with `sign` -1, takes it away) to one stat of its bearer for the battle: the
 * shape of most world-made bonuses (items, upgrades, walls, spells).
 */
export function flatStat(def: {
  readonly id: string;
  readonly name: string;
  readonly stat: keyof Stats;
  readonly sign?: 1 | -1;
  readonly stacking: Stacking;
  readonly quiet?: boolean;
  describe(effect: EffectInstance): string;
}): EffectDef {
  const sign = def.sign ?? 1;
  return {
    id: def.id,
    name: def.name,
    describe: def.describe,
    stacking: def.stacking,
    lifetime: "battle",
    visibility: "public",
    ...(def.quiet ? { quiet: true } : {}),
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats[def.stat] += sign * (self.effect?.amount ?? 0);
      },
      // The AI weighs a stat change by how much a point of it tends to matter (2026-10-05: the AI knows every mechanic).
      aiValue: (_ctx, self) => sign * (self.effect?.amount ?? 0) * STAT_WORTH[def.stat],
    },
  };
}
