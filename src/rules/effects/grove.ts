import type { EffectDef, Ctx } from "#rules/battle/types";
import { flatStat } from "#rules/effects/shared";

/** Witherbloom: the most an enemy withers from hitting a blooming unit, over the whole combat. */
export const WITHERBLOOM_CAP = 15;

/** An enemy withers: `amount` less damage for the rest of combat, adding up to `cap` (Withering, Witherbloom). */
export function wither(ctx: Ctx, targetId: string, amount: number, cap: number, source: string): void {
  const withered = ctx.unit(targetId).effects.find((e) => e.def === "withered");
  if (withered) withered.amount = Math.min(cap, withered.amount + amount);
  else ctx.addEffect(targetId, { def: "withered", amount: Math.min(cap, amount), source });
}

/** The Grove's effects (user's design, 2026-09-29; numbers provisional #57; `abilities/grove.ts`). */
export const GROVE_EFFECTS: readonly EffectDef[] = [
  // The Grove (user's design, 2026-09-29; numbers provisional #57).
  {
    // Decay: damage that rotted in instead of landing, lost evenly over the bearer's next turns (`stacks` of them).
    id: "rotting",
    name: "Rotting",
    describe: (e) => `${e.amount} damage rots in it, lost over its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const rot = self.effect;
        if (!rot || rot.amount <= 0) return null;
        const tick = Math.ceil(rot.amount / Math.max(1, rot.stacks));
        rot.amount -= tick;
        rot.stacks = Math.max(1, rot.stacks - 1);
        ctx.lose(self.unitId, tick, null);
        if (rot.amount <= 0) ctx.removeEffect(self.unitId, rot);
        return null;
      },
    },
  },
  {
    // Corpse explosion: a fungal infestation, damage at the start of each of the bearer's turns while it lasts.
    id: "infested",
    name: "Infested",
    describe: (e) => `Loses ${e.amount} HP at the start of each of its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"} (a fungal infestation).`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const infestation = self.effect;
        if (!infestation) return null;
        ctx.lose(self.unitId, infestation.amount, infestation.source);
        infestation.stacks -= 1;
        if (infestation.stacks <= 0) ctx.removeEffect(self.unitId, infestation);
        return null;
      },
    },
  },
  {
    // Cycle on an enemy: part of the damage heals back at the start of its next turn.
    id: "healing_back",
    name: "Healing back",
    describe: (e) => `Heals ${e.amount} at the start of its next turn.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        if (self.effect) {
          ctx.heal(self.unitId, self.effect.amount);
          ctx.removeEffect(self.unitId, self.effect);
        }
        return null;
      },
    },
  },
  {
    // Spiritwalk (user, 2026-09-29): off the field, invulnerable because untargetable, unable to act; it comes
    // back healed. Double-edged: on an enemy it's a banish that heals them; on an ally, a rescue that benches them.
    id: "spiritwalking",
    name: "Spiritwalking",
    describe: (e) => `Walks among the spirits: not on the field, can't act or be hit. Returns in ${e.stacks} round${e.stacks === 1 ? "" : "s"}, healed ${e.amount}% of its max HP.`,
    stacking: { mode: "unique" },
    lifetime: "rounds",
    visibility: "public",
    absent: true,
    hooks: {},
    onExpire: (ctx, self) => ctx.heal(self.unitId, Math.round((ctx.stats(self.unitId).maxHp * (self.effect?.amount ?? 0)) / 100)),
  },
  flatStat({ id: "gorged", name: "Gorged", stat: "hitBonus", stacking: { mode: "merge" }, describe: (e) => `Deals ${e.amount} more damage (fed on the dead).` }),
  flatStat({ id: "withered", name: "Withered", stat: "hitBonus", sign: -1, stacking: { mode: "unique" }, describe: (e) => `Deals ${e.amount} less damage (withered by a Decay unit).` }),
  {
    // Mend: heals at the start of each of the bearer's turns while it lasts (`stacks` turns).
    id: "mending",
    name: "Mending",
    describe: (e) => `Regrows ${e.amount} HP at the start of each of its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"}.`,
    // One per healer: HoTs from different units run side by side (and a Burst mend consumes them all).
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const mend = self.effect;
        if (!mend) return null;
        ctx.heal(self.unitId, mend.amount);
        mend.stacks -= 1;
        if (mend.stacks <= 0) ctx.removeEffect(self.unitId, mend);
        return null;
      },
    },
  },
  {
    // Witherbloom (Decay support 2): while it blooms, an enemy that hits its bearer withers. Its heal is a `mending`.
    id: "witherblooming",
    name: "Witherbloom",
    applies: ["withered"],
    describe: (e) => `For its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"}, an enemy that hits it withers: ${e.amount} less damage for the rest of combat, up to ${WITHERBLOOM_CAP} less.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      incoming: (ctx, self, packet) => {
        const source = packet.source;
        if (!source || !self.effect || packet.amount <= 0 || ctx.unit(source).side === ctx.unit(self.unitId).side) return;
        wither(ctx, source, self.effect.amount, WITHERBLOOM_CAP, self.effect.source ?? self.unitId);
      },
      turnStart: (ctx, self) => {
        const bloom = self.effect;
        if (!bloom) return null;
        bloom.stacks -= 1;
        if (bloom.stacks <= 0) ctx.removeEffect(self.unitId, bloom);
        return null;
      },
    },
  },
];
