import { at, single } from "#rules/abilities/core";
import { adjacent, frontLine, meleeTargets, occupant, opponent } from "#rules/battle/grid";
import type { Behavior, Row, TargetChoice } from "#rules/battle/types";

/** The Jilliath melee line's abilities (docs/design/units/jilliath-melee-line.md). */
export const jilliath: Readonly<Record<string, Behavior>> = {
  /** One swing hits the entire enemy front line. */
  flail: {
    kind: "active",
    name: "Flail",
    tags: ["attack", "melee", "damage", "area"],
    choices: (ctx, self) => {
      const units = ctx.living();
      const user = ctx.unit(self.unitId);
      if (meleeTargets(units, user).length === 0) return [];
      const enemy = opponent(user.side);
      const row = frontLine(units, enemy);
      const line = units.filter((u) => u.side === enemy && u.tile.row === row);
      return line.map((anchor) => at(anchor, line.map((u) => u.id), "main"));
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, ["attack", "melee", "damage", "area"])),
  },

  congregation: {
    kind: "passive",
    name: "Congregation",
    defaults: { bonus: 10 },
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId) return;
        const owner = ctx.unit(self.unitId);
        const others = ctx.living(owner.side).filter((u) => u.id !== owner.id && ctx.abilityIds(u.id).includes("congregation"));
        stats.damage += (self.params["bonus"] ?? 0) * others.length;
      },
    },
  },

  /** Heals for `multiplier` × the healer's damage: self as a free action; allies (if `allies`) as the main action. */
  lay_on_hands: {
    kind: "active",
    name: "Lay on Hands",
    tags: ["heal"],
    defaults: { charges: 1, multiplier: 2, allies: 0 },
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      const own = [single(user, "free")];
      if (!self.params["allies"]) return own;
      return [...own, ...ctx.living(user.side).filter((u) => u.id !== user.id).map((u) => single(u, "main"))];
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.heal(id, (self.params["multiplier"] ?? 0) * ctx.stats(self.unitId).damage);
    },
  },

  devotion_aura: {
    kind: "passive",
    name: "Devotion Aura",
    defaults: { armor: 20 },
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const owner = ctx.unit(self.unitId);
        const subject = ctx.unit(subjectId);
        if (owner.side === subject.side && adjacent(owner.tile, subject.tile)) stats.armor += self.params["armor"] ?? 0;
      },
    },
  },

  guardian_spirit: {
    kind: "passive",
    name: "Guardian Spirit",
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
    hooks: {
      restrict: (ctx, self, subjectId, allowed) => {
        if (subjectId !== self.unitId) return;
        for (const id of allowed) if (!ctx.hasTag(id, "attack")) allowed.delete(id);
      },
    },
  },

  /** Zealot: every attack costs half of its current damage in health. */
  zeal: {
    kind: "passive",
    name: "Zeal",
    hooks: {
      afterAttack: (ctx, self) => {
        ctx.lose(self.unitId, Math.floor(ctx.stats(self.unitId).damage / 2), self.unitId);
      },
    },
  },

  /** Self-damage equal to half the damage dealt, scaled up on Hysteria's extra attacks. */
  fanaticism: {
    kind: "passive",
    name: "Fanaticism",
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
    hooks: {
      grants: () => ["fanaticism", "hysteria"],
      restrict: (_ctx, _self, _subjectId, allowed) => {
        allowed.delete("defend");
      },
    },
  },

  punishment: {
    kind: "passive",
    name: "Punishment",
    hooks: {
      afterHit: (ctx, self, targetId) => ctx.addEffect(targetId, { def: "punished", source: self.unitId }),
    },
  },

  /** Half of the hit becomes bleed that strikes at the start of the victim's turns. */
  domination: {
    kind: "passive",
    name: "Domination",
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
