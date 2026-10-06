import { playerOf } from "#rules/world/state";
import { allowedUnits, isFork } from "#rules/forks";
import { ARCHETYPES, EVOLUTIONS, FACTION_ROOTS, LINE_ARCHETYPE, UNITS } from "#rules/units/index";
import type { Archetype } from "#rules/units/index";
import { upgradesFor } from "#rules/upgrades";
import { RESEARCH } from "#rules/research";
import { chooseBranchProblem, researchProblem, squadsOf, upgradeProblem } from "#rules/world/economy";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { art } from "#view/art";
import { element, gold, orderButton } from "#view/dom";
import { unitName } from "#view/members";

const ARCHETYPE_NAMES: Readonly<Record<Archetype, string>> = { melee: "Melee", support: "Support", mage: "Mage", joker: "Joker" };

/** Every route from `defId` to the top of its tree. */
function routes(defId: string): string[][] {
  const next = EVOLUTIONS[defId] ?? [];
  return next.length === 0 ? [[defId]] : next.flatMap((e) => routes(e.to).map((route) => [defId, ...route]));
}

const SVG = "http://www.w3.org/2000/svg";

/**
 * Elbow lines from each parent's bottom to its children's tops: down, across, down. Drawn once the grid has its size
 * (and again when it changes), since the cells' places come from the layout.
 */
function connectors(grid: HTMLElement, links: readonly (readonly [HTMLElement, HTMLElement])[]): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.classList.add("connectors");
  const draw = () => {
    const box = grid.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    for (const [child, parent] of links) {
      const from = parent.getBoundingClientRect();
      const to = child.getBoundingClientRect();
      const x1 = from.left + from.width / 2 - box.left;
      const y1 = from.bottom - box.top;
      const x2 = to.left + to.width / 2 - box.left;
      const y2 = to.top - box.top;
      const mid = (y1 + y2) / 2;
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", `M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`);
      svg.appendChild(path);
    }
  };
  new ResizeObserver(draw).observe(grid);
  return svg;
}

/**
 * The Capitol's Research tab (HoMM-style, docs/design/pillars.md): each line's evolution tree, in archetype tabs,
 * with its fork choices and unit-type upgrades.
 */
export class ResearchPanel {
  private tab: Archetype | null = null;

  constructor(
    private readonly act: (action: WorldAction) => void,
    private readonly rerender: () => void,
  ) {}

  render(world: World, side: PlayerId, mayAct: boolean): HTMLElement {
    const column = element("div", "capitol-trees panel");
    column.appendChild(element("div", "section", "Capitol research"));
    for (const research of RESEARCH) {
      const row = element("div", "research-row");
      row.append(element("div", "name", research.name), element("div", "note", research.describe));
      if (playerOf(world, side).research.includes(research.id)) row.appendChild(element("div", "done", "✓ Done"));
      else {
        const problem = researchProblem(world, research.id);
        row.appendChild(orderButton("small", ["Research · ", gold(research.cost)], { mayAct, problem, explain: "", give: () => this.act({ type: "research", research: research.id }) }));
      }
      column.appendChild(row);
    }
    column.appendChild(element("div", "section", "Evolution"));
    column.appendChild(element("div", "note", "Choosing a branch is free and permanent for every unit of that kind. Upgrades reach units that become that type after you buy them."));
    const faction = playerOf(world, side).faction;
    const commitment = playerOf(world, side).commitment;
    const allowed = allowedUnits(faction, commitment);
    const owned = squadsOf(world, side).flatMap((h) => h.squad);
    const roots = FACTION_ROOTS[faction];
    const rootsOf = (archetype: Archetype) => roots.filter((r) => LINE_ARCHETYPE[r] === archetype);
    const tab = this.tab && rootsOf(this.tab).length > 0 ? this.tab : ARCHETYPES.find((a) => rootsOf(a).length > 0);
    const tabs = element("div", "tabs");
    for (const archetype of ARCHETYPES) {
      const lines = rootsOf(archetype);
      const button = element("button", `action${archetype === tab ? " selected" : ""}`, ARCHETYPE_NAMES[archetype]);
      button.disabled = lines.length === 0;
      button.title = lines.length === 0 ? `No ${ARCHETYPE_NAMES[archetype].toLowerCase()} line yet.` : lines.map((r) => `${unitName(r)} line`).join(", ");
      button.addEventListener("click", () => {
        this.tab = archetype;
        this.rerender();
      });
      tabs.appendChild(button);
    }
    column.appendChild(tabs);
    // Each line grows down from its tier-1 unit at the top (user, 2026-09-27: "more tree like"): a column per route
    // to the top of the tree; a unit two routes share sits once, over the first of them.
    const trees = (tab ? rootsOf(tab) : []).map(routes);
    for (const lines of trees) {
      const grid = element("div", "tree down");
      grid.style.gridTemplateColumns = `repeat(${lines.length}, minmax(0, 1fr))`;
      // Each node by its route from the root, so a child finds the cell its parent was drawn in.
      const cells = new Map<string, HTMLElement>();
      const links: [child: HTMLElement, parent: HTMLElement][] = [];
      lines.forEach((route, col) => {
        route.forEach((defId, tier) => {
          const shared = col > 0 && lines[col - 1]?.slice(0, tier + 1).join() === route.slice(0, tier + 1).join();
          if (shared) return;
          const cell = this.node(world, side, defId, route[tier - 1], allowed.includes(defId), owned.filter((m) => m.defId === defId).length, mayAct);
          cells.set(route.slice(0, tier + 1).join(), cell);
          const parent = cells.get(route.slice(0, tier).join());
          if (tier > 0 && parent) links.push([cell, parent]);
          // A unit shared by the routes to its right spans them.
          const span = lines.slice(col).findIndex((other) => other.slice(0, tier + 1).join() !== route.slice(0, tier + 1).join());
          if (tier === 0) cell.classList.add("root");
          cell.style.gridRow = `${tier + 1}`;
          cell.style.gridColumn = `${col + 1} / span ${span === -1 ? lines.length - col : span}`;
          grid.appendChild(cell);
        });
      });
      grid.appendChild(connectors(grid, links));
      column.appendChild(grid);
    }
    return column;
  }

  private node(world: World, side: PlayerId, defId: string, parent: string | undefined, open: boolean, count: number, mayAct: boolean): HTMLElement {
    const def = UNITS[defId];
    const node = element("div", `node${open ? "" : " closed"}`);
    const head = element("div", "head");
    head.append(art({ kind: "portrait", id: defId, frame: "icon" }, "thumb"), element("div", "name", `${unitName(defId)}${count > 0 ? ` ×${count}` : ""}`));
    node.appendChild(head);
    if (def) node.appendChild(element("div", "stats", `Tier ${def.tier} · ${def.stats.maxHp} HP · ${def.stats.damage} dmg · ${def.stats.armor} armor`));
    const commitment = playerOf(world, side).commitment;
    if (parent && isFork(parent)) {
      // Only the duality fork is labelled; later forks go by the unit's name.
      const label = EVOLUTIONS[parent]?.find((e) => e.to === defId)?.label || unitName(defId);
      const chosen = commitment[parent];
      if (chosen === defId) node.appendChild(element("div", "branch chosen", `Chosen: ${label}`));
      else if (chosen !== undefined) node.appendChild(element("div", "branch", `Closed: ${label}`));
      else {
        const problem = chooseBranchProblem(world, parent, defId);
        node.appendChild(
          orderButton("small", `Choose: ${label}`, {
            mayAct,
            problem,
            explain: `Free. Permanent: every ${unitName(parent)} in your army will become a ${unitName(defId)}.`,
            give: () => this.act({ type: "choose", fork: parent, to: defId }),
          }),
        );
      }
    }
    for (const upgrade of upgradesFor(defId)) {
      if (playerOf(world, side).upgrades.includes(upgrade.id)) {
        node.appendChild(element("div", "upgrade bought", `✓ ${upgrade.label}`));
        continue;
      }
      const problem = upgradeProblem(world, upgrade.id);
      node.appendChild(
        orderButton("small upgrade", `Upgrade: ${upgrade.label} · ${upgrade.price} gold`, {
          mayAct: mayAct && open,
          problem,
          explain: `Every unit that becomes a ${unitName(defId)} from now on gets this. Units you already have don't.`,
          give: () => this.act({ type: "upgrade", upgrade: upgrade.id }),
        }),
      );
    }
    return node;
  }
}
