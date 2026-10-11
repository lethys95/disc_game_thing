import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import type { Ctx, EffectDef, TraitSelf } from "#rules/battle/types";
import { SUPPORT_TURN_AI_VALUE, weakened, armorUntilOwnTurn } from "#rules/effects/shared";

/** Punishment's per-stack penalty to damage and initiative. */
export const PUNISHED_PER_STACK = 10;

/**
 * Repentance (the user, 2026-10-06): out of the fight for `stacks` turns, "wakes up early if damaged or healed by
 * anyone or anything".
 */
function repentant(): EffectDef {
  const wake = (ctx: Ctx, self: TraitSelf) => {
    const effect = self.effect;
    if (effect && ctx.unit(self.unitId).effects.includes(effect)) ctx.removeEffect(self.unitId, effect);
  };
  return {
    id: "repentant",
    name: "Repentant",
    describe: (e) => `Out of the fight for ${e.stacks} more turn${e.stacks === 1 ? "" : "s"}. Anything that damages or heals it wakes it.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const effect = self.effect;
        // A burn ticking first may have woken it already.
        if (!effect || !ctx.unit(self.unitId).effects.includes(effect)) return null;
        effect.stacks -= 1;
        if (effect.stacks <= 0) ctx.removeEffect(self.unitId, effect);
        return "skip";
      },
      incoming: (ctx, self, packet) => {
        if (packet.amount > 0) wake(ctx, self);
      },
      hurt: wake,
      healing: (ctx, self, heal) => {
        if (heal.amount > 0) wake(ctx, self);
      },
      aiValue: (ctx, self) => -ctx.strongestHit(self.unitId) * (self.effect?.stacks ?? 1),
    },
  };
}

/** Jilliath's effects (`abilities/jilliath.ts`). */
export const JILLIATH_EFFECTS: readonly EffectDef[] = [
  {
    id: "punished",
    name: "Punished",
    describe: (e) => `−${PUNISHED_PER_STACK * e.stacks} damage and −${PUNISHED_PER_STACK * e.stacks} initiative for the rest of combat (at most ${PUNISHMENT_MAX_STACKS} stacks).`,
    stacking: { mode: "merge", cap: PUNISHMENT_MAX_STACKS },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId || !self.effect) return;
        stats.hitBonus -= PUNISHED_PER_STACK * self.effect.stacks;
        stats.initiative -= PUNISHED_PER_STACK * self.effect.stacks;
      },
    },
  },
  {
    id: "bleeding",
    name: "Bleeding",
    describe: (e) => `Loses ${e.amount} HP at the start of each of its turns.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        ctx.lose(self.unitId, self.effect?.amount ?? 0, null);
        return null;
      },
    },
  },
  {
    id: "deathward",
    quiet: true,
    name: "Spared by death",
    describe: () => "Cannot drop below 1 HP until the round ends.",
    stacking: { mode: "unique" },
    lifetime: "untilRoundEnd",
    visibility: "public",
    hooks: { preventDeath: () => true },
  },
  // The Jilliath support line, the guardian angels (`abilities/jilliath.ts`).
  armorUntilOwnTurn("guardians_shield", "Guardian's Shield"),
  armorUntilOwnTurn("prayed", "Prayer"),
  // The Jilliath mage line (`abilities/jilliath.ts`).
  weakened("castigated", "Castigated"),
  repentant(),
  {
    // An ally that fed Burn at the stake: its turn went into the fire.
    id: "gave_turn",
    name: "Gave its turn",
    describe: () => "Gave its next turn to Burn at the stake.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: { turnStart: () => "skip", aiValue: (ctx, self) => -Math.max(ctx.strongestHit(self.unitId), SUPPORT_TURN_AI_VALUE) },
  },
];
