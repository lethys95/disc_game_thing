/**
 * Battle data and the vocabulary rules are written in. See docs/design/architecture.md: passive abilities and
 * effects are both *traits* (bundles of hooks); damage is a typed packet through an ordered pipeline.
 */

export type Side = 0 | 1;
export type Row = 0 | 1 | 2;
export type Col = 0 | 1 | 2;

/** Row 0 is the front row: the one facing the enemy. */
export interface Tile {
  readonly row: Row;
  readonly col: Col;
}

export type DamageType = "weapon" | "fire";

export interface Stats {
  maxHp: number;
  /** A pool that absorbs hits before health (Nexus automatons). Full at the start of every battle. */
  shield: number;
  damage: number;
  armor: number;
  initiative: number;
}

/** Numeric tuning for one use of a behavior: power, charges, amounts. */
export type Params = Readonly<Record<string, number>>;

export interface AbilityRef {
  readonly id: string;
  readonly params?: Params;
  /** A unit-specific name for this use of the behavior (Divine Lay on Hands is Lay on Hands with more params). */
  readonly name?: string;
}

export type Faction = "jilliath" | "nexus" | "grove" | "neutral";

export interface UnitDef {
  readonly id: string;
  readonly faction: Faction;
  readonly name: string;
  readonly tier: number;
  readonly stats: Readonly<Stats>;
  readonly damageType: DamageType;
  readonly abilities: readonly AbilityRef[];
  /**
   * Nexus casters' batteries (docs/design/factions/ral-vitahl.md): spell charges for the whole battle, full at its
   * start. Spells with a `cost` param draw on them, more when overloaded or replicated. Absent: no spells to power.
   */
  readonly spellCharges?: number;
}

/** An effect on a unit: plain data; its behavior lives in the effect definition. */
export interface EffectInstance {
  readonly def: string;
  /** The unit that applied it, or null (context from the world, the unit itself). */
  readonly source: string | null;
  stacks: number;
  /** Magnitude: bleed per turn, a pool's remaining shield, a bonus. */
  amount: number;
  /** An ability it grants its bearer, with that ability's own params (an item's, a node's). */
  readonly ability?: AbilityRef;
}

/** What callers pass to apply an effect; omitted numbers default to one stack and zero amount. */
export interface EffectSeed {
  readonly def: string;
  readonly source?: string | null;
  readonly stacks?: number;
  readonly amount?: number;
  readonly ability?: AbilityRef;
}

export interface BattleUnit {
  readonly id: string;
  readonly defId: string;
  readonly name: string;
  readonly side: Side;
  tile: Tile;
  hp: number;
  shield: number;
  readonly base: Readonly<Stats>;
  readonly damageType: DamageType;
  /** Its own abilities (granted ones come from traits: `Ctx.abilityRef`). */
  readonly abilities: readonly AbilityRef[];
  /** Uses spent this battle of each ability with `charges`, own or granted. */
  chargesUsed: Record<string, number>;
  effects: EffectInstance[];
  alive: boolean;
  /** Left the battle alive (Retreat): off the field like the dead, but it keeps its health and isn't a kill. */
  fled: boolean;
  /**
   * What's left of it once dead (the Grove's corpse abilities, user 2026-09-29): `intact`, `used` (consumed once;
   * every corpse is used up), or `destroyed` (burst by a corpse explosion: it never reaches the graveyard).
   */
  corpse: "intact" | "used" | "destroyed";
  /** Spell charges left this battle. */
  spellCharges: number;
  /** Leads its squad on the map. No combat effect (canon: elevation grants no stat boost); shown to the player. */
  readonly leader: boolean;
}

export interface Slot {
  readonly unitId: string;
  freeUsed: string[];
  mainTaken: boolean;
  /** Extra attacks owed this slot (Hysteria); each entry is the self-damage multiplier for that attack. */
  bonusAttacks: number[];
  hysteriaTriggers: number;
  /** Self-damage multiplier of the attack being resolved right now. */
  penaltyMultiplier: number;
}

export interface Battle {
  units: Record<string, BattleUnit>;
  round: number;
  pass: number;
  actionsThisRound: Record<string, number>;
  queue: string[];
  waitedThisPass: string[];
  current: Slot | null;
  outcome: Outcome | null;
}

/** `withdrew`: the round limit passed and the attacker (side 0) left the field to the defender. */
export type Outcome = { winner: Side; withdrew?: true } | { winner: null; reason: "mutualDestruction" };

/** A way to use an ability: the tile the player clicks, and the units it will affect. */
export interface TargetChoice {
  readonly anchor: { side: Side; tile: Tile };
  readonly affected: readonly string[];
  readonly cost: Cost;
}

export type Cost = "main" | "free";

/**
 * How a spell is cast (Nexus, after MTG Izzet): as is; **overloaded** (pay extra for a wider reach, e.g. every
 * enemy instead of one); or **replicated** (pay extra per copy, each copy on a different target).
 */
export type Enhancement = { readonly kind: "none" } | { readonly kind: "overload" } | { readonly kind: "replicate"; readonly copies: number };

export const PLAIN: Enhancement = { kind: "none" };

export interface LegalAbility {
  readonly abilityId: string;
  readonly name: string;
  readonly tags: readonly Tag[];
  readonly choices: readonly TargetChoice[];
  readonly enhancement: Enhancement;
  /** Spell charges this use takes (0 for abilities that don't draw on them). */
  readonly spellCost: number;
}

export interface Action {
  readonly abilityId: string;
  readonly choice: number;
  /** Omitted: cast as is. */
  readonly enhancement?: Enhancement;
  /** A replicated spell's further targets: indices into the same choices, all different from `choice` and each other. */
  readonly copies?: readonly number[];
}

export type BattleEvent =
  | { type: "roundStart"; round: number }
  | { type: "turnStart"; unitId: string }
  | { type: "ability"; unitId: string; abilityId: string; targets: readonly string[]; enhancement: Enhancement }
  | { type: "damage"; unitId: string; amount: number; source: string | null }
  | { type: "heal"; unitId: string; amount: number }
  | { type: "shieldHit"; unitId: string; amount: number }
  | { type: "shieldRestored"; unitId: string; amount: number }
  | { type: "absorbed"; unitId: string; amount: number; by: string }
  | { type: "death"; unitId: string }
  | { type: "deathPrevented"; unitId: string }
  | { type: "effect"; unitId: string; effect: string; source: string | null }
  | { type: "effectEnded"; unitId: string; effect: string; source: string | null }
  | { type: "move"; unitId: string; from: Tile; to: Tile }
  | { type: "skipped"; unitId: string; reason: "lostTurn" | "noActions" }
  | { type: "fled"; unitId: string }
  | { type: "countered"; unitId: string; abilityId: string }
  | { type: "battleEnd"; outcome: Outcome };

/**
 * What an ability does, for modifiers, the AI and the UI to reason about without naming abilities:
 * `attack` is the unit's attack (what Must Attack allows and Hysteria repeats); `basic` marks the universal
 * verbs; `damage` abilities are what "+X ability damage" modifiers touch.
 */
export type Tag = "attack" | "basic" | "melee" | "ranged" | "spell" | "damage" | "heal" | "area" | "flee";

/** One hit on one unit, on its way through the damage pipeline (architecture.md §3). */
export interface Packet {
  readonly source: string | null;
  readonly target: string;
  amount: number;
  readonly type: DamageType;
  readonly tags: readonly Tag[];
  /** Split off by conversion stages; applied as bleed instead of as a hit. */
  bleed: number;
}

export interface HitSpec {
  readonly power: number;
  readonly type: DamageType;
  readonly tags: readonly Tag[];
}

/** Who a hook runs for: the unit carrying the trait, the trait's params, and the effect instance if it's an effect. */
export interface TraitSelf {
  readonly unitId: string;
  readonly params: Params;
  readonly effect: EffectInstance | null;
}

/** An active ability resolving: its tags travel with it, so hits it makes carry them. */
export interface ActiveSelf extends TraitSelf {
  readonly tags: readonly Tag[];
}

/** A hook bundle together with whom it runs for. Passive abilities and effects are both traits. */
export interface Trait {
  readonly hooks: Hooks;
  readonly self: TraitSelf;
  readonly absorbPriority: number;
}

/**
 * The hooks a trait may implement. The engine asks every relevant trait at fixed points and never names a
 * specific mechanic. Adding a mechanic means writing hooks, not editing the engine.
 */
export interface Hooks {
  /** Adjusts `subjectId`'s stats. Asked of every trait on the battlefield, so auras can reach others. */
  stats?(ctx: Ctx, self: TraitSelf, subjectId: string, stats: Stats): void;
  /** Abilities granted to `subjectId`. Asked of every trait. */
  grants?(ctx: Ctx, self: TraitSelf, subjectId: string): readonly AbilityRef[];
  /** Removes ability ids `subjectId` may not use. Asked of every trait. */
  restrict?(ctx: Ctx, self: TraitSelf, subjectId: string, allowed: Set<string>): void;
  /** The attacker's traits add to or change an outgoing hit. */
  outgoing?(ctx: Ctx, self: TraitSelf, packet: Packet): void;
  /** The attacker's traits split part of a hit into other forms (bleed), after `outgoing`. */
  convert?(ctx: Ctx, self: TraitSelf, packet: Packet): void;
  /** The target's traits: immunities, resistances. */
  incoming?(ctx: Ctx, self: TraitSelf, packet: Packet): void;
  /** The target's pools soak up the hit, highest `absorbPriority` first; the shield stat's pool comes last. */
  absorb?(ctx: Ctx, self: TraitSelf, packet: Packet): void;
  /** The target's traits reduce what got past the pools (Defend). */
  mitigate?(ctx: Ctx, self: TraitSelf, packet: Packet): void;
  /** Whether this unit acts before everyone else in the current pass (a Bell tower's forewarned defenders). */
  precedes?(ctx: Ctx, self: TraitSelf): boolean;
  /** At the start of this unit's turn; "skip" loses the turn, "leave" takes the unit off the field alive (Retreat). */
  turnStart?(ctx: Ctx, self: TraitSelf): "skip" | "leave" | null;
  /** Before this unit's ability resolves; "cancel" makes it fizzle (the action is still spent). */
  beforeAbility?(ctx: Ctx, self: TraitSelf, abilityId: string): "cancel" | null;
  /** After this unit's hit lands on one target. */
  afterHit?(ctx: Ctx, self: TraitSelf, targetId: string, dealt: number): void;
  /** After this unit's whole action resolves (every target, every copy), if it's still alive and it hit anything. */
  afterAttack?(ctx: Ctx, self: TraitSelf, dealt: number, kills: number): void;
  /** When this unit would die; true keeps it at 1 HP. */
  preventDeath?(ctx: Ctx, self: TraitSelf): boolean;
  /** When any unit dies, or a corpse is used or destroyed. Asked of every trait on the field. */
  remains?(ctx: Ctx, self: TraitSelf, unitId: string, change: RemainsChange): void;
  /**
   * When healing (or a shield restoration) is about to reach this unit: the traits may change `heal.amount`, down to
   * zero, and do something else instead (Negate turns it into damage).
   */
  healing?(ctx: Ctx, self: TraitSelf, heal: { amount: number; readonly pool: "hp" | "shield" }): void;
  /** The acting unit's traits: whether its spells that cost charges are free actions right now (Combustion). */
  castsFree?(ctx: Ctx, self: TraitSelf): boolean;
  /** When a shield restoration reaches this unit: how much went in, and how much didn't fit. */
  restored?(ctx: Ctx, self: TraitSelf, restored: number, overflow: number): void;
  /** What this trait is worth to its unit's side, for the AI's valuation. */
  aiValue?(ctx: Ctx, self: TraitSelf): number;
}

/** What happened to a unit's remains: it died (leaving a corpse), or its corpse was used or destroyed. */
export type RemainsChange = "died" | "used" | "destroyed";

/** `each`: every application is its own instance (a unit can carry several granted abilities). */
export type Stacking = { readonly mode: "unique" } | { readonly mode: "merge"; readonly cap?: number } | { readonly mode: "perSource" } | { readonly mode: "each" };

/**
 * When an effect ends: `battle` lasts the fight; `untilOwnTurn` ends as its bearer's next turn starts;
 * `untilRoundEnd` ends when the round does; `untilSourceTurn` ends as its source's next turn starts; `untilTurnEnd`
 * ends when the bearer's current turn does; `rounds` lasts `stacks` round starts (its `onExpire` runs then).
 */
export type Lifetime = "battle" | "untilOwnTurn" | "untilRoundEnd" | "untilSourceTurn" | "untilTurnEnd" | "rounds";

export interface EffectDef {
  readonly id: string;
  readonly name: string;
  readonly stacking: Stacking;
  readonly lifetime: Lifetime;
  /** `secret`: only the side of the unit that applied it knows it's there, until it fires (a Justiciar's mark). */
  readonly visibility: "public" | "secret";
  /** Bookkeeping effects (a loan, a context bonus) that the view shouldn't announce when applied. */
  readonly quiet?: boolean;
  readonly hooks: Hooks;
  readonly absorbPriority?: number;
  onExpire?(ctx: Ctx, self: TraitSelf): void;
  /**
   * Carried as a mark (`world/state.ts`), extra movement for its warband on the map. Several don't add up: a warband
   * moves as fast as its best (Stables).
   */
  readonly mapMovement?: number;
  /**
   * Its bearer is off the field for now (Spiritwalk, user 2026-09-29): not a target, not in the front line, takes no
   * turns, "doesn't count as present". Alive all the same.
   */
  readonly absent?: boolean;
  /** A city's walls: armor its bearer has from them, which siege-trained attackers ignore (Siege workshop). */
  readonly fortifies?: boolean;
  /** What it does, from its own numbers; shown when hovering it. */
  describe(effect: EffectInstance): string;
}

export interface ActiveBehavior {
  readonly kind: "active";
  readonly name: string;
  readonly tags: readonly Tag[];
  /**
   * Default params; a unit's AbilityRef params override them. `charges` limits uses per combat. Spells: `cost` draws
   * that many spell charges; `overload` and `replicate` (extra cost, per copy for replicate) allow those enhancements.
   */
  readonly defaults?: Params;
  /** Uses the damage type given here instead of the unit's. */
  readonly damageType?: DamageType;
  /** Wait: puts the unit back in the queue instead of acting. Not an ability a Counter can cancel. */
  readonly reschedules?: boolean;
  /** The target is secret from the other side (Counter). */
  readonly secretTarget?: boolean;
  /** What an overloaded cast reaches, when the unit's params allow overloading (`overload`: its extra cost). */
  overloadChoices?(ctx: Ctx, self: TraitSelf): TargetChoice[];
  /** Default keyboard shortcut, a lower-case key. The view uses it; a settings menu may remap it later. */
  readonly hotkey?: string;
  /** Rules text, written from the ability's effective params. */
  describe(params: Params): string;
  choices(ctx: Ctx, self: TraitSelf): TargetChoice[];
  resolve(ctx: Ctx, self: ActiveSelf, choice: TargetChoice): void;
}

export interface PassiveBehavior {
  readonly kind: "passive";
  readonly name: string;
  readonly defaults?: Params;
  /** Rules text, written from the ability's effective params. */
  describe(params: Params): string;
  readonly hooks: Hooks;
}

export type Behavior = ActiveBehavior | PassiveBehavior;

/**
 * What the engine offers traits and behaviors. They read and write the battle only through this, which keeps
 * them free of engine imports.
 */
export interface Ctx {
  readonly battle: Battle;
  unit(id: string): BattleUnit;
  stats(id: string): Stats;
  living(side?: Side): BattleUnit[];
  /** The damage pipeline: power → outgoing → conversion → incoming → armor → pools → mitigation → HP, then reactions. */
  hit(sourceId: string, targetIds: readonly string[], spec: HitSpec): void;
  /** The power and type an ability of this unit hits with: `params.power` if given, else the unit's damage. */
  /** A hit with the resolving ability's power and tags. */
  hitSpec(self: ActiveSelf, type?: DamageType): HitSpec;
  /** Direct HP loss that skips the pipeline (bleed, self-sacrifice). Returns the HP actually removed. */
  lose(targetId: string, amount: number, sourceId: string | null): number;
  heal(targetId: string, amount: number): void;
  /** Shields only come back through this; healing never touches them. */
  restoreShield(targetId: string, amount: number): void;
  addEffect(targetId: string, seed: EffectSeed): void;
  removeEffect(targetId: string, instance: EffectInstance): void;
  /** Uses up or destroys an intact corpse; every trait on the field hears of it (`Hooks.remains`). */
  spendCorpse(unitId: string, state: "used" | "destroyed"): void;
  /** Uses one charge of the unit's ability; false when none are left. */
  consumeCharge(unitId: string, abilityId: string): boolean;
  /** Ability ids the unit has, including ones granted by traits. */
  abilityIds(unitId: string): string[];
  /** The unit's own ref for an ability, or the granted one (with its params), or a bare `{ id }`. */
  abilityRef(unitId: string, abilityId: string): AbilityRef;
  /** The traits on a unit (`battle/traits.ts`), cached until an effect comes or goes or a unit dies. */
  traits(unitId: string): readonly Trait[];
  /** Every trait on the battlefield, cached likewise. */
  allTraits(): readonly Trait[];
  hasTag(abilityId: string, tag: Tag): boolean;
  move(unitId: string, to: Tile): void;
  emit(event: BattleEvent): void;
  /** What each unit's hits dealt and killed during this action: `afterAttack` gets its unit's totals, once. */
  readonly tally: Map<string, { dealt: number; kills: number }>;
}
