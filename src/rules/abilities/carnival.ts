import { at, rangedChoices } from "#rules/abilities/core";
import { frontLine, meleeTargets, opponent } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";

/**
 * The carnival: the user's nomadic swindler tribe (2026-10-05, `faction-stuff/neutrals/carnival.md`). The units and
 * what they do are the user's; the readings marked there and every number are Claude's (`provisional.md` #67).
 */
export const carnival: Readonly<Record<string, Behavior>> = {
  /** Soothsayer (the user: "basic fire which is fairly strong, but always deferred by 1 turn"). */
  foretell: {
    kind: "active",
    name: "Foretell",
    describe: () => "Her attack, ranged: the hit lands at the start of her next turn (if she still stands).",
    tags: ["attack", "ranged", "damage"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "foretold", amount: ctx.stats(self.unitId).damage, source: self.unitId });
    },
  },

  /** Soothsayer (the user: "makes targets deal 35% less damage for 3 turns"). */
  curse: {
    kind: "active",
    name: "Curse",
    describe: (p) => `Main action, ranged: an enemy deals ${p["percent"]}% less damage for its next ${p["turns"]} turns.`,
    tags: ["spell"],
    defaults: { percent: 35, turns: 3 },
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const cursed = ctx.unit(id).effects.find((e) => e.def === "cursed");
        if (cursed) cursed.stacks = Math.max(cursed.stacks, self.params["turns"] ?? 3);
        else ctx.addEffect(id, { def: "cursed", amount: self.params["percent"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
      }
    },
  },

  /** Omen (the user): every tarot card he triggers pays twice; each kill during his action draws Tarot 3. */
  omen: {
    kind: "passive",
    name: "Omen",
    defaults: { payouts: 2, cards: 3 },
    describe: (p) => `Every tarot card his action fulfils pays ${p["payouts"] === 2 ? "twice" : `${p["payouts"]} times`}. For every enemy that dies during his action (his shot, or a card he set off), his side draws ${p["cards"]} more tarot cards and picks one.`,
    hooks: {
      tarotPayouts: (_ctx, self) => self.params["payouts"] ?? 1,
      drawsOnKill: (_ctx, self) => self.params["cards"] ?? 0,
    },
  },

  /**
   * Fire Eater (the user: a cone, "3 tiled aoe with one additional in front"): the enemy front-row tiles in its column
   * and the two beside it, and the middle-row tile in its column. Fire; it reaches only from where it could melee.
   */
  spit_fire: {
    kind: "active",
    name: "Spit fire",
    describe: () => "Its attack, fire: a cone over the three enemy front-row tiles across from it and the middle-row tile behind the centre one.",
    tags: ["attack", "melee", "damage", "area"],
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      const units = ctx.living();
      if (meleeTargets(units, user).length === 0) return [];
      const enemy = opponent(user.side);
      const front = frontLine(units, enemy);
      if (front === null) return [];
      const col = user.tile.col;
      const hit = units.filter(
        (u) => u.side === enemy && ((u.tile.row === front && Math.abs(u.tile.col - col) <= 1) || (u.tile.row === front + 1 && u.tile.col === col)),
      );
      const anchor = hit.find((u) => u.tile.row === front && u.tile.col === col) ?? hit[0];
      return anchor ? [at(anchor, hit.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, "fire")),
  },
};
