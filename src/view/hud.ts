import { BEHAVIORS, describeAbility, paramsOf } from "#rules/abilities/index";
import { effectDef } from "#rules/effects";
import { abilityRef, actionsPerRound, effectiveStats, upcomingSlots } from "#rules/battle/engine";
import type { Battle, BattleEvent, BattleUnit, EffectInstance, Enhancement, LegalAbility, Side } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import { art } from "#view/art";
import { byId, element } from "#view/dom";
import { sees } from "#view/secrecy";
import type { Settings } from "#view/settings";

/** " (overloaded)", " ×3": how an enhanced spell reads in buttons and the log. */
export function enhancementLabel(enhancement: Enhancement): string {
  if (enhancement.kind === "overload") return " (overloaded)";
  if (enhancement.kind === "replicate") return ` ×${enhancement.copies + 1}`;
  return "";
}

/** One button per ability variant: an ability can be offered plain, overloaded and replicated. */
export const optionKey = (option: { abilityId: string; enhancement: Enhancement }) =>
  `${option.abilityId}|${option.enhancement.kind}${option.enhancement.kind === "replicate" ? option.enhancement.copies : ""}`;

/**
 * The ability buttons, in order: one per ability. A replicated spell is one button, its largest version (targets are
 * picked one by one, and it can be cast early); an overloaded one is a toggle on its spell's button (user,
 * 2026-09-27), not a button of its own. Keys 1–9 follow this order.
 */
export function actionButtons(options: readonly LegalAbility[]): LegalAbility[] {
  const largest = (o: LegalAbility) =>
    o.enhancement.kind !== "replicate" || !options.some((x) => x.abilityId === o.abilityId && x.enhancement.kind === "replicate" && x.enhancement.copies > (o.enhancement.kind === "replicate" ? o.enhancement.copies : 0));
  return options.filter((o) => o.enhancement.kind !== "overload" && largest(o));
}

/** The option a button stands for, with its spell's overload toggled on or off. */
export function withOverload(options: readonly LegalAbility[], button: LegalAbility, overloaded: boolean): LegalAbility {
  if (!overloaded || button.enhancement.kind !== "none") return button;
  return options.find((o) => o.abilityId === button.abilityId && o.enhancement.kind === "overload") ?? button;
}

export interface HudHandlers {
  /** A unit in the turn order is hovered (null: no longer). */
  onFocus(unitId: string | null): void;
  onAbility(key: string): void;
  /** A spell's overload toggle was clicked. */
  onOverload(abilityId: string): void;
  /** An ability button is hovered (null: no longer): preview it on every target it can reach. */
  onAbilityHover(key: string | null): void;
  onAuto(): void;
}

export interface BannerButton {
  readonly label: string;
  readonly onClick: () => void;
}

const ROW_NAMES = ["front", "middle", "back"] as const;
const COL_NAMES = ["left", "centre", "right"] as const;

export function unitLabel(unit: BattleUnit, playerSide: Side | null): string {
  const owner = playerSide === null ? `Side ${unit.side + 1}` : unit.side === playerSide ? "Your" : "Enemy";
  return `${owner} ${unit.name}`;
}

function place(unit: BattleUnit): string {
  return `${ROW_NAMES[unit.tile.row]} ${COL_NAMES[unit.tile.col]}`;
}

export class Hud {
  private turnsKey = "";
  private readonly turns = byId("turns");
  private readonly card = byId("card");
  private readonly actions = byId("actions");
  private readonly hint = byId("hint");
  private readonly log = byId("log");
  private readonly banner = byId("banner");
  private readonly auto = byId("auto");

  constructor(
    private readonly settings: Settings,
    private readonly handlers: HudHandlers,
  ) {
    this.auto.addEventListener("click", () => handlers.onAuto());
  }

  renderAuto(available: boolean, on: boolean): void {
    this.auto.hidden = !available;
    this.auto.textContent = on ? "Take control" : "Auto-battle";
    this.auto.classList.toggle("selected", on);
  }

  setVisible(visible: boolean): void {
    for (const el of [this.turns, this.log, this.hint, this.actions, this.auto]) el.hidden = !visible;
    if (!visible) {
      this.card.hidden = true;
      this.banner.hidden = true;
    }
  }

  /**
   * The turn order as portraits: who acts now, who's next. Hovering one highlights the unit. Rebuilt only when the
   * order changes, so a hovered portrait isn't replaced under the pointer.
   */
  renderTurns(battle: Battle, playerSide: Side | null): void {
    const upcoming = upcomingSlots(battle)
      .slice(0, 12)
      .flatMap((id) => {
        const unit = battle.units[id];
        return unit?.alive ? [unit] : [];
      });
    const key = `${battle.round}:${upcoming.map((u) => u.id).join(",")}`;
    if (key === this.turnsKey) return;
    this.turnsKey = key;
    this.turns.replaceChildren();
    this.turns.appendChild(element("div", "round", `Round ${battle.round}`));
    upcoming.forEach((unit, index) => {
      const chip = element("div", `chip side${unit.side}${index === 0 ? " now" : index === 1 ? " next" : ""}`);
      chip.appendChild(art({ kind: "portrait", id: unit.defId }, index === 0 ? "queue-now" : "queue"));
      if (index < 2) chip.appendChild(element("span", "when", index === 0 ? "now" : "next"));
      chip.title = `${unitLabel(unit, playerSide)} (${place(unit)})`;
      chip.addEventListener("mouseenter", () => this.handlers.onFocus(unit.id));
      chip.addEventListener("mouseleave", () => this.handlers.onFocus(null));
      this.turns.appendChild(chip);
    });
  }

  renderCard(battle: Battle, unitId: string | null, playerSide: Side | null, pinned = false): void {
    const unit = unitId ? battle.units[unitId] : undefined;
    this.card.hidden = !unit;
    if (!unit) return;
    const stats = effectiveStats(battle, unit.id);
    const def = UNITS[unit.defId];
    this.card.replaceChildren();
    this.card.className = `panel side${unit.side}`;
    this.card.appendChild(art({ kind: "portrait", id: unit.defId }, "card-portrait"));
    this.card.appendChild(element("div", "title", unit.name));
    if (pinned) this.card.appendChild(element("div", "pin", "Pinned · click it again to release"));
    this.card.appendChild(element("div", "subtitle", `${unitLabel(unit, playerSide).split(" ")[0]}${unit.leader ? " leader" : ""} · tier ${def?.tier ?? "?"} · ${place(unit)}`));

    const hp = element("div", "hp");
    const fill = element("div", "fill");
    fill.style.width = `${(100 * unit.hp) / stats.maxHp}%`;
    hp.appendChild(fill);
    hp.appendChild(element("span", "value", unit.alive ? `${unit.hp} / ${stats.maxHp}` : "Fallen"));
    this.card.appendChild(hp);

    const table = element("div", "stats");
    const row = (name: string, value: number, base: number) => {
      table.appendChild(element("span", "name", name));
      const delta = value - base;
      table.appendChild(element("span", `value${delta > 0 ? " up" : delta < 0 ? " down" : ""}`, delta === 0 ? `${value}` : `${value} (${delta > 0 ? "+" : ""}${delta})`));
    };
    if (stats.shield > 0) {
      table.appendChild(element("span", "name", "Shield"));
      table.appendChild(element("span", "value shield", `${unit.shield} / ${stats.shield}`));
    }
    row("Damage", stats.damage, unit.base.damage);
    row("Armor", stats.armor, unit.base.armor);
    row("Initiative", stats.initiative, unit.base.initiative);
    const battery = def?.spellCharges;
    if (battery !== undefined) {
      table.appendChild(element("span", "name", "Spell charges"));
      table.appendChild(element("span", "value spell", `${unit.spellCharges} / ${battery}`));
    }
    table.appendChild(element("span", "name", "Actions"));
    table.appendChild(element("span", "value", `${actionsPerRound(stats.initiative)} per round`));
    this.card.appendChild(table);

    // Secret effects (a Justiciar's mark) show only to the side that applied them.
    const shown = unit.effects.filter((e) => sees(battle, playerSide, e.def, e.source));
    if (shown.length > 0) {
      const effects = element("div", "effects");
      for (const effect of shown) {
        const tag = element("span", `effect ${effect.def}`);
        tag.append(art({ kind: "effect", id: effect.def }, "tiny"), effectLabel(effect));
        tag.title = effectDef(effect.def).describe(effect);
        effects.appendChild(tag);
      }
      this.card.appendChild(effects);
    }

    const abilities = element("ul", "abilities");
    for (const slot of unit.abilities) {
      const behavior = BEHAVIORS[slot.ref.id];
      if (!behavior || (behavior.kind === "active" && behavior.tags.includes("basic"))) continue;
      const item = element("li", behavior.kind);
      item.appendChild(art({ kind: "ability", id: slot.ref.id }, "small"));
      item.appendChild(element("span", "name", slot.ref.name ?? behavior.name));
      const charges = paramsOf(slot.ref)["charges"];
      if (charges !== undefined) item.appendChild(element("span", "charges", ` ${charges - slot.chargesUsed}/${charges}`));
      item.appendChild(element("div", "text", describeAbility(slot.ref)));
      abilities.appendChild(item);
    }
    this.card.appendChild(abilities);
  }

  /** `overloaded`: the abilities whose overload toggle is on. */
  renderActions(battle: Battle, options: readonly LegalAbility[], selected: string | null, enabled: boolean, overloaded: ReadonlySet<string>): void {
    this.actions.replaceChildren();
    const unitId = battle.current?.unitId;
    const unit = unitId ? battle.units[unitId] : undefined;
    if (!enabled || !unit) return;
    for (const [index, shown] of actionButtons(options).entries()) {
      const option = withOverload(options, shown, overloaded.has(shown.abilityId));
      const slot = element("div", "ability-slot");
      const button = element("button", `action ability${optionKey(option) === selected ? " selected" : ""}`);
      // The icon fills the button (user, 2026-09-27); the words sit on top of it.
      button.appendChild(art({ kind: "ability", id: option.abilityId }, "fill"));
      if (this.settings.data.slotKeys && index < 9) button.appendChild(element("span", "slot", String(index + 1)));
      const replicate = option.enhancement.kind === "replicate";
      button.appendChild(element("span", "name", `${option.name}${replicate ? " (replicate)" : ""}`));
      const plain = options.find((o) => o.abilityId === option.abilityId && o.enhancement.kind === "none");
      const perCopy = replicate && plain && option.enhancement.kind === "replicate" ? (option.spellCost - plain.spellCost) / option.enhancement.copies : 0;
      if (option.spellCost > 0) button.appendChild(element("span", "tag spell", replicate ? `+${perCopy} ⚡ per copy` : `${option.spellCost} ⚡`));
      const key = option.enhancement.kind === "none" ? this.settings.keyFor(option.abilityId) : undefined;
      if (key) button.appendChild(element("span", "key", key.toUpperCase()));
      const ref = abilityRef(unit, option.abilityId);
      const charges = paramsOf(ref)["charges"];
      const used = unit.abilities.find((s) => s.ref.id === option.abilityId)?.chargesUsed ?? 0;
      if (charges !== undefined) button.appendChild(element("span", "tag", `${charges - used}/${charges}`));
      button.title = `${describeAbility(ref)}${key ? ` (${key.toUpperCase()})` : ""}`;
      button.addEventListener("click", () => this.handlers.onAbility(optionKey(option)));
      button.addEventListener("mouseenter", () => this.handlers.onAbilityHover(optionKey(option)));
      button.addEventListener("mouseleave", () => this.handlers.onAbilityHover(null));
      slot.appendChild(button);
      const overload = options.find((o) => o.abilityId === shown.abilityId && o.enhancement.kind === "overload");
      if (overload && shown.enhancement.kind === "none") {
        const on = overloaded.has(shown.abilityId);
        const toggle = element("button", `overload${on ? " on" : ""}`, `Overload +${overload.spellCost - shown.spellCost} ⚡`);
        toggle.title = on ? "Overloaded: click to cast it plain." : "Click to overload this spell: it reaches wider, for more charges.";
        toggle.addEventListener("click", () => this.handlers.onOverload(shown.abilityId));
        slot.appendChild(toggle);
      }
      this.actions.appendChild(slot);
    }
  }

  setHint(text: string): void {
    this.hint.textContent = text;
  }

  appendLog(events: readonly BattleEvent[], battle: Battle, playerSide: Side | null): void {
    const name = (id: string) => {
      const unit = battle.units[id];
      return unit ? unitLabel(unit, playerSide) : id;
    };
    for (const event of events) {
      const line = describe(event, name, playerSide);
      if (!line) continue;
      const entry = element("div", `entry ${event.type}`, line);
      this.log.appendChild(entry);
    }
    while (this.log.childElementCount > 80) this.log.firstElementChild?.remove();
    this.log.scrollTop = this.log.scrollHeight;
  }

  clearLog(): void {
    this.log.replaceChildren();
  }

  showOutcome(battle: Battle, playerSide: Side | null, buttons: readonly BannerButton[]): void {
    const outcome = battle.outcome;
    this.banner.hidden = !outcome;
    if (!outcome) return;
    this.banner.replaceChildren();
    const title =
      outcome.winner === null
        ? "None survive"
        : playerSide === null
          ? `Side ${outcome.winner + 1} prevails`
          : outcome.winner === playerSide
            ? "Victory"
            : "Defeat";
    this.banner.appendChild(element("div", "title", title));
    this.banner.appendChild(element("div", "subtitle", `after ${battle.round} round${battle.round === 1 ? "" : "s"}`));
    for (const { label, onClick } of buttons) {
      const button = element("button", "action", label);
      button.addEventListener("click", onClick);
      this.banner.append(button, " ");
    }
  }
}

/** "Punished ×2", "Bleeding 30": an effect's name with its stacks and amount. */
function effectLabel(effect: EffectInstance): string {
  const stacks = effect.stacks > 1 ? ` ×${effect.stacks}` : "";
  const amount = effect.amount > 0 ? ` ${effect.amount}` : "";
  return `${effectDef(effect.def).name}${stacks}${amount}`;
}

function describe(event: BattleEvent, name: (id: string) => string, playerSide: Side | null): string | null {
  switch (event.type) {
    case "roundStart":
      return `Round ${event.round}`;
    case "ability": {
      const ability = `${BEHAVIORS[event.abilityId]?.name ?? event.abilityId}${enhancementLabel(event.enhancement)}`;
      const targets = event.targets.filter((t) => t !== event.unitId).map(name);
      return targets.length > 0 ? `${name(event.unitId)}: ${ability} → ${targets.join(", ")}` : `${name(event.unitId)}: ${ability}`;
    }
    case "damage":
      return event.source === null ? `${name(event.unitId)} bleeds ${event.amount}` : `${name(event.unitId)} takes ${event.amount}`;
    case "heal":
      return `${name(event.unitId)} heals ${event.amount}`;
    case "shieldHit":
      return `${name(event.unitId)}'s shield absorbs ${event.amount}`;
    case "shieldRestored":
      return `${name(event.unitId)}'s shield restored by ${event.amount}`;
    case "death":
      return `${name(event.unitId)} falls`;
    case "deathPrevented":
      return `${name(event.unitId)} refuses to fall`;
    case "effect": {
      const def = effectDef(event.effect);
      return def.quiet || def.id === "defending" ? null : `${name(event.unitId)}: ${def.name.toLowerCase()}`;
    }
    case "effectEnded":
      return null;
    case "absorbed":
      return `${name(event.unitId)}'s ${effectDef(event.by).name.toLowerCase()} absorbs ${event.amount}`;
    case "move":
      return `${name(event.unitId)} is dragged to the front`;
    case "countered":
      return `${name(event.unitId)}'s action is countered!`;
    case "skipped":
      return event.reason === "stunned" ? `${name(event.unitId)} is stunned` : `${name(event.unitId)} cannot act`;
    case "battleEnd":
      if (event.outcome.winner === null) return "None survive.";
      if (event.outcome.withdrew) return `Neither side can finish the other: the attackers withdraw. ${playerSide === null ? "The defenders hold the field." : playerSide === 1 ? "Victory." : "Defeat."}`;
      return playerSide === null ? `Side ${event.outcome.winner + 1} prevails.` : event.outcome.winner === playerSide ? "Victory." : "Defeat.";
    case "turnStart":
      return null;
  }
}
