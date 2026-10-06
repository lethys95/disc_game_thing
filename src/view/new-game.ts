import { commitmentOf } from "#rules/forks";
import { FACTIONS } from "#rules/factions";
import { defaultMapSize, isMapSize, MAP_SIZES } from "#rules/map";
import type { MapSize } from "#rules/map";
import type { Playable } from "#rules/units/index";
import { FORMATIONS } from "#rules/units/presets";
import { defaultColors, freeColor, PLAYER_COLORS } from "#rules/world/colors";
import type { PlayerColor } from "#rules/world/colors";
import type { PlayerSetup } from "#rules/world/create";
import { art } from "#view/art";
import { COLOR_HEX, COLOR_NAMES } from "#view/colors";
import { button, element } from "#view/dom";

export interface NewGameHandlers {
  onMarch(players: readonly PlayerSetup[], size: MapSize): void;
  onBack(): void;
}

const PLAYABLE = Object.keys(FACTIONS).filter((f): f is Playable => f in FACTIONS);

/** Maps have room for six Capitols (the ring's corners). */
const MAX_OPPONENTS = 5;

/** Two of each faction's painted units, to tell them apart at a glance. */
const FACES: Readonly<Record<Playable, readonly string[]>> = {
  jilliath: ["zealot", "punisher"],
  nexus: ["custodian", "etherborn"],
  grove: ["psychopomp", "bog_giant"],
};

/**
 * A new game on the map: your faction and color, your AI opponents and the map size. Every side starts with its
 * faction's tier-1 formation, the way a game is meant to begin (the skirmish screen builds any squad).
 */
export class NewGame {
  private faction: Playable = "jilliath";
  private color: PlayerColor | null = null;
  private opponents: Playable[] = ["nexus"];
  /** The map size picked; null: the default for the number of players. */
  private size: MapSize | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly handlers: NewGameHandlers,
  ) {}

  show(): void {
    this.root.hidden = false;
    this.render();
  }

  hide(): void {
    this.root.hidden = true;
  }

  get visible(): boolean {
    return !this.root.hidden;
  }

  private ownColor(): PlayerColor {
    return this.color ?? defaultColors([this.faction])[0] ?? "red";
  }

  /** Opponents take their faction's color if it's free, else the next free one. */
  private opponentColors(): PlayerColor[] {
    const taken: PlayerColor[] = [this.ownColor()];
    return this.opponents.map((faction) => {
      const own = defaultColors([faction])[0];
      const color = own && !taken.includes(own) ? own : freeColor(taken);
      taken.push(color);
      return color;
    });
  }

  private mapSize(): MapSize {
    return this.size ?? defaultMapSize(this.opponents.length + 1);
  }

  private players(): PlayerSetup[] {
    const setup = (faction: Playable, color: PlayerColor): PlayerSetup => {
      const squad = [...(FORMATIONS[faction][0]?.squad ?? [])];
      return { squad, faction, commitment: commitmentOf(squad.map((p) => p.defId)) ?? {}, color };
    };
    const colors = this.opponentColors();
    return [setup(this.faction, this.ownColor()), ...this.opponents.map((faction, i) => setup(faction, colors[i] ?? "white"))];
  }

  private render(): void {
    this.root.replaceChildren();
    const header = element("div", "setup-header");
    header.append(element("div", "title", "New game"), element("div", "subtitle", "Choose your faction, then who you march against."));
    this.root.appendChild(header);

    const factions = element("div", "faction-cards");
    for (const faction of PLAYABLE) {
      const def = FACTIONS[faction];
      const card = button(`faction-card panel${this.faction === faction ? " selected" : ""}`, [], () => {
        this.faction = faction;
        this.color = null;
        this.render();
      });
      const faces = element("div", "faces");
      for (const id of FACES[faction]) faces.appendChild(art({ kind: "portrait", id }, "face"));
      card.append(
        faces,
        element("div", "name", def.name),
        element("div", "epithet", def.epithet),
        element("div", "traits", `${def.identity} · ${def.mana} mana · ${def.difficulty}`),
        element("div", "about", def.about),
      );
      factions.appendChild(card);
    }
    this.root.appendChild(factions);

    const options = element("div", "panel newgame-options");
    const colors = element("div", "row");
    colors.appendChild(element("span", "label", "Your color"));
    for (const color of PLAYER_COLORS) {
      const swatch = button(`swatch${this.ownColor() === color ? " selected" : ""}`, [], () => {
        this.color = color;
        this.render();
      });
      swatch.style.background = COLOR_HEX[color];
      swatch.title = COLOR_NAMES[color];
      colors.appendChild(swatch);
    }
    options.appendChild(colors);

    const opponentColors = this.opponentColors();
    this.opponents.forEach((opponent, i) => {
      const row = element("div", "row");
      const dot = element("span", "dot");
      dot.style.background = COLOR_HEX[opponentColors[i] ?? "white"];
      row.append(element("span", "label", `Opponent ${i + 1}`), dot);
      for (const faction of PLAYABLE) {
        row.appendChild(
          button(`doctrine faction small${opponent === faction ? " selected" : ""}`, FACTIONS[faction].name, () => {
            this.opponents[i] = faction;
            this.render();
          }),
        );
      }
      const remove = button("small", "Remove", () => {
        this.opponents.splice(i, 1);
        this.render();
      });
      remove.disabled = this.opponents.length === 1;
      row.appendChild(remove);
      options.appendChild(row);
    });
    const add = button("small", "Add an opponent", () => {
      this.opponents.push(PLAYABLE[this.opponents.length % PLAYABLE.length] ?? "jilliath");
      this.render();
    });
    add.disabled = this.opponents.length >= MAX_OPPONENTS;
    add.title = add.disabled ? `At most ${MAX_OPPONENTS + 1} players on a map.` : "";
    options.appendChild(add);

    // The default grows with the number of players until one is picked (user, 2026-09-27).
    const sizes = element("div", "row map-size");
    sizes.appendChild(element("span", "label", "Map size"));
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
    options.appendChild(sizes);
    this.root.appendChild(options);

    const footer = element("div", "setup-footer");
    footer.append(
      button("action", "Back", () => this.handlers.onBack()),
      button("action fight", "March", () => this.handlers.onMarch(this.players(), this.mapSize())),
    );
    this.root.appendChild(footer);
  }
}
