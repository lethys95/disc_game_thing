import type { Tile } from "#rules/battle/types";
import { FACTION_ROOTS, GUARDIAN_ID } from "#rules/units/index";
import { CITY_HEALING_PER_TIER, CITY_MAX_TIER, CITY_SLOTS, NODE_MAX_LEVEL } from "#rules/balance";
import { raisesDeadAt, cityUpgradeCost, elevateProblem, investNodeProblem, nodeInvestCost, recruitCost, recruitProblem, upgradeCityProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem } from "#rules/world/economy";
import { capacityOf, transferProblem } from "#rules/world/squads";
import { member, playerOf, wallArmorOf, cityById, leaderById, leaderUnit, nodesOf, tribeRecruitsOf } from "#rules/world/state";
import { NODES } from "#rules/nodes";
import { CITY_RESURRECTION_PREMIUM } from "#rules/research";
import type { City, PlayerId, SquadMember, SquadRef, World, WorldAction } from "#rules/world/state";
import { button, element, gold, mana, orderButton, roman } from "#view/dom";
import { FACTIONS } from "#rules/factions";
import { explain } from "#view/explain";
import { unitName } from "#view/members";
import { ResearchPanel } from "#view/research";
import { FALLEN_DRAG, squadGrid } from "#view/squad-grid";
import { squadTile } from "#view/squad-tile";
import { spellsTab } from "#view/spells";
import { tabFrame } from "#view/frames";
import { closeDialog } from "#view/dialog";
import { warbandColumn } from "#view/warband-column";
import type { GridChoice, GridSquad, RecruitChoice } from "#view/squad-grid";
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


const GRID_HINT = "Drag units between the grids; dropping on a unit swaps the two. Click an empty place to recruit. Hold right-click on a unit for its sheet.";

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
    this.research = new ResearchPanel(root, options.act, () => this.rerender());
  }

  open(): boolean {
    return !this.root.hidden;
  }

  /** Escape closes the screen. */
  key(e: KeyboardEvent): boolean {
    if (e.key !== "Escape") return false;
    // Escape closes an open dialog first, then the screen.
    if (!closeDialog(this.root)) this.options.close();
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

    // A city's screen has its column at the right edge (the map column's sibling); a meeting of warbands, the first
    // warband's column and both grids in the frame.
    if (city) {
      this.root.appendChild(this.window(world, city, tab));
      this.root.appendChild(this.column(world, side, city, tab));
    } else if (place.kind === "meet") {
      this.root.append(warbandColumn(world, leaderById(world, place.a), [], () => undefined, () => this.options.close()), tabFrame("Warbands meet", this.garrison(world, side, place, city, mayAct), null));
      return;
    }

    const layout = element("div", "city-layout");
    const content = element("div", "city-content");
    layout.appendChild(content);
    this.root.appendChild(layout);

    if (tab === "home" && city) return;
    if (tab === "research") {
      const research = this.research.render(world, side, mayAct);
      content.appendChild(tabFrame(TABS.research.label, research.body, research.tabs));
    }
    else if (tab === "spells") content.appendChild(tabFrame(TABS.spells.label, spellsTab(world, side, mayAct, this.options.act), null));
    else content.appendChild(this.garrison(world, side, place, city, mayAct));
  }

  /**
   * The column at the right edge, in the map column's place (`docs/design/capitol-elements.md`): which city and the purse
   * at its top, the tabs as labelled rows (a city shows only the tabs it has), Back to the map at its foot. A greybox in
   * flat values until the layout is judged.
   */
  private column(world: World, side: PlayerId, city: City, current: CityTab): HTMLElement {
    const column = element("div", "screen-column");
    column.appendChild(element("div", "plate name", cityName(city)));
    const player = playerOf(world, side);
    const purse = explain(element("div", "plate purse"), "Gold", "What your realm holds. Everything here is paid in it.");
    purse.appendChild(gold(player.gold));
    const reserve = explain(element("div", "plate mana-plate"), "Mana", "What your spells are cast with, on the map.");
    reserve.appendChild(mana(player.mana, FACTIONS[player.faction].accent));
    const purses = element("div", "purses");
    purses.append(purse, reserve);
    column.appendChild(purses);
    const tabs = element("div", "tabs");
    for (const [id, tab] of Object.entries(TABS)) {
      if (!isCityTab(id) || (tab.capitolOnly && city.kind !== "capitol")) continue;
      const row = button(`tab ${id}${id === current ? " selected" : ""}`, [element("span", `glyph icon-${tab.icon}`), element("span", "label", tab.label)], () => {
        this.tab = id;
        this.rerender();
      });
      tabs.appendChild(row);
    }
    column.appendChild(tabs);
    column.appendChild(explain(button("back", "Back to the map", () => this.options.close()), "Back to the map", "Escape does the same."));
    return column;
  }

  /**
   * The city itself, the world in the window behind every tab: a painting of it from the inside (`assets/city/`),
   * drifting slowly, standing in for the montage the user wants (`docs/design/capitol-screen.md`). Its edges are the
   * screen's and the column's; it has no frame of its own.
   */
  private window(world: World, city: City, tab: CityTab): HTMLElement {
    const owner = city.owner === null ? null : playerOf(world, city.owner).faction;
    const painting = cityViewUrl(city.kind === "capitol" ? MODEL_CHAINS.capitol(owner) : MODEL_CHAINS.city());
    const scene = element("div", `city-scene${tab === "home" ? "" : " behind"}`);
    const canvas = element("div", "city-painting");
    if (painting) canvas.style.backgroundImage = `url("${painting}")`;
    scene.appendChild(canvas);
    return scene;
  }

  private garrison(world: World, side: PlayerId, place: Place, city: City | undefined, mayAct: boolean): HTMLElement {
    if (city) return this.garrisonWall(world, side, place, city, mayAct);
    const body = element("div", "city-body");
    const grids = element("div", "grids");
    for (const squad of this.squads(world, side, place)) grids.appendChild(squadGrid(squad, this.gridOptions(world, side, city, mayAct)));
    grids.appendChild(element("div", "note", GRID_HINT));
    body.appendChild(grids);
    return body;
  }

  /**
   * A city's garrison (`docs/design/capitol-elements.md`): the garrison and a warband standing in the city side by side,
   * the heart of the screen; the city's growth (its tier, its nodes) beside them; the fallen under them, only when there
   * are any; the selected unit's orders under its grid; the hint line at the foot. A greybox in flat values.
   */
  private garrisonWall(world: World, side: PlayerId, place: Place, city: City, mayAct: boolean): HTMLElement {
    const board = element("div", "garrison-board");
    const squads = element("div", "squads");
    for (const squad of this.squads(world, side, place)) squads.appendChild(squadGrid(squad, this.gridOptions(world, side, city, mayAct)));
    if (squads.childElementCount === 1) {
      const vacant = element("div", "squad-grid vacant");
      vacant.append(element("div", "section", "No warband here"), element("div", "grid"));
      squads.appendChild(vacant);
    }
    const main = element("div", "main");
    main.appendChild(squads);
    const fallen = this.graveyard(world, side, city, mayAct);
    if (fallen) main.appendChild(fallen);
    main.appendChild(element("div", "hint", GRID_HINT));
    board.append(main, this.growth(world, city, mayAct));
    return board;
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
    return visitor ? [garrison, warband(visitor.id, `${leaderName(visitor.id)}'s warband`)] : [garrison];
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
      recruits: (ref: SquadRef, tile: Tile): RecruitChoice[] =>
        // The faction's own first tiers, then what a Tribal outpost offers here.
        [...FACTION_ROOTS[playerOf(world, side).faction], ...(city ? tribeRecruitsOf(world, city) : [])].map((defId) => ({
          defId,
          price: recruitCost(defId) ?? 0,
          problem: recruitProblem(world, defId, ref, tile),
          run: () => this.options.act({ type: "recruit", defId, into: ref, tile }),
        })),
      raise:
        city && raisesDeadAt(world, side, city)
          ? {
              problem: (index: number, to: SquadRef, tile: Tile) => resurrectProblem(world, index, to, tile),
              run: (index: number, to: SquadRef, tile: Tile) => this.options.act({ type: "resurrect", index, into: to, tile }),
            }
          : null,
      unitChoices: (ref: SquadRef, member: SquadMember): GridChoice[] =>
        ref.kind === "garrison" && city?.kind === "capitol" && member.defId !== GUARDIAN_ID
          ? [{ label: "Elevate to leader", problem: elevateProblem(world, member.tile), run: () => this.options.act({ type: "elevate", tile: member.tile }) }]
          : [],
    };
  }

  /**
   * How the city grows: its tier with what it gives and the next tier's price, then every node that feeds it (the nearest
   * city owns a node) with what it yields and its Invest. A list, so a city with many nodes fits.
   */
  private growth(world: World, city: City, mayAct: boolean): HTMLElement {
    const panel = element("div", "growth");
    panel.appendChild(element("div", "section", "The city"));
    const tier = element("div", "row tier");
    const armor = wallArmorOf(world, city);
    tier.append(element("div", "name", `Tier ${roman(city.tier)}`), element("div", "note", `${CITY_SLOTS[city.tier] ?? 0} places · defenders +${armor} armor · heals ${Math.round(CITY_HEALING_PER_TIER * city.tier * 100)}% a turn`));
    if (city.tier < CITY_MAX_TIER) {
      const next = city.tier + 1;
      tier.appendChild(
        orderButton("order", [`Tier ${roman(next)} · `, gold(cityUpgradeCost(world, city))], {
          mayAct,
          problem: upgradeCityProblem(world, city.id),
          explain: `Tier ${next}: ${CITY_SLOTS[next] ?? 0} places; defenders get +${wallArmorOf(world, city, next)} armor; units resting here heal ${Math.round(CITY_HEALING_PER_TIER * next * 100)}% a turn.`,
          give: () => this.options.act({ type: "upgradeCity", cityId: city.id }),
        }),
      );
    } else tier.appendChild(element("div", "note done", "Highest tier"));
    panel.appendChild(tier);
    panel.appendChild(element("div", "section", "Nodes"));
    const owned = nodesOf(world, city);
    if (owned.length === 0) panel.appendChild(element("div", "note", "No nodes feed this city."));
    for (const node of owned) {
      const def = NODES[node.kind];
      const row = element("div", "row node");
      row.append(element("div", "name", `${def.name} ${roman(node.level)}`), element("div", "note", def.describe(node.level)));
      if (node.level < NODE_MAX_LEVEL) {
        row.appendChild(
          orderButton("order", ["Invest · ", gold(nodeInvestCost(node))], {
            mayAct,
            problem: investNodeProblem(world, node.id),
            explain: `${def.name} ${roman(node.level + 1)}: ${def.describe(node.level + 1)}.`,
            give: () => this.options.act({ type: "investNode", nodeId: node.id }),
          }),
        );
      } else row.appendChild(element("div", "note done", "Highest level"));
      panel.appendChild(row);
    }
    return panel;
  }

  /**
   * The fallen, only when there are any: each a greyed tile with its price, dragged onto an empty place to raise it, as
   * units are dragged between the grids; fallen leaders revived at the Capitol with a button. A city without the
   * Capitol's research shows them but can't raise them.
   */
  private graveyard(world: World, side: PlayerId, city: City, mayAct: boolean): HTMLElement | null {
    const lost = city.kind === "capitol" ? world.leaders.filter((l) => l.player === side && l.fellOnTurn !== null) : [];
    const dead = playerOf(world, side).graveyard;
    if (lost.length === 0 && dead.length === 0) return null;
    const raises = raisesDeadAt(world, side, city);
    const strip = element("div", "graveyard");
    const note = raises
      ? `Drag one onto an empty place to raise it. The price drops each turn you wait.${city.kind === "capitol" ? "" : ` Here it costs ${Math.round((CITY_RESURRECTION_PREMIUM - 1) * 100)}% more.`}`
      : "Raising the fallen here needs the Capitol's research (Resurrection in cities).";
    strip.append(element("div", "section", "The fallen"), element("div", "note", note));
    const row = element("div", "fallen-row");
    for (const leader of lost) {
      const own = leaderUnit(leader);
      const item = element("div", "fallen leader");
      item.append(squadTile(own ? { ...own, hp: 0 } : undefined, leader));
      item.appendChild(
        orderButton("order", ["Revive · ", gold(reviveCost(world, leader) ?? 0)], {
          mayAct,
          problem: reviveProblem(world, leader.id),
          explain: "Returns at 1 HP and leads its warband again. The price drops each turn you wait.",
          give: () => this.options.act({ type: "revive", leaderId: leader.id }),
        }),
      );
      row.appendChild(item);
    }
    dead.forEach((one, index) => {
      const item = element("div", "fallen");
      const tile = squadTile({ ...member(one.defId, { row: 0, col: 0 }), level: one.level, hp: 0 }, undefined);
      tile.draggable = mayAct && raises;
      tile.addEventListener("dragstart", (e) => {
        e.dataTransfer?.setData(FALLEN_DRAG, String(index));
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      });
      item.append(tile, element("div", "price", raises ? "" : "—"));
      if (raises) item.lastElementChild?.appendChild(gold(resurrectionCost(world, side, index, city) ?? 0));
      row.appendChild(item);
    });
    strip.appendChild(row);
    return strip;
  }
}
