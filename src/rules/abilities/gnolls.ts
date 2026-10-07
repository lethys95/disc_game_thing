import { auraSource, single } from "#rules/abilities/core";
import { opponent } from "#rules/battle/grid";
import type { Behavior, Ctx } from "#rules/battle/types";

/**
 * The gnoll tribe (Claude's pitch, accepted by the user 2026-10-04: `faction-stuff/neutrals/gnolls.md`): the chase,
 * the pack's pecking order, the jaws, the laugh. Every number is provisional (`provisional.md` #63).
 */

/** Sets an effect's countdown back to `rounds`, or adds it: a fresh hit renews it rather than stacking. */
function renew(ctx: Ctx, targetId: string, def: string, amount: number, rounds: number, source: string): void {
  const existing = ctx.unit(targetId).effects.find((e) => e.def === def && e.source === source);
  if (existing) existing.stacks = rounds;
  else ctx.addEffect(targetId, { def, amount, stacks: rounds, source });
}

export const gnolls: Readonly<Record<string, Behavior>> = {
  /** Packstalker: the unit it hits is the pack's prey until the end of the next round. */
  prey: {
    kind: "passive",
    name: "Prey",
    defaults: { bonus: 8 },
    describe: (p) => `The unit it hits becomes the pack's prey until the end of the next round: its allies deal ${p["bonus"]} more damage to it.`,
    hooks: {
      afterHit: (ctx, self, targetId, dealt) => {
        if (dealt > 0 && ctx.unit(targetId).alive) renew(ctx, targetId, "prey", self.params["bonus"] ?? 0, 2, self.unitId);
      },
    },
  },

  /** Bonecracker: each hit takes armor away for the rest of combat; unlike Anti-armor, the armor stays gone. */
  crack: {
    kind: "passive",
    name: "Crack",
    defaults: { armor: 4 },
    describe: (p) => `Each hit takes ${p["armor"]} armor from its target for the rest of combat (it adds up).`,
    hooks: {
      afterHit: (ctx, self, targetId, dealt) => {
        if (dealt > 0 && ctx.unit(targetId).alive) ctx.addEffect(targetId, { def: "cracked", amount: self.params["armor"] ?? 0, source: self.unitId });
      },
    },
  },

  /**
   * Hamstringer: a hit slows the target until the end of the next round. Small on purpose: the user (2026-10-04):
   * changing initiative is very strong.
   */
  hamstring: {
    kind: "passive",
    name: "Hamstring",
    defaults: { initiative: 5 },
    describe: (p) => `The unit it hits has ${p["initiative"]} less initiative until the end of the next round.`,
    hooks: {
      afterHit: (ctx, self, targetId, dealt) => {
        if (dealt > 0 && ctx.unit(targetId).alive) renew(ctx, targetId, "hamstrung", self.params["initiative"] ?? 0, 2, self.unitId);
      },
    },
  },

  /**
   * Cackler: the laugh goads one enemy, which must attack on its next turn. Not initiative (the user, 2026-10-04:
   * "be careful with cackle. Changing initiative is very strong"): it takes a healer's or caster's turn away from
   * its spells instead.
   */
  cackle: {
    kind: "active",
    name: "Cackle",
    describe: () => "Main action: an enemy is goaded. On its next turn it can only attack: no spells, healing, defending or waiting (unless it has no attack).",
    tags: [],
    choices: (ctx, self) => ctx.living(opponent(ctx.unit(self.unitId).side)).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "goaded", source: self.unitId });
    },
  },

  /** Cackler and Matriarch: nothing outruns the pack. */
  run_them_down: {
    kind: "passive",
    name: "Run them down",
    describe: () => "While it's in the fight, enemies can't retreat.",
    hooks: {
      restrict: (ctx, self, subjectId, allowed) => {
        if (ctx.unit(subjectId).side === ctx.unit(self.unitId).side) return;
        for (const id of [...allowed]) if (ctx.hasTag(id, "flee")) allowed.delete(id);
      },
    },
  },

  /**
   * Matriarch: the pack fights harder for her. When she falls, the strongest gnoll left takes her place at half
   * strength: the pecking order reshuffles instead of collapsing.
   */
  pecking_order: {
    kind: "passive",
    name: "Pecking order",
    defaults: { damage: 8 },
    describe: (p) => `Her allies deal ${p["damage"]} more damage. If she falls, the ally with the most health left takes her place: its allies deal ${Math.floor((p["damage"] ?? 0) / 2)} more.`,
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId || ctx.unit(subjectId).side !== ctx.unit(self.unitId).side) return;
        if (auraSource(ctx, self, "pecking_order", () => true, (p) => p["damage"] ?? 8)) stats.hitBonus += self.params["damage"] ?? 0;
      },
      remains: (ctx, self, unitId, change) => {
        if (unitId !== self.unitId || change !== "died") return;
        const [heir] = ctx.living(ctx.unit(self.unitId).side).sort((a, b) => b.hp - a.hp || (a.id < b.id ? -1 : 1));
        if (heir) ctx.addEffect(heir.id, { def: "next_in_line", amount: Math.floor((self.params["damage"] ?? 0) / 2), source: self.unitId });
      },
    },
  },
};
