import { adjacent, frontLine, meleeTargets, occupant, opponent } from "#rules/grid";
import type { Behavior, BattleUnit, Cost, Ctx, Row, TargetChoice } from "#rules/types";

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
};

export function behavior(id: string): Behavior {
  const found = BEHAVIORS[id];
  if (!found) throw new Error(`unknown ability: ${id}`);
  return found;
}
