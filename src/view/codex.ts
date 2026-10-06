import { BEHAVIORS, describeAbility, usesAbilityPower } from "#rules/abilities/index";
import type { UnitDef } from "#rules/battle/types";
import { EFFECTS } from "#rules/effects";
import { FACTIONS } from "#rules/factions";
import { EVOLUTIONS, RECRUIT_COST, UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { TRIBES, tribeUnits } from "#rules/world/state";
import type { Tribe } from "#rules/world/state";
import { art } from "#view/art";
import { button, element } from "#view/dom";

export interface CodexHandlers {
  onBack(): void;
}

type Tab = "units" | "abilities" | "effects";
type Shelf = Playable | Tribe;

const PLAYABLE = Object.keys(FACTIONS).filter((f): f is Playable => f in FACTIONS);

/** The tribes' names are placeholders until the user names them (`faction-stuff/neutrals/`). */
const TRIBE_NAMES: Readonly<Record<Tribe, string>> = { bandits: "Bandits", gnolls: "Gnolls", drawn: "The Drawn", carnival: "The carnival" };

const isPlayable = (shelf: Shelf): shelf is Playable => shelf in FACTIONS;

const shelfName = (shelf: Shelf) => (isPlayable(shelf) ? FACTIONS[shelf].name : TRIBE_NAMES[shelf]);

const unitsOf = (shelf: Shelf): UnitDef[] =>
  (isPlayable(shelf) ? Object.values(UNITS).filter((u) => u.faction === shelf) : tribeUnits(shelf).flatMap((id) => UNITS[id] ?? []))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

/** Abilities every unit has (Defend, Wait, Retreat): told once, not on every page. */
const COMMON = Object.keys(BEHAVIORS).filter((id) => Object.values(UNITS).every((u) => u.faction === "neutral" || u.abilities.some((a) => a.id === id)));

/** Which units evolve into this one. */
const evolvesFrom = (id: string) => Object.entries(EVOLUTIONS).filter(([, steps]) => steps.some((s) => s.to === id)).map(([from]) => from);

const unitName = (id: string) => UNITS[id]?.name ?? id;

/**
 * The codex (the user, 2026-10-06: "some sort of guide book/bestiary where you can look at the units and mechanics in
 * the game"): every unit, ability and effect, read from the rules themselves, so it can never drift from the game.
 */
export class Codex {
  private tab: Tab = "units";
  private shelf: Shelf = "jilliath";
  private unit: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly handlers: CodexHandlers,
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

  private render(): void {
    this.root.replaceChildren();
    const header = element("div", "codex-header");
    header.appendChild(element("div", "title", "Codex"));
    const tabs = element("div", "tabs");
    for (const [tab, label] of [["units", "Units"], ["abilities", "Abilities"], ["effects", "Effects"]] as const) {
      tabs.appendChild(
        button(`action${this.tab === tab ? " selected" : ""}`, label, () => {
          this.tab = tab;
          this.render();
        }),
      );
    }
    header.append(tabs, button("action", "Back", () => this.handlers.onBack()));
    this.root.appendChild(header);
    if (this.tab === "units") this.renderUnits();
    else if (this.tab === "abilities") this.renderAbilities();
    else this.renderEffects();
  }

  private renderUnits(): void {
    const shelves = element("div", "codex-shelves");
    for (const shelf of [...PLAYABLE, ...TRIBES]) {
      shelves.appendChild(
        button(`doctrine small${this.shelf === shelf ? " selected" : ""}`, shelfName(shelf), () => {
          this.shelf = shelf;
          this.unit = null;
          this.render();
        }),
      );
    }
    this.root.appendChild(shelves);
    const units = unitsOf(this.shelf);
    const body = element("div", "codex-body");
    const list = element("div", "panel codex-list");
    for (const def of units) {
      const row = button(`codex-row${(this.unit ?? units[0]?.id) === def.id ? " selected" : ""}`, [], () => {
        this.unit = def.id;
        this.render();
      });
      row.append(art({ kind: "portrait", id: def.id, frame: "icon" }, "thumb"), element("span", "name", def.name), element("span", "tier", `tier ${def.tier}`));
      list.appendChild(row);
    }
    body.appendChild(list);
    const shown = UNITS[this.unit ?? units[0]?.id ?? ""];
    if (shown) body.appendChild(this.unitPage(shown));
    this.root.appendChild(body);
  }

  private unitPage(def: UnitDef): HTMLElement {
    const page = element("div", "panel codex-page");
    const top = element("div", "codex-top");
    top.appendChild(art({ kind: "portrait", id: def.id, frame: "bust" }, "codex-bust"));
    const heading = element("div", "heading");
    const faction = def.faction === "neutral" ? "Neutral" : `${FACTIONS[def.faction].name}, ${FACTIONS[def.faction].epithet}`;
    heading.append(element("div", "name", def.name), element("div", "subtitle", `${faction} · tier ${def.tier}`));
    const stats = element("div", "stats");
    const rows: [string, string][] = [
      ["Health", String(def.stats.maxHp)],
      ...(def.stats.shield > 0 ? [["Shield", String(def.stats.shield)] satisfies [string, string]] : []),
      ["Damage", `${def.stats.damage}${def.damageType === "weapon" ? "" : ` ${def.damageType}`}`],
      ["Armor", String(def.stats.armor)],
      ["Initiative", String(def.stats.initiative)],
      ...(usesAbilityPower(def.abilities) ? [["Ability power", String(def.stats.abilityPower)] satisfies [string, string]] : []),
      ...(def.spellCharges ? [["Spell charges", String(def.spellCharges)] satisfies [string, string]] : []),
      ...(RECRUIT_COST[def.id] ? [["Recruit", `${RECRUIT_COST[def.id]} gold`] satisfies [string, string]] : []),
    ];
    for (const [name, value] of rows) stats.append(element("span", "name", name), element("span", "value", value));
    heading.appendChild(stats);
    top.appendChild(heading);
    page.appendChild(top);

    const abilities = element("ul", "abilities");
    for (const ref of def.abilities.filter((a) => !COMMON.includes(a.id))) {
      const behavior = BEHAVIORS[ref.id];
      const item = element("li", behavior?.kind === "passive" ? "passive" : "");
      item.append(element("span", "name", ref.name ?? behavior?.name ?? ref.id), element("div", "text", describeAbility(ref, def.stats.abilityPower)));
      abilities.appendChild(item);
    }
    page.appendChild(abilities);
    const common = COMMON.map((id) => BEHAVIORS[id]?.name ?? id);
    if (common.length > 0 && def.faction !== "neutral") page.appendChild(element("div", "note", `Like every unit, it can also ${common.join(", ").toLowerCase()}.`));

    const from = evolvesFrom(def.id);
    const into = EVOLUTIONS[def.id] ?? [];
    if (from.length > 0 || into.length > 0) {
      const lines = element("div", "codex-lines");
      if (from.length > 0) lines.appendChild(this.unitLinks("Evolves from", from.map((id) => ({ id, label: undefined }))));
      if (into.length > 0) lines.appendChild(this.unitLinks(into.length > 1 ? "Branches into" : "Evolves into", into.map((e) => ({ id: e.to, label: e.label }))));
      page.appendChild(lines);
    }
    return page;
  }

  private unitLinks(title: string, links: readonly { id: string; label: string | undefined }[]): HTMLElement {
    const row = element("div", "links");
    row.appendChild(element("span", "label", title));
    for (const { id, label } of links) {
      row.appendChild(
        button("doctrine small", label ? `${unitName(id)} (${label})` : unitName(id), () => {
          this.unit = id;
          this.render();
        }),
      );
    }
    return row;
  }

  private renderAbilities(): void {
    const page = element("div", "panel codex-entries");
    const behaviors = Object.entries(BEHAVIORS).sort(([, a], [, b]) => a.name.localeCompare(b.name));
    for (const [id, behavior] of behaviors) {
      const users = Object.values(UNITS).filter((u) => u.abilities.some((a) => a.id === id));
      if (users.length === 0) continue;
      const entry = element("div", "codex-entry");
      const head = element("div", "head");
      head.append(art({ kind: "ability", id }, "small"), element("span", "name", behavior.name), element("span", "kind", behavior.kind === "passive" ? "trait" : "ability"));
      entry.append(head, element("div", "text", describeAbility({ id }, 100)), element("div", "users", users.map((u) => u.name).join(" · ")));
      page.appendChild(entry);
    }
    this.root.appendChild(page);
  }

  private renderEffects(): void {
    const page = element("div", "panel codex-entries");
    const effects = [...EFFECTS.values()].filter((e) => !e.quiet).sort((a, b) => a.name.localeCompare(b.name));
    for (const effect of effects) {
      const entry = element("div", "codex-entry");
      const head = element("div", "head");
      head.append(art({ kind: "effect", id: effect.id }, "small"), element("span", "name", effect.name));
      if (effect.visibility === "secret") head.appendChild(element("span", "kind", "secret"));
      entry.append(head, element("div", "text", effect.describe({ def: effect.id, source: null, stacks: 1, amount: 10 })));
      page.appendChild(entry);
    }
    this.root.appendChild(page);
  }
}
