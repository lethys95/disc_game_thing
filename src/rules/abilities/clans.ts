import { single } from "#rules/abilities/core";
import type { Behavior } from "#rules/battle/types";

/**
 * The barbarian clans (Claude's pitch at the user's invitation, 2026-10-11: `faction-stuff/neutrals/barbarians.md`;
 * not the barbarian faction the user may make). They test a squad's burst. Numbers provisional (#81).
 */
export const clans: Readonly<Record<string, Behavior>> = {
  /** Berserker: refuses the first killing blow, and hits harder after (Deadfire's Unbending, made brutal). */
  last_stand: {
    kind: "passive",
    name: "Last stand",
    applies: ["last_stand"],
    defaults: { bonus: 15 },
    scales: ["bonus"],
    describe: (p) => `Once per combat, the first blow that would kill it leaves it at 1 HP, and it deals ${p["bonus"]} more for the rest of the battle.`,
    hooks: {
      preventDeath: (ctx, self) => {
        if (ctx.unit(self.unitId).effects.some((e) => e.def === "last_stand")) return false;
        ctx.addEffect(self.unitId, { def: "last_stand", amount: self.params["bonus"] ?? 0, source: self.unitId });
        return true;
      },
      aiValue: (ctx, self) => (ctx.unit(self.unitId).effects.some((e) => e.def === "last_stand") ? 0 : 20),
    },
  },

  /** Spearwarden: while it defends, every melee hit on it is paid for. */
  set_spears: {
    kind: "passive",
    name: "Set spears",
    defaults: { power: 15 },
    scales: ["power"],
    describe: (p) => `While defending, every melee hit on it deals ${p["power"]} back to the attacker.`,
    hooks: {
      incoming: (ctx, self, packet) => {
        if (packet.target !== self.unitId || !packet.source || packet.amount <= 0 || !packet.tags.includes("melee")) return;
        if (ctx.unit(self.unitId).effects.some((e) => e.def === "defending") && ctx.unit(packet.source).alive) ctx.lose(packet.source, self.params["power"] ?? 0, self.unitId);
      },
    },
  },

  /** Hunter: its arrows go through armor. */
  piercing_shot: {
    kind: "passive",
    name: "Piercing shot",
    describe: () => "Its ranged hits ignore armor.",
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (packet.source === self.unitId && packet.tags.includes("ranged")) packet.pierce += ctx.stats(packet.target).armor;
      },
    },
  },

  /** Shamaness: binds herself to an ally, which hits harder while half its wounds go to her. */
  blood_oath: {
    kind: "active",
    name: "Blood oath",
    applies: ["oathbound"],
    describe: (p) => `Main action: bind an ally to this unit: while it lives, the ally deals ${p["bonus"]} more and half of every wound it takes goes to this unit instead.`,
    tags: [],
    defaults: { bonus: 10 },
    scales: ["bonus"],
    choices: (ctx, self) =>
      ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => u.id !== self.unitId && !u.effects.some((e) => e.def === "oathbound" && e.source === self.unitId))
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const u of ctx.living(ctx.unit(self.unitId).side))
        for (const e of [...u.effects]) if (e.def === "oathbound" && e.source === self.unitId) ctx.removeEffect(u.id, e);
      for (const id of choice.affected) ctx.addEffect(id, { def: "oathbound", amount: self.params["bonus"] ?? 0, source: self.unitId });
    },
  },

  /** Warlord: a war cry, once a fight. */
  war_cry: {
    kind: "active",
    name: "War cry",
    applies: ["war_cried"],
    describe: (p) => `Once per combat, main action: every ally deals ${p["bonus"]} more until the end of the next round.`,
    tags: [],
    defaults: { charges: 1, bonus: 12 },
    scales: ["bonus"],
    choices: (ctx, self) => [single(ctx.unit(self.unitId), "main")],
    resolve: (ctx, self) => {
      for (const u of ctx.living(ctx.unit(self.unitId).side)) ctx.addEffect(u.id, { def: "war_cried", amount: self.params["bonus"] ?? 0, stacks: 2, source: self.unitId });
    },
  },
};
