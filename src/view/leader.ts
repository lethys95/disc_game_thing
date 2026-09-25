import { LEADER_SKILLS, leadershipOf, movementOf, rankOf, unspentPoints } from "#rules/world/leaders";
import { learnSkillProblem } from "#rules/world/economy";
import type { Leader, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";
import { memberRow } from "#view/members";

export interface LeaderScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

/** How deep a skill sits in the tree: one column further than the deepest skill it needs. */
function depth(skill: string): number {
  const requires = LEADER_SKILLS[skill]?.requires ?? [];
  return requires.length === 0 ? 0 : 1 + Math.max(...requires.map(depth));
}

/** A warband leader's own menu: its unit, and the leader tree laid out by prerequisites. */
export class LeaderScreen {
  constructor(
    private readonly root: HTMLElement,
    private readonly options: LeaderScreenOptions,
  ) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.root.hidden) options.close();
    });
  }

  hide(): void {
    this.root.hidden = true;
  }

  show(world: World, leader: Leader, name: string, mayAct: boolean): void {
    this.root.hidden = false;
    this.root.replaceChildren();
    const points = unspentPoints(leader);
    const header = element("div", "capitol-header");
    header.append(element("div", "title", name), element("div", "gold", `${leader.experience} XP as leader · ${points} point${points === 1 ? "" : "s"} to spend`));
    const back = element("button", "action", "Back to the map");
    back.addEventListener("click", () => this.options.close());
    header.appendChild(back);

    const tree = element("div", "capitol-trees panel");
    tree.appendChild(element("div", "section", "Leader tree"));
    tree.appendChild(element("div", "note", "A point for every 100 XP this leader earns while it leads. A skill needs the skills to its left first."));
    const grid = element("div", "tree");
    const ids = Object.keys(LEADER_SKILLS);
    const columns = 1 + Math.max(...ids.map(depth));
    grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    for (const id of ids) {
      const skill = LEADER_SKILLS[id];
      if (!skill) continue;
      const rank = rankOf(leader, id);
      const node = element("div", `node${rank > 0 ? " learned" : ""}`);
      node.style.gridColumn = `${depth(id) + 1}`;
      node.style.gridRow = `${ids.filter((other) => depth(other) === depth(id)).indexOf(id) + 1}`;
      node.append(element("div", "name", skill.name), element("div", "stats", `Rank ${rank} / ${skill.maxRank}`), element("div", "text", skill.describe));
      if (skill.requires.length > 0) node.appendChild(element("div", "stats", `Needs ${skill.requires.map((r) => LEADER_SKILLS[r]?.name ?? r).join(", ")}`));
      const problem = learnSkillProblem(world, leader.id, id);
      if (rank < skill.maxRank) {
        const learn = element("button", "small", "Learn (1 point)");
        learn.disabled = !mayAct || problem !== null;
        learn.title = problem ?? "";
        learn.addEventListener("click", () => this.options.act({ type: "learn", leaderId: leader.id, skill: id }));
        node.appendChild(learn);
      }
      grid.appendChild(node);
    }
    tree.appendChild(grid);

    const side = element("div", "capitol-hall panel");
    side.appendChild(element("div", "section", "Warband"));
    side.appendChild(element("div", "note", `Leadership ${leadershipOf(leader)} · ${movementOf(leader)} movement per turn`));
    for (const m of leader.squad) side.appendChild(memberRow(m, leader, world.commitment[leader.side]));

    const body = element("div", "capitol-body");
    body.append(tree, side);
    this.root.append(header, body);
  }
}
