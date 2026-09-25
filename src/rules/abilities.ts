import { adjacent, COLS, frontLine, meleeTargets, occupant, opponent, ROWS } from "#rules/grid";
import type { Behavior, BattleUnit, Col, Cost, Ctx, Row, TargetChoice } from "#rules/types";

function at(unit: BattleUnit, affected: readonly string[], cost: Cost): TargetChoice {
  return { anchor: { side: unit.side, tile: unit.tile }, affected, cost };
}

function single(unit: BattleUnit, cost: Cost): TargetChoice {
  return at(unit, [unit.id], cost);
}

const attack: Behavior = {
  kind: "active",
  name: "Attack",
  isAttack: true,
  choices: (ctx, userId) => meleeTargets(ctx.living(), ctx.unit(userId)).map((t) => single(t, "main")),
  resolve: (ctx, userId, choice) => ctx.attack(userId, choice.affected),
};

const defend: Behavior = {
  kind: "active",
  name: "Defend",
  choices: (ctx, userId) => [single(ctx.unit(userId), "main")],
  resolve: (ctx, userId) => ctx.addEffect(userId, { kind: "defending" }),
};

/** Resolved by the engine, which moves the unit to the end of the current pass. */
const wait: Behavior = {
  kind: "active",
  name: "Wait",
  choices: (ctx, userId) => [single(ctx.unit(userId), "main")],
  resolve: () => {},
};

/** Punisher and Torturer: one swing hits the entire enemy front line. */
const flail: Behavior = {
  kind: "active",
  name: "Flail",
  isAttack: true,
  choices: (ctx, userId) => {
    const units = ctx.living();
    const user = ctx.unit(userId);
    if (meleeTargets(units, user).length === 0) return [];
    const enemy = opponent(user.side);
    const row = frontLine(units, enemy);
    const line = units.filter((u) => u.side === enemy && u.tile.row === row);
    return line.map((anchor) => at(anchor, line.map((u) => u.id), "main"));
  },
  resolve: (ctx, userId, choice) => ctx.attack(userId, choice.affected),
};

const congregation: Behavior = {
  kind: "passive",
  name: "Congregation",
  modifyStats: (ctx, ownerId, subjectId, stats) => {
    if (ownerId !== subjectId) return;
    const owner = ctx.unit(ownerId);
    const others = ctx
      .living(owner.side)
      .filter((u) => u.id !== ownerId && ctx.abilityIds(u.id).includes("congregation"));
    stats.damage += 10 * others.length;
  },
};

function layOnHands(name: string, charges: number, allies: boolean): Behavior {
  return {
    kind: "active",
    name,
    charges,
    choices: (ctx, userId) => {
      const user = ctx.unit(userId);
      const self = [single(user, "free")];
      if (!allies) return self;
      const others = ctx.living(user.side).filter((u) => u.id !== userId);
      return [...self, ...others.map((u) => single(u, "main"))];
    },
    resolve: (ctx, userId, choice) => {
      for (const id of choice.affected) ctx.heal(id, 2 * ctx.stats(userId).damage);
    },
  };
}

const devotionAura: Behavior = {
  kind: "passive",
  name: "Devotion Aura",
  modifyStats: (ctx, ownerId, subjectId, stats) => {
    const owner = ctx.unit(ownerId);
    const subject = ctx.unit(subjectId);
    if (owner.side === subject.side && adjacent(owner.tile, subject.tile)) stats.armor += 20;
  },
};

const guardianSpirit: Behavior = {
  kind: "passive",
  name: "Guardian Spirit",
  charges: 1,
  preventDeath: (ctx, ownerId) => {
    if (!ctx.consumeCharge(ownerId, "guardian_spirit", 1)) return false;
    ctx.addEffect(ownerId, { kind: "deathward" });
    return true;
  },
};

const mustAttack: Behavior = {
  kind: "passive",
  name: "Must Attack",
  restrict: (ctx, ownerId, subjectId, allowed) => {
    if (ownerId !== subjectId) return;
    for (const id of allowed) if (!ctx.isAttack(id)) allowed.delete(id);
  },
};

/** Zealot: every attack costs half of its current damage in health. */
const zeal: Behavior = {
  kind: "passive",
  name: "Zeal",
  afterAttack: (ctx, ownerId) => ctx.lose(ownerId, Math.floor(ctx.stats(ownerId).damage / 2), ownerId),
};

/** Fanatic line: self-damage equal to half the damage dealt, scaled up on Hysteria's extra attacks. */
const fanaticism: Behavior = {
  kind: "passive",
  name: "Fanaticism",
  afterAttack: (ctx, ownerId, dealt) => {
    const multiplier = ctx.battle.current?.penaltyMultiplier ?? 1;
    ctx.lose(ownerId, Math.floor((dealt / 2) * multiplier), ownerId);
  },
};

/** On a kill, a free extra attack with doubled self-damage; at most twice per turn, doubling again. */
const hysteria: Behavior = {
  kind: "passive",
  name: "Hysteria",
  afterAttack: (ctx, ownerId, _dealt, kills) => {
    const slot = ctx.battle.current;
    if (kills === 0 || slot === null || slot.unitId !== ownerId || slot.hysteriaTriggers >= 2) return;
    slot.hysteriaTriggers += 1;
    slot.bonusAttacks.push(2 ** slot.hysteriaTriggers);
  },
};

/** Avatar of Vengeance: every unit on the battlefield suffers Fanaticism and Hysteria and cannot defend. */
const fanaticismAura: Behavior = {
  kind: "passive",
  name: "Fanaticism Aura",
  grants: () => ["fanaticism", "hysteria"],
  restrict: (_ctx, _ownerId, _subjectId, allowed) => {
    allowed.delete("defend");
  },
};

const punishment: Behavior = {
  kind: "passive",
  name: "Punishment",
  onHit: (ctx, _ownerId, targetId) => ctx.addEffect(targetId, { kind: "punished", stacks: 1 }),
};

const domination: Behavior = {
  kind: "passive",
  name: "Domination",
  bleedShare: 0.5,
};

/** Pulls the first unit behind an empty front tile into the front row and stuns it. */
const hook: Behavior = {
  kind: "active",
  name: "Hook",
  charges: 1,
  choices: (ctx, userId) => {
    const units = ctx.living();
    const enemy = opponent(ctx.unit(userId).side);
    const choices: TargetChoice[] = [];
    for (const col of [0, 1, 2] as const) {
      if (occupant(units, enemy, { row: 0, col })) continue;
      const behind = ([1, 2] as const).map((row: Row) => occupant(units, enemy, { row, col }));
      const target = behind.find((u) => u !== undefined);
      if (target) choices.push(single(target, "main"));
    }
    return choices;
  },
  resolve: (ctx, _userId, choice) => {
    for (const id of choice.affected) {
      const target = ctx.unit(id);
      ctx.move(id, { row: 0, col: target.tile.col });
      ctx.addEffect(id, { kind: "stunned" });
    }
  },
};

/** Ranged: any living enemy (D2 archers; provisional). */
function rangedChoices(ctx: Ctx, userId: string): TargetChoice[] {
  const enemy = opponent(ctx.unit(userId).side);
  return ctx.living(enemy).map((u) => single(u, "main"));
}

const shoot: Behavior = {
  kind: "active",
  name: "Shoot",
  isAttack: true,
  choices: rangedChoices,
  resolve: (ctx, userId, choice) => ctx.attack(userId, choice.affected),
};

/** Apprentice's very weak single-target secondary: the unit's own (low) damage, unlimited. */
const bolt: Behavior = { ...shoot, name: "Bolt" };

/**
 * An area spell on the enemy grid. Every enemy tile is a clickable anchor; the shape is laid around it, clipped to
 * the grid. Ranged, so the caster can be anywhere.
 */
function areaSpell(name: string, shape: (row: Row, col: Col) => { row: number; col: number }[], power: (ctx: Ctx, userId: string) => number, charges?: number): Behavior {
  return {
    kind: "active",
    name,
    isAttack: true,
    ...(charges === undefined ? {} : { charges }),
    choices: (ctx, userId) => {
      const enemy = opponent(ctx.unit(userId).side);
      const units = ctx.living(enemy);
      const choices: TargetChoice[] = [];
      for (const row of ROWS) {
        for (const col of COLS) {
          const cells = shape(row, col);
          const affected = units.filter((u) => cells.some((c) => c.row === u.tile.row && c.col === u.tile.col)).map((u) => u.id);
          if (affected.length > 0) choices.push({ anchor: { side: enemy, tile: { row, col } }, affected, cost: "main" });
        }
      }
      return choices;
    },
    resolve: (ctx, userId, choice) => ctx.attack(userId, choice.affected, power(ctx, userId)),
  };
}

/** Hedge Mage: the 2x2 block that contains the chosen tile. */
const area2x2 = areaSpell(
  "Area Spell",
  (row, col) => {
    const r = Math.min(row, 1);
    const c = Math.min(col, 1);
    return [{ row: r, col: c }, { row: r + 1, col: c }, { row: r, col: c + 1 }, { row: r + 1, col: c + 1 }];
  },
  (ctx, userId) => ctx.stats(userId).damage,
);

/** Provisional: the Apprentice's burst hits for this much, independent of its weak personal damage. */
const PLUS_BURST_POWER = 40;

/** Apprentice: a plus shape around the chosen tile, two uses per combat. */
const plusBurst = areaSpell(
  "Burst",
  (row, col) => [{ row, col }, { row: row - 1, col }, { row: row + 1, col }, { row, col: col - 1 }, { row, col: col + 1 }],
  () => PLUS_BURST_POWER,
  2,
);

/** Brigand: once per combat, stun the enemy directly in front (same column, enemy front line). */
const stunFront: Behavior = {
  kind: "active",
  name: "Stun",
  charges: 1,
  choices: (ctx, userId) => {
    const user = ctx.unit(userId);
    return meleeTargets(ctx.living(), user)
      .filter((t) => t.tile.col === user.tile.col)
      .map((t) => single(t, "main"));
  },
  resolve: (ctx, _userId, choice) => {
    for (const id of choice.affected) ctx.addEffect(id, { kind: "stunned" });
  },
};

/** Marauder: +10 damage against a target that has armor. */
const antiArmor: Behavior = {
  kind: "passive",
  name: "Anti-armor",
  bonusAgainst: (ctx, _ownerId, targetId) => (ctx.stats(targetId).armor > 0 ? 10 : 0),
};

/** Provisional amount the Arcane Engineer restores. */
const SHIELD_RESTORE = 40;

/** Arcane Engineer: restore an ally's shield. Only units with a shield stat can be targeted. */
const restoreShield: Behavior = {
  kind: "active",
  name: "Restore Shield",
  choices: (ctx, userId) =>
    ctx
      .living(ctx.unit(userId).side)
      // Full shields are valid targets too: that's how a Mutant is fed (Mutate).
      .filter((u) => ctx.stats(u.id).shield > 0)
      .map((u) => single(u, "main")),
  resolve: (ctx, _userId, choice) => {
    for (const id of choice.affected) ctx.restoreShield(id, SHIELD_RESTORE);
  },
};

/**
 * Justiciar (scheme): mark a unit; the next ability it uses is cancelled. A free action, once per combat. The mark
 * is secret from the marked unit's side (the view hides it).
 */
const negate: Behavior = {
  kind: "active",
  name: "Negate",
  charges: 1,
  choices: (ctx, userId) => {
    const enemy = opponent(ctx.unit(userId).side);
    return ctx
      .living(enemy)
      .filter((u) => !u.effects.some((e) => e.kind === "negated"))
      .map((u) => single(u, "free"));
  },
  resolve: (ctx, _userId, choice) => {
    for (const id of choice.affected) ctx.addEffect(id, { kind: "negated" });
  },
};

/** Provisional: the Thaumaturge's lightning hits each struck unit for this much. */
const HOMING_LIGHTNING_POWER = 45;

/** Thaumaturge (overload): lightning that strikes every unit sharing the target's name, on both sides. Two uses. */
const homingLightning: Behavior = {
  kind: "active",
  name: "Homing Lightning",
  isAttack: true,
  charges: 2,
  choices: (ctx, userId) => {
    const enemy = opponent(ctx.unit(userId).side);
    const everyone = ctx.living();
    return ctx.living(enemy).map((target) => at(target, everyone.filter((u) => u.defId === target.defId).map((u) => u.id), "main"));
  },
  resolve: (ctx, userId, choice) => ctx.attack(userId, choice.affected, HOMING_LIGHTNING_POWER),
};

/**
 * Battery (scheme): share shields with a unit until both are equal. What it hands over is a loan that perishes when
 * the Battery's next turn starts.
 */
const equalize: Behavior = {
  kind: "active",
  name: "Equalize",
  choices: (ctx, userId) => {
    const user = ctx.unit(userId);
    return ctx
      .living(user.side)
      .filter((u) => u.id !== userId && u.shield + 1 < user.shield)
      .map((u) => single(u, "main"));
  },
  resolve: (ctx, userId, choice) => {
    const user = ctx.unit(userId);
    for (const id of choice.affected) {
      const target = ctx.unit(id);
      const given = Math.floor((user.shield - target.shield) / 2);
      if (given <= 0) continue;
      user.shield -= given;
      target.shield += given;
      ctx.addEffect(id, { kind: "lentShield", loans: [{ from: userId, amount: given }] });
      ctx.emit({ type: "shieldRestored", unitId: id, amount: given });
      ctx.emit({ type: "shieldHit", unitId: userId, amount: given });
    }
  },
};

/** Mutant (overload): restoring a shield that's already full makes it stronger instead. */
const mutate: Behavior = {
  kind: "passive",
  name: "Mutate",
  onShieldOvercharge: (ctx, ownerId) => ctx.addEffect(ownerId, { kind: "mutated", stacks: 1 }),
};

export const BEHAVIORS: Readonly<Record<string, Behavior>> = {
  attack,
  defend,
  wait,
  flail,
  congregation,
  lay_on_hands: layOnHands("Lay on Hands", 1, false),
  divine_lay_on_hands: layOnHands("Divine Lay on Hands", 2, true),
  devotion_aura: devotionAura,
  guardian_spirit: guardianSpirit,
  must_attack: mustAttack,
  zeal,
  fanaticism,
  hysteria,
  fanaticism_aura: fanaticismAura,
  punishment,
  domination,
  hook,
  shoot,
  bolt,
  area_2x2: area2x2,
  plus_burst: plusBurst,
  stun_front: stunFront,
  anti_armor: antiArmor,
  restore_shield: restoreShield,
  negate,
  homing_lightning: homingLightning,
  equalize,
  mutate,
};

export function behavior(id: string): Behavior {
  const found = BEHAVIORS[id];
  if (!found) throw new Error(`unknown ability: ${id}`);
  return found;
}
