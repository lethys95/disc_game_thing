import { single } from "#rules/abilities/core";
import { meleeTargets } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";
import { FRENZY_TAKEN } from "#rules/effects/tribes";

/**
 * The Tuskclans (Claude's pitch at the user's invitation, 2026-10-11: `faction-stuff/neutrals/tuskclans.md`): orcs,
 * goblins and trolls that test a squad's staying power, and its fire. Every number is provisional (`provisional.md` #81).
 */
export const tusk: Readonly<Record<string, Behavior>> = {
  /** Goblin Cutthroat: goes for the wounded. */
  kick_them_down: {
    kind: "passive",
    name: "Kick them while they're down",
    defaults: { percent: 60 },
    describe: (p) => `Deals ${p["percent"]}% more to a unit below half its health.`,
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (packet.source !== self.unitId || packet.amount <= 0) return;
        const target = ctx.unit(packet.target);
        if (target.hp * 2 < ctx.stats(target.id).maxHp) packet.amount = Math.round((packet.amount * (100 + (self.params["percent"] ?? 0))) / 100);
      },
    },
  },

  /** Orc Ravager: every kill feeds it. */
  bloodlust: {
    kind: "passive",
    name: "Bloodlust",
    applies: ["bloodlusted"],
    defaults: { bonus: 8 },
    scales: ["bonus"],
    describe: (p) => `Each kill gives it ${p["bonus"]} more damage for the rest of the battle.`,
    hooks: {
      afterAttack: (ctx, self, _dealt, kills) => {
        if (kills > 0) ctx.addEffect(self.unitId, { def: "bloodlusted", amount: (self.params["bonus"] ?? 0) * kills, source: self.unitId });
      },
    },
  },

  /** Troll: knits its wounds every turn, unless fire has touched it since (Icewind Dale's trolls). */
  regenerate: {
    kind: "passive",
    name: "Regenerate",
    applies: ["seared"],
    defaults: { percent: 12 },
    describe: (p) => `At the start of each of its turns it heals ${p["percent"]}% of its max HP, unless fire hit it since its last turn.`,
    hooks: {
      incoming: (ctx, self, packet) => {
        if (packet.target === self.unitId && packet.type === "fire" && packet.amount > 0 && !ctx.unit(self.unitId).effects.some((e) => e.def === "seared"))
          ctx.addEffect(self.unitId, { def: "seared", source: packet.source ?? self.unitId });
      },
      turnStart: (ctx, self) => {
        const seared = ctx.unit(self.unitId).effects.find((e) => e.def === "seared");
        if (seared) ctx.removeEffect(self.unitId, seared);
        else ctx.heal(self.unitId, Math.round((ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 100));
        return null;
      },
      aiValue: (ctx, self) => (ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 100,
    },
  },

  /** Goblin Hexer: an ally fights harder and more recklessly. */
  frenzy: {
    kind: "active",
    name: "Frenzy",
    applies: ["frenzied"],
    describe: (p) => `Main action: an ally deals ${p["bonus"]} more damage and takes ${FRENZY_TAKEN} more until the end of the next round.`,
    tags: [],
    defaults: { bonus: 12 },
    scales: ["bonus"],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).filter((u) => u.id !== self.unitId).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const existing = ctx.unit(id).effects.find((e) => e.def === "frenzied");
        if (existing) ctx.removeEffect(id, existing);
        ctx.addEffect(id, { def: "frenzied", amount: self.params["bonus"] ?? 0, stacks: 2, source: self.unitId });
      }
    },
  },

  /** Ogre Warchief: one swing takes its target and the enemies beside it. */
  cleave: {
    kind: "active",
    name: "Cleave",
    describe: (p) => `Strike an enemy and the enemies beside it in the same row for ${p["power"]} each.`,
    tags: ["attack", "melee", "damage"],
    defaults: { power: 20 },
    scales: ["power"],
    choices: (ctx, self) =>
      meleeTargets(ctx.living(), ctx.unit(self.unitId)).map((t) => {
        const beside = ctx.living(t.side).filter((u) => u.tile.row === t.tile.row && Math.abs(u.tile.col - t.tile.col) === 1);
        return { ...single(t, "main"), affected: [t.id, ...beside.map((u) => u.id)] };
      }),
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },
};
