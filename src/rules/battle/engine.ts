import { behavior, chargesOf, paramsOf } from "#rules/abilities/index";
import { BATTLE_ROUND_LIMIT, INITIATIVE_PER_ACTION } from "#rules/balance";
import { hit, lose } from "#rules/battle/damage";
import { checkTarot, dealHand, drawHand } from "#rules/battle/tarot";
import { allTraits, buildTraits, traitsOn } from "#rules/battle/traits";
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
  Enhancement,
  LegalAbility,
  Lifetime,
  Side,
  Slot,
  Stats,
  TargetChoice,
  Tile,
  Trait,
  ActiveSelf,
} from "#rules/battle/types";
import { PLAIN } from "#rules/battle/types";
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
  /** What tarot hands are dealt from: the same seed deals the same hands. */
  readonly seed?: number;
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
  return { def: seed.def, source: seed.source ?? null, stacks: seed.stacks ?? 1, amount: seed.amount ?? 0, ...(seed.ability ? { ability: seed.ability } : {}) };
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
        hp: hp ?? Infinity,
        shield: def.stats.shield,
        base: def.stats,
        abilities: def.abilities,
        chargesUsed: {},
        effects: [...(effects ?? []), ...context.sideEffects[side]].map(instance),
        alive: true,
        fled: false,
        corpse: "intact",
        spellCharges: def.spellCharges ?? 0,
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
    tarot: [],
    seed: context.seed ?? 0,
  };
  const events: BattleEvent[] = [];
  const ctx = makeCtx(battle, events);
  // Set only now: effects the units bring can raise their max HP (a leader's extra health) and their shield (a
  // Foundry's plating); shields start every battle full.
  for (const unit of Object.values(units)) {
    const stats = ctx.stats(unit.id);
    unit.hp = Math.min(unit.hp, stats.maxHp);
    unit.shield = stats.shield;
  }
  for (const unit of Object.values(units).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const count = traitsOn(ctx, unit.id).reduce((sum, t) => sum + (t.hooks.tarotCards?.(ctx, t.self) ?? 0), 0);
    if (count > 0) battle.tarot.push({ side: unit.side, unitId: unit.id, cards: dealHand(ctx, unit.id, count, context.seed ?? 0), chosen: null, state: "open", progress: 0 });
  }
  checkOutcome(ctx);
  advance(ctx);
  return { battle, events };
}

/** A side picks a card from a tarot hand (`hand`: its index in `battle.tarot`), in secret, once. */
export function chooseTarot(battle: Battle, hand: number, card: number): Step {
  const draft = cloneBattle(battle);
  const held = draft.tarot[hand];
  if (!held || held.chosen !== null || !held.cards[card]) throw new Error(`cannot choose tarot card ${card} from hand ${hand}`);
  held.chosen = card;
  return { battle: draft, events: [{ type: "tarotChosen", side: held.side, hand }] };
}

/** Every living unit's effective stats, from one context. */
export function effectiveStatsOf(battle: Battle): Record<string, Stats> {
  const ctx = makeCtx(battle, []);
  return Object.fromEntries(ctx.living().map((u) => [u.id, ctx.stats(u.id)]));
}

export function effectiveStats(battle: Battle, unitId: string): Stats {
  return makeCtx(battle, []).stats(unitId);
}

/** A unit's stats with only its own traits and effects: what it would bring into a battle, seen on the map. */
export function ownStats(placement: Placement): Stats {
  const { battle } = createBattle([[placement], []]);
  return effectiveStats(battle, `0.${placement.tile.row}.${placement.tile.col}`);
}

/**
 * What each unit's traits say they're worth to its side (the AI's valuation of marks, mutations, pools), for every
 * unit at once: one context, so the trait lists are built once per position.
 */
export function traitValues(battle: Battle): Record<string, number> {
  const ctx = makeCtx(battle, []);
  const values: Record<string, number> = {};
  for (const unit of ctx.living()) values[unit.id] = traitsOn(ctx, unit.id).reduce((sum, t) => sum + (t.hooks.aiValue?.(ctx, t.self) ?? 0), 0);
  return values;
}

export function legalActions(battle: Battle): LegalAbility[] {
  return legal(makeCtx(battle, []));
}

/** Every ability a unit has now, its own and granted ones, as refs (for the unit card). */
export function unitAbilities(battle: Battle, unitId: string): AbilityRef[] {
  const ctx = makeCtx(battle, []);
  return ctx.abilityIds(unitId).map((id) => ctx.abilityRef(unitId, id));
}

/** What an ability of this unit is, for the view: its display name and effective params (granted ones too). */
export function abilityRef(battle: Battle, unitId: string, abilityId: string): AbilityRef {
  return makeCtx(battle, []).abilityRef(unitId, abilityId);
}

/** A damaging hit of `power` from a unit with these stats: its percent first, then its flat bonus. */
export const withBonuses = (stats: Stats, power: number): number => Math.max(0, Math.round((power * (100 + stats.hitPercent)) / 100) + stats.hitBonus);

/** Every living unit's hardest single hit now (`Ctx.strongestHit`): the AI's sense of a threat. */
export function strongestHits(battle: Battle): Record<string, number> {
  const ctx = makeCtx(battle, []);
  return Object.fromEntries(ctx.living().map((u) => [u.id, ctx.strongestHit(u.id)]));
}

function activeSelf(ctx: Ctx, unitId: string, abilityId: string): ActiveSelf {
  const ref = ctx.abilityRef(unitId, abilityId);
  const b = active(abilityId);
  return { unitId, params: paramsOf(ref, ctx.abilityPower(unitId)), effect: null, tags: b.tags, damageType: ref.damageType ?? b.damageType ?? "weapon" };
}

function active(abilityId: string): ActiveBehavior {
  const b = behavior(abilityId);
  if (b.kind !== "active") throw new Error(`not an active ability: ${abilityId}`);
  return b;
}

export function applyAction(battle: Battle, action: Action): Step {
  const draft = cloneBattle(battle);
  const events: BattleEvent[] = [];
  const ctx = makeCtx(draft, events);
  const slot = draft.current;
  const enhancement = action.enhancement ?? PLAIN;
  const option = legal(ctx).find((a) => a.abilityId === action.abilityId && sameEnhancement(a.enhancement, enhancement));
  const choice = option?.choices[action.choice];
  const copies = (action.copies ?? []).map((i) => option?.choices[i]);
  const picks = [action.choice, ...(action.copies ?? [])];
  const wanted = enhancement.kind === "replicate" ? enhancement.copies : 0;
  const valid = copies.length === wanted && copies.every((c) => c !== undefined) && new Set(picks).size === picks.length;
  if (!slot || !option || !choice || !valid) throw new Error(`illegal action: ${JSON.stringify(action)}`);
  const casts = [choice, ...copies.filter((c): c is TargetChoice => c !== undefined)];

  const unitId = slot.unitId;
  const found = active(action.abilityId);
  const self = activeSelf(ctx, unitId, action.abilityId);
  if (self.params["charges"] !== undefined) ctx.consumeCharge(unitId, action.abilityId);
  ctx.unit(unitId).spellCharges -= option.spellCost;

  const bonus = slot.bonusAttacks.shift();
  slot.penaltyMultiplier = bonus ?? 1;
  ctx.emit({ type: "ability", unitId, abilityId: action.abilityId, targets: casts.flatMap((c) => c.affected), enhancement });
  // A cancel (Counter) spoils the whole cast, copies included.
  const cancelled =
    !found.reschedules && [...traitsOn(ctx, unitId)].some((t) => t.hooks.beforeAbility?.(ctx, t.self, action.abilityId) === "cancel");
  if (cancelled) ctx.emit({ type: "countered", unitId, abilityId: action.abilityId });
  else for (const cast of casts) found.resolve(ctx, self, cast);
  // Once per action, whatever it hit: only the actor's own hits count (a Backlash landing now is another unit's).
  const own = ctx.tally.get(unitId);
  if (own && ctx.unit(unitId).alive) for (const t of [...traitsOn(ctx, unitId)]) t.hooks.afterAttack?.(ctx, t.self, own.dealt, own.kills);
  slot.penaltyMultiplier = 1;

  if (bonus === undefined && choice.cost === "free") slot.freeUsed.push(action.abilityId);
  if (bonus === undefined && choice.cost === "main") slot.mainTaken = true;
  if (found.reschedules) {
    draft.queue.push(unitId);
    draft.waitedThisPass.push(unitId);
  }

  checkTarot(ctx, draft.tarot, events, unitId);
  // Kills during this action, by the actor or a card it set off, may draw more cards (Omen).
  const draws = Math.max(0, ...traitsOn(ctx, unitId).map((t) => t.hooks.drawsOnKill?.(ctx, t.self) ?? 0));
  if (draws > 0) {
    const side = ctx.unit(unitId).side;
    const kills = events.filter((e) => e.type === "death" && ctx.unit(e.unitId).side !== side).length;
    for (let i = 0; i < kills; i++) drawHand(ctx, draft.tarot, unitId, draws, draft.seed);
  }
  checkOutcome(ctx);
  if (draft.current && slotIsOver(ctx, slot)) {
    draft.current = null;
    expire(ctx, "untilTurnEnd", (u) => u.id === unitId);
  }
  const before = events.length;
  advance(ctx);
  // What advancing brought (a new round, a turn's damage over time) can finish a card too, and a card's reward can
  // end the fight or the turn that just began.
  checkTarot(ctx, draft.tarot, events.slice(before), null);
  checkOutcome(ctx);
  if (draft.current && !ctx.unit(draft.current.unitId).alive) {
    draft.current = null;
    advance(ctx);
  }
  return { battle: draft, events };
}

/**
 * A copy to mutate: everything an action can change is copied, and what it only reads (base stats, ability refs) is
 * shared. structuredClone did the same job at a quarter of all AI time: the AI copies the battle for every option it
 * tries.
 */
function cloneBattle(battle: Battle): Battle {
  const units: Record<string, BattleUnit> = {};
  for (const [id, u] of Object.entries(battle.units)) {
    units[id] = { ...u, chargesUsed: { ...u.chargesUsed }, effects: u.effects.map((e) => ({ ...e })) };
  }
  const slot = battle.current;
  return {
    ...battle,
    units,
    actionsThisRound: { ...battle.actionsThisRound },
    queue: [...battle.queue],
    waitedThisPass: [...battle.waitedThisPass],
    current: slot ? { ...slot, freeUsed: [...slot.freeUsed], bonusAttacks: [...slot.bonusAttacks] } : null,
    tarot: battle.tarot.map((h) => ({ ...h })),
  };
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

/** Uses left of an ability with `charges`, own or granted. */
function chargesLeft(ctx: Ctx, unitId: string, abilityId: string): number {
  const max = chargesOf(ctx.abilityRef(unitId, abilityId));
  return max === undefined ? Infinity : max - (ctx.unit(unitId).chargesUsed[abilityId] ?? 0);
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
    const base = self.params["cost"] ?? 0;
    // Spells that cost charges can be made free actions (Combustion).
    const free = base > 0 && traitsOn(ctx, unitId).some((t) => t.hooks.castsFree?.(ctx, t.self) === true);
    const usable = (choices: readonly TargetChoice[]) =>
      choices.map((c) => (bonusMode || free ? { ...c, cost: "free" as const } : c)).filter((c) => bonusMode || c.cost === "main" || !slot.freeUsed.includes(id));
    const name = ctx.abilityRef(unitId, id).name ?? b.name;
    const affordable = (cost: number) => cost <= unit.spellCharges;
    const add = (choices: readonly TargetChoice[], enhancement: Enhancement, spellCost: number) => {
      if (choices.length > 0 && affordable(spellCost)) result.push({ abilityId: id, name, tags: b.tags, choices, enhancement, spellCost });
    };
    const choices = usable(b.choices(ctx, self));
    add(choices, PLAIN, base);
    const overload = self.params["overload"];
    if (overload !== undefined && b.overloadChoices) add(usable(b.overloadChoices(ctx, self)), { kind: "overload" }, base + overload);
    const replicate = self.params["replicate"];
    if (replicate !== undefined) {
      for (let copies = 1; copies < choices.length && affordable(base + replicate * copies); copies++) add(choices, { kind: "replicate", copies }, base + replicate * copies);
    }
  }
  return result;
}

export function sameEnhancement(a: Enhancement, b: Enhancement): boolean {
  return a.kind === b.kind && (a.kind !== "replicate" || b.kind !== "replicate" || a.copies === b.copies);
}

/** Ends every effect with this lifetime that `matches`, running its expiry. */
/** Effects that last a number of rounds count one down as each round starts, and expire at zero. */
function countRounds(ctx: Ctx): void {
  for (const unit of Object.values(ctx.battle.units)) {
    for (const effect of unit.effects) if (effectDef(effect.def).lifetime === "rounds") effect.stacks -= 1;
  }
  expire(ctx, "rounds", (_unit, effect) => effect.stacks <= 0);
}

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
    let leave = false;
    for (const t of [...traitsOn(ctx, next)]) {
      if (!unit.alive) break;
      const result = t.hooks.turnStart?.(ctx, t.self);
      if (result === "skip") skip = true;
      if (result === "leave") leave = true;
    }
    if (leave && unit.alive) {
      unit.alive = false;
      unit.fled = true;
      ctx.emit({ type: "fled", unitId: next });
    }
    checkOutcome(ctx);
    expire(ctx, "untilOwnTurn", (u) => u.id === next);
    if (!unit.alive || battle.outcome) continue;
    if (skip) {
      ctx.emit({ type: "skipped", unitId: next, reason: "lostTurn" });
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
  if (battle.round >= BATTLE_ROUND_LIMIT) {
    battle.outcome = { winner: 1, withdrew: true };
    battle.current = null;
    battle.queue = [];
    ctx.emit({ type: "battleEnd", outcome: battle.outcome });
    return;
  }
  battle.round += 1;
  battle.pass = 0;
  battle.actionsThisRound = {};
  expire(ctx, "untilRoundEnd", () => true);
  countRounds(ctx);
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
  const order = speeds.flatMap((speed) => {
    const tied = acting.filter((a) => a.initiative === speed);
    const first = tied.filter((a) => a.u.side === lead);
    const second = tied.filter((a) => a.u.side !== lead);
    return Array.from({ length: Math.max(first.length, second.length) }, (_, i) => [first[i], second[i]])
      .flat()
      .flatMap((a) => (a ? [a.u.id] : []));
  });
  // Units whose traits say they go first lead the pass, in the order they'd otherwise have.
  const ahead = (id: string) => traitsOn(ctx, id).some((t) => t.hooks.precedes?.(ctx, t.self) ?? false);
  return [...order.filter(ahead), ...order.filter((id) => !ahead(id))];
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
  // Everyone alive counts, present or not: a unit walking among the spirits hasn't lost the battle for its side.
  const standing = (side: Side) => Object.values(battle.units).filter((u) => u.alive && u.side === side).length;
  const first = standing(0);
  const second = standing(1);
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
  // The living who are present: an effect can take a unit off the field for a while (`EffectDef.absent`).
  const living = (side?: Side) =>
    Object.values(battle.units).filter((u) => u.alive && (side === undefined || u.side === side) && !u.effects.some((e) => effectDef(e.def).absent));

  /**
   * Trait lists and ability ids only change when an effect comes or goes or a unit dies, but hooks ask for them
   * constantly (every stats query walks every trait on the field). They're cached while every unit keeps its alive
   * flag and the very same effects array at the same length: removing an effect replaces the array, adding one
   * lengthens it, and stacking changes an effect in place, which its trait already sees.
   */
  const units = Object.values(battle.units);
  let cached: { alive: boolean[]; effects: EffectInstance[][]; lengths: number[]; traits: Map<string, readonly Trait[]>; ids: Map<string, string[]>; grants: Map<string, AbilityRef[]>; power: Map<string, number>; all: readonly Trait[] | null } | null = null;
  const memo = () => {
    const valid = cached !== null && units.every((u, i) => u.alive === cached?.alive[i] && u.effects === cached.effects[i] && u.effects.length === cached.lengths[i]);
    if (!valid || !cached) {
      cached = { alive: units.map((u) => u.alive), effects: units.map((u) => u.effects), lengths: units.map((u) => u.effects.length), traits: new Map(), ids: new Map(), grants: new Map(), power: new Map(), all: null };
    }
    return cached;
  };

  // Grants are read from units' own passives and effects only, so a granted ability can't grant further ones.
  const grantedTo = (id: string): AbilityRef[] => {
    const known = memo().grants.get(id);
    if (known) return known;
    const refs: AbilityRef[] = [];
    // Auras don't stack (user, 2026-09-29): what other units' passives grant comes once per ability, however many
    // units grant it. What a unit's own effects grant (a carried item's ability, a node's) each stays its own.
    const fromOthers = new Set<string>();
    for (const owner of living()) {
      for (const ref of owner.abilities) {
        const b = behavior(ref.id);
        if (b.kind !== "passive" || !b.hooks.grants) continue;
        for (const granted of b.hooks.grants(ctx, { unitId: owner.id, params: paramsOf(ref, abilityPower(owner.id)), effect: null }, id)) {
          if (fromOthers.has(granted.id)) continue;
          fromOthers.add(granted.id);
          refs.push(granted);
        }
      }
      for (const effect of owner.effects) {
        const grants = effectDef(effect.def).hooks.grants;
        if (grants) refs.push(...grants(ctx, { unitId: owner.id, params: {}, effect }, id));
      }
    }
    memo().grants.set(id, refs);
    return refs;
  };
  const abilityIds = (id: string): string[] => {
    const known = memo().ids.get(id);
    if (known) return known;
    const found = [...new Set([...unit(id).abilities.map((r) => r.id), ...grantedTo(id).map((r) => r.id)])];
    memo().ids.set(id, found);
    return found;
  };
  const abilityRef = (unitId: string, abilityId: string): AbilityRef =>
    unit(unitId).abilities.find((r) => r.id === abilityId) ?? grantedTo(unitId).find((r) => r.id === abilityId) ?? { id: abilityId };

  /**
   * Passive abilities' params scale with ability power, and their traits feed `stats`; so ability power comes from
   * the unit and the effects on the field alone (levels, items, other units' buffs), never from a passive ability.
   */
  const abilityPower = (id: string): number => {
    const store = memo().power;
    const known = store.get(id);
    if (known !== undefined) return known;
    const result = { ...unit(id).base, hitBonus: 0, hitPercent: 0 };
    for (const owner of living()) for (const effect of owner.effects) effectDef(effect.def).hooks.stats?.(ctx, { unitId: owner.id, params: {}, effect }, id, result);
    const power = Math.max(0, result.abilityPower);
    store.set(id, power);
    return power;
  };

  const stats = (id: string): Stats => {
    const result = { ...unit(id).base, hitBonus: 0, hitPercent: 0 };
    for (const t of allTraits(ctx)) t.hooks.stats?.(ctx, t.self, id, result);
    if (Math.max(0, result.abilityPower) !== abilityPower(id)) throw new Error(`a passive ability changed ${id}'s ability power: give it an effect instead`);
    result.abilityPower = abilityPower(id);
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
      stacking.mode === "each"
        ? undefined
        : stacking.mode === "perSource"
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
    ctx.emit({ type: "effect", unitId: targetId, effect: seed.def, source: fresh.source });
  };

  const ctx: Ctx = {
    battle,
    unit,
    stats,
    abilityPower,
    living,
    hit: (sourceId, targetIds, spec) => hit(ctx, sourceId, targetIds, spec),
    hitSpec: (self, type, power) => {
      const base = power ?? self.params["power"];
      if (base === undefined) throw new Error(`${unit(self.unitId).defId} hits with an ability that has no power`);
      return { power: self.tags.includes("damage") ? withBonuses(stats(self.unitId), base) : base, type: type ?? self.damageType, tags: self.tags };
    },
    strongestHit: (id) => {
      const own = stats(id);
      const hits = abilityIds(id).flatMap((abilityId) => {
        const b = behavior(abilityId);
        if (b.kind !== "active" || !b.tags.includes("damage")) return [];
        const power = paramsOf(abilityRef(id, abilityId), own.abilityPower)["power"];
        return power === undefined ? [] : [withBonuses(own, power)];
      });
      return Math.max(0, ...hits);
    },
    lose: (targetId, amount, sourceId) => lose(ctx, targetId, amount, sourceId),
    heal: (targetId, offered) => {
      const target = unit(targetId);
      const heal = { amount: offered, pool: "hp" as const };
      for (const t of traitsOn(ctx, targetId)) if (target.alive) t.hooks.healing?.(ctx, t.self, heal);
      const healed = Math.min(heal.amount, stats(targetId).maxHp - target.hp);
      if (!target.alive || healed <= 0) return;
      target.hp += healed;
      ctx.emit({ type: "heal", unitId: targetId, amount: healed });
    },
    restoreShield: (targetId, offered) => {
      const target = unit(targetId);
      if (!target.alive) return;
      const heal = { amount: offered, pool: "shield" as const };
      for (const t of traitsOn(ctx, targetId)) t.hooks.healing?.(ctx, t.self, heal);
      const amount = heal.amount;
      if (amount <= 0 && offered > 0) return;
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
      ctx.emit({ type: "effectEnded", unitId: targetId, effect: effect.def, source: effect.source });
    },
    spendCorpse: (unitId, state) => {
      const dead = unit(unitId);
      if (dead.alive || dead.corpse !== "intact") return;
      dead.corpse = state;
      for (const t of [...allTraits(ctx)]) t.hooks.remains?.(ctx, t.self, unitId, state);
    },
    consumeCharge: (unitId, abilityId) => {
      if (chargesLeft(ctx, unitId, abilityId) <= 0) return false;
      const owner = unit(unitId);
      owner.chargesUsed[abilityId] = (owner.chargesUsed[abilityId] ?? 0) + 1;
      return true;
    },
    abilityIds,
    abilityRef,
    traits: (unitId) => {
      const store = memo().traits;
      const known = store.get(unitId);
      if (known) return known;
      const built = buildTraits(ctx, unitId);
      store.set(unitId, built);
      return built;
    },
    allTraits: () => {
      const store = memo();
      store.all ??= living().flatMap((u) => ctx.traits(u.id));
      return store.all;
    },
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
    tally: new Map(),
  };
  return ctx;
}
