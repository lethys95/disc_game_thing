import { BEHAVIORS, describeAbility } from "#rules/abilities/index";
import type { Placement } from "#rules/battle/engine";
import { STARTING_LEADERSHIP } from "#rules/balance";
import { allowedUnits, commitmentOf, squadProblems } from "#rules/forks";
import type { Commitment, SquadProblem } from "#rules/forks";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import type { Side, Tile } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import { FACTIONS } from "#rules/factions";

/** Every playable faction, in the order the setup offers them. */
const PLAYABLE = Object.keys(FACTIONS).filter((f): f is Playable => f in FACTIONS);
import type { Playable } from "#rules/units/index";
import { defaultColors, fallbackColor, freeColor, PLAYER_COLORS } from "#rules/world/colors";
import type { PlayerColor } from "#rules/world/colors";
import type { PlayerSetup } from "#rules/world/create";
import { art } from "#view/art";
import { colorPair, COLOR_HEX, COLOR_NAMES } from "#view/colors";
import { FORMATIONS, PRESETS } from "#rules/units/presets";
import { button, element } from "#view/dom";
import { defaultMapSize, isMapSize, MAP_SIZES } from "#rules/map";
import type { MapSize } from "#rules/map";

export type Squads = readonly [readonly Placement[], readonly Placement[]];

type Colors = readonly [PlayerColor, PlayerColor];

/** Maps have room for six Capitols (the ring's corners): you, the enemy squad and four more. */
const MAX_EXTRA_OPPONENTS = 4;

export interface SetupHandlers {
  onChange(squads: Squads, colors: Colors): void;
  onFight(squads: Squads, playerSide: Side | null, colors: Colors): void;
  /** Onto a map: you (player 0) against the enemy squad (player 1) and any extra AI opponents. */
  onMarch(players: readonly PlayerSetup[], size: MapSize): void;
  onLoad(): void;
}


const PROBLEM_TEXT: Readonly<Record<SquadProblem, string>> = {
  empty: "A squad needs at least one unit.",
  tooMany: `A new leader commands at most ${STARTING_LEADERSHIP}.`,
  otherFaction: "A squad fields only its own faction's units.",
  conflictingBranches: "Two branches of the same fork (like Paladin and Zealot) can't serve one army.",
};

/**
 * Skirmish setup: pick a faction and a formation for both squads. The branches the placed units took become that
 * side's choices on the map. The arena behind previews them live.
 */
export class Setup {
  private squads: [Placement[], Placement[]] = [[...PRESETS.preserve], [...PRESETS.punishment]];
  private formations: [string, string] = ["Faith preserves", "Faith consumes: Punisher"];
  /** More AI opponents for the map, beyond the enemy squad (a skirmish stays two-sided). */
  private extras: { faction: Playable; formation: string }[] = [];
  private factions: [Playable, Playable] = ["jilliath", "jilliath"];
  private colors: [PlayerColor, PlayerColor] = colorPair(["jilliath", "jilliath"]);
  /** Colors the player picked stay; the others follow the factions' defaults. */
  private picked: [boolean, boolean] = [false, false];
  private active: Side = 0;
  private brush: string | null = null;
  private watch = false;
  /** The map size picked; null: the default for the number of players. */
  private size: MapSize | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly handlers: SetupHandlers,
  ) {}

  show(): void {
    this.root.hidden = false;
    this.render();
    this.handlers.onChange(this.squads, this.colors);
  }

  hide(): void {
    this.root.hidden = true;
  }

  get visible(): boolean {
    return !this.root.hidden;
  }

  private recolor(): void {
    const defaults = colorPair(this.factions);
    const next: [PlayerColor, PlayerColor] = [this.picked[0] ? this.colors[0] : defaults[0], this.picked[1] ? this.colors[1] : defaults[1]];
    // On a clash, the side whose color wasn't picked by hand moves to the first free one.
    const moving: Side = this.picked[1] && !this.picked[0] ? 0 : 1;
    const other: Side = moving === 0 ? 1 : 0;
    if (next[0] === next[1]) next[moving] = fallbackColor(next[other]);
    this.colors = next;
  }

  private setFaction(side: Side, faction: Playable): void {
    this.factions[side] = faction;
    this.recolor();
    const first = FORMATIONS[faction][0];
    this.formations[side] = first?.name ?? "";
    this.squads[side] = [...(first?.squad ?? [])];
    this.active = side;
    this.brush = null;
    this.changed();
  }

  /** What the placed units imply; an empty commitment while they conflict (the Fight button is off then). */
  private commitmentOf(side: Side): Commitment {
    return commitmentOf(this.squads[side].map((p) => p.defId)) ?? {};
  }

  private setFormation(side: Side, name: string): void {
    this.formations[side] = name;
    this.squads[side] = [...(FORMATIONS[this.factions[side]].find((f) => f.name === name)?.squad ?? [])];
    this.active = side;
    this.brush = null;
    this.changed();
  }

  private clickCell(side: Side, tile: Tile): void {
    this.active = side;
    const squad = this.squads[side].filter((p) => !sameTile(p.tile, tile));
    const occupied = squad.length < this.squads[side].length;
    if (this.brush && (occupied || squad.length < STARTING_LEADERSHIP)) squad.push({ defId: this.brush, tile });
    else if (!occupied) {
      this.render();
      return;
    }
    this.squads[side] = squad;
    this.changed();
  }

  private changed(): void {
    this.render();
    this.handlers.onChange(this.squads, this.colors);
  }

  private render(): void {
    this.root.replaceChildren();
    const header = element("div", "setup-header");
    header.appendChild(element("div", "title", "Skirmish"));
    header.appendChild(element("div", "subtitle", "Pick each side's faction and formation. The branches your units took are your choices on the map."));
    this.root.appendChild(header);

    const body = element("div", "setup-body");
    body.appendChild(this.squadPanel(0));
    body.appendChild(this.palette());
    body.appendChild(this.squadPanel(1));
    this.root.appendChild(body);
    this.root.appendChild(this.extrasPanel());

    const footer = element("div", "setup-footer");
    const mode = element("label", "mode");
    const checkbox = element("input", "");
    checkbox.type = "checkbox";
    checkbox.checked = this.watch;
    checkbox.addEventListener("change", () => {
      this.watch = checkbox.checked;
    });
    mode.append(checkbox, " Let the AI play both sides");
    const problems = ([0, 1] as const).flatMap((side) => squadProblems(this.squads[side], this.factions[side]));
    const ready = problems.length === 0;
    if (!ready) footer.appendChild(element("div", "problem", PROBLEM_TEXT[problems[0] ?? "empty"]));
    const fight = element("button", "action fight", "Fight");
    fight.disabled = !ready;
    fight.addEventListener("click", () => this.handlers.onFight(this.squads, this.watch ? null : 0, this.colors));
    const march = element("button", "action fight", "March");
    march.title = this.extras.length === 0 ? "Take both squads onto a map: your leader against the enemy's" : `Onto a map: you against ${this.extras.length + 1} AI opponents`;
    march.disabled = !ready;
    march.addEventListener("click", () => this.handlers.onMarch(this.players(), this.mapSize()));
    const load = element("button", "action", "Load game");
    load.addEventListener("click", () => this.handlers.onLoad());
    footer.append(mode, fight, march, load);
    this.root.appendChild(footer);
  }

  private mapSize(): MapSize {
    return this.size ?? defaultMapSize(this.extras.length + 2);
  }

  /** Everyone on the map: you, the enemy squad, then the extra opponents, each with a color of its own. */
  private players(): PlayerSetup[] {
    const main = ([0, 1] as const).map((side): PlayerSetup => ({ squad: this.squads[side], faction: this.factions[side], commitment: this.commitmentOf(side), color: this.colors[side] }));
    const colors = this.extraColors();
    const extras = this.extras.map((extra, i): PlayerSetup => {
      const squad = this.extraSquad(extra);
      return { squad, faction: extra.faction, commitment: commitmentOf(squad.map((p) => p.defId)) ?? {}, color: colors[i] ?? "white" };
    });
    return [...main, ...extras];
  }

  private extraSquad(extra: { faction: Playable; formation: string }): Placement[] {
    const formations = FORMATIONS[extra.faction];
    return [...(formations.find((f) => f.name === extra.formation) ?? formations[0])?.squad ?? []];
  }

  /** Extra opponents take their faction's color if it's free, else the next free one. */
  private extraColors(): PlayerColor[] {
    const taken: PlayerColor[] = [...this.colors];
    return this.extras.map((extra) => {
      const own = defaultColors([extra.faction])[0];
      const color = own && !taken.includes(own) ? own : freeColor(taken);
      taken.push(color);
      return color;
    });
  }

  /** Map games only: more AI opponents, each with a faction and a formation. */
  private extrasPanel(): HTMLElement {
    const panel = element("div", "setup-extras");
    panel.appendChild(element("div", "note", "On the map, more AI opponents can join (skirmishes stay one against one):"));
    const colors = this.extraColors();
    this.extras.forEach((extra, i) => {
      const row = element("div", "extra");
      const dot = element("span", "dot");
      dot.style.background = COLOR_HEX[colors[i] ?? "white"];
      row.appendChild(dot);
      for (const faction of PLAYABLE) {
        const button = element("button", `doctrine faction small${extra.faction === faction ? " selected" : ""}`, FACTIONS[faction].name);
        button.addEventListener("click", () => {
          this.extras[i] = { faction, formation: FORMATIONS[faction][0]?.name ?? "" };
          this.render();
        });
        row.appendChild(button);
      }
      const formation = element("select", "formation");
      for (const option of FORMATIONS[extra.faction]) {
        const item = element("option", "", option.name);
        item.value = option.name;
        item.selected = option.name === extra.formation;
        formation.appendChild(item);
      }
      formation.addEventListener("change", () => {
        this.extras[i] = { ...extra, formation: formation.value };
      });
      const remove = element("button", "small", "Remove");
      remove.addEventListener("click", () => {
        this.extras.splice(i, 1);
        this.render();
      });
      row.append(formation, remove);
      panel.appendChild(row);
    });
    const add = element("button", "small", "Add an AI opponent");
    add.disabled = this.extras.length >= MAX_EXTRA_OPPONENTS;
    add.title = add.disabled ? `At most ${MAX_EXTRA_OPPONENTS + 2} players on a map.` : "";
    add.addEventListener("click", () => {
      this.extras.push({ faction: "jilliath", formation: FORMATIONS.jilliath[0]?.name ?? "" });
      this.render();
    });
    // Map size (user, 2026-09-27): the default grows with the number of players until one is picked.
    const sizes = element("div", "extra map-size");
    sizes.appendChild(element("span", "note", "Map size:"));
    for (const [size, { name, radius }] of Object.entries(MAP_SIZES)) {
      if (!isMapSize(size)) continue;
      const chosen = this.mapSize() === size;
      const option = button(`doctrine small${chosen ? " selected" : ""}`, name, () => {
        this.size = size;
        this.render();
      });
      option.title = `${3 * radius * (radius + 1) + 1} hexes${this.size === null && chosen ? " (the default for this many players)" : ""}`;
      sizes.appendChild(option);
    }
    sizes.prepend(add);
    panel.appendChild(sizes);
    return panel;
  }

  private squadPanel(side: Side): HTMLElement {
    const panel = element("div", `panel squad side${side}${this.active === side ? " active" : ""}`);
    panel.addEventListener("click", () => {
      if (this.active !== side) {
        this.active = side;
        this.brush = null;
        this.render();
      }
    });
    panel.appendChild(element("div", "title", side === 0 ? "Your squad" : "Enemy squad"));
    const factions = element("div", "factions");
    for (const faction of PLAYABLE) {
      const button = element("button", `doctrine faction${this.factions[side] === faction ? " selected" : ""}`, FACTIONS[faction].name);
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setFaction(side, faction);
      });
      factions.appendChild(button);
    }
    panel.appendChild(factions);
    const swatches = element("div", "swatches");
    for (const color of PLAYER_COLORS) {
      const taken = this.colors[side === 0 ? 1 : 0] === color;
      const swatch = element("button", `swatch${this.colors[side] === color ? " selected" : ""}`);
      swatch.style.background = COLOR_HEX[color];
      swatch.title = taken ? `${COLOR_NAMES[color]} (the other side's)` : COLOR_NAMES[color];
      swatch.disabled = taken;
      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        this.colors[side] = color;
        this.picked[side] = true;
        this.render();
        this.handlers.onChange(this.squads, this.colors);
      });
      swatches.appendChild(swatch);
    }
    panel.appendChild(swatches);
    const doctrines = element("div", "doctrines");
    for (const option of FORMATIONS[this.factions[side]]) {
      const button = element("button", `doctrine${this.formations[side] === option.name ? " selected" : ""}`, option.name);
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setFormation(side, option.name);
      });
      doctrines.appendChild(button);
    }
    panel.appendChild(doctrines);

    // Laid out as seen in the arena: columns top to bottom, the front row facing the middle of the screen.
    const grid = element("div", "grid");
    const rows = side === 0 ? [...ROWS].reverse() : [...ROWS];
    for (const col of COLS) {
      for (const row of rows) {
        const tile = { row, col };
        const placed = this.squads[side].find((p) => sameTile(p.tile, tile));
        const cell = element("button", `cell${row === 0 ? " front" : ""}${placed ? " filled" : ""}`, placed ? (UNITS[placed.defId]?.name ?? placed.defId) : "");
        cell.title = placed ? "Click to replace with the selected unit, right-click to remove" : "Click to place the selected unit";
        cell.addEventListener("click", (e) => {
          e.stopPropagation();
          this.clickCell(side, tile);
        });
        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.squads[side] = this.squads[side].filter((p) => !sameTile(p.tile, tile));
          this.changed();
        });
        grid.appendChild(cell);
      }
    }
    panel.appendChild(grid);
    panel.appendChild(element("div", "count", `${this.squads[side].length} / ${STARTING_LEADERSHIP} units (a new leader's Leadership) · front row faces the enemy`));
    return panel;
  }

  private palette(): HTMLElement {
    const panel = element("div", "panel palette");
    panel.appendChild(element("div", "title", `Recruit for ${this.active === 0 ? "your" : "the enemy"} squad`));
    panel.appendChild(element("div", "subtitle", "Pick a unit, then click a tile."));
    for (const defId of allowedUnits(this.factions[this.active], {})) {
      const def = UNITS[defId];
      if (!def) continue;
      const card = element("button", `recruit${this.brush === defId ? " selected" : ""}`);
      card.appendChild(art({ kind: "portrait", id: defId }, "thumb"));
      const head = element("div", "head");
      head.append(element("span", "name", def.name), element("span", "tier", `tier ${def.tier}`));
      card.appendChild(head);
      card.appendChild(
        element("div", "stats", `${def.stats.maxHp} HP${def.stats.shield > 0 ? ` · ${def.stats.shield} shield` : ""} · ${def.stats.damage} dmg${def.damageType === "weapon" ? "" : ` (${def.damageType})`} · ${def.stats.armor} armor · ${def.stats.initiative} init`),
      );
      const special = def.abilities.filter((a) => {
        const b = BEHAVIORS[a.id];
        return !(b?.kind === "active" && b.tags.includes("basic"));
      });
      const label = (a: (typeof special)[number]) => a.name ?? BEHAVIORS[a.id]?.name ?? a.id;
      card.appendChild(element("div", "abilities", special.map(label).join(" · ")));
      card.title = special.map((a) => `${label(a)}: ${describeAbility(a)}`).join("\n");
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        this.brush = this.brush === defId ? null : defId;
        this.render();
      });
      panel.appendChild(card);
    }
    return panel;
  }
}
