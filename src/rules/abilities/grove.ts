import { single } from "#rules/abilities/core";
import type { Behavior } from "#rules/battle/types";

/**
 * The Grove's melee line (the user's design, 2026-09-29: `faction-stuff/sylvan/melee.md`): regeneration at tier 1,
 * then Regrowth (more regeneration, then support) or Decay (a share of the damage it takes is delayed, then
 * enemies that hit it wither). Every number here is provisional (`provisional.md` #57).
 */
export const grove: Readonly<Record<string, Behavior>> = {
  regrowth: {
    kind: "passive",
    name: "Regrowth",
    defaults: { percent: 6 },
    describe: (p) => `At the start of each of its turns it heals ${p["percent"]}% of its max HP.`,
    hooks: {
      turnStart: (ctx, self) => {
        ctx.heal(self.unitId, Math.round((ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 100));
        return null;
      },
      aiValue: (ctx, self) => (ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 100,
    },
  },

  decay: {
    kind: "passive",
    name: "Decay",
    defaults: { percent: 40, turns: 3 },
    describe: (p) => `${p["percent"]}% of the damage that reaches it rots in instead, lost over its next ${p["turns"]} turns.`,
    hooks: {
      mitigate: (ctx, self, packet) => {
        const delayed = Math.floor((packet.amount * (self.params["percent"] ?? 0)) / 100);
        if (delayed <= 0) return;
        packet.amount -= delayed;
        const turns = self.params["turns"] ?? 3;
        const rot = ctx.unit(self.unitId).effects.find((e) => e.def === "rotting");
        if (rot) {
          rot.amount += delayed;
          rot.stacks = turns;
        } else ctx.addEffect(self.unitId, { def: "rotting", amount: delayed, stacks: turns });
      },
      aiValue: (ctx, self) => (ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 200,
    },
  },

  withering: {
    kind: "passive",
    name: "Withering",
    defaults: { amount: 5, cap: 15 },
    describe: (p) => `An enemy that hits it withers: it deals ${p["amount"]} less damage for the rest of combat, up to ${p["cap"]} less.`,
    hooks: {
      incoming: (ctx, self, packet) => {
        const source = packet.source;
        if (!source || packet.amount <= 0 || ctx.unit(source).side === ctx.unit(self.unitId).side) return;
        const amount = self.params["amount"] ?? 0;
        const cap = self.params["cap"] ?? 0;
        const withered = ctx.unit(source).effects.find((e) => e.def === "withered");
        if (withered) withered.amount = Math.min(cap, withered.amount + amount);
        else ctx.addEffect(source, { def: "withered", amount, source: self.unitId });
      },
    },
  },

  grove_mend: {
    kind: "active",
    name: "Grove mend",
    describe: (p) => `Main action: an ally (or itself) regrows ${p["amount"]} HP at the start of each of its next ${p["turns"]} turns.`,
    tags: ["heal"],
    defaults: { amount: 15, turns: 3 },
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "mending", amount: self.params["amount"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
    },
  },
};
