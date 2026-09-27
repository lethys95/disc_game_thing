import type { Tile } from "#rules/battle/types";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST } from "#rules/units/index";
import { CITY_ARMOR_PER_TIER, CITY_MAX_TIER, CITY_SLOTS, NODE_MAX_LEVEL } from "#rules/balance";
import { raisesDeadAt, cityUpgradeCost, elevateProblem, investNodeProblem, nodeInvestCost, recruitProblem, upgradeCityProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem } from "#rules/world/economy";
import { capacityOf, transferProblem } from "#rules/world/squads";
import { playerOf, cityById, leaderById, leaderUnit, nodesOf } from "#rules/world/state";
import { NODES } from "#rules/nodes";
import { CITY_RESURRECTION_PREMIUM } from "#rules/research";
import type { City, PlayerId, SquadMember, SquadRef, World, WorldAction } from "#rules/world/state";
import { button, element, gold, orderButton } from "#view/dom";
import { unitName } from "#view/members";
import { ResearchPanel } from "#view/research";
import { squadGrid } from "#view/squad-grid";
import { spellsTab } from "#view/spells";
import type { GridChoice, GridSquad } from "#view/squad-grid";
import { sameHex } from "#rules/hex";

/** What the screen shows: one of your cities (the Capitol included), or two of your warbands side by side. */
export type Place = { readonly kind: "city"; readonly cityId: string } | { readonly kind: "meet"; readonly a: string; readonly b: string };

export interface CityScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}


/** Placeholder city names until the user names them. */
export const cityName = (city: City): string => (city.kind === "capitol" ? "Capitol" : `City ${city.id.replace("city", "")}`);

/**
 * A city's screen (pillars.md, "Cities"): the *City* tab has the garrison and any visiting warband as grids to drag
 * units between; clicking an empty tile recruits (or resurrects, at the Capitol). The Capitol adds *Research*. The
 * same grids show two warbands that meet on the map.
 */
export class CityScreen {
  private tab: "city" | "research" | "spells" = "city";
  private selected: { ref: SquadRef; tile: Tile } | null = null;
  private shown: { world: World; side: PlayerId; place: Place; mayAct: boolean } | null = null;
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

  show(world: World, side: PlayerId, place: Place, mayAct: boolean): void {
    if (this.shown?.place.kind !== place.kind || JSON.stringify(this.shown.place) !== JSON.stringify(place)) this.tab = "city";
    this.shown = { world, side, place, mayAct };
    this.root.hidden = false;
    this.root.replaceChildren();
    const city = place.kind === "city" ? cityById(world, place.cityId) : undefined;

    const header = element("div", "capitol-header");
    header.append(element("div", "title", city ? cityName(city) : "Warbands meet"), gold(playerOf(world, side).gold, "purse"));
    if (city?.kind === "capitol") {
      const tabs = element("div", "tabs");
      for (const [id, label] of [["city", "City"], ["research", "Research"], ["spells", "Spells"]] as const) {
        tabs.appendChild(
          button(`action${this.tab === id ? " selected" : ""}`, label, () => {
            this.tab = id;
            this.rerender();
          }),
        );
      }
      header.appendChild(tabs);
    }
    header.appendChild(button("action", "Back to the map", () => this.options.close()));
    this.root.appendChild(header);

    if (this.tab === "research" && city?.kind === "capitol") {
      this.root.appendChild(this.research.render(world, side, mayAct));
      return;
    }
    if (this.tab === "spells" && city?.kind === "capitol") {
      this.root.appendChild(spellsTab(world, side, mayAct, this.options.act));
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
    for (const squad of squads) grids.appendChild(squadGrid(squad, this.gridOptions(world, side, city, mayAct)));
    grids.appendChild(element("div", "note", "Drag units between the grids; dropping on a unit swaps the two. Click an empty tile to recruit. Click a unit for its details."));
    body.appendChild(grids);
    if (city && raisesDeadAt(world, side, city)) body.appendChild(this.graveyard(world, side, city, mayAct));
    else if (city) body.appendChild(element("div", "note panel", "Resurrection here needs the Capitol's research (Research tab: Resurrection in cities)."));
    this.root.appendChild(body);
  }

  private rerender(): void {
    const shown = this.shown;
    if (shown && !this.root.hidden) this.show(shown.world, shown.side, shown.place, shown.mayAct);
  }

  private squads(world: World, side: PlayerId, place: Place): GridSquad[] {
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
    const visitor = world.leaders.find((l) => l.player === side && sameHex(l.hex, city.hex));
    return visitor ? [garrison, warband(visitor.id, `Visiting: ${leaderName(visitor.id)}'s warband`)] : [garrison];
  }

  /** `side`: the player whose screen this is (not whose turn: during the AI's turn it's still yours). */
  private gridOptions(world: World, side: PlayerId, city: City | undefined, mayAct: boolean) {
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
        const recruits = FACTION_ROOTS[playerOf(world, side).faction].map((defId) => ({
          label: `Recruit ${unitName(defId)} · ${RECRUIT_COST[defId] ?? 0} gold`,
          problem: recruitProblem(world, defId, ref, tile),
          run: () => this.options.act({ type: "recruit", defId, into: ref, tile }),
        }));
        const raised =
          city && raisesDeadAt(world, side, city)
            ? playerOf(world, side).graveyard.map((fallen, index) => ({
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
      const yields = NODES[node.kind].describe(node.level);
      const item = element("div", "node-item");
      item.append(element("div", "", `${def.name} · level ${node.level}`), element("div", "note", yields));
      if (node.level < NODE_MAX_LEVEL) {
        const problem = investNodeProblem(world, node.id);
        item.appendChild(
          orderButton("small", ["Invest · ", gold(nodeInvestCost(node))], {
            mayAct,
            problem,
            explain: `Level ${node.level + 1}: ${NODES[node.kind].describe(node.level + 1)}.`,
            give: () => this.options.act({ type: "investNode", nodeId: node.id }),
          }),
        );
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
      row.appendChild(
        orderButton("action small", [`Upgrade to tier ${next} · `, gold(cityUpgradeCost(city))], {
          mayAct,
          problem,
          explain: `Tier ${next}: ${CITY_SLOTS[next] ?? 0} garrison slots; the garrison and a warband defending here get +${CITY_ARMOR_PER_TIER * (next - 1)} armor.`,
          give: () => this.options.act({ type: "upgradeCity", cityId: city.id }),
        }),
      );
    } else row.appendChild(element("div", "note", "Fully upgraded."));
    return row;
  }

  /** The fallen: warband leaders to revive here, and units to resurrect by clicking an empty tile. */
  private graveyard(world: World, side: PlayerId, city: City, mayAct: boolean): HTMLElement {
    const column = element("div", "capitol-hall panel");
    column.appendChild(element("div", "section", city.kind === "capitol" ? "Graveyard" : `Graveyard (researched: resurrect here for ${Math.round((CITY_RESURRECTION_PREMIUM - 1) * 100)}% more)`));
    // Fallen leaders are revived at the Capitol only.
    const lost = city.kind === "capitol" ? world.leaders.filter((l) => l.player === side && l.fellOnTurn !== null) : [];
    for (const leader of lost) {
      const own = leaderUnit(leader);
      const problem = reviveProblem(world, leader.id);
      const row = element("div", "fallen");
      row.appendChild(element("span", "name", `♛ ${unitName(own?.defId ?? "")}, a warband's leader · ${reviveCost(world, leader) ?? 0} gold`));
      row.appendChild(
        orderButton("small", "Revive", {
          mayAct,
          problem,
          explain: "Returns at 1 HP and leads its warband again. The price drops each turn you wait.",
          give: () => this.options.act({ type: "revive", leaderId: leader.id }),
        }),
      );
      column.appendChild(row);
    }
    playerOf(world, side).graveyard.forEach((fallen, index) => {
      column.appendChild(element("div", "fallen", `${unitName(fallen.defId)} · ${resurrectionCost(world, side, index, city) ?? 0} gold`));
    });
    const empty = playerOf(world, side).graveyard.length === 0 && lost.length === 0;
    column.appendChild(element("div", "note", empty ? "Nobody has fallen yet." : "Resurrect by clicking an empty tile. The price drops each turn you wait."));
    return column;
  }
}
