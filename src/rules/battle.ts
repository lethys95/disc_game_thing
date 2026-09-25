import { behavior } from "#rules/abilities";
import type {
  Action,
  Battle,
  BattleEvent,
  BattleUnit,
  Ctx,
  Effect,
  LegalAbility,
  PassiveBehavior,
  Side,
  Slot,
  Stats,
  Tile,
} from "#rules/types";
import { UNITS } from "#rules/units";

export interface Placement {
  readonly defId: string;
  readonly tile: Tile;
}

export interface Step {
  readonly battle: Battle;
  readonly events: readonly BattleEvent[];
}

/** Initiative per action in a round; provisional balance constant (docs/design/combat.md). */
export const INITIATIVE_PER_ACTION = 15;

export function actionsPerRound(initiative: number): number {
  return Math.max(1, Math.floor(initiative / INITIATIVE_PER_ACTION));
}

export function createBattle(sides: readonly [readonly Placement[], readonly Placement[]]): Step {
  const units: Record<string, BattleUnit> = {};
  sides.forEach((placements, index) => {
    const side: Side = index === 0 ? 0 : 1;
    for (const { defId, tile } of placements) {
      const def = UNITS[defId];
      if (!def) throw new Error(`unknown unit: ${defId}`);
      const id = `${side}.${tile.row}.${tile.col}`;
      if (units[id]) throw new Error(`two units on tile ${id}`);
      units[id] = {
        id,
        defId,
        name: def.name,
        side,
        tile,
        hp: def.stats.maxHp,
        base: def.stats,
        damageType: def.damageType,
        abilities: def.abilities.map((ref) => ({ ref, chargesUsed: 0 })),
        effects: [],
        alive: true,
      };
    }
  });
  const battle: Battle = {
    units,
    round: 0,
    pass: 0,
    actionsThisRound: {},
    queue: [],
    waitedThisPass: [],
    current: null,
    outcome: null,
  };
  const events: BattleEvent[] = [];
  const ctx = makeCtx(battle, events);
  checkOutcome(ctx);
  advance(ctx);
  return { battle, events };
}

export function effectiveStats(battle: Battle, unitId: string): Stats {
  return makeCtx(battle, []).stats(unitId);
}

export function legalActions(battle: Battle): LegalAbility[] {
  return legal(makeCtx(battle, []));
}

export function applyAction(battle: Battle, action: Action): Step {
  const draft = structuredClone(battle);
  const events: BattleEvent[] = [];
  const ctx = makeCtx(draft, events);
  const slot = draft.current;
  const option = legal(ctx).find((a) => a.abilityId === action.abilityId);
  const choice = option?.choices[action.choice];
  if (!slot || !option || !choice) throw new Error(`illegal action: ${JSON.stringify(action)}`);

  const unitId = slot.unitId;
  const found = behavior(action.abilityId);
  if (found.kind !== "active") throw new Error(`not an active ability: ${action.abilityId}`);
  if (found.charges !== undefined) ctx.consumeCharge(unitId, action.abilityId, found.charges);

  const bonus = slot.bonusAttacks.shift();
  slot.penaltyMultiplier = bonus ?? 1;
  ctx.emit({ type: "ability", unitId, abilityId: action.abilityId, targets: choice.affected });
  found.resolve(ctx, unitId, choice);
  slot.penaltyMultiplier = 1;

  if (bonus === undefined && choice.cost === "free") slot.freeUsed.push(action.abilityId);
  if (bonus === undefined && choice.cost === "main") slot.mainTaken = true;
  if (action.abilityId === "wait") {
    draft.queue.push(unitId);
    draft.waitedThisPass.push(unitId);
  }

  checkOutcome(ctx);
  if (draft.current && slotIsOver(ctx, slot)) draft.current = null;
  advance(ctx);
  return { battle: draft, events };
}

function slotIsOver(ctx: Ctx, slot: Slot): boolean {
  if (!ctx.unit(slot.unitId).alive) return true;
  const options = legal(ctx);
  if (slot.mainTaken) return slot.bonusAttacks.length === 0 || options.length === 0;
  return !hasMainAction(options);
}

function hasMainAction(options: readonly LegalAbility[]): boolean {
  return options.some((a) => a.choices.some((c) => c.cost === "main"));
}

function legal(ctx: Ctx): LegalAbility[] {
  const battle = ctx.battle;
  const slot = battle.current;
  if (!slot || battle.outcome) return [];
  const unitId = slot.unitId;
  const bonusMode = slot.bonusAttacks.length > 0;

  const allowed = new Set(ctx.abilityIds(unitId).filter((id) => behavior(id).kind === "active"));
  if (bonusMode) for (const id of allowed) if (!ctx.isAttack(id)) allowed.delete(id);
  for (const owner of ctx.living()) {
    for (const id of ctx.abilityIds(owner.id)) {
      const b = behavior(id);
      if (b.kind === "passive") b.restrict?.(ctx, owner.id, unitId, allowed);
    }
  }
  if (battle.waitedThisPass.includes(unitId)) allowed.delete("wait");

  const result: LegalAbility[] = [];
  for (const id of allowed) {
    const b = behavior(id);
    if (b.kind !== "active") continue;
    if (b.charges !== undefined && ctx.chargesLeft(unitId, id, b.charges) === 0) continue;
    const choices = b
      .choices(ctx, unitId)
      .map((c) => (bonusMode ? { ...c, cost: "free" as const } : c))
      .filter((c) => bonusMode || c.cost === "main" || !slot.freeUsed.includes(id));
    if (choices.length > 0) result.push({ abilityId: id, name: b.name, choices });
  }
  return result;
}

function advance(ctx: Ctx): void {
  const battle = ctx.battle;
  while (!battle.outcome && battle.current === null) {
    const next = battle.queue.shift();
    if (next === undefined) {
      const more = ctx.living().some((u) => (battle.actionsThisRound[u.id] ?? 0) > battle.pass);
      if (more) startPass(ctx);
      else startRound(ctx);
      continue;
    }
    const unit = ctx.unit(next);
    if (!unit.alive) continue;
    unit.effects = unit.effects.filter((e) => e.kind !== "defending");
    ctx.emit({ type: "turnStart", unitId: next });

    const bleeding = unit.effects.find((e) => e.kind === "bleeding");
    if (bleeding?.kind === "bleeding") {
      ctx.lose(next, bleeding.perTurn, null);
      checkOutcome(ctx);
      if (!unit.alive || battle.outcome) continue;
    }
    if (unit.effects.some((e) => e.kind === "stunned")) {
      unit.effects = unit.effects.filter((e) => e.kind !== "stunned");
      ctx.emit({ type: "skipped", unitId: next, reason: "stunned" });
      continue;
    }
    battle.current = {
      unitId: next,
      freeUsed: [],
      mainTaken: false,
      bonusAttacks: [],
      hysteriaTriggers: 0,
      penaltyMultiplier: 1,
    };
    if (!hasMainAction(legal(ctx))) {
      battle.current = null;
      ctx.emit({ type: "skipped", unitId: next, reason: "noActions" });
    }
  }
}

function startRound(ctx: Ctx): void {
  const battle = ctx.battle;
  battle.round += 1;
  battle.pass = 0;
  battle.actionsThisRound = {};
  for (const unit of ctx.living()) {
    unit.effects = unit.effects.filter((e) => e.kind !== "deathward");
    battle.actionsThisRound[unit.id] = actionsPerRound(ctx.stats(unit.id).initiative);
  }
  ctx.emit({ type: "roundStart", round: battle.round });
  startPass(ctx);
}

/** Every unit with actions left acts once per pass, fastest first, so extra actions interleave. */
function startPass(ctx: Ctx): void {
  const battle = ctx.battle;
  battle.pass += 1;
  battle.waitedThisPass = [];
  battle.queue = ctx
    .living()
    .filter((u) => (battle.actionsThisRound[u.id] ?? 0) >= battle.pass)
    .map((u) => ({ u, initiative: ctx.stats(u.id).initiative }))
    .sort(
      (a, b) =>
        b.initiative - a.initiative ||
        a.u.side - b.u.side ||
        a.u.tile.row - b.u.tile.row ||
        a.u.tile.col - b.u.tile.col,
    )
    .map(({ u }) => u.id);
}

function checkOutcome(ctx: Ctx): void {
  const battle = ctx.battle;
  if (battle.outcome) return;
  const first = ctx.living(0).length;
  const second = ctx.living(1).length;
  if (first > 0 && second > 0) return;
  battle.outcome =
    first === 0 && second === 0 ? { winner: null, reason: "mutualDestruction" } : { winner: first === 0 ? 1 : 0 };
  battle.current = null;
  battle.queue = [];
  ctx.emit({ type: "battleEnd", outcome: battle.outcome });
}

function passives(ctx: Ctx, unitId: string): PassiveBehavior[] {
  return ctx
    .abilityIds(unitId)
    .map(behavior)
    .filter((b): b is PassiveBehavior => b.kind === "passive");
}

function makeCtx(battle: Battle, events: BattleEvent[]): Ctx {
  const unit = (id: string): BattleUnit => {
    const found = battle.units[id];
    if (!found) throw new Error(`unknown unit id: ${id}`);
    return found;
  };
  const living = (side?: Side) =>
    Object.values(battle.units).filter((u) => u.alive && (side === undefined || u.side === side));

  const ownIds = (id: string) => unit(id).abilities.map((s) => s.ref.id);

  const abilityIds = (id: string): string[] => {
    const ids = ownIds(id);
    for (const owner of living()) {
      for (const ownerAbility of ownIds(owner.id)) {
        const b = behavior(ownerAbility);
        if (b.kind === "passive" && b.grants) ids.push(...b.grants(ctx, owner.id, id));
      }
    }
    return [...new Set(ids)];
  };

  const stats = (id: string): Stats => {
    const subject = unit(id);
    const result = { ...subject.base };
    for (const owner of living()) {
      for (const abilityId of abilityIds(owner.id)) {
        const b = behavior(abilityId);
        if (b.kind === "passive") b.modifyStats?.(ctx, owner.id, id, result);
      }
    }
    for (const effect of subject.effects) {
      if (effect.kind === "punished") {
        result.damage -= 10 * effect.stacks;
        result.initiative -= 10 * effect.stacks;
      }
    }
    result.damage = Math.max(0, result.damage);
    result.initiative = Math.max(0, result.initiative);
    return result;
  };

  /** Returns the HP actually removed: overkill is not damage dealt. */
  const lose = (targetId: string, amount: number, sourceId: string | null): number => {
    const target = unit(targetId);
    if (!target.alive || amount <= 0) return 0;
    const removed = Math.min(amount, target.hp);
    target.hp -= amount;
    ctx.emit({ type: "damage", unitId: targetId, amount: removed, source: sourceId });
    if (target.hp > 0) return removed;
    const warded = target.effects.some((e) => e.kind === "deathward");
    if (warded || passives(ctx, targetId).some((b) => b.preventDeath?.(ctx, targetId))) {
      target.hp = 1;
      ctx.emit({ type: "deathPrevented", unitId: targetId });
      return removed;
    }
    target.hp = 0;
    target.alive = false;
    ctx.emit({ type: "death", unitId: targetId });
    return removed;
  };

  const strike = (sourceId: string, targetId: string, raw: number): number => {
    const target = unit(targetId);
    let amount = Math.max(1, raw - stats(targetId).armor);
    if (target.effects.some((e) => e.kind === "defending")) amount = Math.max(1, Math.floor(amount / 2));
    return lose(targetId, amount, sourceId);
  };

  const addEffect = (targetId: string, effect: Effect) => {
    const target = unit(targetId);
    if (!target.alive) return;
    const existing = target.effects.find((e) => e.kind === effect.kind);
    if (existing?.kind === "punished" && effect.kind === "punished") existing.stacks += effect.stacks;
    else if (existing?.kind === "bleeding" && effect.kind === "bleeding") existing.perTurn += effect.perTurn;
    else if (!existing) target.effects.push({ ...effect });
    ctx.emit({ type: "effect", unitId: targetId, effect: effect.kind });
  };

  const attack = (userId: string, targetIds: readonly string[]) => {
    const raw = stats(userId).damage;
    const own = passives(ctx, userId);
    const bleedShare = Math.min(1, own.reduce((sum, b) => sum + (b.bleedShare ?? 0), 0));
    let dealt = 0;
    let kills = 0;
    for (const targetId of targetIds) {
      if (!unit(targetId).alive) continue;
      const bleed = Math.floor(raw * bleedShare);
      const hit = strike(userId, targetId, raw - bleed);
      if (bleed > 0) addEffect(targetId, { kind: "bleeding", perTurn: bleed });
      dealt += hit;
      if (!unit(targetId).alive) kills += 1;
      for (const b of own) b.onHit?.(ctx, userId, targetId, hit);
    }
    for (const b of own) if (unit(userId).alive) b.afterAttack?.(ctx, userId, dealt, kills);
  };

  const slotOf = (unitId: string, abilityId: string) => unit(unitId).abilities.find((s) => s.ref.id === abilityId);

  const ctx: Ctx = {
    battle,
    unit,
    stats,
    living,
    strike,
    lose,
    heal: (targetId, amount) => {
      const target = unit(targetId);
      const healed = Math.min(amount, stats(targetId).maxHp - target.hp);
      if (!target.alive || healed <= 0) return;
      target.hp += healed;
      ctx.emit({ type: "heal", unitId: targetId, amount: healed });
    },
    addEffect,
    move: (unitId, to) => {
      const moving = unit(unitId);
      const from = moving.tile;
      moving.tile = to;
      ctx.emit({ type: "move", unitId, from, to });
    },
    emit: (event) => {
      events.push(event);
    },
    attack,
    consumeCharge: (unitId, abilityId, max) => {
      const slot = slotOf(unitId, abilityId);
      if (!slot || slot.chargesUsed >= max) return false;
      slot.chargesUsed += 1;
      return true;
    },
    chargesLeft: (unitId, abilityId, max) => max - (slotOf(unitId, abilityId)?.chargesUsed ?? max),
    abilityIds,
    isAttack: (abilityId) => {
      const b = behavior(abilityId);
      return b.kind === "active" && b.isAttack === true;
    },
  };
  return ctx;
}
