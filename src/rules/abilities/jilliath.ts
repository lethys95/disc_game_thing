import { auraSource, at, rangedChoices, single, uses } from "#rules/abilities/core";
import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import { PUNISHED_PER_STACK } from "#rules/effects";
import { adjacent, COLS, frontLine, meleeTargets, occupant, opponent } from "#rules/battle/grid";
import type { Behavior, Ctx, Row, TargetChoice, TraitSelf } from "#rules/battle/types";

/** What the unit's hits during `act` dealt (pools soaked and health removed). */
function dealing(ctx: Ctx, unitId: string, act: () => void): number {
  const before = ctx.tally.get(unitId)?.dealt ?? 0;
  act();
  return (ctx.tally.get(unitId)?.dealt ?? 0) - before;
}

/** Castigation's mark: the stronger of the two weakenings, for the longer of the two spans. */
function castigate(ctx: Ctx, targetId: string, self: TraitSelf): void {
  const weaken = self.params["weaken"] ?? 0;
  const turns = self.params["turns"] ?? 0;
  const castigated = ctx.unit(targetId).effects.find((e) => e.def === "castigated");
  if (!castigated) {
    ctx.addEffect(targetId, { def: "castigated", amount: weaken, stacks: turns, source: self.unitId });
    return;
  }
  castigated.amount = Math.max(castigated.amount, weaken);
  castigated.stacks = Math.max(castigated.stacks, turns);
}

/** The Jilliath melee line's abilities (docs/design/units/jilliath-melee-line.md). */
export const jilliath: Readonly<Record<string, Behavior>> = {
  /** The tier-1 support (user, 2026-09-26): a single-target heal that restores more the more health the ally is missing. */
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

  /** The guardian angels (the user, 2026-10-08): "'prayer' for a weak/moderate healing"; the Shepherd's adds armor. */
  prayer: {
    kind: "active",
    name: "Prayer",
    applies: ["prayed"],
    describe: (p) => `Every ally heals ${p["heal"]}${p["armor"] ? ` and has +${p["armor"]} armor until its next turn` : ""}.`,
    tags: ["heal", "area"],
    defaults: { heal: 10, armor: 0 },
    scales: ["heal"],
    choices: (ctx, self) => {
      const allies = ctx.living(ctx.unit(self.unitId).side);
      const useful = (self.params["armor"] ?? 0) > 0 || allies.some((u) => u.hp < ctx.stats(u.id).maxHp);
      const first = allies[0];
      return useful && first ? [at(first, allies.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => {
      const armor = self.params["armor"] ?? 0;
      for (const id of choice.affected) {
        ctx.heal(id, self.params["heal"] ?? 0);
        if (armor > 0) ctx.addEffect(id, { def: "prayed", amount: armor, source: self.unitId });
      }
    },
  },

  /** The Guardian (the user, 2026-10-08): "a single target single use 30+ armor on target for a single turn". */
  guardians_shield: {
    kind: "active",
    name: "Guardian's Shield",
    applies: ["guardians_shield"],
    describe: (p) => `${uses(p)}: an ally has +${p["armor"]} armor until its next turn.`,
    tags: [],
    defaults: { charges: 1, armor: 30 },
    choices: (ctx, self) => ctx.living(ctx.unit(self.unitId).side).map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "guardians_shield", amount: self.params["armor"] ?? 0, source: self.unitId });
    },
  },

  /**
   * The Godkin (the user: resurrection "only lives under faith", "at 50% health to begin with"). Not a unit whose
   * remains were used or destroyed: the Grove's corpse explosion prevents it (the user, 2026-09-26).
   */
  resurrection: {
    kind: "active",
    name: "Resurrection",
    describe: (p) => `${uses(p)}: a fallen ally rises with ${p["percent"]}% of its health. Not one whose remains were used or destroyed.`,
    tags: ["heal"],
    defaults: { charges: 1, percent: 50 },
    choices: (ctx, self) => {
      const side = ctx.unit(self.unitId).side;
      const living = ctx.living();
      return Object.values(ctx.battle.units)
        .filter((u) => u.side === side && !u.alive && !u.fled && u.corpse === "intact")
        .filter((u) => !living.some((l) => l.side === side && l.tile.row === u.tile.row && l.tile.col === u.tile.col))
        .map((u) => single(u, "main"));
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.revive(id, Math.floor((ctx.stats(id).maxHp * (self.params["percent"] ?? 0)) / 100));
    },
  },

  /**
   * The Paragon and the Empyreal (the user: discipline priests' Atonement, "probably not 1 to 1. Should damage less than
   * it heals"): a hit whose damage heals the `allies` most wounded allies, each for `percent` of it.
   */
  atonement: {
    kind: "active",
    name: "Atonement",
    describe: (p) =>
      `Hit an enemy for ${p["power"]}. ${p["allies"] === 1 ? "The most wounded ally" : `The ${p["allies"]} most wounded allies`} heal${p["allies"] === 1 ? "s" : " each"} ${p["percent"]}% of the damage dealt.`,
    tags: ["attack", "ranged", "damage", "heal"],
    defaults: { power: 15, allies: 1, percent: 150 },
    scales: ["power"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      const dealt = dealing(ctx, self.unitId, () => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)));
      const side = ctx.unit(self.unitId).side;
      const missing = (id: string) => ctx.stats(id).maxHp - ctx.unit(id).hp;
      const wounded = ctx
        .living(side)
        .filter((u) => missing(u.id) > 0)
        .sort((a, b) => missing(b.id) - missing(a.id))
        .slice(0, self.params["allies"] ?? 1);
      for (const ally of wounded) ctx.heal(ally.id, Math.floor((dealt * (self.params["percent"] ?? 0)) / 100));
    },
  },

  /** The Reclaimer (the user: "massive but double edged heals"): the strongest heal, paid with her own health. */
  transfusion: {
    kind: "active",
    name: "Transfusion",
    describe: (p) => `Heal another ally for ${p["heal"]}. She loses ${p["paid"]}% of what it heals.`,
    tags: ["heal"],
    // Not `cost`: that param is a spell's price in spell charges.
    defaults: { heal: 60, paid: 50 },
    scales: ["heal"],
    choices: (ctx, self) =>
      ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => u.id !== self.unitId && u.hp < ctx.stats(u.id).maxHp)
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const before = ctx.unit(id).hp;
        ctx.heal(id, self.params["heal"] ?? 0);
        const healed = ctx.unit(id).hp - before;
        ctx.lose(self.unitId, Math.floor((healed * (self.params["paid"] ?? 0)) / 100), self.unitId);
      }
    },
  },

  /** The Reclaimer's attack (the user: "some lifedrain on enemies as attack"): it heals her for what it deals. */
  reclaim: {
    kind: "active",
    name: "Reclaim",
    describe: (p) => `Hit an enemy for ${p["power"]}, and heal ${p["percent"]}% of the damage dealt.`,
    tags: ["attack", "ranged", "damage", "heal"],
    defaults: { power: 20, percent: 100 },
    scales: ["power"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      const dealt = dealing(ctx, self.unitId, () => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)));
      ctx.heal(self.unitId, Math.floor((dealt * (self.params["percent"] ?? 0)) / 100));
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

  /**
   * The faith mage (the user, 2026-10-06): holy damage. Castigation: "less damage, but whoever it hits deals less".
   */
  castigation: {
    kind: "active",
    name: "Castigation",
    applies: ["castigated"],
    describe: (p) => `Hit an enemy for ${p["power"]} holy damage. It deals ${p["weaken"]}% less damage for its next ${p["turns"]} turns.`,
    tags: ["attack", "ranged", "spell", "damage"],
    damageType: "holy",
    defaults: { power: 18, weaken: 30, turns: 2 },
    scales: ["power"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self));
      for (const id of choice.affected) castigate(ctx, id, self);
    },
  },

  /** The Pontiff (the user, 2026-10-07): "Hits all enemies for light damage and applies a weaker castigate effect to all." */
  chant: {
    kind: "active",
    name: "Chant",
    applies: ["castigated"],
    describe: (p) => `Hit every enemy for ${p["power"]} holy damage. Each deals ${p["weaken"]}% less damage for its next ${p["turns"]} turns.`,
    tags: ["ranged", "spell", "damage", "area"],
    damageType: "holy",
    defaults: { power: 6, weaken: 15, turns: 2 },
    scales: ["power"],
    choices: (ctx, self) => {
      const enemies = ctx.living(opponent(ctx.unit(self.unitId).side));
      const first = enemies[0];
      return first ? [at(first, enemies.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => {
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self));
      for (const id of choice.affected) castigate(ctx, id, self);
    },
  },

  /** The user (2026-10-06): "incapacitate for three turns. Free action. Unit wakes up early if damaged or healed by anyone or anything." */
  repentance: {
    kind: "active",
    name: "Repentance",
    applies: ["repentant"],
    describe: (p) => `${uses(p)}, a free action: an enemy is out of the fight for its next ${p["turns"]} turns. Anything that damages or heals it wakes it.`,
    tags: ["spell"],
    defaults: { charges: 1, turns: 3 },
    choices: (ctx, self) =>
      ctx
        .living(opponent(ctx.unit(self.unitId).side))
        .filter((u) => !u.effects.some((e) => e.def === "repentant"))
        .map((u) => single(u, "free")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "repentant", stacks: self.params["turns"] ?? 0, source: self.unitId });
    },
  },

  /** The user (2026-10-06): "all enemies who dealt damage last turn". */
  judgement: {
    kind: "active",
    name: "Judgement",
    describe: (p) => `Strike every enemy whose last turn dealt damage, ${p["power"]} holy damage each.`,
    tags: ["ranged", "spell", "damage", "area"],
    damageType: "holy",
    defaults: { power: 25 },
    scales: ["power"],
    choices: (ctx, self) => {
      const guilty = ctx.living(opponent(ctx.unit(self.unitId).side)).filter((u) => u.struck);
      const first = guilty[0];
      return first ? [at(first, guilty.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },

  /**
   * The Doomsayer (the user, 2026-10-06): "deals damage that stacks for every allied unit which are left in the queue
   * before restart, but skips their turn (as if they're contributing to burning an enemy at the stake)".
   */
  burn_at_the_stake: {
    kind: "active",
    name: "Burn at the stake",
    applies: ["gave_turn"],
    describe: (p) => `Hit an enemy for ${p["power"]}, plus ${p["perAlly"]} for every ally still to act this round. Each of those allies gives up its next turn.`,
    tags: ["ranged", "spell", "damage"],
    damageType: "fire",
    defaults: { power: 20, perAlly: 25 },
    scales: ["power", "perAlly"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => {
      const battle = ctx.battle;
      const waiting = ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => u.id !== self.unitId && !u.effects.some((e) => e.def === "gave_turn"))
        .filter((u) => battle.queue.includes(u.id) || (battle.actionsThisRound[u.id] ?? 0) > battle.pass);
      const power = (self.params["power"] ?? 0) + (self.params["perAlly"] ?? 0) * waiting.length;
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, undefined, power));
      for (const ally of waiting) ctx.addEffect(ally.id, { def: "gave_turn", source: self.unitId });
    },
  },

  /** The user (2026-10-06): tier 3 "will likely strike all enemies for small damage but putting burn on all enemies". Name: a placeholder. */
  fire_on_all: {
    kind: "active",
    name: "Fire on all",
    describe: (p) => `Hit every enemy for ${p["power"]}.`,
    tags: ["ranged", "spell", "damage", "area"],
    damageType: "fire",
    defaults: { power: 5 },
    scales: ["power"],
    choices: (ctx, self) => {
      const enemies = ctx.living(opponent(ctx.unit(self.unitId).side));
      const first = enemies[0];
      return first ? [at(first, enemies.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },

  /** The user (2026-10-06): "detonate the burn". How much it adds is Claude's (provisional). */
  detonate: {
    kind: "active",
    name: "Detonate",
    describe: (p) => `Every burning enemy takes what is left of its burn at once, at ${p["percent"]}%, as a fire hit. The burn ends.`,
    tags: ["ranged", "spell", "damage", "area"],
    damageType: "fire",
    defaults: { percent: 150 },
    choices: (ctx, self) => {
      const burning = ctx.living(opponent(ctx.unit(self.unitId).side)).filter((u) => u.effects.some((e) => e.def === "burning"));
      const first = burning[0];
      return first ? [at(first, burning.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) {
        const burn = ctx.unit(id).effects.find((e) => e.def === "burning");
        if (!burn) continue;
        ctx.removeEffect(id, burn);
        const power = Math.floor((burn.amount * burn.stacks * (self.params["percent"] ?? 0)) / 100);
        ctx.hit(self.unitId, [id], ctx.hitSpec(self, undefined, power));
      }
    },
  },

  /**
   * The martyrdom mage (the user, 2026-09-26): "a beam (a line, up to three in a row), hitting very hard but
   * backfiring on every shot". The line runs front to back through one column; the backfire is the unit's Fanaticism.
   */
  beam: {
    kind: "active",
    name: "Beam",
    describe: (p) => `Hit every enemy in one column, front to back, for ${p["power"]}.`,
    tags: ["ranged", "spell", "damage", "area"],
    damageType: "fire",
    defaults: { power: 25 },
    scales: ["power"],
    choices: (ctx, self) => {
      const enemies = ctx.living(opponent(ctx.unit(self.unitId).side));
      return COLS.flatMap((col) => {
        const line = enemies.filter((u) => u.tile.col === col).sort((a, b) => a.tile.row - b.tile.row);
        const front = line[0];
        return front ? [at(front, line.map((u) => u.id), "main")] : [];
      });
    },
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
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
