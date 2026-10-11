import { isLeaderOf, maxHpOf } from "#rules/world/record";
import { leadershipOf, movementOf, unspentPoints } from "#rules/world/leaders";
import { playerOf } from "#rules/world/state";
import type { Leader, World } from "#rules/world/state";
import { art } from "#view/art";
import { button, element, gold, movementPips } from "#view/dom";
import { explain, explainWith } from "#view/explain";
import { leaderName } from "#view/map-text";
import { memberRow, unitName } from "#view/members";

/**
 * The warband's column at the right edge of the leader's and the structures' screens (assets/ui/warband/column.webp,
 * the hud-paint-in skill; the map and Capitol columns' sibling): the leader's name, the purse and the warband's count,
 * the warband in the window's nine panes, three facts, and Back to the map as the seal the standard-bearer and the
 * pilgrim hold.
 */
export function warbandColumn(world: World, leader: Leader, close: () => void): HTMLElement {
  const column = element("div", "warband-column");
  const commitment = playerOf(world, leader.player).commitment;
  column.appendChild(element("div", "plate name", `♛ ${leaderName(leader)}`));
  const purse = explain(element("div", "plate purse"), "Gold", "What your realm holds.");
  purse.appendChild(gold(playerOf(world, leader.player).gold));
  column.appendChild(purse);
  column.appendChild(explain(element("div", "plate count", `${leader.squad.length} / ${leadershipOf(leader)}`), "The warband", `${leader.squad.length} of ${leadershipOf(leader)} places filled.`));
  for (const row of [0, 1, 2] as const) {
    for (const col of [0, 1, 2] as const) {
      const m = leader.squad.find((u) => u.tile.row === row && u.tile.col === col);
      // As on the map's column: the grid a quarter turned, a squad's back row (row 2) its left column.
      const pane = element("div", `pane x${2 - row} y${col}${m ? "" : " empty"}`);
      if (m) {
        pane.appendChild(art({ kind: "portrait", id: m.defId, frame: "icon" }, "pane-art"));
        if (isLeaderOf(m, leader)) pane.appendChild(element("span", "crown", "♛"));
        const hp = element("span", "pane-hp");
        const fill = element("span", "fill");
        fill.style.width = `${(100 * m.hp) / maxHpOf(m, leader)}%`;
        hp.appendChild(fill);
        pane.appendChild(hp);
        pane.classList.toggle("fallen", m.hp <= 0);
        explainWith(pane, unitName(m.defId), memberRow(m, leader, commitment));
      }
      column.appendChild(pane);
    }
  }
  const points = unspentPoints(leader);
  const facts = [
    `Leadership ${leadershipOf(leader)} · move ${movementPips(leader.movement, movementOf(leader))}`,
    `${leader.experience} XP as leader · ${points} point${points === 1 ? "" : "s"}`,
    `${leader.worn.length} worn · ${leader.bag.length} in the bag`,
  ];
  facts.forEach((fact, i) => column.appendChild(element("div", `fact f${i}`, fact)));
  const back = button("seal", [], close);
  back.setAttribute("aria-label", "Back to the map");
  column.appendChild(explain(back, "Back to the map", "Escape does the same."));
  return column;
}
