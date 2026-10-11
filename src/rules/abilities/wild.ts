import { single } from "#rules/abilities/core";
import { opponent } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";

/**
 * The Wild (Claude's pitch at the user's invitation, 2026-10-11: `faction-stuff/neutrals/wildlife.md`): beasts that
 * test a squad's back row. Every number is provisional (`provisional.md` #81).
 */
export const wild: Readonly<Record<string, Behavior>> = {
  /** Grey Wolf, Old Grey: leaps from anywhere in its squad to any enemy within a column of it (the line means nothing to it). */
  pounce: {
    kind: "active",
    name: "Pounce",
    describe: (p) => `Leap and bite an enemy for ${p["power"]}: any enemy within one column of it (or the nearest, if none is), front or back row, from anywhere in its own squad.`,
    tags: ["attack", "melee", "damage"],
    defaults: { power: 20 },
    scales: ["power"],
    choices: (ctx, self) => {
      const me = ctx.unit(self.unitId);
      const enemies = ctx.living(opponent(me.side));
      // As melee does (`meleeTargets`): when no enemy is within a column, the nearest ones are in reach.
      const distance = (u: (typeof enemies)[number]) => Math.abs(u.tile.col - me.tile.col);
      const reach = Math.max(1, Math.min(...enemies.map(distance)));
      return enemies.filter((u) => distance(u) <= reach).map((u) => single(u, "main"));
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },

  /** Boar: its tusks leave wounds that keep bleeding. */
  gore: {
    kind: "passive",
    name: "Gore",
    applies: ["gored"],
    defaults: { bleed: 5 },
    scales: ["bleed"],
    describe: (p) => `The unit it hits bleeds ${p["bleed"]} at the start of each of its turns for the rest of the battle; more gores add up.`,
    hooks: {
      afterHit: (ctx, self, targetId, dealt) => {
        if (dealt > 0 && ctx.unit(targetId).alive) ctx.addEffect(targetId, { def: "gored", amount: self.params["bleed"] ?? 0, source: self.unitId });
      },
    },
  },

  /** Cave Bear: below half its health it mauls. */
  wounded_fury: {
    kind: "passive",
    name: "Wounded fury",
    defaults: { percent: 60 },
    describe: (p) => `Below half its health it deals ${p["percent"]}% more damage.`,
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const me = ctx.unit(self.unitId);
        if (subjectId === self.unitId && me.hp * 2 < me.base.maxHp) stats.hitPercent += self.params["percent"] ?? 0;
      },
    },
  },

  /** Carrion Murder: the crows go for the eyes. */
  peck_the_eyes: {
    kind: "passive",
    name: "Peck the eyes",
    applies: ["pecked"],
    defaults: { percent: 30 },
    describe: (p) => `The unit it hits deals ${p["percent"]}% less damage on its next turn.`,
    hooks: {
      afterHit: (ctx, self, targetId, dealt) => {
        if (dealt <= 0 || !ctx.unit(targetId).alive) return;
        const existing = ctx.unit(targetId).effects.find((e) => e.def === "pecked");
        if (existing) existing.stacks = 1;
        else ctx.addEffect(targetId, { def: "pecked", amount: self.params["percent"] ?? 0, stacks: 1, source: self.unitId });
      },
    },
  },

  /** Old Grey: the howl, once a fight: every ally's next hit bites deeper. */
  howl: {
    kind: "active",
    name: "Howl",
    applies: ["howled"],
    describe: (p) => `Once per combat, main action: every ally's next hit deals ${p["bonus"]} more.`,
    tags: [],
    defaults: { charges: 1, bonus: 15 },
    scales: ["bonus"],
    choices: (ctx, self) => [single(ctx.unit(self.unitId), "main")],
    resolve: (ctx, self) => {
      for (const u of ctx.living(ctx.unit(self.unitId).side)) ctx.addEffect(u.id, { def: "howled", amount: self.params["bonus"] ?? 0, source: self.unitId });
    },
  },
};
