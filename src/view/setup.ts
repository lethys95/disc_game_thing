import { BEHAVIORS, describeAbility } from "#rules/abilities/index";
import type { Placement } from "#rules/battle/engine";
import { STARTING_LEADERSHIP } from "#rules/balance";
import { allowedUnits, commitmentOf, squadProblems } from "#rules/forks";
import type { Commitment, SquadProblem } from "#rules/forks";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import type { Side, Tile } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { art } from "#view/art";
import { FORMATIONS, PRESETS } from "#view/squads";
import { element } from "#view/dom";

export type Squads = readonly [readonly Placement[], readonly Placement[]];

export interface SetupHandlers {
  onChange(squads: Squads): void;
  onFight(squads: Squads, playerSide: Side | null): void;
  onMarch(squads: Squads, factions: readonly [Playable, Playable], commitments: readonly [Commitment, Commitment]): void;
}

const FACTION_NAMES: Readonly<Record<Playable, string>> = { jilliath: "Jilliath", nexus: "Ral-Vitahl" };

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
  private formations: [string, string] = ["Faith preserves", "Faith consumes: Punishment"];
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
    this.handlers.onChange(this.squads);
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
        element("div", "stats", `${def.stats.maxHp} HP${def.stats.shield > 0 ? ` · ${def.stats.shield} shield` : ""} · ${def.stats.damage} dmg${def.damageType === "fire" ? " (fire)" : ""} · ${def.stats.armor} armor · ${def.stats.initiative} init`),
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
