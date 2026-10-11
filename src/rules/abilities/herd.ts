import { single } from "#rules/abilities/core";
import { frontLine, meleeTargets, opponent } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";

/**
 * The Herd (Claude's pitch at the user's invitation, 2026-10-11: `faction-stuff/neutrals/centaurs.md`): centaurs that
 * test a squad's melee and its turtling. Numbers provisional (#81).
 */
export const herd: Readonly<Record<string, Behavior>> = {
  /** Outrider: never stands still long enough for a blade. */
  skirmish: {
    kind: "passive",
    name: "Skirmish",
    defaults: { percent: 50 },
    describe: (p) => `Melee hits on it deal ${p["percent"]}% less.`,
    hooks: {
      incoming: (_ctx, self, packet) => {
        if (packet.target === self.unitId && packet.amount > 0 && packet.tags.includes("melee"))
          packet.amount = Math.max(1, Math.round((packet.amount * (100 - (self.params["percent"] ?? 0))) / 100));
      },
    },
  },

  /** Lancer: the lance goes through its target into the enemy behind it. */
  run_through: {
    kind: "active",
    name: "Run through",
    describe: (p) => `Strike an enemy for ${p["power"]}, and the enemy directly behind it for half.`,
    tags: ["attack", "melee", "damage"],
    defaults: { power: 22 },
    scales: ["power"],
    choices: (ctx, self) =>
      meleeTargets(ctx.living(), ctx.unit(self.unitId)).map((t) => {
        const behind = ctx.living(t.side).find((u) => u.tile.col === t.tile.col && u.tile.row === t.tile.row + 1);
        return { ...single(t, "main"), affected: behind ? [t.id, behind.id] : [t.id] };
      }),
    resolve: (ctx, self, choice) => {
      const [first, behind] = choice.affected;
      if (first) ctx.hit(self.unitId, [first], ctx.hitSpec(self));
      if (behind) ctx.hit(self.unitId, [behind], ctx.hitSpec(self, undefined, Math.floor((self.params["power"] ?? 0) / 2)));
    },
  },

  /** Hoofbreaker: a kick that breaks a defending unit's guard. */
  rear_and_kick: {
    kind: "passive",
    name: "Rear and kick",
    defaults: { bonus: 12 },
    scales: ["bonus"],
    describe: (p) => `Against a defending unit it deals ${p["bonus"]} more and breaks the defence.`,
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (packet.source !== self.unitId || packet.amount <= 0) return;
        const guard = ctx.unit(packet.target).effects.find((e) => e.def === "defending");
        if (!guard) return;
        packet.amount += self.params["bonus"] ?? 0;
        ctx.removeEffect(packet.target, guard);
      },
    },
  },

  /** Starseer: an ally is warned, and the next hit on it misses. */
  read_the_stars: {
    kind: "active",
    name: "Read the stars",
    applies: ["starwarned"],
    describe: () => "Main action: an ally (or this unit) is warned: the next hit on it misses entirely.",
    tags: [],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).filter((u) => !u.effects.some((e) => e.def === "starwarned")).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "starwarned", source: self.unitId });
    },
  },

  /** Herd-Khan: rides down the enemy front line, once a fight. */
  thundering_charge: {
    kind: "active",
    name: "Thundering charge",
    describe: (p) => `Once per combat, main action: ride down the enemy front line, hitting every unit in it for ${p["power"]}.`,
    tags: ["attack", "melee", "damage", "area"],
    defaults: { charges: 1, power: 20 },
    scales: ["power"],
    choices: (ctx, self) => {
      const enemy = opponent(ctx.unit(self.unitId).side);
      const row = frontLine(ctx.living(), enemy);
      const line = ctx.living(enemy).filter((u) => u.tile.row === row);
      const [anchor] = line;
      return anchor ? [{ ...single(anchor, "main"), affected: line.map((u) => u.id) }] : [];
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },
};
