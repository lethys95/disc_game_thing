import { unitName } from "#view/names";
import type { Commitment } from "#rules/forks";
import { isLeaderOf, maxHpOf } from "#rules/world/record";
import type { Leader, SquadMember } from "#rules/world/state";
import { art } from "#view/art";
import { element } from "#view/dom";
import { memberCard } from "#view/members";
import { showPeek } from "#view/peek";

/**
 * One place in a squad's 3×3 grid, the same everywhere a squad is shown (the map's column, the garrison, a meeting, the
 * warband's column; the user, 2026-10-11: "We need modularity"): the portrait covering the tile, a crown for the
 * leader, a line of health at its foot, and the unit's sheet under a held right-click. No name: the face is enough.
 * An empty place is left clear, so whatever the tile sits in shows through. The container sets the size.
 */
export function squadTile(m: SquadMember | undefined, leader: Leader | undefined, commitment?: Commitment): HTMLElement {
  const tile = element("div", `squad-tile${m ? "" : " empty"}`);
  if (!m) return tile;
  tile.appendChild(art({ kind: "portrait", id: m.defId, frame: "icon" }, "tile-art"));
  if (isLeaderOf(m, leader)) tile.appendChild(element("span", "crown", "♛"));
  const hp = element("span", "tile-hp");
  const fill = element("span", "fill");
  fill.style.width = `${(100 * Math.max(0, m.hp)) / maxHpOf(m, leader)}%`;
  hp.appendChild(fill);
  tile.appendChild(hp);
  tile.classList.toggle("fallen", m.hp <= 0);
  tile.setAttribute("aria-label", unitName(m.defId));
  tile.addEventListener("contextmenu", (e) => e.preventDefault());
  tile.addEventListener("pointerdown", (e) => {
    const peek = document.getElementById("peek");
    if (e.button === 2 && peek) showPeek(peek, [memberCard(m, leader, commitment)], e.clientX, e.clientY);
  });
  return tile;
}
