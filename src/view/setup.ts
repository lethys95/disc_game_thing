import { BEHAVIORS } from "#rules/abilities";
import type { Placement } from "#rules/battle";
import { DOCTRINES, SQUAD_LIMIT, squadProblems } from "#rules/doctrine";
import type { Doctrine } from "#rules/doctrine";
import { COLS, ROWS, sameTile } from "#rules/grid";
import type { Side, Tile } from "#rules/types";
import { UNITS } from "#rules/units";
import { PRESETS } from "#view/squads";
import { ABILITY_TEXT } from "#view/text";

export type Squads = readonly [readonly Placement[], readonly Placement[]];

export interface SetupHandlers {
  onChange(squads: Squads): void;
  onFight(squads: Squads, playerSide: Side | null): void;
  onMarch(squads: Squads): void;
}

const DOCTRINE_ORDER: readonly Doctrine[] = ["preserve", "punishment", "sacrifice"];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Skirmish setup: pick a doctrine and a formation for both squads. The arena behind previews them live. */
export class Setup {
  private squads: [Placement[], Placement[]] = [[...PRESETS.preserve], [...PRESETS.punishment]];
  private doctrines: [Doctrine, Doctrine] = ["preserve", "punishment"];
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

  private setDoctrine(side: Side, doctrine: Doctrine): void {
    this.doctrines[side] = doctrine;
    this.squads[side] = [...PRESETS[doctrine]];
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
    header.appendChild(element("div", "subtitle", "Jilliath against Jilliath. Each squad commits to one doctrine."));
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
    const ready = squadProblems(this.squads[0], this.doctrines[0]).length === 0 && squadProblems(this.squads[1], this.doctrines[1]).length === 0;
    const fight = element("button", "action fight", "Fight");
    fight.disabled = !ready;
    fight.addEventListener("click", () => this.handlers.onFight(this.squads, this.watch ? null : 0));
    const march = element("button", "action fight", "March");
    march.title = "Take both squads onto a map: your leader against the enemy's";
    march.disabled = !ready;
    march.addEventListener("click", () => this.handlers.onMarch(this.squads));
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
    const doctrines = element("div", "doctrines");
    for (const doctrine of DOCTRINE_ORDER) {
      const button = element("button", `doctrine${this.doctrines[side] === doctrine ? " selected" : ""}`, DOCTRINES[doctrine].name);
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setDoctrine(side, doctrine);
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
    for (const defId of DOCTRINES[this.doctrines[this.active]].units) {
      const def = UNITS[defId];
      if (!def) continue;
      const card = element("button", `recruit${this.brush === defId ? " selected" : ""}`);
      const head = element("div", "head");
      head.append(element("span", "name", def.name), element("span", "tier", `tier ${def.tier}`));
      card.appendChild(head);
      card.appendChild(
        element("div", "stats", `${def.stats.maxHp} HP · ${def.stats.damage} dmg${def.damageType === "fire" ? " (fire)" : ""} · ${def.stats.armor} armor · ${def.stats.initiative} init`),
      );
      const special = def.abilities.filter((a) => !["attack", "defend", "wait"].includes(a.id));
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
