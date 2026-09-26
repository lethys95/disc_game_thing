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
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, ["attack", "melee", "damage"])),
  },
  shoot: {
    kind: "active",
    name: "Shoot",
    describe: () =>
      "Ranged: hit any enemy.",
    tags: ["attack", "basic", "ranged", "damage"],
    choices: rangedChoices,
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, ["attack", "ranged", "damage"])),
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
