import { leadershipOf } from "#rules/world/leaders";
import { playerOf } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { button, element, gold } from "#view/dom";
import { explain } from "#view/explain";
import { leaveButton } from "#view/leave";
import { leaderName } from "#view/map-text";
import { squadTile } from "#view/squad-tile";

/** A tab in a screen's column: its id, label, and whether it's open. */
export interface ColumnTab {
  readonly id: string;
  readonly label: string;
  readonly selected: boolean;
}

/**
 * The column at the right edge of the leader's and the structures' screens (`docs/design/warband-elements.md`), the
 * Capitol's column the same way: the leader's name, the purse and the warband's count, the warband in its 3×3, the tabs
 * as labelled rows, Back to the map at the foot. A greybox in flat values until it is painted.
 */
export function warbandColumn(world: World, leader: Leader, tabs: readonly ColumnTab[], select: (id: string) => void, close: () => void): HTMLElement {
  const column = element("div", "screen-column warband-column");
  const commitment = playerOf(world, leader.player).commitment;
  column.appendChild(element("div", "plate name", `♛ ${leaderName(leader)}`));
  const purse = explain(element("div", "plate purse"), "Gold", "What your realm holds.");
  purse.appendChild(gold(playerOf(world, leader.player).gold));
  const count = explain(element("div", "plate count", `${leader.squad.length} / ${leadershipOf(leader)}`), "The warband", `${leader.squad.length} of ${leadershipOf(leader)} places filled.`);
  const purses = element("div", "purses");
  purses.append(purse, count);
  column.appendChild(purses);
  const grid = element("div", "warband-grid");
  for (const row of [0, 1, 2] as const) {
    for (const col of [0, 1, 2] as const) {
      const m = leader.squad.find((u) => u.tile.row === row && u.tile.col === col);
      // As on the map's column: the grid a quarter turned, a squad's back row (row 2) its left column.
      const tile = squadTile(m, leader, commitment);
      tile.style.gridColumn = String(3 - row);
      tile.style.gridRow = String(col + 1);
      grid.appendChild(tile);
    }
  }
  column.appendChild(grid);
  if (tabs.length > 1) {
    const rows = element("div", "tabs");
    for (const tab of tabs) rows.appendChild(button(`tab${tab.selected ? " selected" : ""}`, [element("span", "label", tab.label)], () => select(tab.id)));
    column.appendChild(rows);
  }
  column.appendChild(leaveButton(close));
  return column;
}
