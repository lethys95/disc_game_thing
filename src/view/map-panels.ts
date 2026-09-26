import { hexDistance, sameHex } from "#rules/hex";
import { openForks } from "#rules/forks";
import { GUARDIAN_ID } from "#rules/units/index";
import { leadershipOf, movementOf, unspentPoints } from "#rules/world/leaders";
import { playerOf } from "#rules/world/state";
import type { Leader, PlayerId, World } from "#rules/world/state";
import { cityName } from "#view/city";
import type { Place } from "#view/city";
import { byId, element, movementPips } from "#view/dom";
import { leaderName } from "#view/map-text";
import { memberRow } from "#view/members";

export interface MapPanelActions {
  readonly select: (leaderId: string) => void;
  readonly openLeader: (leaderId: string) => void;
  readonly openPlace: (place: Place) => void;
  readonly newGame: () => void;
}

/** The panels beside the map: the player's warbands, its cities, and the end-of-game banner. */
export class MapPanels {
  private readonly squad = byId("mapsquad");
  private readonly city = byId("mapcity");
  private readonly banner = byId("mapbanner");

  constructor(private readonly actions: MapPanelActions) {}

  render(world: World, player: PlayerId, selected: Leader | undefined): void {
    this.renderWarbands(world, player, selected);
    this.renderCities(world, player);
    this.renderBanner(world, player);
  }

  private renderWarbands(world: World, player: PlayerId, selected: Leader | undefined): void {
    this.squad.replaceChildren();
    const mine = world.leaders.filter((l) => l.player === player);
    this.squad.hidden = mine.length === 0;
    this.squad.appendChild(element("div", "title", mine.length === 1 ? "Your warband" : "Your warbands"));
    for (const leader of mine) {
      const isSelected = leader.id === selected?.id;
      const head = element("button", `warband${isSelected ? " selected" : ""}`);
      head.append(element("span", "name", leaderName(leader)), element("span", "meta", `${leader.squad.length}/${leadershipOf(leader)} units · ${movementPips(leader.movement, movementOf(leader))}`));
      head.addEventListener("click", () => this.actions.select(leader.id));
      this.squad.appendChild(head);
      if (!isSelected) continue;
      const commitment = playerOf(world, player).commitment;
      for (const m of [...leader.squad].sort((a, b) => a.tile.row - b.tile.row || a.tile.col - b.tile.col)) this.squad.appendChild(memberRow(m, leader, commitment));
      // The leader tree has its own screen; the panel shows how many points wait there.
      const points = unspentPoints(leader);
      const tree = element("button", `action small${points > 0 ? " ready" : ""}`, `Leader tree${points > 0 ? ` · ${points} point${points === 1 ? "" : "s"} to spend` : ""}`);
      tree.addEventListener("click", () => this.actions.openLeader(leader.id));
      this.squad.appendChild(tree);
      // Warbands next to each other can trade units (pillars.md, "Warbands meeting").
      for (const other of mine.filter((l) => l.id !== leader.id && hexDistance(l.hex, leader.hex) === 1)) {
        const meet = element("button", "action small", `Meet ${leaderName(other)}'s warband`);
        meet.addEventListener("click", () => this.actions.openPlace({ kind: "meet", a: leader.id, b: other.id }));
        this.squad.appendChild(meet);
      }
    }
  }

  /** The player's cities, the Capitol first; each opens its own screen. Everything happens there. */
  private renderCities(world: World, player: PlayerId): void {
    this.city.replaceChildren();
    const cities = world.cities.filter((c) => c.owner === player).sort((a, b) => Number(b.kind === "capitol") - Number(a.kind === "capitol"));
    this.city.hidden = cities.length === 0 || world.outcome !== null;
    this.city.appendChild(element("div", "title", cities.length === 1 ? "Your city" : "Your cities"));
    const forks = openForks(playerOf(world, player).faction, playerOf(world, player).commitment).length;
    for (const city of cities) {
      const row = element("div", "city-row");
      const visitor = world.leaders.find((l) => l.player === player && sameHex(l.hex, city.hex));
      const facts = [`${city.garrison.filter((m) => m.defId !== GUARDIAN_ID).length} in the garrison`, visitor ? `${leaderName(visitor)}'s warband visiting` : ""];
      if (city.kind === "capitol") facts.push(`${forks} open branch${forks === 1 ? "" : "es"}`, `${playerOf(world, player).graveyard.length} in the graveyard`);
      const text = element("div", "city-text");
      text.append(element("div", "name", cityName(city)), element("div", "note", facts.filter((f) => f).join(" · ")));
      const enter = element("button", "small", "Enter");
      enter.addEventListener("click", () => this.actions.openPlace({ kind: "city", cityId: city.id }));
      row.append(text, enter);
      this.city.appendChild(row);
    }
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
