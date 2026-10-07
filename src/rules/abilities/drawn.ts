import { auraSource, rangedChoices, single } from "#rules/abilities/core";
import { frontLine, opponent } from "#rules/battle/grid";
import type { Behavior, BattleUnit, Ctx } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

/**
 * The Drawn: moth-folk, drawn to light and to magic. Claude's own tribe (the user, 2026-10-04: "generate your own idea
 * for a neutral tribe, create skills and concept art"): `faction-stuff/neutrals/the-drawn.md`. Every name and number
 * is Claude's and provisional (`provisional.md` #64).
 */

/** What an enemy carries that its own side gave it: heals over time, blessings, lent shields. Quiet bookkeeping and world-made effects (no source) stay. */
function drinkable(ctx: Ctx, target: BattleUnit) {
  return target.effects.filter((e) => e.source !== null && ctx.unit(e.source).side === target.side && !effectDef(e.def).quiet);
}

export const drawn: Readonly<Record<string, Behavior>> = {
  /** Dustwing, an emerged Chrysalis, the Pale Mother: they fly over the front line. */
  flit: {
    kind: "active",
    name: "Flit",
    describe: (p) => `Its attack: it flies over the front line and strikes any enemy for ${p["power"]}.`,
    defaults: { power: 22 },
    scales: ["power"],
    tags: ["attack", "melee", "damage"],
    hotkey: "a",
    choices: rangedChoices,
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },

  /** Dustwing: the blow that kills it comes away coated in dust. */
  dust: {
    kind: "passive",
    name: "Dust",
    applies: ["dusted"],
    describe: () => "The enemy whose hit kills it is dusted: that enemy's next hit lands as nothing.",
    hooks: {
      mitigate: (ctx, self, packet) => {
        if (packet.source && packet.amount >= ctx.unit(self.unitId).hp) ctx.addEffect(packet.source, { def: "dusted", source: self.unitId });
      },
    },
  },

  /** Chrysalis: shut in its cocoon, it can only endure; at the start of its third turn it splits open. */
  metamorphosis: {
    kind: "passive",
    name: "Metamorphosis",
    applies: ["pupating", "emerged"],
    // `flit` isn't scaled here: the Flit it carries grows with the bearer's ability power when it's used.
    defaults: { turns: 3, flit: 34 },
    describe: (p) => `It can't attack while it pupates. At the start of its turn number ${p["turns"]} it emerges: back to full health, and it flies at any enemy (Flit, for ${p["flit"]}).`,
    hooks: {
      turnStart: (ctx, self) => {
        const unit = ctx.unit(self.unitId);
        if (unit.effects.some((e) => e.def === "emerged")) return null;
        const pupa = unit.effects.find((e) => e.def === "pupating");
        if (!pupa) {
          ctx.addEffect(self.unitId, { def: "pupating", stacks: (self.params["turns"] ?? 3) - 1, source: self.unitId });
          return null;
        }
        pupa.stacks -= 1;
        if (pupa.stacks > 0) return null;
        ctx.removeEffect(self.unitId, pupa);
        ctx.addEffect(self.unitId, { def: "emerged", source: self.unitId, ability: { id: "flit", params: { power: self.params["flit"] ?? 0 } } });
        ctx.heal(self.unitId, ctx.stats(self.unitId).maxHp);
        return null;
      },
    },
  },

  /** Lightdrinker: drinks the light out of an enemy: whatever its own side gave it, and its shield. */
  drink_light: {
    kind: "active",
    name: "Drink the light",
    describe: (p) => `Main action, ranged: an enemy loses every effect its own side gave it (heals over time, blessings, lent shields) and its shield. The Lightdrinker heals ${p["heal"]} for each effect drunk, and half the shield.`,
    tags: ["spell"],
    defaults: { heal: 10 },
    scales: ["heal"],
    choices: (ctx, self) =>
      ctx
        .living(opponent(ctx.unit(self.unitId).side))
        .filter((u) => u.shield > 0 || drinkable(ctx, u).length > 0)
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const target = ctx.unit(id);
        const drunk = drinkable(ctx, target);
        for (const effect of drunk) ctx.removeEffect(id, effect);
        const shield = target.shield;
        target.shield = 0;
        ctx.heal(self.unitId, drunk.length * (self.params["heal"] ?? 0) + Math.floor(shield / 2));
      }
    },
  },

  /** Eyespot: the eyes on its wings hold an enemy still, until something hurts it. */
  mesmerize: {
    kind: "active",
    name: "Mesmerize",
    applies: ["mesmerized"],
    describe: (p) => `Main action, ranged, ${p["charges"]} per combat: an enemy loses its next turn, unless it is hurt before then.`,
    tags: ["spell"],
    defaults: { charges: 2 },
    choices: (ctx, self) =>
      ctx
        .living(opponent(ctx.unit(self.unitId).side))
        .filter((u) => !u.effects.some((e) => e.def === "mesmerized"))
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "mesmerized", source: self.unitId });
    },
  },

  /** The Pale Mother: once, she opens her wings and every eye on them. */
  open_the_eyes: {
    kind: "active",
    name: "Open the eyes",
    applies: ["mesmerized"],
    describe: (p) => `Main action, ${p["charges"]} per combat: the whole enemy front row is mesmerized (each loses its next turn, unless hurt first).`,
    tags: ["spell", "area"],
    defaults: { charges: 1 },
    choices: (ctx, self) => {
      const units = ctx.living();
      const enemy = opponent(ctx.unit(self.unitId).side);
      const row = frontLine(units, enemy);
      const line = units.filter((u) => u.side === enemy && u.tile.row === row);
      return line.length > 0 && line[0] ? [{ ...single(line[0], "main"), affected: line.map((u) => u.id) }] : [];
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "mesmerized", source: self.unitId });
    },
  },

  /** The Pale Mother: her dust hangs around her brood. */
  dust_veil: {
    kind: "passive",
    name: "Dust veil",
    defaults: { armor: 5 },
    describe: (p) => `Her allies (and she) have +${p["armor"]} armor. Doesn't stack.`,
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (ctx.unit(subjectId).side !== ctx.unit(self.unitId).side) return;
        if (auraSource(ctx, self, "dust_veil", () => true, (p) => p["armor"] ?? 5)) stats.armor += self.params["armor"] ?? 0;
      },
    },
  },
};
