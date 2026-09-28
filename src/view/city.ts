import type { Tile } from "#rules/battle/types";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST } from "#rules/units/index";
import { CITY_ARMOR_PER_TIER, CITY_HEALING_PER_TIER, CITY_MAX_TIER, CITY_SLOTS, NODE_MAX_LEVEL } from "#rules/balance";
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
import type { KeyLayer } from "#view/input";
import { cityViewUrl } from "#view/art";
import { MODEL_CHAINS } from "#view/models";

/** What the screen shows: one of your cities (the Capitol included), or two of your warbands side by side. */
export type Place = { readonly kind: "city"; readonly cityId: string } | { readonly kind: "meet"; readonly a: string; readonly b: string };

export interface CityScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

type CityTab = "home" | "garrison" | "research" | "spells";

/** The tab rail (user, 2026-09-27: a neat tab menu on the right, as in a strategy game); glyphs are placeholders. */
const TABS: Readonly<Record<CityTab, { readonly label: string; readonly glyph: string; readonly icon: string; readonly capitolOnly: boolean }>> = {
  home: { label: "City", glyph: "⌂", icon: "city", capitolOnly: false },
  garrison: { label: "Garrison", glyph: "⚔", icon: "garrison", capitolOnly: false },
  research: { label: "Research", glyph: "✦", icon: "research", capitolOnly: true },
  spells: { label: "Spells", glyph: "✧", icon: "spells", capitolOnly: true },
};


const isCityTab = (key: string): key is CityTab => key in TABS;

/** Placeholder city names until the user names them. */
export const cityName = (city: City): string => (city.kind === "capitol" ? "Capitol" : `City ${city.id.replace("city", "")}`);

/**
 * A city's screen (pillars.md, "Cities"; the user's layout, `design/capitol-screen.md`): it opens on the city itself
 * (the camera close on it), with a tab rail on the right. *Garrison* has the garrison and any visiting warband as
 * grids to drag units between (clicking an empty tile recruits or resurrects) and the graveyard; the Capitol adds
 * *Research* and *Spells*. The same grids, without the rail, show two warbands that meet on the map.
 */
export class CityScreen implements KeyLayer {
  private tab: CityTab = "home";
  private selected: { ref: SquadRef; tile: Tile } | null = null;
  private shown: { world: World; side: PlayerId; place: Place; mayAct: boolean } | null = null;
  private readonly research: ResearchPanel;

  constructor(
    private readonly root: HTMLElement,
    private readonly options: CityScreenOptions,
  ) {
    this.research = new ResearchPanel(options.act, () => this.rerender());
  }

  open(): boolean {
    return !this.root.hidden;
  }

  /** Escape closes the screen. */
  key(e: KeyboardEvent): boolean {
    if (e.key !== "Escape") return false;
    this.options.close();
    return true;
  }

  /** Shows a tab by name, if the screen has it. */
  openTab(name: string): void {
    if (!isCityTab(name)) return;
    this.tab = name;
    this.rerender();
  }

  hide(): void {
    this.root.hidden = true;
    this.selected = null;
  }

  show(world: World, side: PlayerId, place: Place, mayAct: boolean): void {
    if (this.shown?.place.kind !== place.kind || JSON.stringify(this.shown.place) !== JSON.stringify(place)) this.tab = "home";
    this.shown = { world, side, place, mayAct };
    this.root.hidden = false;
    this.root.replaceChildren();
    const city = place.kind === "city" ? cityById(world, place.cityId) : undefined;
    const tab: CityTab = city ? (TABS[this.tab].capitolOnly && city.kind !== "capitol" ? "home" : this.tab) : "garrison";

    const header = element("div", "capitol-header");
    header.append(element("div", "title", city ? cityName(city) : "Warbands meet"), gold(playerOf(world, side).gold, "purse"));
    header.appendChild(button("action", "Back to the map", () => this.options.close()));
    this.root.appendChild(header);

    const layout = element("div", "city-layout");
    const content = element("div", "city-content");
    layout.appendChild(content);
    if (city) layout.appendChild(this.rail(world, side, city, tab));
    this.root.appendChild(layout);

    if (tab === "home" && city) content.appendChild(this.home(world, city));
    else if (tab === "research") content.appendChild(this.research.render(world, side, mayAct));
    else if (tab === "spells") content.appendChild(spellsTab(world, side, mayAct, this.options.act));
    else content.appendChild(this.garrison(world, side, place, city, mayAct));
  }

  /**
   * The right-hand column (the user's reference: Disciples II's city panel): the tabs as medallions, and what matters
   * about the city at a glance on marble plaques below them, whatever the tab.
   */
  private rail(world: World, side: PlayerId, city: City, current: CityTab): HTMLElement {
    const rail = element("div", "tab-rail panel");
    const tabs = element("div", "rail-tabs");
    for (const [id, tab] of Object.entries(TABS)) {
      if (!isCityTab(id) || (tab.capitolOnly && city.kind !== "capitol")) continue;
      const tile = button(`rail-tab${id === current ? " selected" : ""}`, [element("span", `glyph icon-${tab.icon}`, tab.glyph), element("span", "label", tab.label)], () => {
        this.tab = id;
        this.rerender();
      });
      tabs.appendChild(tile);
    }
    rail.appendChild(tabs);
    const defenders = city.garrison.filter((m) => m.defId !== GUARDIAN_ID).length;
    const visitor = world.leaders.find((l) => l.player === side && sameHex(l.hex, city.hex));
    const facts = [
      `Tier ${city.tier}`,
      `Heals ${Math.round(CITY_HEALING_PER_TIER * city.tier * 100)}% a turn`,
      `Defenders +${CITY_ARMOR_PER_TIER * (city.tier - 1)} armor`,
      `${defenders} in the garrison${city.kind === "capitol" ? " + Guardian" : ""}`,
      visitor ? `${unitName(leaderUnit(visitor)?.defId ?? "")}'s warband here` : "No warband visiting",
      ...nodesOf(world, city).map((n) => `${NODES[n.kind].name} ${n.level}`),
    ];
    const plaques = element("div", "rail-facts");
    for (const fact of facts) plaques.appendChild(element("div", "fact", fact));
    rail.appendChild(plaques);
    return rail;
  }

  /**
   * The city itself, in a frame: a painting of it from the inside (`assets/city/`), drifting slowly, standing in for
   * the montage the user wants (`docs/design/capitol-screen.md`).
   */
  private home(world: World, city: City): HTMLElement {
    const view = element("div", "city-view panel");
    const owner = city.owner === null ? null : playerOf(world, city.owner).faction;
    const painting = cityViewUrl(city.kind === "capitol" ? MODEL_CHAINS.capitol(owner) : MODEL_CHAINS.city());
    const scene = element("div", "city-scene");
    if (painting) scene.style.backgroundImage = `url("${painting}")`;
    view.appendChild(scene);
    return view;
  }

  private garrison(world: World, side: PlayerId, place: Place, city: City | undefined, mayAct: boolean): HTMLElement {
    const body = element("div", "city-body");
    if (city) {
      const head = element("div", "city-head");
      head.appendChild(this.fortifications(world, city, mayAct));
      if (nodesOf(world, city).length > 0) head.appendChild(this.nodes(world, city, mayAct));
      body.appendChild(head);
    }
    const grids = element("div", "grids panel");
    for (const squad of this.squads(world, side, place)) grids.appendChild(squadGrid(squad, this.gridOptions(world, side, city, mayAct)));
    grids.appendChild(element("div", "note", "Drag units between the grids; dropping on a unit swaps the two. Click an empty tile to recruit. Click a unit for its details."));
    body.appendChild(grids);
    if (city && raisesDeadAt(world, side, city)) body.appendChild(this.graveyard(world, side, city, mayAct));
    else if (city) body.appendChild(element("div", "note panel", "Resurrection here needs the Capitol's research (Research tab: Resurrection in cities)."));
    return body;
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
    row.append(element("div", "name", `Tier ${city.tier}`), element("div", "note", `${CITY_SLOTS[city.tier] ?? 0} garrison slots · defenders +${armor} armor · heals ${Math.round(CITY_HEALING_PER_TIER * city.tier * 100)}% a turn`));
    if (city.tier < CITY_MAX_TIER) {
      const next = city.tier + 1;
      const problem = upgradeCityProblem(world, city.id);
      row.appendChild(
        orderButton("action small", [`Upgrade to tier ${next} · `, gold(cityUpgradeCost(city))], {
          mayAct,
          problem,
          explain: `Tier ${next}: ${CITY_SLOTS[next] ?? 0} garrison slots; the garrison and a warband defending here get +${CITY_ARMOR_PER_TIER * (next - 1)} armor; units resting here heal ${Math.round(CITY_HEALING_PER_TIER * next * 100)}% a turn.`,
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
