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
  damage: number;
  armor: number;
  initiative: number;
}

export interface AbilityRef {
  readonly id: string;
}

export interface UnitDef {
  readonly id: string;
  readonly name: string;
  readonly tier: number;
  readonly stats: Readonly<Stats>;
  readonly damageType: DamageType;
  readonly abilities: readonly AbilityRef[];
}

export type Effect =
  | { kind: "defending" }
  | { kind: "stunned" }
  | { kind: "punished"; stacks: number }
  | { kind: "bleeding"; perTurn: number }
  | { kind: "deathward" };

export interface AbilitySlot {
  readonly ref: AbilityRef;
  chargesUsed: number;
}

export interface BattleUnit {
  readonly id: string;
  readonly defId: string;
  readonly name: string;
  readonly side: Side;
  tile: Tile;
  hp: number;
  readonly base: Readonly<Stats>;
  readonly damageType: DamageType;
  abilities: AbilitySlot[];
  effects: Effect[];
  alive: boolean;
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

export type Outcome = { winner: Side } | { winner: null; reason: "mutualDestruction" };

/** A way to use an ability: the tile the player clicks, and the units it will affect. */
export interface TargetChoice {
  readonly anchor: { side: Side; tile: Tile };
  readonly affected: readonly string[];
  readonly cost: Cost;
}

export type Cost = "main" | "free";

export interface LegalAbility {
  readonly abilityId: string;
  readonly name: string;
  readonly choices: readonly TargetChoice[];
}

export interface Action {
  readonly abilityId: string;
  readonly choice: number;
}

export type BattleEvent =
  | { type: "roundStart"; round: number }
  | { type: "turnStart"; unitId: string }
  | { type: "ability"; unitId: string; abilityId: string; targets: readonly string[] }
  | { type: "damage"; unitId: string; amount: number; source: string | null }
  | { type: "heal"; unitId: string; amount: number }
  | { type: "death"; unitId: string }
  | { type: "deathPrevented"; unitId: string }
  | { type: "effect"; unitId: string; effect: Effect["kind"] }
  | { type: "move"; unitId: string; from: Tile; to: Tile }
  | { type: "skipped"; unitId: string; reason: "stunned" | "noActions" }
  | { type: "battleEnd"; outcome: Outcome };

/**
 * What the engine offers ability behaviors. Behaviors only read and write the battle through this,
 * which keeps them free of engine imports.
 */
export interface Ctx {
  readonly battle: Battle;
  unit(id: string): BattleUnit;
  stats(id: string): Stats;
  living(side?: Side): BattleUnit[];
  /** Applies armor and defense; returns the HP actually removed. */
  strike(sourceId: string, targetId: string, raw: number): number;
  /** Direct HP loss that ignores armor and defense (self-sacrifice, bleed). */
  lose(targetId: string, amount: number, sourceId: string | null): number;
  heal(targetId: string, amount: number): void;
  addEffect(targetId: string, effect: Effect): void;
  /** The standard attack pipeline: strikes each target, then runs on-hit and after-attack passives. */
  attack(userId: string, targetIds: readonly string[]): void;
  /** Uses one charge of the unit's ability; false when none are left. */
  consumeCharge(unitId: string, abilityId: string, max: number): boolean;
  chargesLeft(unitId: string, abilityId: string, max: number): number;
  /** Ability ids the unit has, including ones granted by other units' passives. */
  abilityIds(unitId: string): string[];
  isAttack(abilityId: string): boolean;
  move(unitId: string, to: Tile): void;
  emit(event: BattleEvent): void;
}

export interface ActiveBehavior {
  readonly kind: "active";
  readonly name: string;
  /** Marks the unit's attack: what "must attack" allows and what Hysteria repeats. */
  readonly isAttack?: boolean;
  readonly charges?: number;
  choices(ctx: Ctx, userId: string): TargetChoice[];
  resolve(ctx: Ctx, userId: string, choice: TargetChoice): void;
}

export interface PassiveBehavior {
  readonly kind: "passive";
  readonly name: string;
  /** Adjusts `stats` of `subjectId`; called for every living ability owner on the battlefield. */
  modifyStats?(ctx: Ctx, ownerId: string, subjectId: string, stats: Stats): void;
  readonly charges?: number;
  /** Abilities this passive grants to `subjectId`; called for every living owner. */
  grants?(ctx: Ctx, ownerId: string, subjectId: string): readonly string[];
  /** Removes ability ids the subject may not use; called for every living owner. */
  restrict?(ctx: Ctx, ownerId: string, subjectId: string, allowed: Set<string>): void;
  /** Share of the owner's attack damage that becomes bleed instead of an immediate hit. */
  bleedShare?: number;
  /** Called for each target the owner's attack struck. */
  onHit?(ctx: Ctx, ownerId: string, targetId: string, dealt: number): void;
  /** Called after the owner's attack resolves, if the owner is still alive. */
  afterAttack?(ctx: Ctx, ownerId: string, dealt: number, kills: number): void;
  /** Called when the owner would die; return true to prevent it. */
  preventDeath?(ctx: Ctx, ownerId: string): boolean;
}

export type Behavior = ActiveBehavior | PassiveBehavior;
