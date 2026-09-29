import { sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { isLeaderOf, maxHpOf } from "#rules/world/record";
import { NODES } from "#rules/nodes";
import { STRUCTURES } from "#rules/structures";
import { cityOfNode, leaderAt } from "#rules/world/state";
import type { Leader, PlayerId, SquadMember, World } from "#rules/world/state";
import { element } from "#view/dom";
import { unitName } from "#view/members";
import { leaderName } from "#view/map-text";

/** The hold-right-click peek: a small card by the pointer, gone on release. */

export interface Group {
  readonly title: string;
  readonly squad: readonly SquadMember[];
  readonly leader: Leader | undefined;
}

/**
 * The squad standing on a hex as the player knows it (`knownWorld`): a warband, a camp or dungeon's guards, a
 * garrison. Places out of sight are marked as last seen.
 */
export function groupAt(known: World, player: PlayerId, hex: Hex, inSight: boolean): Group | null {
  const lastSeen = inSight ? "" : ", as last seen";
  const leader = leaderAt(known, hex);
  if (leader) {
    const whose = leader.player === player ? "Your warband" : "Enemy warband";
    return { title: `${whose}, led by a ${leaderName(leader)}`, squad: leader.squad, leader };
  }
  const lair = known.lairs.find((l) => sameHex(l.hex, hex) && l.guards.length > 0);
  if (lair) return { title: `${lair.kind === "camp" ? "Bandit camp" : "Dungeon guards"}${lastSeen}`, squad: lair.guards, leader: undefined };
  const city = known.cities.find((c) => sameHex(c.hex, hex) && c.garrison.length > 0);
  if (city) {
    const whose = city.owner === null ? "Bandit-held" : city.owner === player ? "Your" : "Enemy";
    return { title: `${whose} ${city.kind === "capitol" ? "Capitol" : "city"} garrison${lastSeen}`, squad: city.garrison, leader: undefined };
  }
  return null;
}

/** Shows `content` in the peek near the pointer, kept on screen. */
export function showPeek(peek: HTMLElement, content: readonly HTMLElement[], x: number, y: number, width: number, height: number): void {
  peek.replaceChildren(...content);
  peek.hidden = false;
  peek.style.left = `${Math.min(x + 16, window.innerWidth - width)}px`;
  peek.style.top = `${Math.min(y + 16, window.innerHeight - height)}px`;
}

/** A group's formation: its 3×3 grid with names and health. */
export function formation(group: Group): HTMLElement[] {
  const grid = element("div", "formation");
  for (const row of [0, 1, 2]) {
    grid.appendChild(element("div", "row-label", ["Front", "Middle", "Back"][row] ?? ""));
    for (const col of [0, 1, 2]) {
      const m = group.squad.find((s) => s.tile.row === row && s.tile.col === col);
      const cell = element("div", `cell${m ? " filled" : ""}`);
      if (m) {
        cell.appendChild(element("div", "name", `${isLeaderOf(m, group.leader) ? "♛ " : ""}${unitName(m.defId)}`));
        const bar = element("div", "hp");
        const fill = element("div", "fill");
        fill.style.width = `${(100 * m.hp) / maxHpOf(m, group.leader)}%`;
        bar.appendChild(fill);
        cell.appendChild(bar);
      }
      grid.appendChild(cell);
    }
  }
  return [element("div", "title", group.title), grid];
}

/**
 * What a place on a hex does, for the hold-right-click peek (the user, 2026-09-29): a node (its gift at its level, and
 * whose city it serves), a structure, a portal. Null where there's none.
 */
export function placeInfo(known: World, player: PlayerId, hex: Hex, inSight: boolean): HTMLElement[] | null {
  const lastSeen = inSight ? "" : " (as last seen)";
  const node = known.nodes.find((n) => sameHex(n.hex, hex));
  if (node) {
    const def = NODES[node.kind];
    const city = cityOfNode(known, node);
    const holder = !city ? "Its city is unknown" : city.owner === null ? "Its city is neutral" : city.owner === player ? "Its city is yours" : "Its city is the enemy's";
    return [
      element("div", "title", `${def.name}, level ${node.level}${lastSeen}`),
      element("div", "note", capitalized(def.describe(node.level))),
      element("div", "note muted", `${holder}: whoever holds the nearest city holds it.`),
    ];
  }
  const structure = known.structures.find((s) => sameHex(s.hex, hex));
  if (structure) return [element("div", "title", `${STRUCTURES[structure.kind].name}${lastSeen}`), element("div", "note", STRUCTURES[structure.kind].describe)];
  const portal = known.map.portals.find((p) => sameHex(p.a, hex) || sameHex(p.b, hex));
  if (portal) return [element("div", "title", "Portal"), element("div", "note", "A warband standing here can step through to its twin, as if it were the next hex.")];
  return null;
}

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1) + (text.endsWith(".") ? "" : ".");
