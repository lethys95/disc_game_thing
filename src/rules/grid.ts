import type { BattleUnit, Col, Row, Side, Tile } from "#rules/types";

export const ROWS: readonly Row[] = [0, 1, 2];
export const COLS: readonly Col[] = [0, 1, 2];

export function sameTile(a: Tile, b: Tile): boolean {
  return a.row === b.row && a.col === b.col;
}

export function opponent(side: Side): Side {
  return side === 0 ? 1 : 0;
}

export function occupant(units: readonly BattleUnit[], side: Side, tile: Tile): BattleUnit | undefined {
  return units.find((u) => u.alive && u.side === side && sameTile(u.tile, tile));
}

/**
 * A squad's front line is its frontmost row that still has a living unit. When a whole row falls,
 * the row behind becomes the front line (D2 rule), so melee can never be blocked forever.
 */
export function frontLine(units: readonly BattleUnit[], side: Side): Row | null {
  const rows = new Set(units.filter((u) => u.alive && u.side === side).map((u) => u.tile.row));
  return ROWS.find((r) => rows.has(r)) ?? null;
}

export function inFrontLine(units: readonly BattleUnit[], unit: BattleUnit): boolean {
  return frontLine(units, unit.side) === unit.tile.row;
}

/**
 * Melee reach: the user must stand in its own front line, and may hit enemy front-line units at most
 * one column away. If none is that close, the nearest ones are reachable.
 * Provisional (docs/design/combat.md): the user suggested "one tile in front"; widened to the
 * neighbouring columns so a gap in the enemy line can't make a unit useless.
 */
export function meleeTargets(units: readonly BattleUnit[], user: BattleUnit): BattleUnit[] {
  if (!inFrontLine(units, user)) return [];
  const enemy = opponent(user.side);
  const row = frontLine(units, enemy);
  if (row === null) return [];
  const line = units.filter((u) => u.alive && u.side === enemy && u.tile.row === row);
  const distance = (u: BattleUnit) => Math.abs(u.tile.col - user.tile.col);
  const reach = Math.max(1, Math.min(...line.map(distance)));
  return line.filter((u) => distance(u) <= reach);
}

export function adjacent(a: Tile, b: Tile): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}
