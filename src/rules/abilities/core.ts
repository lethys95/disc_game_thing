import { COLS, meleeTargets, opponent, ROWS } from "#rules/battle/grid";
import type { Behavior, BattleUnit, Col, Cost, Ctx, Params, Row, TargetChoice, TraitSelf } from "#rules/battle/types";

/** Shared targeting helpers and the universal verbs every unit has. */

/** "Once per combat" / "2 uses per combat", for rules text. */
export const uses = (p: Params) => (p["charges"] === 1 ? "Once per combat" : `${p["charges"]} uses per combat`);

const charges = (n: number) => `${n} spell charge${n === 1 ? "" : "s"}`;

/** A spell's price in spell charges, and the enhancements this unit may pay for (docs/design/factions/ral-vitahl.md). */
export function spellCost(p: Params, overloaded?: string): string {
  const parts = [`Costs ${charges(p["cost"] ?? 0)}.`];
  if (p["overload"] !== undefined && overloaded) parts.push(`Overload (+${charges(p["overload"])}): ${overloaded}.`);
  if (p["replicate"] !== undefined) parts.push(`Replicate (+${charges(p["replicate"])} per copy): cast it again on another target.`);
  return parts.join(" ");
}

export function at(anchor: BattleUnit, affected: readonly string[], cost: Cost): TargetChoice {
  return { anchor: { side: anchor.side, tile: anchor.tile }, affected, cost };
}

export function single(unit: BattleUnit, cost: Cost): TargetChoice {
  return at(unit, [unit.id], cost);
}

/** Ranged: any living enemy (D2 archers; provisional). */
export function rangedChoices(ctx: Ctx, self: TraitSelf): TargetChoice[] {
  return ctx.living(opponent(ctx.unit(self.unitId).side)).map((u) => single(u, "main"));
}

/**
 * An area on the enemy grid. Every enemy tile is a clickable anchor; the shape is laid around it and clipped to
 * the grid. Ranged, so the caster can stand anywhere.
 */
export function areaChoices(ctx: Ctx, self: TraitSelf, shape: (row: Row, col: Col) => { row: number; col: number }[]): TargetChoice[] {
  const enemy = opponent(ctx.unit(self.unitId).side);
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
}

export const core: Readonly<Record<string, Behavior>> = {
  attack: {
    kind: "active",
    name: "Attack",
    describe: () =>
      "Strike an enemy in the front line, at most one column away.",
    tags: ["attack", "basic", "melee", "damage"],
    choices: (ctx, self) => meleeTargets(ctx.living(), ctx.unit(self.unitId)).map((t) => single(t, "main")),
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },
  shoot: {
    kind: "active",
    name: "Shoot",
    describe: () =>
      "Ranged: hit any enemy.",
    tags: ["attack", "basic", "ranged", "damage"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },
  defend: {
    kind: "active",
    name: "Defend",
    describe: () =>
      "End the turn. Damage taken is halved until this unit acts again.",
    tags: ["basic"],
    hotkey: "d",
    choices: (ctx, self) => [single(ctx.unit(self.unitId), "main")],
    resolve: (ctx, self) => ctx.addEffect(self.unitId, { def: "defending" }),
  },
  /** Granted by a Cathedral (user, 2026-09-27): units recruited in its city carry holy water. */
  holy_water: {
    kind: "active",
    name: "Holy Water",
    describe: (p) => `${uses(p)}: an ally (or this unit) heals ${p["amount"]}.`,
    tags: ["heal"],
    defaults: { charges: 1, amount: 30 },
    scales: ["amount"],
    choices: (ctx, self) =>
      ctx
        .living(ctx.unit(self.unitId).side)
        .filter((u) => u.hp < ctx.stats(u.id).maxHp)
        .map((u) => single(u, "main")),
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.heal(id, self.params["amount"] ?? 0);
    },
  },
  /** Granted by a Hatchet (user, 2026-09-27): thrown once per combat. */
  throw_hatchet: {
    kind: "active",
    name: "Throw Hatchet",
    describe: (p) => `${uses(p)}: throw it at any enemy for ${p["power"]}.`,
    tags: ["attack", "ranged", "damage"],
    defaults: { charges: 1, power: 30 },
    scales: ["power"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },
  retreat: {
    kind: "active",
    name: "Retreat",
    describe: () =>
      "Turn your back and flee: this unit loses its next turn, then leaves the battle alive at the start of the one after. It keeps its health; the enemy gains no XP for it.",
    tags: ["basic", "flee"],
    hotkey: "r",
    choices: (ctx, self) => [single(ctx.unit(self.unitId), "main")],
    resolve: (ctx, self) => ctx.addEffect(self.unitId, { def: "retreating", source: self.unitId }),
  },
  wait: {
    kind: "active",
    name: "Wait",
    describe: () =>
      "Act again at the end of this pass.",
    tags: ["basic"],
    hotkey: "w",
    reschedules: true,
    choices: (ctx, self) => [single(ctx.unit(self.unitId), "main")],
    resolve: () => {},
  },
};

/**
 * Auras don't stack (user, 2026-09-29): when several units' copies of one aura reach a unit, only the strongest
 * applies (ties go to the first unit by id). True if `self` is that one, among the units `reaches` says reach the
 * unit in question.
 */
export function auraSource(ctx: Ctx, self: TraitSelf, abilityId: string, reaches: (sourceId: string) => boolean, strength: (params: Params) => number): boolean {
  const sources = ctx
    .living(ctx.unit(self.unitId).side)
    .filter((u) => ctx.abilityIds(u.id).includes(abilityId) && reaches(u.id))
    .map((u) => ({ id: u.id, strength: strength(ctx.abilityRef(u.id, abilityId).params ?? {}) }))
    .sort((a, b) => b.strength - a.strength || (a.id < b.id ? -1 : 1));
  return sources[0]?.id === self.unitId;
}
