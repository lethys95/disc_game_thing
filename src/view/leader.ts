import { LEADER_SKILLS, rankOf, unspentPoints } from "#rules/world/leaders";
import { learnSkillProblem } from "#rules/world/economy";
import type { Leader, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";
import { closeDialog, openDialog } from "#view/dialog";
import { equipmentPanel } from "#view/equipment";
import { tabFrame } from "#view/frames";
import type { KeyLayer } from "#view/input";
import { warbandColumn } from "#view/warband-column";

export interface LeaderScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

type LeaderTab = "tree" | "equipment";

/** How deep a skill sits in the tree: one column further than the deepest skill it needs. */
function depth(skill: string): number {
  const requires = LEADER_SKILLS[skill]?.requires ?? [];
  return requires.length === 0 ? 0 : 1 + Math.max(...requires.map(depth));
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
    const body = this.tab === "tree" ? this.tree(world, leader, mayAct) : equipmentPanel(world, leader, mayAct, this.options.act);
    this.root.append(warbandColumn(world, leader, tabs, select, () => this.options.close()), tabFrame(this.tab === "tree" ? "Leader tree" : "Equipment", body, null));
  }

  /**
   * The skills in columns by what they need: each node is the way in, as in research; a click asks to spend a point on
   * its next rank. Learned ranks are pips; a skill whose needs aren't met is dimmed.
   */
  private tree(world: World, leader: Leader, mayAct: boolean): HTMLElement {
    const grid = element("div", "tree leader-tree");
    const ids = Object.keys(LEADER_SKILLS);
    grid.style.gridTemplateColumns = `repeat(${1 + Math.max(...ids.map(depth))}, minmax(0, 1fr))`;
    for (const id of ids) {
      const skill = LEADER_SKILLS[id];
      if (!skill) continue;
      const rank = rankOf(leader, id);
      const met = skill.requires.every((r) => rankOf(leader, r) > 0);
      const node = element("button", `node skill${rank > 0 ? " learned" : ""}${met ? "" : " pending"}${rank >= skill.maxRank ? " full" : ""}`);
      node.style.gridColumn = `${depth(id) + 1}`;
      node.style.gridRow = `${ids.filter((other) => depth(other) === depth(id)).indexOf(id) + 1}`;
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
    return grid;
  }
}
