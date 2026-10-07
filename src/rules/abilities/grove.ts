import { at, rangedChoices, single } from "#rules/abilities/core";
import { wetten } from "#rules/abilities/keywords";
import { WITHERBLOOM_CAP, wither } from "#rules/effects";
import { adjacent, frontLine, meleeTargets, opponent } from "#rules/battle/grid";
import type { BattleUnit, Ctx } from "#rules/battle/types";
import type { Behavior } from "#rules/battle/types";

/**
 * The Grove's melee line (the user's design, 2026-09-29: `faction-stuff/sylvan/melee.md`): regeneration at tier 1,
 * then Regrowth (more regeneration, then support) or Decay (a share of the damage it takes is delayed, then
 * enemies that hit it wither). Every number here is provisional (`provisional.md` #57).
 */
/** How many of its turns a Decay unit's rot is spread over. */
const ROT_TURNS = 3;

/** Rot joins whatever already rots in the unit, and the countdown starts over. */
function addRot(ctx: Ctx, unitId: string, amount: number, turns = ROT_TURNS): void {
  if (amount <= 0) return;
  const rot = ctx.unit(unitId).effects.find((e) => e.def === "rotting");
  if (rot) {
    rot.amount += amount;
    rot.stacks = turns;
  } else ctx.addEffect(unitId, { def: "rotting", amount, stacks: turns });
}

/** The corpses still intact on the field, of `side` (or both): the dead that didn't flee. */
function corpses(ctx: Ctx, side: 0 | 1 | null): BattleUnit[] {
  return Object.keys(ctx.battle.units)
    .map((id) => ctx.unit(id))
    .filter((u) => !u.alive && !u.fled && u.corpse === "intact" && (side === null || u.side === side));
}

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
    applies: ["rotting"],
    defaults: { percent: 40, turns: 3 },
    describe: (p) => `${p["percent"]}% of the damage that reaches it rots in instead, lost over its next ${p["turns"]} turns.`,
    hooks: {
      mitigate: (ctx, self, packet) => {
        const delayed = Math.floor((packet.amount * (self.params["percent"] ?? 0)) / 100);
        if (delayed <= 0) return;
        packet.amount -= delayed;
        const turns = self.params["turns"] ?? 3;
        addRot(ctx, self.unitId, delayed, turns);
      },
      aiValue: (ctx, self) => (ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 200,
    },
  },

  withering: {
    kind: "passive",
    name: "Withering",
    applies: ["withered"],
    defaults: { amount: 5, cap: 15 },
    describe: (p) => `An enemy that hits it withers: it deals ${p["amount"]} less damage for the rest of combat, up to ${p["cap"]} less.`,
    hooks: {
      incoming: (ctx, self, packet) => {
        const source = packet.source;
        if (!source || packet.amount <= 0 || ctx.unit(source).side === ctx.unit(self.unitId).side) return;
        wither(ctx, source, self.params["amount"] ?? 0, self.params["cap"] ?? 0, self.unitId);
      },
    },
  },

  /**
   * Decay tier 4 (the user, 2026-09-29): "the more it suffers, the more it lashes back". A main action that deals the
   * rot inside it to the whole enemy front row. Double-edged: the rot stays, and its countdown starts over, so it
   * suffers it longer. It needs healers behind it (the user: turning a tank into a cannon shouldn't be free).
   */
  lash_out: {
    kind: "active",
    name: "Lash out",
    describe: (p) => `Main action: deal ${p["percent"]}% of the rot inside it to the whole enemy front row. The rot stays, and its countdown starts over.`,
    tags: ["attack", "melee", "damage", "area"],
    defaults: { percent: 100 },
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      const rot = user.effects.find((e) => e.def === "rotting");
      const units = ctx.living();
      if (!rot || rot.amount <= 0 || meleeTargets(units, user).length === 0) return [];
      const enemy = opponent(user.side);
      const row = frontLine(units, enemy);
      const line = units.filter((u) => u.side === enemy && u.tile.row === row);
      return line.map((anchor) => at(anchor, line.map((u) => u.id), "main"));
    },
    resolve: (ctx, self, choice) => {
      const rot = ctx.unit(self.unitId).effects.find((e) => e.def === "rotting");
      if (!rot) return;
      const power = Math.round((rot.amount * (self.params["percent"] ?? 100)) / 100);
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, undefined, power));
      rot.stacks = Math.max(rot.stacks, ROT_TURNS);
    },
  },

  /**
   * Mulch Gorger (Decay tier 4, the user, 2026-10-04): "whenever someone dies or a corpse gets interacted with
   * (resurrection, corpse explosion, etc.) it heals and gains damage for the rest of combat, stacking indefinitely."
   * Anyone, either side. Numbers provisional (#57).
   */
  gorge: {
    kind: "passive",
    name: "Gorge",
    applies: ["gorged"],
    defaults: { heal: 6, damage: 6 },
    scales: ["heal"],
    describe: (p) => `Whenever any unit dies, or a corpse is used up or destroyed, it heals ${p["heal"]} and deals ${p["damage"]} more damage for the rest of combat (no limit).`,
    hooks: {
      remains: (ctx, self, unitId) => {
        if (unitId === self.unitId || !ctx.unit(self.unitId).alive) return;
        ctx.heal(self.unitId, self.params["heal"] ?? 0);
        ctx.addEffect(self.unitId, { def: "gorged", amount: self.params["damage"] ?? 0, source: self.unitId });
      },
      aiValue: (ctx, self) => (self.params["damage"] ?? 0) * ctx.living().length,
    },
  },

  /** Grove support (tier 1, the user: basic): an ally regrows over its next turns. */
  bloom: {
    kind: "active",
    name: "Bloom",
    applies: ["mending"],
    describe: (p) => `Main action: an ally (or itself) regrows ${p["amount"]} HP at the start of each of its next ${p["turns"]} turns.`,
    tags: ["heal"],
    defaults: { amount: 12, turns: 3 },
    scales: ["amount"],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "mending", amount: self.params["amount"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
    },
  },

  /**
   * Decay support 2 (the user, 2026-10-07: "if decay support's healing spell needs to be worse, then you can just
   * create a different bloom spell. Call it witherbloom. Maybe it heals less and does something slightly different").
   * Claude's pitch: a weaker Bloom whose bearer withers the enemies that hit it while it blooms.
   */
  witherbloom: {
    kind: "active",
    name: "Witherbloom",
    applies: ["mending", "witherblooming"],
    describe: (p) =>
      `Main action: an ally (or itself) regrows ${p["amount"]} HP at the start of each of its next ${p["turns"]} turns. While it blooms, an enemy that hits it withers: ${p["wither"]} less damage for the rest of combat, up to ${WITHERBLOOM_CAP} less.`,
    tags: ["heal"],
    defaults: { amount: 4, turns: 3, wither: 5 },
    scales: ["amount"],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      const turns = self.params["turns"] ?? 3;
      for (const id of choice.affected) {
        ctx.addEffect(id, { def: "mending", amount: self.params["amount"] ?? 0, stacks: turns, source: self.unitId });
        ctx.addEffect(id, { def: "witherblooming", amount: self.params["wither"] ?? 0, stacks: turns, source: self.unitId });
      }
    },
  },

  /** Decay support: growth from a corpse of either side heals every living ally; the corpse is used up. */
  corpse_growth: {
    kind: "active",
    name: "Corpse growth",
    describe: (p) => `Main action: growth springs from a corpse (either side's); every living ally heals ${p["amount"]}. The corpse is used up.`,
    tags: ["heal"],
    defaults: { amount: 13 },
    scales: ["amount"],
    choices: (ctx) => corpses(ctx, null).map((c) => at(c, [c.id], "main")),
    resolve: (ctx, self, choice) => {
      const corpse = choice.affected[0] ? ctx.unit(choice.affected[0]) : null;
      if (!corpse || corpse.corpse !== "intact") return;
      ctx.spendCorpse(corpse.id, "used");
      for (const ally of ctx.living(ctx.unit(self.unitId).side)) ctx.heal(ally.id, self.params["amount"] ?? 0);
    },
  },

  /**
   * Decay support (the canon mage idea, moved to the support by the user): an enemy corpse bursts; a fungal
   * infestation damages the enemies next to it now and at the start of their next turns. The corpse is destroyed:
   * that unit never reaches its graveyard.
   */
  corpse_explosion: {
    kind: "active",
    name: "Corpse explosion",
    applies: ["infested"],
    describe: (p) => `Main action: an enemy corpse bursts. The enemies next to it take ${p["power"]} now and ${p["infest"]} at the start of each of their next ${p["turns"]} turns. The dead can't be raised.`,
    tags: ["damage", "area"],
    defaults: { power: 15, infest: 5, turns: 3 },
    scales: ["power", "infest"],
    choices: (ctx, self) => {
      const enemy = opponent(ctx.unit(self.unitId).side);
      return corpses(ctx, enemy).map((c) => at(c, [c.id, ...ctx.living(enemy).filter((u) => adjacent(u.tile, c.tile)).map((u) => u.id)], "main"));
    },
    resolve: (ctx, self, choice) => {
      const [corpseId, ...near] = choice.affected;
      const corpse = corpseId ? ctx.unit(corpseId) : null;
      if (!corpse || corpse.corpse !== "intact") return;
      ctx.spendCorpse(corpse.id, "destroyed");
      if (near.length > 0) ctx.hit(self.unitId, near, ctx.hitSpec(self));
      for (const id of near) if (ctx.unit(id).alive) ctx.addEffect(id, { def: "infested", amount: self.params["infest"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
    },
  },

  /**
   * Grove mage (tier 1; the user's double-edged nuke): on an enemy, damage that heals back a third at its next turn;
   * on an ally, a heal, and part of it comes back as rot, which feeds a Decay unit's Lash out (the user's synergy).
   */
  cycle: {
    kind: "active",
    name: "Cycle",
    applies: ["healing_back", "rotting"],
    describe: (p) => `Main action, ranged. An enemy takes ${p["power"]}, and heals back a third at the start of its next turn. An ally heals ${p["heal"]}, and ${p["rot"]} rots in over its next 3 turns (feeding a Decay unit's rot).`,
    tags: ["damage"],
    defaults: { power: 40, heal: 35, rot: 12 },
    scales: ["power", "heal", "rot"],
    choices: (ctx, self) => [...rangedChoices(ctx, self), ...ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main"))],
    resolve: (ctx, self, choice) => {
      const me = ctx.unit(self.unitId);
      for (const id of choice.affected) {
        if (ctx.unit(id).side !== me.side) {
          ctx.hit(self.unitId, [id], ctx.hitSpec(self));
          if (ctx.unit(id).alive) ctx.addEffect(id, { def: "healing_back", amount: Math.round((self.params["power"] ?? 0) / 3), source: self.unitId });
        } else {
          ctx.heal(id, self.params["heal"] ?? 0);
          addRot(ctx, id, self.params["rot"] ?? 0);
        }
      }
    },
  },

  /**
   * The healing support's primary fire (the user, 2026-10-05): water. An enemy is hurt and left wet; an ally is healed
   * much more than an enemy is hurt, and wet only if it was burning (else Nexus lightning would punish the healing).
   */
  water: {
    kind: "active",
    name: "Water",
    applies: ["wet"],
    damageType: "water",
    describe: (p) => `Ranged, water. An enemy takes ${p["power"]} and is wet for ${p["rounds"]} rounds. An ally (or itself) heals ${p["heal"]}; a burning one is put out (and wet).`,
    tags: ["attack", "ranged", "damage", "heal"],
    defaults: { power: 10, heal: 30, rounds: 2 },
    scales: ["power", "heal"],
    choices: (ctx, self) => [...rangedChoices(ctx, self), ...ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main"))],
    resolve: (ctx, self, choice) => {
      const me = ctx.unit(self.unitId);
      for (const id of choice.affected) {
        const rounds = self.params["rounds"] ?? 2;
        if (ctx.unit(id).side !== me.side) {
          ctx.hit(self.unitId, [id], ctx.hitSpec(self));
          wetten(ctx, id, rounds, self.unitId);
        } else {
          ctx.heal(id, self.params["heal"] ?? 0);
          if (ctx.unit(id).effects.some((e) => e.def === "burning")) wetten(ctx, id, rounds, self.unitId);
        }
      }
    },
  },

  /** Spiritess (the user: a semi-HoT, like WoW's Regrowth): a heal now, and more over the ally's next turns. */
  spirit_bloom: {
    kind: "active",
    name: "Spirit bloom",
    applies: ["mending"],
    describe: (p) => `Main action: an ally (or itself) heals ${p["heal"]} now, and regrows ${p["amount"]} at the start of each of its next ${p["turns"]} turns.`,
    tags: ["heal"],
    defaults: { heal: 18, amount: 6, turns: 3 },
    scales: ["heal", "amount"],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        ctx.heal(id, self.params["heal"] ?? 0);
        ctx.addEffect(id, { def: "mending", amount: self.params["amount"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
      }
    },
  },

  /**
   * Spiritess (the user: like WoW's Swiftmend): every regrowing effect on an ally is consumed at once for a burst
   * heal of what it would still have healed, and more. A Regrowth melee's own regeneration counts too, without being
   * consumed (the user: it stacks with the Regrowth side's HoTs).
   */
  burst_mend: {
    kind: "active",
    name: "Burst mend",
    describe: (p) => `Main action, ${p["charges"]} per combat: an ally's regrowing effects are all consumed at once; it heals ${p["percent"]}% of what they'd still have healed (a Regrowth melee's own regeneration counts as three turns of it).`,
    tags: ["heal"],
    defaults: { charges: 2, percent: 150 },
    choices: (ctx, self) =>
      ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => u.effects.some((e) => e.def === "mending") || ctx.abilityIds(u.id).includes("regrowth"))
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const target = ctx.unit(id);
        const hots = target.effects.filter((e) => e.def === "mending");
        let pending = hots.reduce((sum, e) => sum + e.amount * e.stacks, 0);
        for (const hot of hots) ctx.removeEffect(id, hot);
        if (ctx.abilityIds(id).includes("regrowth")) pending += Math.round((ctx.stats(id).maxHp * (ctx.abilityRef(id, "regrowth").params?.["percent"] ?? 6) * 3) / 100);
        ctx.heal(id, Math.round((pending * (self.params["percent"] ?? 100)) / 100));
      }
    },
  },

  /**
   * Psychopomp (user, 2026-09-29): a unit of either side walks among the spirits. It leaves the field (not a
   * target, doesn't hold its front line, can't act) and returns healed. On an enemy, a banish; on an ally, a rescue.
   */
  spiritwalk: {
    kind: "active",
    name: "Spiritwalk",
    applies: ["spiritwalking"],
    describe: (p) => `Main action, ${p["charges"]} per combat: any other unit, ally or enemy, leaves the field for ${p["rounds"]} round starts: it can't act or be hit, and doesn't hold its line. It returns healed ${p["heal"]}% of its max HP.`,
    tags: [],
    defaults: { charges: 1, rounds: 2, heal: 40 },
    choices: (ctx, self) => ctx.living().filter((u) => u.id !== self.unitId).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "spiritwalking", stacks: self.params["rounds"] ?? 2, amount: self.params["heal"] ?? 0, source: self.unitId });
    },
  },

  grove_mend: {
    kind: "active",
    name: "Grove mend",
    applies: ["mending"],
    describe: (p) => `Main action: an ally (or itself) regrows ${p["amount"]} HP at the start of each of its next ${p["turns"]} turns.`,
    tags: ["heal"],
    defaults: { amount: 13, turns: 3 },
    scales: ["amount"],
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "mending", amount: self.params["amount"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
    },
  },
};
