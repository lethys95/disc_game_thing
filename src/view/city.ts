import type { Side, Tile } from "#rules/battle/types";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST } from "#rules/units/index";
import { BLACKSMITH_BONUS, CITY_ARMOR_PER_TIER, CITY_MAX_TIER, CITY_SLOTS, NODE_MAX_LEVEL } from "#rules/balance";
import { cityUpgradeCost, elevateProblem, investNodeProblem, nodeInvestCost, recruitProblem, upgradeCityProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem } from "#rules/world/economy";
import { capacityOf, transferProblem } from "#rules/world/squads";
import { cityById, leaderById, leaderUnit, nodesOf } from "#rules/world/state";
import { NODES } from "#rules/nodes";
import type { City, SquadMember, SquadRef, World, WorldAction } from "#rules/world/state";
import { element, gold } from "#view/dom";
import { unitName } from "#view/members";
import { ResearchPanel } from "#view/research";
import { squadGrid } from "#view/squad-grid";
import type { GridChoice, GridSquad } from "#view/squad-grid";
import { sameHex } from "#rules/hex";

/** What the screen shows: one of your cities (the Capitol included), or two of your warbands side by side. */
export type Place = { readonly kind: "city"; readonly cityId: string } | { readonly kind: "meet"; readonly a: string; readonly b: string };

export interface CityScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

/** Whether the dead can be raised in this city: at the Capitol, or anywhere once researched. */
const raisesHere = (world: World, city: City): boolean => city.kind === "capitol" || world.research[world.activeSide].includes("city_resurrection");

/** Placeholder city names until the user names them. */
export const cityName = (city: City): string => (city.kind === "capitol" ? "Capitol" : `City ${city.id.replace("city", "")}`);

/**
 * A city's screen (pillars.md, "Cities"): the *City* tab has the garrison and any visiting warband as grids to drag
 * units between; clicking an empty tile recruits (or resurrects, at the Capitol). The Capitol adds *Research*. The
 * same grids show two warbands that meet on the map.
 */
export class CityScreen {
  private tab: "city" | "research" = "city";
  private selected: { ref: SquadRef; tile: Tile } | null = null;
  private shown: { world: World; side: Side; place: Place; mayAct: boolean } | null = null;
  private readonly research: ResearchPanel;

  constructor(
    private readonly root: HTMLElement,
    private readonly options: CityScreenOptions,
  ) {
    this.research = new ResearchPanel(options.act, () => this.rerender());
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.root.hidden) options.close();
    });
  }

  hide(): void {
    this.root.hidden = true;
    this.selected = null;
  }

  show(world: World, side: Side, place: Place, mayAct: boolean): void {
    if (this.shown?.place.kind !== place.kind || JSON.stringify(this.shown.place) !== JSON.stringify(place)) this.tab = "city";
    this.shown = { world, side, place, mayAct };
    this.root.hidden = false;
    this.root.replaceChildren();
    const city = place.kind === "city" ? cityById(world, place.cityId) : undefined;

    const header = element("div", "capitol-header");
    header.append(element("div", "title", city ? `Your ${cityName(city)}` : "Warbands meet"), gold(world.gold[side], "purse"));
    if (city?.kind === "capitol") {
      const tabs = element("div", "tabs");
      for (const [id, label] of [["city", "City"], ["research", "Research"]] as const) {
        const button = element("button", `action${this.tab === id ? " selected" : ""}`, label);
        button.addEventListener("click", () => {
          this.tab = id;
          this.rerender();
        });
        tabs.appendChild(button);
      }
      header.appendChild(tabs);
    }
    const back = element("button", "action", "Back to the map");
    back.addEventListener("click", () => this.options.close());
    header.appendChild(back);
    this.root.appendChild(header);

    if (this.tab === "research" && city?.kind === "capitol") {
      this.root.appendChild(this.research.render(world, side, mayAct));
      return;
    }
    const body = element("div", "city-body");
    if (city) {
      const head = element("div", "city-head");
      head.appendChild(this.fortifications(world, city, mayAct));
      if (nodesOf(world, city).length > 0) head.appendChild(this.nodes(world, city, mayAct));
      body.appendChild(head);
    }
    const squads = this.squads(world, side, place);
    const grids = element("div", "grids panel");
    for (const squad of squads) grids.appendChild(squadGrid(squad, this.gridOptions(world, city, mayAct)));
    grids.appendChild(element("div", "note", "Drag units between the grids; dropping on a unit swaps the two. Click an empty tile to recruit. Click a unit for its details."));
    body.appendChild(grids);
    if (city && raisesHere(world, city)) body.appendChild(this.graveyard(world, side, city, mayAct));
    this.root.appendChild(body);
  }

  private rerender(): void {
    const shown = this.shown;
    if (shown && !this.root.hidden) this.show(shown.world, shown.side, shown.place, shown.mayAct);
  }

  private squads(world: World, side: Side, place: Place): GridSquad[] {
    const warband = (leaderId: string, title: string): GridSquad => {
      const leader = leaderById(world, leaderId);
      const ref: SquadRef = { kind: "warband", leaderId };
      return { ref, title, squad: leader.squad, leader, capacity: capacityOf(world, ref) };
    };
    const leaderName = (id: string) => unitName(leaderUnit(leaderById(world, id))?.defId ?? "");
    if (place.kind === "meet") return [warband(place.a, `${leaderName(place.a)}'s warband`), warband(place.b, `${leaderName(place.b)}'s warband`)];
    const city = cityById(world, place.cityId);
    const ref: SquadRef = { kind: "garrison", cityId: city.id };
    const garrison: GridSquad = { ref, title: "Garrison", squad: city.garrison, leader: undefined, capacity: capacityOf(world, ref) };
    const visitor = world.leaders.find((l) => l.side === side && sameHex(l.hex, city.hex));
    return visitor ? [garrison, warband(visitor.id, `Visiting: ${leaderName(visitor.id)}'s warband`)] : [garrison];
  }

  private gridOptions(world: World, city: City | undefined, mayAct: boolean) {
    const side = world.activeSide;
    return {
      mayAct,
      selected: this.selected,
      select: (selection: { ref: SquadRef; tile: Tile } | null) => {
        this.selected = selection;
        this.rerender();
      },
      moveProblem: (from: SquadRef, fromTile: Tile, to: SquadRef, toTile: Tile) => transferProblem(world, { from, fromTile, to, toTile }),
      move: (from: SquadRef, fromTile: Tile, to: SquadRef, toTile: Tile) => {
        this.selected = null;
        this.options.act({ type: "transfer", from, fromTile, to, toTile });
      },
      emptyChoices: (ref: SquadRef, tile: Tile): GridChoice[] => {
        const recruits = FACTION_ROOTS[world.factions[side]].map((defId) => ({
          label: `Recruit ${unitName(defId)} · ${RECRUIT_COST[defId] ?? 0} gold`,
          problem: recruitProblem(world, defId, ref, tile),
          run: () => this.options.act({ type: "recruit", defId, into: ref, tile }),
        }));
        const raised =
          city && raisesHere(world, city)
            ? world.graveyard[side].map((fallen, index) => ({
                label: `Resurrect ${unitName(fallen.defId)} · ${resurrectionCost(world, side, index, city) ?? 0} gold`,
                problem: resurrectProblem(world, index, ref, tile),
                run: () => this.options.act({ type: "resurrect", index, into: ref, tile }),
              }))
            : [];
        return [...recruits, ...raised];
      },
      unitChoices: (ref: SquadRef, member: SquadMember): GridChoice[] =>
        ref.kind === "garrison" && city?.kind === "capitol" && member.defId !== GUARDIAN_ID
          ? [{ label: "Elevate to leader", problem: elevateProblem(world, member.tile), run: () => this.options.act({ type: "elevate", tile: member.tile }) }]
          : [],
    };
  }

  /** The nodes that feed this city (the nearest city owns a node), and investing in them. */
  private nodes(world: World, city: City, mayAct: boolean): HTMLElement {
    const row = element("div", "fortifications nodes panel");
    row.appendChild(element("div", "name", "Nodes"));
    for (const node of nodesOf(world, city)) {
      const def = NODES[node.kind];
      const yields = node.kind === "gold" ? `+${def.income(node.level)} gold per turn` : `+${BLACKSMITH_BONUS * node.level} ability damage in your battles`;
      const item = element("div", "node-item");
      item.append(element("div", "", `${def.name} · level ${node.level}`), element("div", "note", yields));
      if (node.level < NODE_MAX_LEVEL) {
        const problem = investNodeProblem(world, node.id);
        const invest = element("button", "small");
        invest.append(`Invest · `, gold(nodeInvestCost(node)));
        invest.disabled = !mayAct || problem !== null;
        invest.title = problem ?? `Level ${node.level + 1}: ${node.kind === "gold" ? `+${def.income(node.level + 1)} gold per turn` : `+${BLACKSMITH_BONUS * (node.level + 1)} ability damage`}.`;
        invest.addEventListener("click", () => this.options.act({ type: "investNode", nodeId: node.id }));
        item.appendChild(invest);
      }
      row.appendChild(item);
    }
    return row;
  }

  /** The city's tier and its upgrade. */
  private fortifications(world: World, city: City, mayAct: boolean): HTMLElement {
    const row = element("div", "fortifications panel");
    const armor = CITY_ARMOR_PER_TIER * (city.tier - 1);
    row.append(element("div", "name", `Tier ${city.tier}`), element("div", "note", `${CITY_SLOTS[city.tier] ?? 0} garrison slots · defenders +${armor} armor`));
    if (city.tier < CITY_MAX_TIER) {
      const next = city.tier + 1;
      const problem = upgradeCityProblem(world, city.id);
      const upgrade = element("button", "action small");
      upgrade.append(`Upgrade to tier ${next} · `, gold(cityUpgradeCost(city)));
      upgrade.disabled = !mayAct || problem !== null;
      upgrade.title = problem ?? `Tier ${next}: ${CITY_SLOTS[next] ?? 0} garrison slots; the garrison and a warband defending here get +${CITY_ARMOR_PER_TIER * (next - 1)} armor.`;
      upgrade.addEventListener("click", () => this.options.act({ type: "upgradeCity", cityId: city.id }));
      row.appendChild(upgrade);
    } else row.appendChild(element("div", "note", "Fully upgraded."));
    return row;
  }

  /** The fallen: warband leaders to revive here, and units to resurrect by clicking an empty tile. */
  private graveyard(world: World, side: Side, city: City, mayAct: boolean): HTMLElement {
    const column = element("div", "capitol-hall panel");
    column.appendChild(element("div", "section", "Graveyard"));
    // Fallen leaders are revived at the Capitol only.
    const lost = city.kind === "capitol" ? world.leaders.filter((l) => l.side === side && l.fellOnTurn !== null) : [];
    for (const leader of lost) {
      const own = leaderUnit(leader);
      const problem = reviveProblem(world, leader.id);
      const row = element("div", "fallen");
      row.appendChild(element("span", "name", `♛ ${unitName(own?.defId ?? "")}, a warband's leader · ${reviveCost(world, leader) ?? 0} gold`));
      const revive = element("button", "small", "Revive");
      revive.disabled = !mayAct || problem !== null;
      revive.title = problem ?? "Returns at 1 HP and leads its warband again. The price drops each turn you wait.";
      revive.addEventListener("click", () => this.options.act({ type: "revive", leaderId: leader.id }));
      row.appendChild(revive);
      column.appendChild(row);
    }
    world.graveyard[side].forEach((fallen, index) => {
      column.appendChild(element("div", "fallen", `${unitName(fallen.defId)} · ${resurrectionCost(world, side, index, city) ?? 0} gold`));
    });
    const empty = world.graveyard[side].length === 0 && lost.length === 0;
    column.appendChild(element("div", "note", empty ? "Nobody has fallen yet." : "Resurrect by clicking an empty tile. The price drops each turn you wait."));
    return column;
  }
}
