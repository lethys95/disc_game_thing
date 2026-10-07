import { targetingOf } from "#rules/battle/reach";
import { element } from "#view/dom";

/**
 * An ability's reach and area as two small grids (the user, 2026-10-07, after Eiyuu Senki: show "squares which
 * indicate which target squares are available" instead of describing them). Laid out like the city's squad grids and
 * the battle (the user: "stay consistent"): left to right, the unit's own back, middle and front line, then the
 * enemy's front, middle and back; sideways reach up and down. Target: where it can be aimed, the unit circled. Area:
 * what one use hits around its target (the dot), deeper to the right.
 */
export function targetingGrids(defId: string, abilityId: string): HTMLElement | null {
  const targeting = targetingOf(defId, abilityId);
  if (!targeting) return null;
  const box = element("div", "targeting");
  // `lines`: the grid's columns, each a list of its cells top to bottom.
  const grid = (label: string, lines: readonly (readonly { on: boolean; mark: string }[])[]) => {
    const wrap = element("div", "targeting-grid");
    wrap.appendChild(element("span", "label", label));
    const cells = element("div", "cells");
    cells.style.gridTemplateColumns = `repeat(${lines.length}, 8px)`;
    const height = lines[0]?.length ?? 0;
    for (let y = 0; y < height; y++) {
      lines.forEach((line, x) => {
        const cell = line[y];
        if (cell) cells.appendChild(element("span", `cell${cell.on ? " on" : ""}${cell.mark}`));
        else cells.appendChild(element("span", "cell"));
        if (x === 2 && lines.length === 6 && cells.lastElementChild) cells.lastElementChild.classList.add("divide");
      });
    }
    wrap.appendChild(cells);
    return wrap;
  };
  // Rules rows 0–2 are the enemy's back to front, 3–5 the unit's own front to back: reversed, they run left to right.
  const reach = [5, 4, 3, 2, 1, 0].map((r) => (targeting.reach[r] ?? []).map((on, c) => ({ on, mark: r >= 3 ? (r === 3 && c === 2 ? " own self" : " own") : "" })));
  const area = [4, 3, 2, 1, 0].map((r) => (targeting.area[r] ?? []).map((on, c) => ({ on, mark: r === 2 && c === 2 ? " anchor" : "" })));
  box.append(grid("Target", reach), grid("Area", area));
  box.title = "Target: where it can be aimed (your lines on the left, the enemy's on the right; the circle is this unit). Area: what it hits around that target (the dot).";
  return box;
}
