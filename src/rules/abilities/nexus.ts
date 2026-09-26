import { areaChoices, at, rangedChoices, single, spellCost } from "#rules/abilities/core";
import { MUTATED_PER_STACK } from "#rules/effects";
import { opponent } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";

/** Ral-Vitahl's abilities (docs/design/units/nexus-tier1.md, docs/design/dichotomies.md). */
export const nexus: Readonly<Record<string, Behavior>> = {
  /** The Apprentice's very weak single-target secondary: the unit's own (low) damage, unlimited. */
  bolt: {
    kind: "active",
    name: "Bolt",
    describe: () =>
      "Very weak ranged hit on any enemy. Unlimited.",
    tags: ["attack", "ranged", "spell", "damage"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, ["attack", "ranged", "spell", "damage"])),
  },

  /** A plus shape around the chosen tile; overloaded, every enemy. */
  plus_burst: {
    kind: "active",
    name: "Burst",
    describe: (p) =>
      `A burst of ${p["power"]} hitting every enemy in a plus shape. ${spellCost(p, "every enemy is hit")}`,
    tags: ["attack", "ranged", "spell", "damage", "area"],
    defaults: { power: 40, cost: 1 },
    choices: (ctx, self) =>
      areaChoices(ctx, self, (row, col) => [{ row, col }, { row: row - 1, col }, { row: row + 1, col }, { row, col: col - 1 }, { row, col: col + 1 }]),
    overloadChoices: (ctx, self) => {
      const enemies = ctx.living(opponent(ctx.unit(self.unitId).side));
      return enemies.map((target) => at(target, enemies.map((u) => u.id), "main"));
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, ["attack", "ranged", "spell", "damage", "area"])),
  },

  /** Restore an ally's shield. Only units with a shield stat; full shields too (that's how a Mutant is fed). */
  restore_shield: {
    kind: "active",
    name: "Restore Shield",
    describe: (p) =>
      `Restore ${p["amount"]} of an ally's shield. Healing can't restore shields.`,
    tags: [],
    defaults: { amount: 40 },
    choices: (ctx, self) =>
      ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => ctx.stats(u.id).shield > 0)
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.restoreShield(id, self.params["amount"] ?? 0);
    },
  },

  /**
   * Justiciar (scheme): secretly mark an enemy; the next ability it uses is cancelled. A free action. With a
   * `backlash` param (the Backlasher's Backlash), the cancelled unit is also hit for that much.
   */
  counter: {
    kind: "active",
    name: "Counter",
    describe: (p) =>
      `Free action: secretly mark an enemy; the next ability it uses is cancelled${p["backlash"] ? `, and the backlash hits it for ${p["backlash"]}` : ""}. ${spellCost(p)}`,
    tags: ["spell"],
    defaults: { cost: 1 },
    secretTarget: true,
    choices: (ctx, self) =>
      ctx
        .living(opponent(ctx.unit(self.unitId).side))
        .filter((u) => !u.effects.some((e) => e.def === "countered"))
        .map((u) => single(u, "free")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "countered", source: self.unitId, amount: self.params["backlash"] ?? 0 });
    },
  },

  /** Etherborn: secretly mark any unit; the next damage or healing to reach it is turned around, once. */
  negate: {
    kind: "active",
    name: "Negate",
    describe: (p) =>
      `Secretly mark any unit: the next damage it would take heals it instead, and the next healing it would get (shields too) hurts it instead. Once. ${spellCost(p)}`,
    tags: ["spell"],
    defaults: { cost: 1 },
    secretTarget: true,
    choices: (ctx) =>
      ctx
        .living()
        .filter((u) => !u.effects.some((e) => e.def === "negated"))
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "negated", source: self.unitId });
    },
  },

  /**
   * Etherborn's basic attack. On an enemy: a very weak hit, and its next hit is weakened. On an ally: the next hit
   * on it is softened. Either way the Etherborn heals by what was prevented.
   */
  absorb: {
    kind: "active",
    name: "Absorb",
    describe: (p) =>
      `On an enemy: a very weak ranged hit, and its next hit deals ${p["prevent"]} less. On an ally: the next hit on it deals ${p["prevent"]} less. This unit heals by what is prevented. Unlimited.`,
    tags: ["attack", "ranged", "spell", "damage"],
    defaults: { prevent: 15 },
    choices: (ctx, self) =>
      ctx
        .living()
        .filter((u) => u.id !== self.unitId)
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      const side = ctx.unit(self.unitId).side;
      const prevent = self.params["prevent"] ?? 0;
      for (const id of choice.affected) {
        if (ctx.unit(id).side === side) {
          ctx.addEffect(id, { def: "absorbing_guard", source: self.unitId, amount: prevent });
          continue;
        }
        ctx.hit(self.unitId, [id], ctx.hitSpec(self, ["attack", "ranged", "spell", "damage"]));
        ctx.addEffect(id, { def: "absorbing_hit", source: self.unitId, amount: prevent });
      }
    },
  },

  /** Maelstrom: for the rest of this turn, its spells that cost charges are free actions. */
  combustion: {
    kind: "active",
    name: "Combustion",
    describe: (p) =>
      `Free action: until this turn ends, spells that cost charges are free actions. ${spellCost(p)}`,
    tags: ["spell"],
    defaults: { cost: 1 },
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      return user.effects.some((e) => e.def === "combusting") ? [] : [single(user, "free")];
    },
    resolve: (ctx, self) => ctx.addEffect(self.unitId, { def: "combusting", source: self.unitId }),
  },

  /**
   * Thaumaturge (overload): lightning on one enemy; overloaded, it homes in on every unit sharing the target's name,
   * on both sides (the user's design is the overloaded form).
   */
  homing_lightning: {
    kind: "active",
    name: "Homing Lightning",
    describe: (p) =>
      `Lightning (${p["power"]}) strikes an enemy. ${spellCost(p, "it strikes every unit with the target's name, friend and foe alike")}`,
    tags: ["attack", "ranged", "spell", "damage", "area"],
    defaults: { power: 45, cost: 1 },
    choices: (ctx, self) => ctx.living(opponent(ctx.unit(self.unitId).side)).map((target) => single(target, "main")),
    overloadChoices: (ctx, self) => {
      const everyone = ctx.living();
      return ctx
        .living(opponent(ctx.unit(self.unitId).side))
        .map((target) => at(target, everyone.filter((u) => u.defId === target.defId).map((u) => u.id), "main"));
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, ["attack", "ranged", "spell", "damage", "area"])),
  },

  /** Cyclops (scheme): share shield with an ally until both are equal; the loan perishes on the Cyclops's next turn. */
  equalize: {
    kind: "active",
    name: "Equalize",
    describe: () =>
      "Share shield with an ally until both are equal. The lent shield perishes when this unit's next turn starts.",
    tags: [],
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      return ctx
        .living(user.side)
        .filter((u) => u.id !== user.id && u.shield + 1 < user.shield)
        .map((u) => single(u, "main"));
    },
    resolve: (ctx, self, choice) => {
      const user = ctx.unit(self.unitId);
      for (const id of choice.affected) {
        const target = ctx.unit(id);
        const given = Math.floor((user.shield - target.shield) / 2);
        if (given <= 0) continue;
        user.shield -= given;
        target.shield += given;
        ctx.addEffect(id, { def: "lent_shield", source: user.id, amount: given });
        ctx.emit({ type: "shieldHit", unitId: user.id, amount: given });
        ctx.emit({ type: "shieldRestored", unitId: id, amount: given });
      }
    },
  },

  /** Mutant (overload): restoring a shield that's already full makes it stronger instead. */
  mutate: {
    kind: "passive",
    name: "Mutate",
    describe: () =>
      `If its shield is restored while already full, it gains +${MUTATED_PER_STACK} damage for the rest of combat.`,
    hooks: {
      restored: (ctx, self, restored) => {
        if (restored === 0) ctx.addEffect(self.unitId, { def: "mutated", source: self.unitId });
      },
    },
  },
};
