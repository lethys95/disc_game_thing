import type { Tile } from "#rules/battle/types";
import { FACTION_ROOTS, GUARDIAN_ID } from "#rules/units/index";
import { CITY_ARMOR_PER_TIER, CITY_HEALING_PER_TIER, CITY_MAX_TIER, CITY_SLOTS, NODE_MAX_LEVEL } from "#rules/balance";
import { raisesDeadAt, cityUpgradeCost, elevateProblem, investNodeProblem, nodeInvestCost, recruitCost, recruitProblem, upgradeCityProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem } from "#rules/world/economy";
import { capacityOf, transferProblem } from "#rules/world/squads";
import { playerOf, cityById, leaderById, leaderUnit, nodesOf, tribeRecruitsOf } from "#rules/world/state";
import { NODES } from "#rules/nodes";
import { CITY_RESURRECTION_PREMIUM } from "#rules/research";
import type { City, PlayerId, SquadMember, SquadRef, World, WorldAction } from "#rules/world/state";
import { button, element, gold, orderButton, roman } from "#view/dom";
import { explain } from "#view/explain";
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


const GRID_HINT = "Drag units between the grids; dropping on a unit swaps the two. Click an empty tile to recruit. Click a unit for its details.";

const isCityTab = (key: string): key is CityTab => key in TABS;

/** Placeholder city names until the user names them. */
export const cityName = (city: City): string => (city.kind === "capitol" ? "Capitol" : `City ${city.id.replace("city", "")}`);

/** The city's tier, in the beam's medallion: its one number. */
function tierMedallion(city: City): HTMLElement {
  return explain(
    element("div", "medallion", roman(city.tier)),
    `Tier ${city.tier}`,
    `${CITY_SLOTS[city.tier] ?? 0} garrison slots · heals ${Math.round(CITY_HEALING_PER_TIER * city.tier * 100)}% a turn · defenders +${CITY_ARMOR_PER_TIER * (city.tier - 1)} armor`,
  );
}

/**
 * The painted frame the Research and Spells tabs fill (assets/ui/capitol/tab.webp, the hud-paint-in skill): the tab's
 * name on the marble plate, its content scrolling in the dark field.
 */
function tabFrame(title: string, body: HTMLElement): HTMLElement {
  const frame = element("div", "tab-frame");
  const field = element("div", "field");
  field.appendChild(body);
  frame.append(element("div", "title", title), field);
  return frame;
}

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

    // A city's screen has its column at the right edge (the map column's sibling); a meeting of warbands, a header.
    if (city) {
      this.root.appendChild(this.window(world, city, tab));
      this.root.appendChild(this.column(world, side, city, tab));
    } else {
      const header = element("div", "capitol-header");
      header.append(element("div", "title", "Warbands meet"), gold(playerOf(world, side).gold, "purse"));
      header.appendChild(button("action", "Back to the map", () => this.options.close()));
      this.root.appendChild(header);
    }

    const layout = element("div", "city-layout");
    const content = element("div", "city-content");
    layout.appendChild(content);
    this.root.appendChild(layout);

    if (tab === "home" && city) return;
    if (tab === "research") content.appendChild(tabFrame(TABS.research.label, this.research.render(world, side, mayAct)));
    else if (tab === "spells") content.appendChild(tabFrame(TABS.spells.label, spellsTab(world, side, mayAct, this.options.act)));
    else content.appendChild(this.garrison(world, side, place, city, mayAct));
  }

  /**
   * The column at the right edge (assets/ui/capitol/column.webp, the hud-paint-in skill; Disciples II's capital keeps
   * the map's column with its compartments swapped): the city's name, the purse and the tier, the four tabs in their
   * niches (the open one lit; one the city lacks stays dark), three facts, and Back to the map as the seal the mason and
   * the abbess hold.
   */
  private column(world: World, side: PlayerId, city: City, current: CityTab): HTMLElement {
    const column = element("div", "city-column");
    column.appendChild(element("div", "plate name", cityName(city)));
    column.appendChild(explain(element("div", "plate purse"), "Gold", "What your realm holds."));
    column.lastElementChild?.appendChild(gold(playerOf(world, side).gold));
    const tier = tierMedallion(city);
    tier.className = "plate tier";
    tier.textContent = `Tier ${roman(city.tier)}`;
    column.appendChild(tier);
    for (const [id, tab] of Object.entries(TABS)) {
      if (!isCityTab(id)) continue;
      const held = !tab.capitolOnly || city.kind === "capitol";
      const niche = button(`niche ${id}${id === current ? " selected" : ""}`, [element("span", held ? `glyph icon-${tab.icon}` : "glyph")], () => {
        this.tab = id;
        this.rerender();
      });
      niche.setAttribute("aria-label", tab.label);
      niche.disabled = !held;
      column.appendChild(held ? explain(niche, tab.label) : explain(niche, tab.label, "Only the Capitol has it."));
    }
    const defenders = city.garrison.filter((m) => m.defId !== GUARDIAN_ID).length;
    const visitor = world.leaders.find((l) => l.player === side && sameHex(l.hex, city.hex));
    const facts = [
      `${defenders} in the garrison${city.kind === "capitol" ? " + Guardian" : ""}`,
      visitor ? `${unitName(leaderUnit(visitor)?.defId ?? "")}'s warband here` : "No warband visiting",
      nodesOf(world, city).map((n) => `${NODES[n.kind].name} ${n.level}`).join(" · ") || "No nodes",
    ];
    facts.forEach((fact, i) => column.appendChild(element("div", `fact f${i}`, fact)));
    const back = button("seal", [], () => this.options.close());
    back.setAttribute("aria-label", "Back to the map");
    column.appendChild(explain(back, "Back to the map", "Escape does the same."));
    return column;
  }

  /**
   * The city itself, the world in the window behind every tab: a painting of it from the inside (`assets/city/`),
   * drifting slowly, standing in for the montage the user wants (`docs/design/capitol-screen.md`). Its edges are the
   * screen's, the beam's and the rail's; it has no frame of its own.
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
    const grids = element("div", "grids panel");
    for (const squad of this.squads(world, side, place)) grids.appendChild(squadGrid(squad, this.gridOptions(world, side, city, mayAct)));
    grids.appendChild(element("div", "note", GRID_HINT));
    body.appendChild(grids);
    return body;
  }

  /**
   * A city's garrison as one painted wall (assets/ui/capitol/garrison.webp, the hud-paint-in skill): the tier and the
   * nodes along the top, each with its order on an ivory button; the garrison and a visiting warband as two windows of
   * nine panes; a well under them for the selected unit's orders; the graveyard in the recess over the tomb chest.
   */
  private garrisonWall(world: World, side: PlayerId, place: Place, city: City, mayAct: boolean): HTMLElement {
    const wall = element("div", "garrison-wall");
    wall.append(this.fortifications(world, city, mayAct), this.nodes(world, city, mayAct));
    const squads = this.squads(world, side, place);
    squads.forEach((squad, i) => {
      const grid = squadGrid(squad, this.gridOptions(world, side, city, mayAct));
      grid.classList.add(`w${i}`);
      wall.appendChild(grid);
    });
    if (squads.length === 1) {
      const vacant = element("div", "squad-grid w1 vacant");
      vacant.appendChild(element("div", "section", "No warband visiting"));
      wall.appendChild(vacant);
    }
    wall.appendChild(element("div", "orders-hint", GRID_HINT));
    if (raisesDeadAt(world, side, city)) wall.appendChild(this.graveyard(world, side, city, mayAct));
    else {
      const crypt = element("div", "graveyard");
      crypt.append(element("div", "section", "Graveyard"), element("div", "note", "Resurrection here needs the Capitol's research (Research tab: Resurrection in cities)."));
      wall.appendChild(crypt);
    }
    return wall;
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
        // The faction's own first tiers, then what a Tribal outpost offers here.
        const offered = [...FACTION_ROOTS[playerOf(world, side).faction], ...(city ? tribeRecruitsOf(world, city) : [])];
        const recruits = offered.map((defId) => ({
          label: `Recruit ${unitName(defId)} · ${recruitCost(defId) ?? 0} gold`,
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

  /** The nodes that feed this city (the nearest city owns a node), and investing in them: the first on the panel's button. */
  private nodes(world: World, city: City, mayAct: boolean): HTMLElement {
    const panel = element("div", "head-panel nodes");
    const text = element("div", "text");
    panel.appendChild(text);
    const owned = nodesOf(world, city);
    if (owned.length === 0) text.append(element("div", "name", "Nodes"), element("div", "note", "No nodes feed this city."));
    owned.forEach((node, i) => {
      const def = NODES[node.kind];
      const line = element("div", "node-line");
      line.append(element("span", "name", `${def.name} ${roman(node.level)}`), element("span", "note", def.describe(node.level)));
      text.appendChild(line);
      if (node.level >= NODE_MAX_LEVEL) return;
      const invest = orderButton(i === 0 ? "order" : "order inline", ["Invest · ", gold(nodeInvestCost(node))], {
        mayAct,
        problem: investNodeProblem(world, node.id),
        explain: `${def.name} ${roman(node.level + 1)}: ${def.describe(node.level + 1)}.`,
        give: () => this.options.act({ type: "investNode", nodeId: node.id }),
      });
      if (i === 0) panel.appendChild(invest);
      else line.appendChild(invest);
    });
    return panel;
  }

  /** The city's tier and its upgrade. */
  private fortifications(world: World, city: City, mayAct: boolean): HTMLElement {
    const panel = element("div", "head-panel fortifications");
    const armor = CITY_ARMOR_PER_TIER * (city.tier - 1);
    const text = element("div", "text");
    text.append(element("div", "name", `Tier ${roman(city.tier)}`), element("div", "note", `${CITY_SLOTS[city.tier] ?? 0} garrison slots · defenders +${armor} armor · heals ${Math.round(CITY_HEALING_PER_TIER * city.tier * 100)}% a turn`));
    panel.appendChild(text);
    if (city.tier < CITY_MAX_TIER) {
      const next = city.tier + 1;
      panel.appendChild(
        orderButton("order", [`Tier ${roman(next)} · `, gold(cityUpgradeCost(world, city))], {
          mayAct,
          problem: upgradeCityProblem(world, city.id),
          explain: `Tier ${next}: ${CITY_SLOTS[next] ?? 0} garrison slots; the garrison and a warband defending here get +${CITY_ARMOR_PER_TIER * (next - 1)} armor; units resting here heal ${Math.round(CITY_HEALING_PER_TIER * next * 100)}% a turn.`,
          give: () => this.options.act({ type: "upgradeCity", cityId: city.id }),
        }),
      );
    } else panel.appendChild(element("div", "order done", "Fully upgraded"));
    return panel;
  }

  /** The fallen: warband leaders to revive here, and units to resurrect by clicking an empty tile. */
  private graveyard(world: World, side: PlayerId, city: City, mayAct: boolean): HTMLElement {
    const column = element("div", "graveyard");
    column.appendChild(element("div", "section", "Graveyard"));
    if (city.kind !== "capitol") column.appendChild(element("div", "note", `Researched: resurrecting here costs ${Math.round((CITY_RESURRECTION_PREMIUM - 1) * 100)}% more.`));
    const list = element("div", "fallen-list");
    column.appendChild(list);
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
      list.appendChild(row);
    }
    playerOf(world, side).graveyard.forEach((fallen, index) => {
      list.appendChild(element("div", "fallen", `${unitName(fallen.defId)} · ${resurrectionCost(world, side, index, city) ?? 0} gold`));
    });
    const empty = playerOf(world, side).graveyard.length === 0 && lost.length === 0;
    column.appendChild(element("div", "note", empty ? "Nobody has fallen yet." : "Resurrect by clicking an empty tile. The price drops each turn you wait."));
    return column;
  }
}
