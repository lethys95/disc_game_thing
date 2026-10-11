import { member, playerOf } from "#rules/world/state";
import { isFork } from "#rules/forks";
import { EVOLUTIONS, FACTION_ROOTS, LINE_ARCHETYPE } from "#rules/units/index";
import { ARCHETYPES } from "#rules/units/types";
import type { Archetype } from "#rules/units/types";
import { upgradesFor } from "#rules/upgrades";
import { RESEARCH } from "#rules/research";
import { chooseBranchProblem, researchProblem, squadsOf, upgradeProblem } from "#rules/world/economy";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { art } from "#view/art";
import { element, gold, orderButton } from "#view/dom";
import { closeDialog, openDialog } from "#view/dialog";
import { branchCards, branchText } from "#view/branches";
import { memberCard, unitName } from "#view/members";
import { showPeek } from "#view/peek";
import { maxHpOf } from "#rules/world/record";

const ARCHETYPE_NAMES: Readonly<Record<Archetype, string>> = { melee: "Melee", support: "Support", mage: "Mage", joker: "Joker" };

/** The tab rail: the Capitol's own research, then a tab per line archetype. */
type ResearchTab = "general" | Archetype;

/** Every route from `defId` to the top of its tree. */
function routes(defId: string): string[][] {
  const next = EVOLUTIONS[defId] ?? [];
  return next.length === 0 ? [[defId]] : next.flatMap((e) => routes(e.to).map((route) => [defId, ...route]));
}

const SVG = "http://www.w3.org/2000/svg";

/**
 * Where a unit stands on its line for this player: unlocked (every branch above it chosen its way, or none to choose),
 * choosable (the branch of a fork not yet decided), pending (below an undecided fork), closed (another branch was
 * chosen above it).
 */
type Reach = "unlocked" | "choosable" | "pending" | "closed";

function reachOf(route: readonly string[], tier: number, commitment: Readonly<Record<string, string>>): Reach {
  let reach: Reach = "unlocked";
  for (let i = 1; i <= tier; i++) {
    const parent = route[i - 1] ?? "";
    const here = route[i] ?? "";
    if (!isFork(parent)) continue;
    const chosen = commitment[parent];
    if (chosen !== undefined && chosen !== here) return "closed";
    if (chosen === undefined) reach = reach === "unlocked" && i === tier ? "choosable" : "pending";
  }
  return reach;
}

/** Which way a line's tree grows: down from its root at the top, or across from its root at the left. */
type TreeLayout = "down" | "across";

/** The deepest tier a line reaches (tier 5, the longest lines). */
const TREE_TIERS = 5;

/**
 * Across, the portraits grow with the room a branch and a tier get, less the name and pips under them. Set here, not
 * in CSS: container query heights resolve to zero inside this grid.
 */
function fitPortraits(grid: HTMLElement): void {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const rows = Number(grid.style.getPropertyValue("--rows")) || 1;
  const room = Math.min(grid.clientHeight / rows - 3.5 * rem, grid.clientWidth / TREE_TIERS - 3 * rem);
  grid.style.setProperty("--thumb", `${Math.max(5.75 * rem, Math.min(11 * rem, room))}px`);
}

/**
 * Branches from each parent's portrait to its children's, elbowed (down a tree: down, across, down; across one: across,
 * down, across), lit along the unlocked branches. Drawn once the grid has its size (and again when it changes), since
 * the portraits' places come from the layout.
 */
function connectors(grid: HTMLElement, links: readonly (readonly [HTMLElement, HTMLElement, boolean])[], layout: TreeLayout): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.classList.add("connectors");
  const draw = () => {
    if (layout === "across") fitPortraits(grid);
    const box = grid.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    for (const [child, parent, lit] of links) {
      // Down a tree a branch leaves below the parent's name; across one, from its portrait's side.
      const from = (layout === "down" ? parent : (parent.querySelector(".thumb") ?? parent)).getBoundingClientRect();
      const to = (child.querySelector(".thumb") ?? child).getBoundingClientRect();
      const path = document.createElementNS(SVG, "path");
      if (layout === "down") {
        const x1 = from.left + from.width / 2 - box.left;
        const y1 = from.bottom - box.top;
        const x2 = to.left + to.width / 2 - box.left;
        const y2 = to.top - box.top;
        path.setAttribute("d", `M ${x1} ${y1} V ${(y1 + y2) / 2} H ${x2} V ${y2}`);
      } else {
        const x1 = from.right - box.left;
        const y1 = from.top + from.height / 2 - box.top;
        const x2 = to.left - box.left;
        const y2 = to.top + to.height / 2 - box.top;
        path.setAttribute("d", `M ${x1} ${y1} H ${(x1 + x2) / 2} V ${y2} H ${x2}`);
      }
      if (lit) path.classList.add("lit");
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
  private tab: ResearchTab = "general";
  private layout: TreeLayout = "down";

  constructor(
    private readonly host: HTMLElement,
    private readonly act: (action: WorldAction) => void,
    private readonly rerender: () => void,
  ) {}

  /**
   * The tabs (General, then a tab per archetype, browser-style on top of the field, outside what scrolls) and the open
   * tab's content: the Capitol's research, or each line's tree (`docs/design/capitol-elements.md`, "Research").
   */
  render(world: World, side: PlayerId, mayAct: boolean): { readonly tabs: HTMLElement; readonly body: HTMLElement } {
    const column = element("div", "capitol-trees");
    const faction = playerOf(world, side).faction;
    const commitment = playerOf(world, side).commitment;
    const owned = squadsOf(world, side).flatMap((h) => h.squad);
    const roots = FACTION_ROOTS[faction];
    const rootsOf = (archetype: Archetype) => roots.filter((r) => LINE_ARCHETYPE[r] === archetype);
    const tab: ResearchTab = this.tab === "general" || rootsOf(this.tab).length > 0 ? this.tab : "general";
    const tabs = element("div", "frame-tabs");
    const tabButton = (id: ResearchTab, label: string, title: string, held: boolean) => {
      const button = element("button", `tab${id === tab ? " selected" : ""}`, label);
      button.disabled = !held;
      button.title = title;
      button.addEventListener("click", () => {
        this.tab = id;
        this.rerender();
      });
      tabs.appendChild(button);
    };
    tabButton("general", "General", "The Capitol's own research.", true);
    for (const archetype of ARCHETYPES) {
      const lines = rootsOf(archetype);
      tabButton(archetype, ARCHETYPE_NAMES[archetype], lines.length === 0 ? `No ${ARCHETYPE_NAMES[archetype].toLowerCase()} line yet.` : lines.map((r) => `${unitName(r)} line`).join(", "), lines.length > 0);
    }
    if (tab === "general") {
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
      return { tabs, body: column };
    }
    // The two layouts side by side until the user picks one (todo/proper-trees): a toggle above the trees.
    const layouts = element("div", "tree-layouts");
    for (const [id, label] of [["down", "Top down"], ["across", "Left to right"]] as const) {
      const button = element("button", `layout${this.layout === id ? " selected" : ""}`, label);
      button.addEventListener("click", () => {
        this.layout = id;
        this.rerender();
      });
      layouts.appendChild(button);
    }
    column.appendChild(layouts);
    // Each line grows from its tier-1 unit (user, 2026-09-27: "more tree like"): a lane per route to the end of the
    // tree; a unit two routes share sits once, over the first of them.
    const across = this.layout === "across";
    for (const lines of rootsOf(tab).map(routes)) {
      const grid = element("div", `tree line ${this.layout}`);
      // Across: a column per tier up to the deepest a line can reach, so every tab's tiers line up; the branches share the height.
      if (across) {
        grid.style.gridTemplateRows = `repeat(${lines.length}, minmax(0, 1fr))`;
        grid.style.gridTemplateColumns = `repeat(${TREE_TIERS}, minmax(0, 1fr))`;
        grid.style.setProperty("--rows", String(lines.length));
      }
      else grid.style.gridTemplateColumns = `repeat(${lines.length}, minmax(0, 1fr))`;
      // Each node by its route from the root, so a child finds the cell its parent was drawn in.
      const cells = new Map<string, HTMLElement>();
      const links: [child: HTMLElement, parent: HTMLElement, lit: boolean][] = [];
      lines.forEach((route, col) => {
        route.forEach((defId, tier) => {
          const shared = col > 0 && lines[col - 1]?.slice(0, tier + 1).join() === route.slice(0, tier + 1).join();
          if (shared) return;
          const reach = reachOf(route, tier, commitment);
          const cell = this.node(world, side, defId, route[tier - 1], reach, owned.filter((m) => m.defId === defId).length, mayAct);
          cells.set(route.slice(0, tier + 1).join(), cell);
          const parent = cells.get(route.slice(0, tier).join());
          if (tier > 0 && parent) links.push([cell, parent, reach === "unlocked"]);
          // A unit shared by the routes to its right spans them.
          const span = lines.slice(col).findIndex((other) => other.slice(0, tier + 1).join() !== route.slice(0, tier + 1).join());
          if (tier === 0) cell.classList.add("root");
          const lane = `${col + 1} / span ${span === -1 ? lines.length - col : span}`;
          cell.style.gridRow = across ? lane : `${tier + 1}`;
          cell.style.gridColumn = across ? `${tier + 1}` : lane;
          grid.appendChild(cell);
        });
      });
      grid.appendChild(connectors(grid, links, this.layout));
      column.appendChild(grid);
    }
    return { tabs, body: column };
  }

  /**
   * A unit on its line: its portrait is the way in. A branch not yet chosen asks to confirm the choice; an unlocked unit
   * opens its upgrades; a closed one is greyed and does nothing. Its numbers are on its sheet, a held right-click.
   */
  private node(world: World, side: PlayerId, defId: string, parent: string | undefined, reach: Reach, count: number, mayAct: boolean): HTMLElement {
    const node = element("button", `node ${reach}`);
    node.appendChild(art({ kind: "portrait", id: defId, frame: "icon" }, "thumb"));
    node.appendChild(element("div", "name", `${unitName(defId)}${count > 0 ? ` ×${count}` : ""}`));
    const upgrades = upgradesFor(defId);
    const bought = playerOf(world, side).upgrades;
    if (upgrades.length > 0) {
      const pips = element("div", "pips");
      for (const upgrade of upgrades) pips.appendChild(element("span", `pip${bought.includes(upgrade.id) ? " bought" : ""}`));
      node.appendChild(pips);
    }
    node.disabled = reach === "closed";
    node.title = reach === "closed" ? "No longer reachable: another branch was chosen." : reach === "choosable" ? "Click to choose this branch." : "Click for its upgrades.";
    node.addEventListener("click", () => {
      if (reach === "choosable" && parent) this.confirmBranch(world, parent, defId, mayAct);
      else if (reach !== "closed") this.upgradeDialog(world, side, defId, mayAct);
    });
    // Its numbers are on its sheet, under a held right-click (released on pointerup).
    node.addEventListener("contextmenu", (e) => e.preventDefault());
    node.addEventListener("pointerdown", (e) => {
      const peek = document.getElementById("peek");
      if (e.button !== 2 || !peek) return;
      const fresh = member(defId, { row: 0, col: 0 });
      showPeek(peek, [memberCard({ ...fresh, hp: maxHpOf(fresh, undefined) }, undefined)], e.clientX, e.clientY);
    });
    return node;
  }

  /** The fork's branches to pick from, the clicked one marked: the same cards as the evolve prompt on the map. */
  private confirmBranch(world: World, fork: string, to: string, mayAct: boolean): void {
    const problem = mayAct ? chooseBranchProblem(world, fork, to) : "not your turn";
    const cards = branchCards(fork, to, problem, (picked) => {
      closeDialog(this.host);
      this.act({ type: "choose", fork, to: picked });
    });
    openDialog(this.host, `Choose a branch for the ${unitName(fork)}`, [branchText(fork), cards], []);
  }

  private upgradeDialog(world: World, side: PlayerId, defId: string, mayAct: boolean): void {
    const upgrades = upgradesFor(defId);
    const bought = playerOf(world, side).upgrades;
    const lines: (string | Node)[] = upgrades.length === 0 ? ["It has no upgrades."] : [`Every unit that becomes a ${unitName(defId)} from now on gets these. Units you already have don't.`];
    for (const upgrade of upgrades.filter((u) => bought.includes(u.id))) lines.push(element("div", "bought", `✓ ${upgrade.label}`));
    openDialog(
      this.host,
      unitName(defId),
      lines,
      upgrades
        .filter((u) => !bought.includes(u.id))
        .map((upgrade) => ({ label: [`Buy ${upgrade.label} · `, gold(upgrade.price)], problem: mayAct ? upgradeProblem(world, upgrade.id) : "not your turn", run: () => this.act({ type: "upgrade", upgrade: upgrade.id }) })),
    );
  }
}
