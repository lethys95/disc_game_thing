import { hexDistance, sameHex } from "#rules/hex";
import { openForks } from "#rules/forks";
import { GUARDIAN_ID } from "#rules/units/index";
import { leadershipOf, movementOf, unspentPoints } from "#rules/world/leaders";
import { playerOf } from "#rules/world/state";
import type { Leader, PlayerId, World } from "#rules/world/state";
import { cityName } from "#view/city";
import type { Place } from "#view/city";
import { art } from "#view/art";
import { button, buttonById, byId, element, movementPips } from "#view/dom";
import { explain, explainWith } from "#view/explain";
import { STRUCTURES } from "#rules/structures";
import { structureAt } from "#rules/world/structures";
import { leaderName } from "#view/map-text";
import { memberRow, unitName } from "#view/members";
import { isLeaderOf, maxHpOf } from "#rules/world/record";
import { raisesDeadAt } from "#rules/world/economy";
import { spellBar } from "#view/spells";

export interface MapPanelActions {
  readonly select: (leaderId: string) => void;
  readonly openLeader: (leaderId: string) => void;
  /** Open the structure this warband stands on. */
  readonly visit: (leaderId: string) => void;
  readonly openPlace: (place: Place) => void;
  readonly newGame: () => void;
  /** Pick a spell to aim (null: stop aiming). */
  readonly pickSpell: (id: string | null) => void;
}

/**
 * The map's interface: one painted column at the screen's right edge (assets/ui/map/column.webp; the hud-paint-in
 * skill) with the shown warband's name, its 3x3 squad, three command sockets and the Capitol in its windows, and a
 * drawer beside it for what the column has no window for (spells, other cities, further meetings).
 */
export class MapPanels {
  private readonly squad = byId("mapsquad");
  private readonly commands = byId("mapcommands");
  private readonly city = byId("mapcity");
  private readonly extra = byId("mapextra");
  private readonly banner = byId("mapbanner");
  private readonly spellBook = buttonById("mapspells");
  /** The gem's spell book is open: the spell bar shows in the drawer. Aiming a spell keeps it open. */
  private spellsOpen = false;
  private last: (() => void) | null = null;

  constructor(private readonly actions: MapPanelActions) {
    this.spellBook.addEventListener("click", () => {
      this.spellsOpen = !this.spellsOpen;
      this.last?.();
    });
  }

  render(world: World, player: PlayerId, selected: Leader | undefined, casting: string | null, mayAct: boolean): void {
    this.last = () => this.render(world, player, selected, casting, mayAct);
    const mine = world.leaders.filter((l) => l.player === player);
    const shown = selected ?? mine[0];
    this.extra.replaceChildren();
    this.renderSquad(world, player, mine, shown, shown !== undefined && shown.id === selected?.id);
    this.renderCommands(world, mine, shown);
    this.renderCities(world, player);
    const spells = spellBar(world, player, mayAct, casting, this.actions.pickSpell);
    this.spellBook.disabled = spells === null;
    this.spellBook.classList.toggle("open", this.spellsOpen && spells !== null);
    explain(this.spellBook, "Spell book", spells ? (this.spellsOpen ? "Close the spells." : "Open the spells you have learned.") : "No spells learned yet: the Capitol's Spells tab.");
    if (spells && (this.spellsOpen || casting !== null)) this.extra.prepend(spells);
    this.extra.hidden = this.extra.childElementCount === 0;
    this.renderBanner(world, player);
  }

  /** The name plate and the nine panes; a pane without a unit shows the window's glass. */
  private renderSquad(world: World, player: PlayerId, mine: readonly Leader[], leader: Leader | undefined, isSelected: boolean): void {
    this.squad.replaceChildren();
    if (!leader) return;
    const plate = element("button", `plate name${isSelected ? " selected" : ""}`);
    plate.append(element("span", "name", `♛ ${leaderName(leader)}`), element("span", "meta", `${leader.squad.length}/${leadershipOf(leader)} · ${movementPips(leader.movement, movementOf(leader))}`));
    // Clicking the shown warband's plate moves on to the next warband; an unselected one is selected first.
    const next = mine[(mine.indexOf(leader) + 1) % mine.length] ?? leader;
    plate.addEventListener("click", () => this.actions.select(isSelected ? next.id : leader.id));
    const cycle = mine.length > 1 ? [`Click for the next warband: ${leaderName(next)}.`] : [];
    explain(plate, `${leaderName(leader)}'s warband`, `${leader.squad.length} of ${leadershipOf(leader)} places filled.`, `Movement ${leader.movement} of ${movementOf(leader)}.`, ...cycle);
    this.squad.appendChild(plate);
    const commitment = playerOf(world, player).commitment;
    for (const row of [0, 1, 2] as const) {
      for (const col of [0, 1, 2] as const) {
        const m = leader.squad.find((u) => u.tile.row === row && u.tile.col === col);
        // The window shows the grid a quarter turned: a squad's back row (row 2) is its left column.
        const cell = element("button", `pane x${2 - row} y${col}${m ? "" : " empty"}`);
        if (m) {
          cell.appendChild(art({ kind: "portrait", id: m.defId, frame: "icon" }, "pane-art"));
          if (isLeaderOf(m, leader)) cell.appendChild(element("span", "crown", "♛"));
          const hp = element("span", "pane-hp");
          const fill = element("span", "fill");
          fill.style.width = `${(100 * m.hp) / maxHpOf(m, leader)}%`;
          hp.appendChild(fill);
          cell.appendChild(hp);
          cell.classList.toggle("fallen", m.hp <= 0);
          explainWith(cell, unitName(m.defId), memberRow(m, leader, commitment));
          cell.addEventListener("click", () => this.actions.openLeader(leader.id));
        } else {
          cell.disabled = true;
          explain(cell, "An empty place", "Recruit into it in a city.");
        }
        this.squad.appendChild(cell);
      }
    }
  }

  /** Two of the three sockets: the leader tree and what can be done where the warband stands. End turn is the third. */
  private renderCommands(world: World, mine: readonly Leader[], leader: Leader | undefined): void {
    this.commands.replaceChildren();
    const points = leader ? unspentPoints(leader) : 0;
    this.commands.appendChild(
      this.socket("tree", "icon-research", "Leader tree", points > 0 ? `${points} point${points === 1 ? "" : "s"} to spend.` : "No points to spend.", leader ? () => this.actions.openLeader(leader.id) : null, points > 0),
    );
    // Standing on a structure, visit it; next to another of your warbands, meet it. More than one: the rest in the drawer.
    const here: { label: string; act: () => void }[] = [];
    const structure = leader ? structureAt(world, leader) : undefined;
    if (leader && structure) here.push({ label: `Visit the ${STRUCTURES[structure.kind].name.toLowerCase()}`, act: () => this.actions.visit(leader.id) });
    for (const other of leader ? mine.filter((l) => l.id !== leader.id && hexDistance(l.hex, leader.hex) === 1) : []) {
      here.push({ label: `Meet ${leaderName(other)}'s warband`, act: () => leader && this.actions.openPlace({ kind: "meet", a: leader.id, b: other.id }) });
    }
    const [first, ...rest] = here;
    this.commands.appendChild(first ? this.socket("here", "icon-city", first.label, "", first.act, false) : this.socket("here", "icon-city", "Nothing here", "Stand on a structure, or next to another warband.", null, false));
    for (const more of rest) this.extra.appendChild(button("action small", more.label, more.act));
  }

  private socket(slot: string, icon: string, label: string, note: string, act: (() => void) | null, ready: boolean): HTMLElement {
    const socket = element("button", `socket ${slot}${ready ? " ready" : ""}`);
    socket.setAttribute("aria-label", label);
    socket.appendChild(element("span", `glyph ${icon}`));
    socket.disabled = act === null;
    if (act) socket.addEventListener("click", act);
    return explain(socket, label, ...(note ? [note] : []));
  }

  /** The Capitol on the column's plate; any other city in the drawer. Each opens its own screen. */
  private renderCities(world: World, player: PlayerId): void {
    this.city.replaceChildren();
    const cities = world.cities.filter((c) => c.owner === player).sort((a, b) => Number(b.kind === "capitol") - Number(a.kind === "capitol"));
    const forks = openForks(playerOf(world, player).faction, playerOf(world, player).commitment).length;
    cities.forEach((city, i) => {
      const visitor = world.leaders.find((l) => l.player === player && sameHex(l.hex, city.hex));
      const facts = [`${city.garrison.filter((m) => m.defId !== GUARDIAN_ID).length} in the garrison`, visitor ? `${leaderName(visitor)}'s warband visiting` : ""];
      if (city.kind === "capitol") facts.push(`${forks} open branch${forks === 1 ? "" : "es"}`);
      // The graveyard shows where the dead can be raised: the Capitol, or every city once researched.
      if (raisesDeadAt(world, player, city)) facts.push(`${playerOf(world, player).graveyard.length} in the graveyard`);
      const open = () => this.actions.openPlace({ kind: "city", cityId: city.id });
      if (i === 0) {
        const plate = element("button", "plate city");
        plate.append(element("span", "name", cityName(city)), element("span", "meta", facts[0] ?? ""));
        plate.setAttribute("aria-label", `Enter ${cityName(city)}`);
        plate.addEventListener("click", open);
        this.city.appendChild(explain(plate, cityName(city), ...facts.filter((f) => f)));
      } else {
        const row = element("div", "city-row");
        const text = element("div", "city-text");
        text.append(element("div", "name", cityName(city)), element("div", "note", facts.filter((f) => f).join(" · ")));
        row.append(text, button("small", "Enter", open));
        this.extra.appendChild(row);
      }
    });
  }

  /** The end of your game: the last one standing, or your Guardian fell (with 3+ players, the others play on). */
  private renderBanner(world: World, player: PlayerId): void {
    const out = playerOf(world, player).eliminated;
    this.banner.hidden = !world.outcome && !out;
    if (this.banner.hidden) return;
    this.banner.replaceChildren();
    const won = world.outcome?.winner === player;
    const others = world.players.length > 2 ? "Every other Guardian has fallen" : "The enemy Guardian has fallen";
    this.banner.appendChild(element("div", "title", won ? others : "Your Guardian has fallen"));
    this.banner.appendChild(element("div", "subtitle", `${won ? "Victory" : "Defeat"} on turn ${world.turn}`));
    const again = element("button", "action", "New game");
    again.addEventListener("click", () => this.actions.newGame());
    this.banner.appendChild(again);
  }
}
