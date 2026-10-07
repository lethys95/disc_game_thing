import { auraSource, at, rangedChoices, single, uses } from "#rules/abilities/core";
import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import { PUNISHED_PER_STACK } from "#rules/effects";
import { adjacent, frontLine, meleeTargets, occupant, opponent } from "#rules/battle/grid";
import type { Behavior, Row, TargetChoice } from "#rules/battle/types";

/** The Jilliath melee line's abilities (docs/design/units/jilliath-melee-line.md). */
export const jilliath: Readonly<Record<string, Behavior>> = {
  /** Cleric (user, 2026-09-26): a single-target heal that restores more the more health the ally is missing. */
  mend: {
    kind: "active",
    name: "Heal",
    describe: (p) => `Heal a wounded ally for ${p["amount"]}, plus ${p["missing"]}% of the health it is missing.`,
    tags: ["heal"],
    defaults: { amount: 20, missing: 30 },
    scales: ["amount"],
    choices: (ctx, self) =>
      ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => u.hp < ctx.stats(u.id).maxHp)
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const missing = ctx.stats(id).maxHp - ctx.unit(id).hp;
        ctx.heal(id, (self.params["amount"] ?? 0) + Math.floor((missing * (self.params["missing"] ?? 0)) / 100));
      }
    },
  },

  /**
   * Jilliath's first mage (Claude's pitch, accepted in outline by the user, 2026-09-26): "thumb in the wound": a
   * ranged hit that deals more the more health the target is missing. The name is a placeholder.
   */
  condemn: {
    kind: "active",
    name: "Condemn",
    describe: (p) => `Hit an enemy for ${p["power"]}, plus ${p["missing"]}% of the health it is missing.`,
    tags: ["attack", "ranged", "spell", "damage"],
    defaults: { power: 25, missing: 30 },
    scales: ["power"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      const spec = ctx.hitSpec(self);
      for (const id of choice.affected) {
        const missing = ctx.stats(id).maxHp - ctx.unit(id).hp;
        ctx.hit(self.unitId, [id], { ...spec, power: spec.power + Math.floor((missing * (self.params["missing"] ?? 0)) / 100) });
      }
    },
  },

  /** One swing hits the entire enemy front line. */
  flail: {
    kind: "active",
    name: "Flail",
    describe: (p) =>
      `One swing, ${p["power"]} to every enemy it reaches.`,
    tags: ["attack", "melee", "damage", "area"],
    defaults: { power: 15 },
    scales: ["power"],
    choices: (ctx, self) => {
      const units = ctx.living();
      const user = ctx.unit(self.unitId);
      if (meleeTargets(units, user).length === 0) return [];
      const enemy = opponent(user.side);
      const row = frontLine(units, enemy);
      const line = units.filter((u) => u.side === enemy && u.tile.row === row);
      return line.map((anchor) => at(anchor, line.map((u) => u.id), "main"));
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },

  congregation: {
    kind: "passive",
    name: "Congregation",
    describe: (p) =>
      `+${p["bonus"]} damage for each other Congregant in the squad.`,
    defaults: { bonus: 10 },
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId) return;
        const owner = ctx.unit(self.unitId);
        const others = ctx.living(owner.side).filter((u) => u.id !== owner.id && ctx.abilityIds(u.id).includes("congregation"));
        stats.hitBonus += (self.params["bonus"] ?? 0) * others.length;
      },
    },
  },

  /** A heal: self as a free action; allies (if `allies`) as the main action. */
  lay_on_hands: {
    kind: "active",
    name: "Lay on Hands",
    describe: (p) =>
      p["allies"]
        ? `${uses(p)}. Heal for ${p["heal"]}: self as a free action, an ally as the main action.`
        : `Free action, ${uses(p).toLowerCase()}: heal self for ${p["heal"]}.`,
    tags: ["heal"],
    defaults: { charges: 1, heal: 40, allies: 0 },
    scales: ["heal"],
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      const own = [single(user, "free")];
      if (!self.params["allies"]) return own;
      return [...own, ...ctx.living(user.side).filter((u) => u.id !== user.id).map((u) => single(u, "main"))];
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.heal(id, self.params["heal"] ?? 0);
    },
  },

  devotion_aura: {
    kind: "passive",
    name: "Devotion Aura",
    describe: (p) =>
      `Adjacent allies gain +${p["armor"]} armor. Doesn't stack: an ally next to several gets the strongest.`,
    defaults: { armor: 20 },
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const owner = ctx.unit(self.unitId);
        const subject = ctx.unit(subjectId);
        if (owner.side !== subject.side || !adjacent(owner.tile, subject.tile)) return;
        const reaches = (sourceId: string) => adjacent(ctx.unit(sourceId).tile, subject.tile);
        if (auraSource(ctx, self, "devotion_aura", reaches, (p) => p["armor"] ?? 20)) stats.armor += self.params["armor"] ?? 0;
      },
    },
  },

  guardian_spirit: {
    kind: "passive",
    name: "Guardian Spirit",
    applies: ["deathward"],
    describe: () =>
      "Once per combat, a killing blow leaves this unit at 1 HP, and it cannot die until the round ends.",
    defaults: { charges: 1 },
    hooks: {
      preventDeath: (ctx, self) => {
        if (!ctx.consumeCharge(self.unitId, "guardian_spirit")) return false;
        ctx.addEffect(self.unitId, { def: "deathward", source: self.unitId });
        return true;
      },
    },
  },

  must_attack: {
    kind: "passive",
    name: "Must Attack",
    describe: () =>
      "Must attack every turn: cannot defend, wait, or use other abilities.",
    hooks: {
      restrict: (ctx, self, subjectId, allowed) => {
        if (subjectId !== self.unitId) return;
        for (const id of allowed) if (!ctx.hasTag(id, "attack")) allowed.delete(id);
      },
    },
  },

  /** Zealot: every attack costs half of its hardest hit in health. */
  zeal: {
    kind: "passive",
    name: "Zeal",
    describe: () =>
      "Each attack costs it half of its hardest hit in health.",
    hooks: {
      afterAttack: (ctx, self) => {
        ctx.lose(self.unitId, Math.floor(ctx.strongestHit(self.unitId) / 2), self.unitId);
      },
    },
  },

  /** Self-damage equal to half the damage dealt, scaled up on Hysteria's extra attacks. */
  fanaticism: {
    kind: "passive",
    name: "Fanaticism",
    describe: () =>
      "Takes self-damage equal to half the damage it deals.",
    hooks: {
      afterAttack: (ctx, self, dealt) => {
        const multiplier = ctx.battle.current?.penaltyMultiplier ?? 1;
        ctx.lose(self.unitId, Math.floor((dealt / 2) * multiplier), self.unitId);
      },
    },
  },

  /** On a kill, a free extra attack with doubled self-damage; at most twice per turn, doubling again. */
  hysteria: {
    kind: "passive",
    name: "Hysteria",
    describe: () =>
      "A kill grants a free extra attack at double self-damage, up to twice per turn.",
    hooks: {
      afterAttack: (ctx, self, _dealt, kills) => {
        const slot = ctx.battle.current;
        if (kills === 0 || slot === null || slot.unitId !== self.unitId || slot.hysteriaTriggers >= 2) return;
        slot.hysteriaTriggers += 1;
        slot.bonusAttacks.push(2 ** slot.hysteriaTriggers);
      },
    },
  },

  /** Avatar of Vengeance: every unit on the battlefield suffers Fanaticism and Hysteria and cannot defend. */
  fanaticism_aura: {
    kind: "passive",
    name: "Fanaticism Aura",
    describe: () =>
      "Every unit on the battlefield suffers Fanaticism and Hysteria, and nobody can defend.",
    hooks: {
      grants: () => [{ id: "fanaticism" }, { id: "hysteria" }],
      restrict: (_ctx, _self, _subjectId, allowed) => {
        allowed.delete("defend");
      },
    },
  },

  punishment: {
    kind: "passive",
    name: "Punishment",
    applies: ["punished"],
    describe: () =>
      `Every enemy struck loses ${PUNISHED_PER_STACK} damage and ${PUNISHED_PER_STACK} initiative for the rest of combat. Stacks up to ${PUNISHMENT_MAX_STACKS} times.`,
    hooks: {
      afterHit: (ctx, self, targetId) => ctx.addEffect(targetId, { def: "punished", source: self.unitId }),
    },
  },

  /** Half of the hit becomes bleed that strikes at the start of the victim's turns. */
  domination: {
    kind: "passive",
    name: "Domination",
    applies: ["bleeding"],
    describe: (p) =>
      `${Math.round((p["share"] ?? 0) * 100)}% of this unit's damage becomes bleed, which strikes at the start of the victim's turns.`,
    defaults: { share: 0.5 },
    hooks: {
      convert: (_ctx, self, packet) => {
        const bleed = Math.floor(packet.amount * (self.params["share"] ?? 0));
        packet.bleed += bleed;
        packet.amount -= bleed;
      },
    },
  },

  /** Pulls the first unit behind an empty front tile into the front row and stuns it. */
  hook: {
    kind: "active",
    name: "Hook",
    applies: ["stunned"],
    describe: () =>
      "Once per combat: pull the first enemy behind an empty front tile into the front row and stun it.",
    tags: [],
    defaults: { charges: 1 },
    choices: (ctx, self) => {
      const units = ctx.living();
      const enemy = opponent(ctx.unit(self.unitId).side);
      const choices: TargetChoice[] = [];
      for (const col of [0, 1, 2] as const) {
        if (occupant(units, enemy, { row: 0, col })) continue;
        const behind = ([1, 2] as const).map((row: Row) => occupant(units, enemy, { row, col }));
        const target = behind.find((u) => u !== undefined);
        if (target) choices.push(single(target, "main"));
      }
      return choices;
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        ctx.move(id, { row: 0, col: ctx.unit(id).tile.col });
        ctx.addEffect(id, { def: "stunned", source: self.unitId });
      }
    },
  },
};
