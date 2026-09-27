import { playerOf } from "#rules/world/state";
import { equipProblem, LEADER_SKILLS, leadershipOf, movementOf, rankOf, unspentPoints } from "#rules/world/leaders";
import { itemById, SLOT_CAPACITY, SLOT_NAMES } from "#rules/items";
import type { EquipmentSlot } from "#rules/items";
import { learnSkillProblem } from "#rules/world/economy";
import type { Leader, World, WorldAction } from "#rules/world/state";
import { button, element, orderButton } from "#view/dom";
import { memberRow } from "#view/members";

export interface LeaderScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

const isSlot = (key: string): key is EquipmentSlot => key in SLOT_CAPACITY;

/** How deep a skill sits in the tree: one column further than the deepest skill it needs. */
function depth(skill: string): number {
  const requires = LEADER_SKILLS[skill]?.requires ?? [];
  return requires.length === 0 ? 0 : 1 + Math.max(...requires.map(depth));
}

/** A warband leader's own menu: its unit, its equipment, and the leader tree laid out by prerequisites. */
export class LeaderScreen {
  constructor(
    private readonly root: HTMLElement,
    private readonly options: LeaderScreenOptions,
  ) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.root.hidden) options.close();
    });
  }

  /** The equipment slots (the user's 2024 layout) with what's worn, and the bag: click to put on or take off. */
  private equipment(leader: Leader, mayAct: boolean): HTMLElement {
    const box = element("div", "equipment");
    box.appendChild(element("div", "section", "Equipment"));
    for (const slot of Object.keys(SLOT_CAPACITY).filter(isSlot)) {
      const worn = leader.worn.filter((id) => itemById(id).slot === slot);
      for (let i = 0; i < SLOT_CAPACITY[slot]; i++) {
        const id = worn[i];
        const row = element("div", "slot-row");
        row.appendChild(element("span", "slot-name", SLOT_NAMES[slot]));
        if (id) {
          const item = itemById(id);
          row.appendChild(
            orderButton("small", `${item.name} · take off`, { mayAct, problem: null, explain: item.describe, give: () => this.options.act({ type: "unequip", leaderId: leader.id, item: id }) }),
          );
        } else row.appendChild(element("span", "note", "empty"));
        box.appendChild(row);
      }
    }
    box.appendChild(element("div", "section", "Bag"));
    if (leader.bag.length === 0) box.appendChild(element("div", "note", "Nothing carried. Dungeons and beaten warbands give items."));
    leader.bag.forEach((id) => {
      const item = itemById(id);
      const row = element("div", "slot-row");
      row.appendChild(element("span", "note", item.describe));
      if (item.slot) {
        const problem = equipProblem(leader, id);
        row.prepend(orderButton("small", `${item.name} · put on`, { mayAct, problem, explain: item.describe, give: () => this.options.act({ type: "equip", leaderId: leader.id, item: id }) }));
      } else row.prepend(element("span", "name", item.name));
      box.appendChild(row);
    });
    return box;
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
    header.appendChild(button("action", "Back to the map", () => this.options.close()));

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
        node.appendChild(orderButton("small", "Learn (1 point)", { mayAct, problem, explain: "", give: () => this.options.act({ type: "learn", leaderId: leader.id, skill: id }) }));
      }
      grid.appendChild(node);
    }
    tree.appendChild(grid);

    const side = element("div", "capitol-hall panel");
    side.appendChild(element("div", "section", "Warband"));
    side.appendChild(element("div", "note", `Leadership ${leadershipOf(leader)} · ${movementOf(leader)} movement per turn`));
    for (const m of leader.squad) side.appendChild(memberRow(m, leader, playerOf(world, leader.player).commitment));
    side.appendChild(this.equipment(leader, mayAct));

    const body = element("div", "capitol-body");
    body.append(tree, side);
    this.root.append(header, body);
  }
}
