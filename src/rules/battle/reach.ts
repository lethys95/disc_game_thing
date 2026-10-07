import { createBattle, legalActions } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import { COLS, ROWS } from "#rules/battle/grid";
import type { Battle, Col, Row, TargetChoice, Tile } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";

/**
 * What an ability can target and what it hits, as two small grids (the user, 2026-10-07, after Eiyuu Senki: show the
 * boxes instead of describing them). Read from the engine itself: the unit is put in its own front row, at each
 * column in turn, with every other tile filled, and the ability's legal choices are collected. So the grids can't
 * drift from the rules.
 */
export interface Targeting {
  /**
   * Six rows (the enemy's back, middle and front line, then the unit's own front, middle and back) by five columns
   * (sideways from the unit, −2 to +2: from one edge it can reach two columns over). The unit stands in row 3, column 2.
   */
  readonly reach: readonly (readonly boolean[])[];
  /** Five by five around the target (row 2, column 2): what one use hits. Deeper lines are higher up. */
  readonly area: readonly (readonly boolean[])[];
}

/** Filler for the probe: a unit with a shield and no passive abilities, so shield abilities have targets. */
const FILLER = "custodian";

const empty = (rows: number): boolean[][] => Array.from({ length: rows }, () => Array.from({ length: 5 }, () => false));

/**
 * Who lies dead in a probe: nobody; the middle tile of each side (an area around a corpse has neighbours); or
 * everyone but the unit (a corpse anywhere).
 */
type Dead = "none" | "centres" | "all";

/** A battle with the unit, wounded, at its front row's `col` and every other tile filled, wounded too. */
function probe(defId: string, col: Col, dead: Dead): Battle {
  const filler = (side: 0 | 1) =>
    ROWS.flatMap((row) => COLS.map((c): Tile => ({ row, col: c })))
      .filter((tile) => side === 1 || tile.row !== 0 || tile.col !== col)
      .map((tile): Placement => ({ defId: FILLER, tile, hp: 30 }));
  const hp = Math.ceil((UNITS[defId]?.stats.maxHp ?? 2) / 2);
  const { battle } = createBattle([[{ defId, tile: { row: 0, col }, hp }, ...filler(0)], filler(1)]);
  const userId = `0.0.${col}`;
  const lies = (id: string) => id !== userId && (dead === "all" || (dead === "centres" && id.endsWith(".1.1")));
  const units = Object.fromEntries(Object.entries(battle.units).map(([id, u]) => [id, lies(id) ? { ...u, alive: false, hp: 0 } : u]));
  return { ...battle, units, current: { unitId: userId, freeUsed: [], mainTaken: false, bonusAttacks: [], hysteriaTriggers: 0, penaltyMultiplier: 1 } };
}

const rowOf = (side: 0 | 1, row: Row): number => (side === 1 ? 2 - row : 3 + row);

/** The choice nearest the middle of its grid, for the area: an area cut off at an edge would understate it. */
const central = (choices: readonly TargetChoice[]): TargetChoice | undefined =>
  [...choices].sort((a, b) => Math.abs(a.anchor.tile.row - 1) + Math.abs(a.anchor.tile.col - 1) - (Math.abs(b.anchor.tile.row - 1) + Math.abs(b.anchor.tile.col - 1)))[0];

/**
 * The grids for one of a unit type's active abilities; null when no probe gives it a target (or it has none). Reach
 * comes from the full board; only an ability with no target there (one that needs corpses) reads the probes with dead.
 */
export function targetingOf(defId: string, abilityId: string): Targeting | null {
  const probes = (["none", "centres", "all"] as const).map((dead) =>
    COLS.map((col) => {
      const battle = probe(defId, col, dead);
      const choices = legalActions(battle).filter((a) => a.abilityId === abilityId && a.enhancement.kind === "none").flatMap((a) => a.choices);
      return { battle, col, choices };
    }),
  );
  const [full = [], ...withDead] = probes;
  const reaching = full.some((p) => p.choices.length > 0) ? full : withDead.flat();
  const reach = empty(6);
  for (const { col, choices } of reaching) {
    for (const choice of choices) {
      const r = reach[rowOf(choice.anchor.side, choice.anchor.tile.row)];
      if (r) r[choice.anchor.tile.col - col + 2] = true;
    }
  }
  if (!reach.some((row) => row.includes(true))) return null;
  const area = empty(5);
  const middle = probes.flat().find((p) => p.col === 1 && p.choices.length > 0);
  const choice = middle && central(middle.choices);
  if (middle && choice) {
    for (const id of choice.affected) {
      const unit = middle.battle.units[id];
      if (!unit || unit.side !== choice.anchor.side) continue;
      const row = area[2 - (unit.tile.row - choice.anchor.tile.row)];
      if (row) row[unit.tile.col - choice.anchor.tile.col + 2] = true;
    }
  }
  return { reach, area };
}
