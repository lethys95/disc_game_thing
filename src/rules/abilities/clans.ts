import { single } from "#rules/abilities/core";
import { opponent } from "#rules/battle/grid";

/** How far an Axe-maiden throws, in tiles from her own (the user, 2026-10-12). */
const AXE_REACH = 3;
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

  /**
   * Axe-maiden (the user, 2026-10-12: she replaces the spearwarden; "Throw axes and be a non-healing support unit.
   * Midrange"). Her throw reaches three tiles out from where she stands (the user: "if she's in the middle lane, she'll
   * hit the first two rows. If she's front row, she can hit all. If she's in the back row, she can only hit the front
   * row"), counted on the tiles themselves, and splits the target's armor, so the clan's blows land.
   */
  hurled_axe: {
    kind: "active",
    name: "Hurled axe",
    applies: ["split_armor"],
    describe: (p) => `Throw an axe for ${p["power"]} at an enemy up to ${AXE_REACH} tiles out (from the front row every enemy row, from the back row only the enemy's front row); it loses ${p["armor"]} armor until the end of the next round.`,
    tags: ["attack", "ranged", "damage"],
    defaults: { power: 14, armor: 8 },
    scales: ["power"],
    choices: (ctx, self) => {
      const me = ctx.unit(self.unitId);
      return ctx.living(opponent(me.side)).filter((u) => me.tile.row + u.tile.row + 1 <= AXE_REACH).map((u) => single(u, "main"));
    },
    resolve: (ctx, self, choice) => {
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self));
      for (const id of choice.affected) {
        if (!ctx.unit(id).alive) continue;
        const existing = ctx.unit(id).effects.find((e) => e.def === "split_armor");
        if (existing) ctx.removeEffect(id, existing);
        ctx.addEffect(id, { def: "split_armor", amount: self.params["armor"] ?? 0, stacks: 2, source: self.unitId });
      }
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
