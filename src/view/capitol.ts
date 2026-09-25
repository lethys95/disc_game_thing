import type { Side } from "#rules/battle/types";
import { allowedUnits, isFork } from "#rules/forks";
import { EVOLUTIONS, FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units/index";
import { upgradesFor } from "#rules/upgrades";
import { chooseBranchProblem, elevateProblem, recruitProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem, squadsOf, upgradeProblem } from "#rules/world/economy";
import { capitolOf, leaderUnit } from "#rules/world/state";
import type { Leader, RecruitInto, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";
import { memberRow, unitName } from "#view/members";

export interface CapitolOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

/** Every route from `defId` to the top of its tree. */
function routes(defId: string): string[][] {
  const next = EVOLUTIONS[defId] ?? [];
  return next.length === 0 ? [[defId]] : next.flatMap((e) => routes(e.to).map((route) => [defId, ...route]));
}

/**
 * Inside the Capitol (HoMM-style, docs/design/pillars.md): the evolution trees with their fork choices and
 * unit-type upgrades, and the recruiting, garrison and graveyard.
 */
export class CapitolScreen {
  constructor(
    private readonly root: HTMLElement,
    private readonly options: CapitolOptions,
  ) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.root.hidden) options.close();
    });
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  hide(): void {
    this.root.hidden = true;
  }

  /** `home` is the warband standing in the Capitol, if any: recruits and the raised dead can join it directly. */
  show(world: World, side: Side, home: Leader | undefined, mayAct: boolean): void {
    this.root.hidden = false;
    this.root.replaceChildren();
    const header = element("div", "capitol-header");
    header.append(element("div", "title", "Your Capitol"), element("div", "gold", `${world.gold[side]} gold`));
    const back = element("button", "action", "Back to the map");
    back.addEventListener("click", () => this.options.close());
    header.appendChild(back);
    const body = element("div", "capitol-body");
    body.append(this.trees(world, side, mayAct), this.hall(world, side, home, mayAct));
    this.root.append(header, body);
  }

  private trees(world: World, side: Side, mayAct: boolean): HTMLElement {
    const column = element("div", "capitol-trees panel");
    column.appendChild(element("div", "section", "Evolution"));
    column.appendChild(element("div", "note", "Choosing a branch is free and permanent for every unit of that kind. Upgrades reach units that become that type after you buy them."));
    const faction = world.factions[side];
    const commitment = world.commitment[side];
    const allowed = allowedUnits(faction, commitment);
    const owned = squadsOf(world, side).flatMap((h) => h.squad);
    const trees = FACTION_ROOTS[faction].map(routes);
    const tiers = Math.max(...trees.flat().map((route) => route.length));
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
    node.appendChild(element("div", "name", `${unitName(defId)}${count > 0 ? ` ×${count}` : ""}`));
    if (def) node.appendChild(element("div", "stats", `Tier ${def.tier} · ${def.stats.maxHp} HP · ${def.stats.damage} dmg · ${def.stats.armor} armor`));
    const commitment = world.commitment[side];
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
        choose.addEventListener("click", () => this.options.act({ type: "choose", fork: parent, to: defId }));
        node.appendChild(choose);
      }
    }
    for (const upgrade of upgradesFor(defId)) {
      if (world.upgrades[side].includes(upgrade.id)) {
        node.appendChild(element("div", "upgrade bought", `✓ ${upgrade.label}`));
        continue;
      }
      const problem = upgradeProblem(world, upgrade.id);
      const buy = element("button", "small upgrade", `Upgrade: ${upgrade.label} · ${upgrade.price} gold`);
      buy.disabled = !mayAct || !open || problem !== null;
      buy.title = problem ?? `Every unit that becomes a ${unitName(defId)} from now on gets this. Units you already have don't.`;
      buy.addEventListener("click", () => this.options.act({ type: "upgrade", upgrade: upgrade.id }));
      node.appendChild(buy);
    }
    return node;
  }

  private hall(world: World, side: Side, home: Leader | undefined, mayAct: boolean): HTMLElement {
    const column = element("div", "capitol-hall panel");
    const capitol = capitolOf(world, side);
    if (!capitol) return column;

    column.appendChild(element("div", "section", "Recruit"));
    for (const defId of FACTION_ROOTS[world.factions[side]]) {
      const cost = RECRUIT_COST[defId] ?? 0;
      const targets: { label: string; into: RecruitInto }[] = [{ label: "to the garrison", into: { kind: "garrison" } }];
      if (home) targets.unshift({ label: "to the warband here", into: { kind: "leader", leaderId: home.id } });
      for (const { label, into } of targets) {
        const problem = recruitProblem(world, defId, into);
        const recruit = element("button", "action small", `${unitName(defId)} ${label} · ${cost} gold`);
        recruit.disabled = !mayAct || problem !== null;
        recruit.title = problem ?? "";
        recruit.addEventListener("click", () => this.options.act({ type: "recruit", defId, into }));
        column.appendChild(recruit);
      }
    }
    if (!home) column.appendChild(element("div", "note", "A warband standing in the Capitol can take recruits directly, and heals each turn."));

    column.appendChild(element("div", "section", "Garrison"));
    for (const m of capitol.garrison) {
      const row = memberRow(m, undefined);
      if (m.defId !== GUARDIAN_ID) {
        const problem = elevateProblem(world, m.tile);
        const elevate = element("button", "small", "Elevate");
        elevate.disabled = !mayAct || problem !== null;
        elevate.title = problem ?? "Make this unit the leader of a new warband (irreversible).";
        elevate.addEventListener("click", () => this.options.act({ type: "elevate", tile: m.tile }));
        row.appendChild(elevate);
      }
      column.appendChild(row);
    }

    const fallen = world.graveyard[side];
    column.appendChild(element("div", "section", "Graveyard"));
    const lost = world.leaders.filter((l) => l.side === side && l.fellOnTurn !== null);
    for (const leader of lost) {
      const own = leaderUnit(leader);
      const cost = reviveCost(world, leader) ?? 0;
      const problem = reviveProblem(world, leader.id);
      const row = element("div", "fallen");
      row.appendChild(element("span", "name", `♛ ${unitName(own?.defId ?? "")}, a warband's leader · ${cost} gold`));
      const revive = element("button", "small", "Revive");
      revive.disabled = !mayAct || problem !== null;
      revive.title = problem ?? "Returns at 1 HP and leads its warband again. The price drops each turn you wait.";
      revive.addEventListener("click", () => this.options.act({ type: "revive", leaderId: leader.id }));
      row.appendChild(revive);
      column.appendChild(row);
    }
    if (fallen.length === 0 && lost.length === 0) column.appendChild(element("div", "note", "Nobody has fallen yet."));
    const into: RecruitInto = home ? { kind: "leader", leaderId: home.id } : { kind: "garrison" };
    fallen.forEach((f, index) => {
      const cost = resurrectionCost(world, side, index) ?? 0;
      const problem = resurrectProblem(world, index, into);
      const row = element("div", "fallen");
      row.appendChild(element("span", "name", `${unitName(f.defId)} · ${cost} gold`));
      const raise = element("button", "small", "Resurrect");
      raise.disabled = !mayAct || problem !== null;
      raise.title = problem ?? `Returns at 1 HP ${home ? "to the warband here" : "to the garrison"}, with its track record. The price drops each turn you wait.`;
      raise.addEventListener("click", () => this.options.act({ type: "resurrect", index, into }));
      row.appendChild(raise);
      column.appendChild(row);
    });
    return column;
  }
}
