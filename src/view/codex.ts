import { BEHAVIORS } from "#rules/abilities/index";
import type { UnitDef } from "#rules/battle/types";
import { EFFECTS } from "#rules/effects";
import { FACTIONS } from "#rules/factions";
import { NODES } from "#rules/nodes";
import type { NodeKind } from "#rules/nodes";
import { EVOLUTIONS, RECRUIT_COST, UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { TRIBES, tribeUnits } from "#rules/world/state";
import type { Tribe } from "#rules/world/state";
import { abilityRow, abilityText } from "#view/ability-text";
import { targetingGrids } from "#view/targeting";
import { art } from "#view/art";
import { abilityGroup, abilitySources, effectGroup, effectSources, GROUP_NAMES, GROUPS } from "#view/codex-links";
import type { Group, Source } from "#view/codex-links";
import { button, element } from "#view/dom";

export interface CodexHandlers {
  onBack(): void;
}

type Tab = "units" | "abilities" | "effects" | "nodes";
type Shelf = Playable | Tribe;

const TABS: readonly (readonly [Tab, string])[] = [["units", "Units"], ["abilities", "Abilities"], ["effects", "Effects"], ["nodes", "Nodes"]];

const PLAYABLE = Object.keys(FACTIONS).filter((f): f is Playable => f in FACTIONS);

/** The tribes' names are placeholders until the user names them (`faction-stuff/neutrals/`). */
const TRIBE_NAMES: Readonly<Record<Tribe, string>> = { bandits: "Bandits", gnolls: "Gnolls", drawn: "The Drawn", carnival: "The carnival" };

const isPlayable = (shelf: Shelf): shelf is Playable => shelf in FACTIONS;

const shelfName = (shelf: Shelf) => (isPlayable(shelf) ? FACTIONS[shelf].name : TRIBE_NAMES[shelf]);

const unitsOf = (shelf: Shelf): UnitDef[] =>
  (isPlayable(shelf) ? Object.values(UNITS).filter((u) => u.faction === shelf) : tribeUnits(shelf).flatMap((id) => UNITS[id] ?? []))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

/** The shelf a unit sits on: its faction, or the tribe it belongs to. */
const shelfOf = (def: UnitDef): Shelf | null => (def.faction !== "neutral" ? def.faction : (TRIBES.find((t) => tribeUnits(t).includes(def.id)) ?? null));

/** Which units evolve into this one. */
const evolvesFrom = (id: string) => Object.entries(EVOLUTIONS).filter(([, steps]) => steps.some((s) => s.to === id)).map(([from]) => from);

const unitName = (id: string) => UNITS[id]?.name ?? id;

const isNodeKind = (id: string): id is NodeKind => id in NODES;

/** One row of a list: what it shows, what the search reads, and which shelf it's under. */
interface Entry {
  readonly id: string;
  readonly name: string;
  readonly search: string;
  readonly group: string;
  readonly icon: HTMLElement | null;
  readonly note: string;
}

/**
 * The codex (the user, 2026-10-06: "some sort of guide book/bestiary where you can look at the units and mechanics in
 * the game"): every unit, ability, effect and node, read from the rules themselves, so it can never drift from the
 * game. Each tab is a searchable list and a page; pages link to each other (the user, 2026-10-07: annotate "which
 * units/items/nodes/etc they're associated with").
 */
export class Codex {
  private tab: Tab = "units";
  private shelf: Shelf = "jilliath";
  private readonly picked: Record<Tab, string | null> = { units: null, abilities: null, effects: null, nodes: null };
  private readonly queries: Record<Tab, string> = { units: "", abilities: "", effects: "", nodes: "" };
  /** Each tab's list scroll, kept across re-renders (picking an entry rebuilds the page, not where you were). */
  private readonly scrolls: Record<Tab, number> = { units: 0, abilities: 0, effects: 0, nodes: 0 };
  private shownTab: Tab | null = null;

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

  private open(tab: Tab, id: string): void {
    this.tab = tab;
    this.picked[tab] = id;
    const def = tab === "units" ? UNITS[id] : undefined;
    const shelf = def ? shelfOf(def) : null;
    if (shelf) this.shelf = shelf;
    this.render();
  }

  private render(): void {
    const rows = this.root.querySelector(".codex-list .rows");
    if (this.shownTab && rows) this.scrolls[this.shownTab] = rows.scrollTop;
    this.shownTab = this.tab;
    this.root.replaceChildren();
    const header = element("div", "codex-header");
    header.appendChild(element("div", "title", "Codex"));
    const tabs = element("div", "tabs");
    for (const [tab, label] of TABS) {
      tabs.appendChild(
        button(`action${this.tab === tab ? " selected" : ""}`, label, () => {
          this.tab = tab;
          this.render();
        }),
      );
    }
    header.append(tabs, button("action", "Back", () => this.handlers.onBack()));
    this.root.appendChild(header);
    if (this.tab === "units") this.root.appendChild(this.shelves());
    const entries = this.entries();
    const body = element("div", "codex-body");
    const selected = entries.find((e) => e.id === this.picked[this.tab]) ?? entries[0];
    const list = this.list(entries, selected?.id ?? null);
    body.appendChild(list);
    if (selected) body.appendChild(this.page(selected.id));
    this.root.appendChild(body);
    const shown = list.querySelector(".rows");
    if (shown) shown.scrollTop = this.scrolls[this.tab];
    // A link may open an entry that's out of view: bring it in, without moving a list that already shows it.
    list.querySelector(".codex-row.selected")?.scrollIntoView({ block: "nearest" });
  }

  /** The playable factions, then the tribes, kept apart so it's plain which is which (the user, 2026-10-07). */
  private shelves(): HTMLElement {
    const shelves = element("div", "codex-shelves");
    const group = (label: string, list: readonly Shelf[]) => {
      const box = element("div", "shelf-group");
      box.appendChild(element("span", "label", label));
      for (const shelf of list) {
        box.appendChild(
          button(`doctrine small${this.shelf === shelf ? " selected" : ""}`, shelfName(shelf), () => {
            this.shelf = shelf;
            this.picked.units = null;
            this.scrolls.units = 0;
            this.render();
          }),
        );
      }
      return box;
    };
    shelves.append(group("Playable factions", PLAYABLE), group("Neutral tribes · not playable", TRIBES));
    return shelves;
  }

  private entries(): Entry[] {
    if (this.tab === "units") {
      return unitsOf(this.shelf).map((def) => ({
        id: def.id,
        name: def.name,
        search: def.name,
        group: "",
        icon: art({ kind: "portrait", id: def.id, frame: "icon" }, "thumb"),
        note: `tier ${def.tier}`,
      }));
    }
    if (this.tab === "abilities") {
      return Object.entries(BEHAVIORS)
        .map(([id, b]) => ({
          id,
          name: b.name,
          search: `${b.name} ${b.describe(b.defaults ?? {})}`,
          group: GROUP_NAMES[abilityGroup(id)],
          icon: art({ kind: "ability", id }, "small"),
          note: b.kind === "passive" ? "trait" : "",
        }))
        .sort((a, b) => groupRank(a.group) - groupRank(b.group) || a.name.localeCompare(b.name));
    }
    if (this.tab === "effects") {
      return [...EFFECTS.values()]
        .filter((e) => !e.quiet)
        .map((e) => ({
          id: e.id,
          name: e.name,
          search: `${e.name} ${e.describe({ def: e.id, source: null, stacks: 1, amount: 10 })}`,
          group: GROUP_NAMES[effectGroup(e.id)],
          icon: art({ kind: "effect", id: e.id }, "small"),
          note: e.visibility === "secret" ? "secret" : "",
        }))
        .sort((a, b) => groupRank(a.group) - groupRank(b.group) || a.name.localeCompare(b.name));
    }
    return Object.entries(NODES)
      .map(([id, node]) => ({ id, name: node.name, search: `${node.name} ${node.describe(1)}`, group: "", icon: null, note: "" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** The list, with a search field over it; typing filters the rows without rebuilding the page. */
  private list(entries: readonly Entry[], selected: string | null): HTMLElement {
    const pane = element("div", "panel codex-list");
    const search = element("input", "codex-search");
    search.type = "search";
    search.placeholder = this.tab === "units" ? "Search this shelf" : `Search ${this.tab}`;
    search.value = this.queries[this.tab];
    const rows = element("div", "rows");
    const fill = () => {
      const query = this.queries[this.tab].trim().toLowerCase();
      rows.replaceChildren();
      let group: string | null = null;
      for (const entry of entries) {
        if (query && !entry.search.toLowerCase().includes(query)) continue;
        if (entry.group && entry.group !== group) {
          group = entry.group;
          rows.appendChild(element("div", "codex-group", group));
        }
        const row = button(`codex-row${entry.id === selected ? " selected" : ""}`, [], () => {
          this.picked[this.tab] = entry.id;
          this.render();
        });
        if (entry.icon) row.appendChild(entry.icon.cloneNode(true));
        row.append(element("span", "name", entry.name), element("span", "tier", entry.note));
        rows.appendChild(row);
      }
      if (rows.childElementCount === 0) rows.appendChild(element("div", "note", "Nothing matches."));
    };
    search.addEventListener("input", () => {
      this.queries[this.tab] = search.value;
      fill();
    });
    fill();
    pane.append(search, rows);
    return pane;
  }

  private page(id: string): HTMLElement {
    if (this.tab === "units") {
      const def = UNITS[id];
      return def ? this.unitPage(def) : element("div", "panel codex-page");
    }
    if (this.tab === "abilities") return this.abilityPage(id);
    if (this.tab === "effects") return this.effectPage(id);
    return isNodeKind(id) ? this.nodePage(id) : element("div", "panel codex-page");
  }

  private unitPage(def: UnitDef): HTMLElement {
    const page = element("div", "panel codex-page");
    const top = element("div", "codex-top");
    top.appendChild(art({ kind: "portrait", id: def.id, frame: "bust" }, "codex-bust"));
    const heading = element("div", "heading");
    const shelf = shelfOf(def);
    const where = def.faction !== "neutral" ? `${FACTIONS[def.faction].name}, ${FACTIONS[def.faction].epithet}` : shelf ? `${shelfName(shelf)} · neutral tribe, not playable` : "Neutral";
    heading.append(element("div", "name", def.name), element("div", "subtitle", `${where} · tier ${def.tier}`));
    const stats = element("div", "stats");
    const rows: [string, string][] = [
      ["Health", String(def.stats.maxHp)],
      ...(def.stats.shield > 0 ? [["Shield", String(def.stats.shield)] satisfies [string, string]] : []),
      ["Armor", String(def.stats.armor)],
      ["Initiative", String(def.stats.initiative)],
      ["Ability power", String(def.stats.abilityPower)],
      ...(def.spellCharges ? [["Spell charges", String(def.spellCharges)] satisfies [string, string]] : []),
      ...(RECRUIT_COST[def.id] ? [["Recruit", `${RECRUIT_COST[def.id]} gold`] satisfies [string, string]] : []),
    ];
    for (const [name, value] of rows) stats.append(element("span", "name", name), element("span", "value", value));
    heading.appendChild(stats);
    top.appendChild(heading);
    page.appendChild(top);

    const abilities = element("ul", "abilities");
    const common: string[] = [];
    for (const ref of def.abilities) {
      const behavior = BEHAVIORS[ref.id];
      if (behavior?.kind === "active" && behavior.tags.includes("common")) {
        common.push(behavior.name);
        continue;
      }
      const item = element("li", behavior?.kind === "passive" ? "passive" : "");
      const name = button("codex-link name", ref.name ?? behavior?.name ?? ref.id, () => this.open("abilities", ref.id));
      item.appendChild(abilityRow(def.id, ref, [name], def.stats.abilityPower));
      abilities.appendChild(item);
    }
    page.appendChild(abilities);
    if (common.length > 0) page.appendChild(element("div", "note", `Like every unit, it can also ${common.join(", ").toLowerCase()}.`));

    const from = evolvesFrom(def.id);
    const into = EVOLUTIONS[def.id] ?? [];
    if (from.length > 0 || into.length > 0) {
      const lines = element("div", "codex-lines");
      if (from.length > 0) lines.appendChild(this.links("Evolves from", from.map((id): Source => ({ kind: "unit", id }))));
      if (into.length > 0) lines.appendChild(this.links(into.length > 1 ? "Branches into" : "Evolves into", into.map((e): Source => ({ kind: "unit", id: e.to })), into.map((e) => e.label)));
      page.appendChild(lines);
    }
    return page;
  }

  private abilityPage(id: string): HTMLElement {
    const page = element("div", "panel codex-page");
    const b = BEHAVIORS[id];
    if (!b) return page;
    page.appendChild(this.heading(art({ kind: "ability", id }, "codex-icon"), b.name, b.kind === "passive" ? "Trait" : "Ability"));
    const holder = abilitySources(id).find((s) => s.kind === "unit");
    const grids = holder?.kind === "unit" ? targetingGrids(holder.id, id) : null;
    const row = element("div", "ability-row no-icon");
    row.append(abilityText({ id }, 100), grids ?? element("span", ""));
    page.appendChild(row);
    if ((b.scales ?? []).length > 0) page.appendChild(element("div", "note", "Its numbers here are at ability power 100; a unit's page shows them at its own."));
    const lines = element("div", "codex-lines");
    const sources = abilitySources(id);
    lines.appendChild(sources.length > 0 ? this.links("Who has it", sources) : this.plain("Who has it", "No unit yet: a keyword waiting for an owner."));
    const applies = (b.applies ?? []).filter((e) => !EFFECTS.get(e)?.quiet);
    if (applies.length > 0) lines.appendChild(this.links("What it applies", applies.map((e): Source => ({ kind: "effect", id: e }))));
    page.appendChild(lines);
    return page;
  }

  private effectPage(id: string): HTMLElement {
    const page = element("div", "panel codex-page");
    const effect = EFFECTS.get(id);
    if (!effect) return page;
    page.appendChild(this.heading(art({ kind: "effect", id }, "codex-icon"), effect.name, effect.visibility === "secret" ? "Effect · secret" : "Effect"));
    page.appendChild(element("div", "text", effect.describe({ def: effect.id, source: null, stacks: 1, amount: 10 })));
    page.appendChild(element("div", "note", "Its numbers here are an example; each use sets its own."));
    const lines = element("div", "codex-lines");
    const sources = effectSources(id);
    lines.appendChild(sources.length > 0 ? this.links("Comes from", sources) : this.plain("Comes from", "Nothing yet."));
    const applies = (effect.applies ?? []).filter((e) => !EFFECTS.get(e)?.quiet);
    if (applies.length > 0) lines.appendChild(this.links("Leads to", applies.map((e): Source => ({ kind: "effect", id: e }))));
    page.appendChild(lines);
    return page;
  }

  private nodePage(id: NodeKind): HTMLElement {
    const page = element("div", "panel codex-page");
    const node = NODES[id];
    page.appendChild(this.heading(null, node.name, "Node"));
    const levels = element("ul", "abilities");
    for (const level of [1, 2, 3]) {
      const item = element("li", "");
      const income = [node.income(level) > 0 ? `${node.income(level)} gold a turn` : "", node.mana(level) > 0 ? `${node.mana(level)} mana a turn` : ""].filter((s) => s).join(", ");
      item.append(element("span", "name", `Level ${level}`), element("div", "text", [node.describe(level), income].filter((s) => s).join(" · ")));
      levels.appendChild(item);
    }
    page.appendChild(levels);
    page.appendChild(element("div", "note", "A node belongs to the nearest city: whoever holds the city holds it. Investing raises its level."));
    const seeds = [...node.recruitEffects(1), ...(node.city?.defenderEffects?.(1) ?? [])];
    const gives = seeds.flatMap((seed): Source[] => (seed.ability ? [{ kind: "ability", id: seed.ability.id }] : EFFECTS.get(seed.def)?.quiet ? [] : [{ kind: "effect", id: seed.def }]));
    if (gives.length > 0) {
      const lines = element("div", "codex-lines");
      lines.appendChild(this.links("Gives", gives));
      page.appendChild(lines);
    }
    return page;
  }

  private heading(icon: HTMLElement | null, name: string, kind: string): HTMLElement {
    const top = element("div", "codex-top");
    if (icon) top.appendChild(icon);
    const heading = element("div", "heading");
    heading.append(element("div", "name", name), element("div", "subtitle", kind));
    top.appendChild(heading);
    return top;
  }

  private plain(title: string, text: string): HTMLElement {
    const row = element("div", "links");
    row.append(element("span", "label", title), element("span", "note", text));
    return row;
  }

  /** A row of links: units, abilities, effects and nodes open their page; items and spells are named. */
  private links(title: string, sources: readonly Source[], labels: readonly (string | undefined)[] = []): HTMLElement {
    const row = element("div", "links");
    row.appendChild(element("span", "label", title));
    sources.forEach((source, i) => {
      const label = labels[i];
      if (source.kind === "unit") row.appendChild(button("doctrine small", label ? `${unitName(source.id)} (${label})` : unitName(source.id), () => this.open("units", source.id)));
      else if (source.kind === "ability") row.appendChild(button("doctrine small", BEHAVIORS[source.id]?.name ?? source.id, () => this.open("abilities", source.id)));
      else if (source.kind === "effect") row.appendChild(button("doctrine small", EFFECTS.get(source.id)?.name ?? source.id, () => this.open("effects", source.id)));
      else if (source.kind === "node") row.appendChild(button("doctrine small", `${NODES[source.id].name} (node)`, () => this.open("nodes", source.id)));
      else row.appendChild(element("span", "chip", `${source.name} (${source.kind})`));
    });
    return row;
  }
}

const groupRank = (name: string): number => GROUPS.findIndex((g: Group) => GROUP_NAMES[g] === name);
