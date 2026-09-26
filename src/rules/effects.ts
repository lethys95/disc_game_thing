import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import type { EffectDef } from "#rules/battle/types";

/** Punishment's per-stack penalty to damage and initiative. */
export const PUNISHED_PER_STACK = 10;
/** Mutate's per-stack damage bonus. */
export const MUTATED_PER_STACK = 10;

/**
 * Effect definitions. An effect on a unit is plain data (`EffectInstance`); what it does lives here as hooks.
 * The engine never checks for a particular effect.
 */
const effects: readonly EffectDef[] = [
  {
    id: "defending",
    name: "Defending",
    describe: () => "Damage that gets past its shield is halved until this unit's next turn.",
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
    describe: () => "Loses its next turn.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: { turnStart: () => "skip" },
  },
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
        stats.damage -= PUNISHED_PER_STACK * self.effect.stacks;
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
  {
    id: "negated",
    name: "Negated",
    describe: () => "The next ability it uses will be cancelled.",
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
    describe: (e) => `${e.amount} shield lent by a Battery; it perishes when the Battery's next turn starts.`,
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
    describe: (e) => `+${MUTATED_PER_STACK * e.stacks} damage for the rest of combat.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId && self.effect) stats.damage += MUTATED_PER_STACK * self.effect.stacks;
      },
      aiValue: (_ctx, self) => 15 * (self.effect?.stacks ?? 0),
    },
  },
  {
    // A pool that only soaks fire (the user's example of a typed shield). Not on any unit yet; items and spells
    // will grant it.
    id: "fire_shield",
    name: "Fire shield",
    describe: (e) => `Absorbs the next ${e.amount} fire damage.`,
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
    describe: (e) => `Damaging abilities deal +${e.amount} (from a Blacksmith this side holds).`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (_ctx, self, packet) => {
        if (packet.tags.includes("damage")) packet.amount += self.effect?.amount ?? 0;
      },
    },
  },
  {
    // A bought unit-type upgrade (placeholder content until the user designs unique ones).
    id: "extra_damage",
    quiet: true,
    name: "Extra damage",
    describe: (e) => `+${e.amount} damage.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.damage += self.effect?.amount ?? 0;
      },
    },
  },
  {
    // Levels past the end of a line (pillars.md): a share of the base stat, so higher tiers gain more per level.
    id: "veteran",
    quiet: true,
    name: "Veteran",
    describe: (e) => `+${e.amount}% of its base max HP and damage.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId) return;
        const base = ctx.unit(subjectId).base;
        const share = (self.effect?.amount ?? 0) / 100;
        stats.maxHp += Math.round(base.maxHp * share);
        stats.damage += Math.round(base.damage * share);
      },
    },
  },
  {
    // From the leader tree: the leader's own extra health.
    id: "extra_health",
    quiet: true,
    name: "Extra health",
    describe: (e) => `+${e.amount}% of its base max HP.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      // Percentages add a share of the base stat, so they don't depend on the order hooks run in.
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.maxHp += Math.round((ctx.unit(subjectId).base.maxHp * (self.effect?.amount ?? 0)) / 100);
      },
    },
  },
  {
    // From the leader tree: while the leader stands, its allies hit harder.
    id: "leader_aura",
    quiet: true,
    name: "Leader's aura",
    describe: (e) => `While this leader stands, its side's units deal +${e.amount}% of their base damage.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const subject = ctx.unit(subjectId);
        if (subject.side === ctx.unit(self.unitId).side) stats.damage += Math.round((subject.base.damage * (self.effect?.amount ?? 0)) / 100);
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
