import type { EffectDef } from "#rules/battle/types";


/** Mutate's per-stack damage bonus. */
export const MUTATED_PER_STACK = 10;

/** Ral-Vitahl's effects (`abilities/nexus.ts`). */
export const NEXUS_EFFECTS: readonly EffectDef[] = [
  {
    // A Justiciar's Counter; a Backlasher's Backlash also hurts the unit it cancels (`amount`).
    id: "countered",
    name: "Countered",
    describe: (e) => `The next ability it uses will be cancelled${e.amount > 0 ? `, and the backlash deals ${e.amount} to it` : ""}.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "secret",
    hooks: {
      beforeAbility: (ctx, self) => {
        const mark = self.effect;
        if (!mark) return "cancel";
        ctx.removeEffect(self.unitId, mark);
        if (mark.amount > 0) ctx.hit(mark.source ?? self.unitId, [self.unitId], { power: mark.amount, type: mark.source ? ctx.damageTypeOf(mark.source, "counter") : "weapon", tags: ["spell", "damage"] });
        return "cancel";
      },
      aiValue: (ctx, self) => -2 * ctx.strongestHit(self.unitId) - (self.effect?.amount ?? 0),
    },
  },
  {
    // An Etherborn's Negate: the next damage or healing to reach it is turned around, once.
    id: "negated",
    name: "Negated",
    describe: () => "The next damage it would take heals it instead, and the next healing it would get (shields too) hurts it instead. Once.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "secret",
    hooks: {
      // Before armor and shields: the whole hit turns into healing.
      incoming: (ctx, self, packet) => {
        const mark = self.effect;
        if (!mark || packet.amount <= 0) return;
        const amount = packet.amount;
        packet.amount = 0;
        ctx.removeEffect(self.unitId, mark);
        ctx.heal(self.unitId, amount);
      },
      healing: (ctx, self, heal) => {
        const mark = self.effect;
        if (!mark || heal.amount <= 0) return;
        const amount = heal.amount;
        heal.amount = 0;
        ctx.removeEffect(self.unitId, mark);
        if (heal.pool === "hp") ctx.lose(self.unitId, amount, mark.source);
        else {
          const unit = ctx.unit(self.unitId);
          const drained = Math.min(amount, unit.shield);
          unit.shield -= drained;
          if (drained > 0) ctx.emit({ type: "shieldHit", unitId: unit.id, amount: drained });
        }
      },
      // Mostly a unit expects to be hit rather than healed: the next enemy hit swings from a loss to a gain.
      aiValue: (ctx, self) => {
        const bearer = ctx.unit(self.unitId);
        const enemies = ctx.living(bearer.side === 0 ? 1 : 0);
        const hit = enemies.reduce((sum, u) => sum + ctx.strongestHit(u.id), 0) / Math.max(1, enemies.length);
        return 2 * hit;
      },
    },
  },
  {
    // An Etherborn's Absorb on an enemy: its next hit is weaker, and the Etherborn drinks what was held back.
    id: "absorbing_hit",
    name: "Absorbed (its next hit)",
    describe: (e) => `Its next hit deals ${e.amount} less; whoever absorbed it heals by what was prevented.`,
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        const mark = self.effect;
        if (!mark || packet.amount <= 0 || !packet.tags.includes("damage")) return;
        const prevented = Math.min(mark.amount, packet.amount);
        packet.amount -= prevented;
        ctx.removeEffect(self.unitId, mark);
        if (mark.source) ctx.heal(mark.source, prevented);
      },
      aiValue: (_ctx, self) => -(self.effect?.amount ?? 0),
    },
  },
  {
    // An Etherborn's Absorb on an ally: the next hit on it is softened, and the Etherborn drinks what was held back.
    id: "absorbing_guard",
    name: "Absorbed (next hit on it)",
    describe: (e) => `The next hit on it deals ${e.amount} less; whoever absorbed it heals by what was prevented.`,
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      incoming: (ctx, self, packet) => {
        const mark = self.effect;
        if (!mark || packet.amount <= 0) return;
        const prevented = Math.min(mark.amount, packet.amount);
        packet.amount -= prevented;
        ctx.removeEffect(self.unitId, mark);
        if (mark.source) ctx.heal(mark.source, prevented);
      },
      aiValue: (_ctx, self) => self.effect?.amount ?? 0,
    },
  },
  {
    // A Maelstrom's Combustion: for the rest of this turn its spells don't take its action.
    id: "combusting",
    name: "Combusting",
    describe: () => "Its spells that cost charges are free actions until its turn ends.",
    stacking: { mode: "unique" },
    lifetime: "untilTurnEnd",
    visibility: "public",
    hooks: {
      castsFree: () => true,
      // Each charge it can still spend this turn is a spell that doesn't cost its action.
      aiValue: (ctx, self) => 30 * Math.min(2, ctx.unit(self.unitId).spellCharges),
    },
  },
  {
    // Shield lent by a Cyclops. It sits in the bearer's shield pool; on expiry whatever is left of it goes.
    id: "lent_shield",
    quiet: true,
    name: "Lent shield",
    describe: (e) => `${e.amount} shield lent by a Cyclops; it perishes when the Cyclops's next turn starts.`,
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
        if (subjectId === self.unitId && self.effect) stats.hitBonus += MUTATED_PER_STACK * self.effect.stacks;
      },
      aiValue: (_ctx, self) => 15 * (self.effect?.stacks ?? 0),
    },
  },
];
