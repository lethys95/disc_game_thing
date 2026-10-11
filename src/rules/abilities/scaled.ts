import { rangedChoices, single } from "#rules/abilities/core";
import { meleeTargets } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";

/**
 * The Scaled (Claude's pitch at the user's invitation, 2026-10-11: `faction-stuff/neutrals/scaled.md`): lizardmen, a
 * naga and a medusa that test a squad's health over time and its answers to control. Numbers provisional (#81).
 */
export const scaled: Readonly<Record<string, Behavior>> = {
  /** Scaleblade, Spitter, Medusa: what they hit is envenomed. */
  venom: {
    kind: "passive",
    name: "Venom",
    applies: ["envenomed"],
    defaults: { venom: 5 },
    scales: ["venom"],
    describe: (p) => `The unit it hits is envenomed: it loses ${p["venom"]} at the start of each of its turns and heals only half; more venom adds up, to three doses.`,
    hooks: {
      afterHit: (ctx, self, targetId, dealt) => {
        if (dealt <= 0 || !ctx.unit(targetId).alive) return;
        const dose = self.params["venom"] ?? 0;
        const existing = ctx.unit(targetId).effects.find((e) => e.def === "envenomed");
        if (existing) existing.amount = Math.min(existing.amount + dose, dose * 3);
        else ctx.addEffect(targetId, { def: "envenomed", amount: dose, source: self.unitId });
      },
    },
  },

  /**
   * Naga Coiler: holds one enemy for as long as it keeps squeezing, at the cost of its own turn (unlike the Brigand's
   * single stun).
   */
  constrict: {
    kind: "active",
    name: "Constrict",
    applies: ["constricted"],
    describe: (p) => `Main action: squeeze an enemy in reach for ${p["power"]}; it loses its turns until this unit's next turn.`,
    tags: ["attack", "melee", "damage"],
    defaults: { power: 10 },
    scales: ["power"],
    choices: (ctx, self) => meleeTargets(ctx.living(), ctx.unit(self.unitId)).map((t) => single(t, "main")),
    resolve: (ctx, self, choice) => {
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self));
      for (const id of choice.affected) if (ctx.unit(id).alive) ctx.addEffect(id, { def: "constricted", source: self.unitId });
    },
  },

  /** Shedskin: an ally sheds everything the enemy laid on it. */
  shed_skin: {
    kind: "active",
    name: "Shed skin",
    describe: (p) => `Main action: an ally (or this unit) sheds every effect the enemy laid on it and heals ${p["amount"]}.`,
    tags: ["heal"],
    defaults: { amount: 15 },
    scales: ["amount"],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      const side = ctx.unit(self.unitId).side;
      for (const id of choice.affected) {
        for (const e of [...ctx.unit(id).effects]) if (e.source && ctx.unit(e.source).side !== side) ctx.removeEffect(id, e);
        ctx.heal(id, self.params["amount"] ?? 0);
      }
    },
  },

  /** Medusa: one enemy turns to stone: it loses its next turn but takes half damage meanwhile (Pillars' petrify). */
  stone_gaze: {
    kind: "active",
    name: "Stone gaze",
    applies: ["petrified"],
    describe: () => "Twice per combat, main action: an enemy turns to stone. It loses its next turn, and takes half damage until then.",
    tags: ["spell"],
    defaults: { charges: 2 },
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "petrified", source: self.unitId });
    },
  },
};
