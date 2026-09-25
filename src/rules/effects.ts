import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import type { EffectDef } from "#rules/battle/types";

/**
 * Effect definitions. An effect on a unit is plain data (`EffectInstance`); what it does lives here as hooks.
 * The engine never checks for a particular effect.
 */
const effects: readonly EffectDef[] = [
  {
    id: "defending",
    name: "Defending",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: {
      // Only what gets past the shield is halved (faction notes: shields "don't get bonuses from defend").
      mitigate: (_ctx, _self, packet) => {
        if (packet.amount > 0) packet.amount = Math.max(1, Math.floor(packet.amount / 2));
      },
    },
  },
  {
    id: "stunned",
    name: "Stunned",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: { turnStart: () => "skip" },
  },
  {
    id: "punished",
    name: "Punished",
    stacking: { mode: "merge", cap: PUNISHMENT_MAX_STACKS },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId || !self.effect) return;
        stats.damage -= 10 * self.effect.stacks;
        stats.initiative -= 10 * self.effect.stacks;
      },
    },
  },
  {
    id: "bleeding",
    name: "Bleeding",
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
    stacking: { mode: "unique" },
    lifetime: "untilRoundEnd",
    visibility: "public",
    hooks: { preventDeath: () => true },
  },
  {
    id: "negated",
    name: "Negated",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "hiddenFromBearerSide",
    hooks: {
      beforeAbility: (ctx, self) => {
        if (self.effect) ctx.removeEffect(self.unitId, self.effect);
        return "cancel";
      },
      aiValue: (ctx, self) => -2 * ctx.unit(self.unitId).base.damage,
    },
  },
  {
    // Shield lent by a Battery. It sits in the bearer's shield pool; on expiry whatever is left of it goes.
    id: "lent_shield",
    quiet: true,
    name: "Lent shield",
    stacking: { mode: "perSource" },
    lifetime: "untilSourceTurn",
    visibility: "public",
    hooks: {},
    onExpire: (ctx, self) => {
      const holder = ctx.unit(self.unitId);
      const lost = Math.min(self.effect?.amount ?? 0, holder.shield);
      if (lost <= 0) return;
      holder.shield -= lost;
      ctx.emit({ type: "shieldHit", unitId: holder.id, amount: lost });
    },
  },
  {
    id: "mutated",
    name: "Mutated",
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId && self.effect) stats.damage += 10 * self.effect.stacks;
      },
      aiValue: (_ctx, self) => 15 * (self.effect?.stacks ?? 0),
    },
  },
  {
    // A pool that only soaks fire (the user's example of a typed shield). Not on any unit yet; items and spells
    // will grant it.
    id: "fire_shield",
    name: "Fire shield",
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    absorbPriority: 10,
    hooks: {
      absorb: (ctx, self, packet) => {
        const pool = self.effect;
        if (!pool || packet.type !== "fire" || packet.amount <= 0) return;
        const taken = Math.min(pool.amount, packet.amount);
        pool.amount -= taken;
        packet.amount -= taken;
        ctx.emit({ type: "absorbed", unitId: self.unitId, amount: taken, by: "fire_shield" });
        if (pool.amount <= 0) ctx.removeEffect(self.unitId, pool);
      },
      aiValue: (_ctx, self) => 0.5 * (self.effect?.amount ?? 0),
    },
  },
  {
    // Context from the world: the side owns a Blacksmith node. Its damaging abilities hit harder.
    id: "blacksmith",
    quiet: true,
    name: "Blacksmith",
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (_ctx, self, packet) => {
        if (packet.tags.includes("damage")) packet.amount += self.effect?.amount ?? 0;
      },
    },
  },
];

export const EFFECTS: ReadonlyMap<string, EffectDef> = new Map(effects.map((e) => [e.id, e]));

export function effectDef(id: string): EffectDef {
  const found = EFFECTS.get(id);
  if (!found) throw new Error(`unknown effect: ${id}`);
  return found;
}
