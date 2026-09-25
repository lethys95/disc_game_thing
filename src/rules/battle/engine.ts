import { behavior, paramsOf } from "#rules/abilities/index";
import { INITIATIVE_PER_ACTION } from "#rules/balance";
import { hit, lose } from "#rules/battle/damage";
import { allTraits, traitsOn } from "#rules/battle/traits";
import type {
  AbilityRef,
  Action,
  ActiveBehavior,
  Battle,
  BattleEvent,
  BattleUnit,
  Ctx,
  EffectInstance,
  EffectSeed,
  LegalAbility,
  Lifetime,
  Side,
  Slot,
  Stats,
  Tile,
  TraitSelf,
} from "#rules/battle/types";
import { effectDef } from "#rules/effects";
import { UNITS } from "#rules/units/index";

export interface Placement {
  readonly defId: string;
  readonly tile: Tile;
  /** Wounds carried in from the map; full health when absent. */
  readonly hp?: number;
  /** Effects this unit brings into battle (items, leader upgrades, world-level effects). */
  readonly effects?: readonly EffectSeed[];
  readonly leader?: boolean;
}

/** What the world brings into a battle beyond the units: effects on every unit of a side (a Blacksmith node). */
export interface BattleContext {
  readonly sideEffects: readonly [readonly EffectSeed[], readonly EffectSeed[]];
}

export const NO_CONTEXT: BattleContext = { sideEffects: [[], []] };

export interface Step {
  readonly battle: Battle;
  readonly events: readonly BattleEvent[];
}

export function actionsPerRound(initiative: number): number {
  return Math.max(1, Math.floor(initiative / INITIATIVE_PER_ACTION));
}

function instance(seed: EffectSeed): EffectInstance {
  return { def: seed.def, source: seed.source ?? null, stacks: seed.stacks ?? 1, amount: seed.amount ?? 0 };
}

export function createBattle(sides: readonly [readonly Placement[], readonly Placement[]], context: BattleContext = NO_CONTEXT): Step {
  const units: Record<string, BattleUnit> = {};
  sides.forEach((placements, index) => {
    const side: Side = index === 0 ? 0 : 1;
    for (const { defId, tile, hp, effects, leader } of placements) {
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
        hp: Math.min(hp ?? def.stats.maxHp, def.stats.maxHp),
        shield: def.stats.shield,
        base: def.stats,
        damageType: def.damageType,
        abilities: def.abilities.map((ref) => ({ ref, chargesUsed: 0 })),
        effects: [...(effects ?? []), ...context.sideEffects[side]].map(instance),
        alive: true,
        leader: leader ?? false,
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

/** What a unit's traits say they're worth to its side (the AI's valuation of marks, mutations, pools). */
export function traitValue(battle: Battle, unitId: string): number {
  const ctx = makeCtx(battle, []);
  return traitsOn(ctx, unitId).reduce((sum, t) => sum + (t.hooks.aiValue?.(ctx, t.self) ?? 0), 0);
}

export function legalActions(battle: Battle): LegalAbility[] {
  return legal(makeCtx(battle, []));
}

/** What an ability of this unit is, for the view: its display name and effective params. */
export function abilityRef(unit: BattleUnit, abilityId: string): AbilityRef {
  return unit.abilities.find((s) => s.ref.id === abilityId)?.ref ?? { id: abilityId };
}

function activeSelf(ctx: Ctx, unitId: string, abilityId: string): TraitSelf {
  return { unitId, params: paramsOf(abilityRef(ctx.unit(unitId), abilityId)), effect: null };
}

function active(abilityId: string): ActiveBehavior {
  const b = behavior(abilityId);
  if (b.kind !== "active") throw new Error(`not an active ability: ${abilityId}`);
  return b;
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
  const found = active(action.abilityId);
  const self = activeSelf(ctx, unitId, action.abilityId);
  if (self.params["charges"] !== undefined) ctx.consumeCharge(unitId, action.abilityId);

  const bonus = slot.bonusAttacks.shift();
  slot.penaltyMultiplier = bonus ?? 1;
  ctx.emit({ type: "ability", unitId, abilityId: action.abilityId, targets: choice.affected });
  const cancelled =
    !found.reschedules && [...traitsOn(ctx, unitId)].some((t) => t.hooks.beforeAbility?.(ctx, t.self, action.abilityId) === "cancel");
  if (cancelled) ctx.emit({ type: "negated", unitId, abilityId: action.abilityId });
  else found.resolve(ctx, self, choice);
  slot.penaltyMultiplier = 1;

  if (bonus === undefined && choice.cost === "free") slot.freeUsed.push(action.abilityId);
  if (bonus === undefined && choice.cost === "main") slot.mainTaken = true;
  if (found.reschedules) {
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

function chargesLeft(ctx: Ctx, unitId: string, abilityId: string): number {
  const slot = ctx.unit(unitId).abilities.find((s) => s.ref.id === abilityId);
  if (!slot) return 0;
  const max = paramsOf(slot.ref)["charges"];
  return max === undefined ? Infinity : max - slot.chargesUsed;
}

function legal(ctx: Ctx): LegalAbility[] {
  const battle = ctx.battle;
  const slot = battle.current;
  if (!slot || battle.outcome) return [];
  const unitId = slot.unitId;
  const bonusMode = slot.bonusAttacks.length > 0;

  const allowed = new Set(ctx.abilityIds(unitId).filter((id) => behavior(id).kind === "active"));
  if (bonusMode) for (const id of allowed) if (!ctx.hasTag(id, "attack")) allowed.delete(id);
  for (const t of allTraits(ctx)) t.hooks.restrict?.(ctx, t.self, unitId, allowed);
  if (battle.waitedThisPass.includes(unitId)) for (const id of allowed) if (active(id).reschedules) allowed.delete(id);

  const unit = ctx.unit(unitId);
  const result: LegalAbility[] = [];
  for (const id of allowed) {
    const b = active(id);
    const self = activeSelf(ctx, unitId, id);
    if (self.params["charges"] !== undefined && chargesLeft(ctx, unitId, id) <= 0) continue;
    const choices = b
      .choices(ctx, self)
      .map((c) => (bonusMode ? { ...c, cost: "free" as const } : c))
      .filter((c) => bonusMode || c.cost === "main" || !slot.freeUsed.includes(id));
    if (choices.length > 0) result.push({ abilityId: id, name: abilityRef(unit, id).name ?? b.name, tags: b.tags, choices });
  }
  return result;
}

/** Ends every effect with this lifetime that `matches`, running its expiry. */
function expire(ctx: Ctx, lifetime: Lifetime, matches: (unit: BattleUnit, effect: EffectInstance) => boolean): void {
  for (const unit of Object.values(ctx.battle.units)) {
    for (const effect of [...unit.effects]) {
      const def = effectDef(effect.def);
      if (def.lifetime !== lifetime || !matches(unit, effect)) continue;
      if (unit.alive) def.onExpire?.(ctx, { unitId: unit.id, params: {}, effect });
      unit.effects = unit.effects.filter((e) => e !== effect);
    }
  }
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
    ctx.emit({ type: "turnStart", unitId: next });
    expire(ctx, "untilSourceTurn", (_u, e) => e.source === next);

    let skip = false;
    for (const t of traitsOn(ctx, next)) {
      if (!unit.alive) break;
      if (t.hooks.turnStart?.(ctx, t.self) === "skip") skip = true;
    }
    checkOutcome(ctx);
    expire(ctx, "untilOwnTurn", (u) => u.id === next);
    if (!unit.alive || battle.outcome) continue;
    if (skip) {
      ctx.emit({ type: "skipped", unitId: next, reason: "stunned" });
      continue;
    }
    battle.current = { unitId: next, freeUsed: [], mainTaken: false, bonusAttacks: [], hysteriaTriggers: 0, penaltyMultiplier: 1 };
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
  expire(ctx, "untilRoundEnd", () => true);
  for (const unit of ctx.living()) battle.actionsThisRound[unit.id] = actionsPerRound(ctx.stats(unit.id).initiative);
  ctx.emit({ type: "roundStart", round: battle.round });
  startPass(ctx);
}

/** Every unit with actions left acts once per pass, fastest first, so extra actions interleave. */
function startPass(ctx: Ctx): void {
  const battle = ctx.battle;
  battle.pass += 1;
  battle.waitedThisPass = [];
  battle.queue = passOrder(ctx, battle.pass);
}

/**
 * Fastest first. Equal initiative alternates between the sides, and the side that leads a tie swaps every
 * pass, so neither side gets a standing first-move advantage (provisional, docs/design/combat.md).
 */
function passOrder(ctx: Ctx, pass: number): string[] {
  const battle = ctx.battle;
  const lead: Side = (battle.round + pass) % 2 === 0 ? 0 : 1;
  const acting = ctx
    .living()
    .filter((u) => (battle.actionsThisRound[u.id] ?? 0) >= pass)
    .map((u) => ({ u, initiative: ctx.stats(u.id).initiative }))
    .sort((a, b) => a.u.tile.row - b.u.tile.row || a.u.tile.col - b.u.tile.col);
  const speeds = [...new Set(acting.map((a) => a.initiative))].sort((a, b) => b - a);
  return speeds.flatMap((speed) => {
    const tied = acting.filter((a) => a.initiative === speed);
    const first = tied.filter((a) => a.u.side === lead);
    const second = tied.filter((a) => a.u.side !== lead);
    return Array.from({ length: Math.max(first.length, second.length) }, (_, i) => [first[i], second[i]])
      .flat()
      .flatMap((a) => (a ? [a.u.id] : []));
  });
}

/** Slots still to come this round. Later passes are a forecast: Wait and initiative changes can reorder them. */
export function upcomingSlots(battle: Battle): string[] {
  const ctx = makeCtx(battle, []);
  const order = battle.current ? [battle.current.unitId, ...battle.queue] : [...battle.queue];
  const most = Math.max(0, ...ctx.living().map((u) => battle.actionsThisRound[u.id] ?? 0));
  for (let pass = battle.pass + 1; pass <= most; pass++) order.push(...passOrder(ctx, pass));
  return order;
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

function makeCtx(battle: Battle, events: BattleEvent[]): Ctx {
  const unit = (id: string): BattleUnit => {
    const found = battle.units[id];
    if (!found) throw new Error(`unknown unit id: ${id}`);
    return found;
  };
  const living = (side?: Side) =>
    Object.values(battle.units).filter((u) => u.alive && (side === undefined || u.side === side));

  // Grants are read from units' own passives and effects only, so a granted ability can't grant further ones.
  const abilityIds = (id: string): string[] => {
    const ids = unit(id).abilities.map((s) => s.ref.id);
    for (const owner of living()) {
      for (const slot of owner.abilities) {
        const b = behavior(slot.ref.id);
        if (b.kind === "passive" && b.hooks.grants) ids.push(...b.hooks.grants(ctx, { unitId: owner.id, params: paramsOf(slot.ref), effect: null }, id));
      }
      for (const effect of owner.effects) {
        const grants = effectDef(effect.def).hooks.grants;
        if (grants) ids.push(...grants(ctx, { unitId: owner.id, params: {}, effect }, id));
      }
    }
    return [...new Set(ids)];
  };

  const stats = (id: string): Stats => {
    const result = { ...unit(id).base };
    for (const t of allTraits(ctx)) t.hooks.stats?.(ctx, t.self, id, result);
    result.damage = Math.max(0, result.damage);
    result.initiative = Math.max(0, result.initiative);
    result.armor = Math.max(0, result.armor);
    return result;
  };

  const addEffect = (targetId: string, seed: EffectSeed) => {
    const target = unit(targetId);
    if (!target.alive) return;
    const def = effectDef(seed.def);
    const fresh = instance(seed);
    const stacking = def.stacking;
    const existing =
      stacking.mode === "perSource"
        ? target.effects.find((e) => e.def === seed.def && e.source === fresh.source)
        : target.effects.find((e) => e.def === seed.def);
    if (!existing) {
      if (stacking.mode === "merge" && stacking.cap !== undefined) fresh.stacks = Math.min(stacking.cap, fresh.stacks);
      target.effects.push(fresh);
    } else if (stacking.mode !== "unique") {
      const cap = stacking.mode === "merge" ? (stacking.cap ?? Infinity) : Infinity;
      existing.stacks = Math.min(cap, existing.stacks + fresh.stacks);
      existing.amount += fresh.amount;
    }
    ctx.emit({ type: "effect", unitId: targetId, effect: seed.def });
  };

  const ctx: Ctx = {
    battle,
    unit,
    stats,
    living,
    hit: (sourceId, targetIds, spec) => hit(ctx, sourceId, targetIds, spec),
    hitSpec: (self, tags, type) => ({
      power: self.params["power"] ?? stats(self.unitId).damage,
      type: type ?? unit(self.unitId).damageType,
      tags,
    }),
    lose: (targetId, amount, sourceId) => lose(ctx, targetId, amount, sourceId),
    heal: (targetId, amount) => {
      const target = unit(targetId);
      const healed = Math.min(amount, stats(targetId).maxHp - target.hp);
      if (!target.alive || healed <= 0) return;
      target.hp += healed;
      ctx.emit({ type: "heal", unitId: targetId, amount: healed });
    },
    restoreShield: (targetId, amount) => {
      const target = unit(targetId);
      if (!target.alive) return;
      const room = Math.max(0, stats(targetId).shield - target.shield);
      const restored = Math.min(amount, room);
      if (restored > 0) {
        target.shield += restored;
        ctx.emit({ type: "shieldRestored", unitId: targetId, amount: restored });
      }
      for (const t of traitsOn(ctx, targetId)) t.hooks.restored?.(ctx, t.self, restored, amount - restored);
    },
    addEffect,
    removeEffect: (targetId, effect) => {
      const target = unit(targetId);
      target.effects = target.effects.filter((e) => e !== effect);
      ctx.emit({ type: "effectEnded", unitId: targetId, effect: effect.def });
    },
    consumeCharge: (unitId, abilityId) => {
      const slot = unit(unitId).abilities.find((s) => s.ref.id === abilityId);
      if (!slot || chargesLeft(ctx, unitId, abilityId) <= 0) return false;
      slot.chargesUsed += 1;
      return true;
    },
    abilityIds,
    hasTag: (abilityId, tag) => {
      const b = behavior(abilityId);
      return b.kind === "active" && b.tags.includes(tag);
    },
    move: (unitId, to) => {
      const moving = unit(unitId);
      const from = moving.tile;
      moving.tile = to;
      ctx.emit({ type: "move", unitId, from, to });
    },
    emit: (event) => {
      events.push(event);
    },
  };
  return ctx;
}
