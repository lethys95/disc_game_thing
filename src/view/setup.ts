import { BEHAVIORS } from "#rules/abilities";
import type { Placement } from "#rules/battle";
import { allowedUnits, doctrine, DOCTRINES, SQUAD_LIMIT, squadProblems } from "#rules/doctrine";
import type { Commitment } from "#rules/doctrine";
import { COLS, ROWS, sameTile } from "#rules/grid";
import type { Side, Tile } from "#rules/types";
import { UNITS } from "#rules/units";
import type { Playable } from "#rules/units";
import { NEXUS_PRESETS, PRESETS } from "#view/squads";
import { ABILITY_TEXT } from "#view/text";

export type Squads = readonly [readonly Placement[], readonly Placement[]];

export interface SetupHandlers {
  onChange(squads: Squads): void;
  onFight(squads: Squads, playerSide: Side | null): void;
  onMarch(squads: Squads, factions: readonly [Playable, Playable], commitments: readonly [Commitment, Commitment]): void;
}

const FACTION_NAMES: Readonly<Record<Playable, string>> = { jilliath: "Jilliath", nexus: "Ral-Vitahl" };

const isJilliathPreset = (key: string): key is keyof typeof PRESETS => key in PRESETS;
const isNexusPreset = (key: string): key is keyof typeof NEXUS_PRESETS => key in NEXUS_PRESETS;

const presetFor = (faction: Playable, key: string) =>
  faction === "nexus" ? [...(isNexusPreset(key) ? NEXUS_PRESETS[key] : NEXUS_PRESETS.uncommitted)] : [...(isJilliathPreset(key) ? PRESETS[key] : PRESETS.uncommitted)];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Skirmish setup: pick a doctrine and a formation for both squads. The arena behind previews them live. */
export class Setup {
  private squads: [Placement[], Placement[]] = [[...PRESETS.preserve], [...PRESETS.punishment]];
  private doctrines: [string, string] = ["preserve", "punishment"];
  private factions: [Playable, Playable] = ["jilliath", "jilliath"];
  private active: Side = 0;
  private brush: string | null = null;
  private watch = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly handlers: SetupHandlers,
  ) {}

  show(): void {
    this.root.hidden = false;
    this.render();
    this.handlers.onChange(this.squads);
  }

  hide(): void {
    this.root.hidden = true;
  }

  private setFaction(side: Side, faction: Playable): void {
    this.factions[side] = faction;
    this.doctrines[side] = "uncommitted";
    this.squads[side] = presetFor(faction, this.doctrines[side]);
    this.active = side;
    this.brush = null;
    this.changed();
  }

  private commitmentOf(side: Side): Commitment {
    return doctrine(this.factions[side], this.doctrines[side]).commitment;
  }

  private setDoctrine(side: Side, key: string): void {
    this.doctrines[side] = key;
    this.squads[side] = presetFor(this.factions[side], key);
    this.active = side;
    this.brush = null;
    this.changed();
  }

  private clickCell(side: Side, tile: Tile): void {
    this.active = side;
    const squad = this.squads[side].filter((p) => !sameTile(p.tile, tile));
    const occupied = squad.length < this.squads[side].length;
    if (this.brush && (occupied || squad.length < SQUAD_LIMIT)) squad.push({ defId: this.brush, tile });
    else if (!occupied) {
      this.render();
      return;
    }
    this.squads[side] = squad;
    this.changed();
  }

  private changed(): void {
    this.render();
    this.handlers.onChange(this.squads);
  }

  private render(): void {
    this.root.replaceChildren();
    const header = element("div", "setup-header");
    header.appendChild(element("div", "title", "Skirmish"));
    header.appendChild(element("div", "subtitle", "Pick each side's faction, doctrine and formation."));
    this.root.appendChild(header);

    const body = element("div", "setup-body");
    body.appendChild(this.squadPanel(0));
    body.appendChild(this.palette());
    body.appendChild(this.squadPanel(1));
    this.root.appendChild(body);

    const footer = element("div", "setup-footer");
    const mode = element("label", "mode");
    const checkbox = element("input", "");
    checkbox.type = "checkbox";
    checkbox.checked = this.watch;
    checkbox.addEventListener("change", () => {
      this.watch = checkbox.checked;
    });
    mode.append(checkbox, " Let the AI play both sides");
    const ready = ([0, 1] as const).every((side) => squadProblems(this.squads[side], this.factions[side], this.commitmentOf(side)).length === 0);
    const fight = element("button", "action fight", "Fight");
    fight.disabled = !ready;
    fight.addEventListener("click", () => this.handlers.onFight(this.squads, this.watch ? null : 0));
    const march = element("button", "action fight", "March");
    march.title = "Take both squads onto a map: your leader against the enemy's";
    march.disabled = !ready;
    march.addEventListener("click", () => this.handlers.onMarch(this.squads, this.factions, [this.commitmentOf(0), this.commitmentOf(1)]));
    footer.append(mode, fight, march);
    this.root.appendChild(footer);
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
    for (const faction of ["jilliath", "nexus"] as const) {
      const button = element("button", `doctrine faction${this.factions[side] === faction ? " selected" : ""}`, FACTION_NAMES[faction]);
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setFaction(side, faction);
      });
      factions.appendChild(button);
    }
    panel.appendChild(factions);
    const doctrines = element("div", "doctrines");
    for (const option of DOCTRINES[this.factions[side]]) {
      const button = element("button", `doctrine${this.doctrines[side] === option.key ? " selected" : ""}`, option.name);
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setDoctrine(side, option.key);
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
    panel.appendChild(element("div", "count", `${this.squads[side].length} / ${SQUAD_LIMIT} units · front row faces the enemy`));
    return panel;
  }

  private palette(): HTMLElement {
    const panel = element("div", "panel palette");
    panel.appendChild(element("div", "title", `Recruit for ${this.active === 0 ? "your" : "the enemy"} squad`));
    panel.appendChild(element("div", "subtitle", "Pick a unit, then click a tile."));
    for (const defId of allowedUnits(this.factions[this.active], this.commitmentOf(this.active))) {
      const def = UNITS[defId];
      if (!def) continue;
      const card = element("button", `recruit${this.brush === defId ? " selected" : ""}`);
      const head = element("div", "head");
      head.append(element("span", "name", def.name), element("span", "tier", `tier ${def.tier}`));
      card.appendChild(head);
      card.appendChild(
        element("div", "stats", `${def.stats.maxHp} HP${def.stats.shield > 0 ? ` · ${def.stats.shield} shield` : ""} · ${def.stats.damage} dmg${def.damageType === "fire" ? " (fire)" : ""} · ${def.stats.armor} armor · ${def.stats.initiative} init`),
      );
      const special = def.abilities.filter((a) => !["attack", "shoot", "defend", "wait"].includes(a.id));
      card.appendChild(element("div", "abilities", special.map((a) => BEHAVIORS[a.id]?.name ?? a.id).join(" · ")));
      card.title = special.map((a) => `${BEHAVIORS[a.id]?.name}: ${ABILITY_TEXT[a.id] ?? ""}`).join("\n");
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
