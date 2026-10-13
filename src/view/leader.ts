import { LEADER_SKILLS, rankOf, unspentPoints } from "#rules/world/leaders";
import { learnSkillProblem } from "#rules/world/economy";
import type { Leader, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";
import { closeDialog, openDialog } from "#view/dialog";
import { equipmentPanel } from "#view/equipment";
import { tabFrame } from "#view/frames";
import type { KeyLayer } from "#view/input";
import { treeLines } from "#view/tree-lines";
import type { TreeLink } from "#view/tree-lines";
import { warbandColumn } from "#view/warband-column";

export interface LeaderScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
  /** Aim an item that takes a hex (Salt of the old kings) on the map: the screen closes for it. */
  readonly aim: (leaderId: string, item: string) => void;
}

type LeaderTab = "tree" | "equipment";

/** How deep a skill sits in the tree: one column further than the deepest skill it needs. */
function depth(skill: string): number {
  const requires = LEADER_SKILLS[skill]?.requires ?? [];
  return requires.length === 0 ? 0 : 1 + Math.max(...requires.map(depth));
}

/**
 * Each skill's row in the tree, from 1: the skills that need nothing in order, every other on the middle row of the
 * skills it needs, or the next free row in its column.
 */
function rowsOf(ids: readonly string[]): Record<string, number> {
  const rows: Record<string, number> = {};
  for (const id of [...ids].sort((a, b) => depth(a) - depth(b))) {
    const needs = (LEADER_SKILLS[id]?.requires ?? []).map((r) => rows[r] ?? 1);
    const taken = (row: number) => Object.entries(rows).some(([other, r]) => r === row && depth(other) === depth(id));
    let row = needs.length === 0 ? 1 : Math.round(needs.reduce((sum, r) => sum + r, 0) / needs.length);
    while (taken(row)) row++;
    rows[id] = row;
  }
  return rows;
}

/**
 * A warband leader's own screen (`docs/design/warband-elements.md`): the warband's column at the right edge, and in the
 * frame the leader tree (its tab says how many points wait) or the equipment.
 */
export class LeaderScreen implements KeyLayer {
  private tab: LeaderTab = "tree";
  private shown: { world: World; leader: Leader; mayAct: boolean } | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly options: LeaderScreenOptions,
  ) {}

  open(): boolean {
    return !this.root.hidden;
  }

  /** Escape closes an open dialog first, then the screen. */
  key(e: KeyboardEvent): boolean {
    if (e.key !== "Escape") return false;
    if (!closeDialog(this.root)) this.options.close();
    return true;
  }

  hide(): void {
    this.root.hidden = true;
  }

  show(world: World, leader: Leader, mayAct: boolean): void {
    if (this.shown?.leader.id !== leader.id) this.tab = "tree";
    this.shown = { world, leader, mayAct };
    this.root.hidden = false;
    this.root.replaceChildren();
    const points = unspentPoints(leader);
    const tabs = [
      { id: "tree", label: points > 0 ? `Leader tree · ${points}` : "Leader tree", selected: this.tab === "tree" },
      { id: "equipment", label: "Equipment", selected: this.tab === "equipment" },
    ];
    const select = (id: string) => {
      this.tab = id === "equipment" ? "equipment" : "tree";
      this.show(world, leader, mayAct);
    };
    const body = this.tab === "tree" ? this.tree(world, leader, mayAct) : equipmentPanel(world, leader, mayAct, this.options.act, (item) => this.options.aim(leader.id, item));
    this.root.append(warbandColumn(world, leader, tabs, select, () => this.options.close()), tabFrame(this.tab === "tree" ? "Leader tree" : "Equipment", body, null));
  }

  /**
   * The skills left to right by what they need, as the research trees grow: each in the column after its deepest need,
   * on the row of the skills it needs, a line from each need, lit once it's learned. Each node is the way in: a click
   * asks to spend a point on its next rank. Learned ranks are pips; a skill whose needs aren't met is dimmed.
   */
  private tree(world: World, leader: Leader, mayAct: boolean): HTMLElement {
    const grid = element("div", "tree leader-tree");
    const rows = rowsOf(Object.keys(LEADER_SKILLS));
    grid.style.gridTemplateColumns = `repeat(${1 + Math.max(...Object.keys(rows).map(depth))}, minmax(0, 1fr))`;
    grid.style.gridTemplateRows = `repeat(${Math.max(...Object.values(rows))}, minmax(0, 1fr))`;
    const nodes = new Map<string, HTMLElement>();
    for (const [id, row] of Object.entries(rows)) {
      const skill = LEADER_SKILLS[id];
      if (!skill) continue;
      const rank = rankOf(leader, id);
      const met = skill.requires.every((r) => rankOf(leader, r) > 0);
      const node = element("button", `node skill${rank > 0 ? " learned" : ""}${met ? "" : " pending"}${rank >= skill.maxRank ? " full" : ""}`);
      node.style.gridColumn = `${depth(id) + 1}`;
      node.style.gridRow = `${row}`;
      nodes.set(id, node);
      const pips = element("div", "pips");
      for (let i = 0; i < skill.maxRank; i++) pips.appendChild(element("span", `pip${i < rank ? " bought" : ""}`));
      node.append(element("div", "name", skill.name), pips, element("div", "text", skill.describe));
      node.title = met ? (rank >= skill.maxRank ? "Fully learned." : "Click to learn its next rank.") : `Needs ${skill.requires.map((r) => LEADER_SKILLS[r]?.name ?? r).join(", ")} first.`;
      node.addEventListener("click", () => {
        if (rank >= skill.maxRank) return;
        const problem = mayAct ? learnSkillProblem(world, leader.id, id) : "not your turn";
        openDialog(this.root, skill.name, [`Rank ${rank + 1} of ${skill.maxRank}: ${skill.describe}`], [
          { label: "Learn · 1 point", problem, run: () => this.options.act({ type: "learn", leaderId: leader.id, skill: id }) },
        ]);
      });
      grid.appendChild(node);
    }
    const links = Object.keys(rows).flatMap((id): TreeLink[] =>
      (LEADER_SKILLS[id]?.requires ?? []).flatMap((need) => {
        const child = nodes.get(id);
        const parent = nodes.get(need);
        return child && parent ? [[child, parent, rankOf(leader, need) > 0]] : [];
      }),
    );
    grid.appendChild(treeLines(grid, links));
    return grid;
  }
}
