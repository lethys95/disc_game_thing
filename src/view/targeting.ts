import { targetingOf } from "#rules/battle/reach";
import { element } from "#view/dom";

/**
 * An ability's reach and area as two small grids, beside its text (the user, 2026-10-07, after Eiyuu Senki: show
 * "squares which indicate which target squares are available" instead of describing them). Target: the enemy's three
 * lines above, the unit's own below, the unit itself circled. Area: what one use hits around its target (the dot).
 */
export function targetingGrids(defId: string, abilityId: string): HTMLElement | null {
  const targeting = targetingOf(defId, abilityId);
  if (!targeting) return null;
  const box = element("div", "targeting");
  const grid = (label: string, rows: readonly (readonly boolean[])[], mark: (row: number, col: number) => string) => {
    const wrap = element("div", "targeting-grid");
    wrap.appendChild(element("span", "label", label));
    const cells = element("div", `cells rows${rows.length}`);
    rows.forEach((row, r) => row.forEach((on, c) => cells.appendChild(element("span", `cell${on ? " on" : ""}${mark(r, c)}`))));
    wrap.appendChild(cells);
    return wrap;
  };
  box.append(
    grid("Target", targeting.reach, (r, c) => (r === 3 && c === 2 ? " own self" : r >= 3 ? " own" : "")),
    grid("Area", targeting.area, (r, c) => (r === 2 && c === 2 ? " anchor" : "")),
  );
  box.title = "Target: where it can be aimed (the enemy's lines above, your own below; the circle is this unit). Area: what it hits around that target (the dot).";
  return box;
}
