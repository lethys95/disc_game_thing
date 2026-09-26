import { playerOf } from "#rules/world/state";
import type { Side } from "#rules/battle/types";
import { allowedUnits, isFork } from "#rules/forks";
import { ARCHETYPES, EVOLUTIONS, FACTION_ROOTS, LINE_ARCHETYPE, UNITS } from "#rules/units/index";
import type { Archetype } from "#rules/units/index";
import { upgradesFor } from "#rules/upgrades";
import { RESEARCH } from "#rules/research";
import { chooseBranchProblem, researchProblem, squadsOf, upgradeProblem } from "#rules/world/economy";
import type { World, WorldAction } from "#rules/world/state";
import { art } from "#view/art";
import { element, gold } from "#view/dom";
import { unitName } from "#view/members";

const ARCHETYPE_NAMES: Readonly<Record<Archetype, string>> = { melee: "Melee", ranged: "Ranged", support: "Support", mage: "Mage" };

/** Every route from `defId` to the top of its tree. */
function routes(defId: string): string[][] {
  const next = EVOLUTIONS[defId] ?? [];
  return next.length === 0 ? [[defId]] : next.flatMap((e) => routes(e.to).map((route) => [defId, ...route]));
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

  render(world: World, side: Side, mayAct: boolean): HTMLElement {
    const column = element("div", "capitol-trees panel");
    column.appendChild(element("div", "section", "Capitol research"));
    for (const research of RESEARCH) {
      const row = element("div", "research-row");
      row.append(element("div", "name", research.name), element("div", "note", research.describe));
      if (playerOf(world, side).research.includes(research.id)) row.appendChild(element("div", "done", "✓ Done"));
      else {
        const problem = researchProblem(world, research.id);
        const buy = element("button", "small");
        buy.append("Research · ", gold(research.cost));
        buy.disabled = !mayAct || problem !== null;
        buy.title = problem ?? "";
        buy.addEventListener("click", () => this.act({ type: "research", research: research.id }));
        row.appendChild(buy);
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
    const trees = (tab ? rootsOf(tab) : []).map(routes);
    const tiers = Math.max(5, ...trees.flat().map((route) => route.length));
    for (const lines of trees) {
      const grid = element("div", "tree");
      grid.style.gridTemplateColumns = `repeat(${tiers}, minmax(0, 1fr))`;
      lines.forEach((route, row) => {
        route.forEach((defId, col) => {
          const shared = row > 0 && lines[row - 1]?.slice(0, col + 1).join() === route.slice(0, col + 1).join();
          const cell = shared ? element("div", "node continued") : this.node(world, side, defId, route[col - 1], allowed.includes(defId), owned.filter((m) => m.defId === defId).length, mayAct);
          cell.style.gridRow = `${row + 1}`;
          cell.style.gridColumn = `${col + 1}`;
          grid.appendChild(cell);
        });
      });
      column.appendChild(grid);
    }
    return column;
  }

  private node(world: World, side: Side, defId: string, parent: string | undefined, open: boolean, count: number, mayAct: boolean): HTMLElement {
    const def = UNITS[defId];
    const node = element("div", `node${open ? "" : " closed"}`);
    const head = element("div", "head");
    head.append(art({ kind: "portrait", id: defId }, "thumb"), element("div", "name", `${unitName(defId)}${count > 0 ? ` ×${count}` : ""}`));
    node.appendChild(head);
    if (def) node.appendChild(element("div", "stats", `Tier ${def.tier} · ${def.stats.maxHp} HP · ${def.stats.damage} dmg · ${def.stats.armor} armor`));
    const commitment = playerOf(world, side).commitment;
    if (parent && isFork(parent)) {
      const label = EVOLUTIONS[parent]?.find((e) => e.to === defId)?.label ?? "";
      const chosen = commitment[parent];
      if (chosen === defId) node.appendChild(element("div", "branch chosen", `Chosen: ${label}`));
      else if (chosen !== undefined) node.appendChild(element("div", "branch", `Closed: ${label}`));
      else {
        const problem = chooseBranchProblem(world, parent, defId);
        const choose = element("button", "small", `Choose: ${label}`);
        choose.disabled = !mayAct || problem !== null;
        choose.title = problem ?? `Free. Permanent: every ${unitName(parent)} in your army will become a ${unitName(defId)}.`;
        choose.addEventListener("click", () => this.act({ type: "choose", fork: parent, to: defId }));
        node.appendChild(choose);
      }
    }
    for (const upgrade of upgradesFor(defId)) {
      if (playerOf(world, side).upgrades.includes(upgrade.id)) {
        node.appendChild(element("div", "upgrade bought", `✓ ${upgrade.label}`));
        continue;
      }
      const problem = upgradeProblem(world, upgrade.id);
      const buy = element("button", "small upgrade", `Upgrade: ${upgrade.label} · ${upgrade.price} gold`);
      buy.disabled = !mayAct || !open || problem !== null;
      buy.title = problem ?? `Every unit that becomes a ${unitName(defId)} from now on gets this. Units you already have don't.`;
      buy.addEventListener("click", () => this.act({ type: "upgrade", upgrade: upgrade.id }));
      node.appendChild(buy);
    }
    return node;
  }
}
