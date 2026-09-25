import { BEHAVIORS, paramsOf } from "#rules/abilities/index";
import { effectDef } from "#rules/effects";
import { abilityRef, actionsPerRound, effectiveStats, upcomingSlots } from "#rules/battle/engine";
import type { Battle, BattleEvent, BattleUnit, LegalAbility, Side } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import { abilityText, effectLabel, effectText } from "#view/text";
import { byId, element } from "#view/dom";

export interface HudHandlers {
  onAbility(abilityId: string): void;
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
  private readonly turns = byId("turns");
  private readonly card = byId("card");
  private readonly actions = byId("actions");
  private readonly hint = byId("hint");
  private readonly log = byId("log");
  private readonly banner = byId("banner");
  private readonly auto = byId("auto");

  constructor(private readonly handlers: HudHandlers) {
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

  renderTurns(battle: Battle, playerSide: Side | null): void {
    this.turns.replaceChildren();
    this.turns.appendChild(element("div", "round", `Round ${battle.round}`));
    upcomingSlots(battle).slice(0, 14).forEach((id, index) => {
      const unit = battle.units[id];
      if (!unit?.alive) return;
      const chip = element("div", `chip side${unit.side}${index === 0 ? " now" : ""}`, unit.name);
      chip.title = `${unitLabel(unit, playerSide)} (${place(unit)})`;
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
    table.appendChild(element("span", "name", "Actions"));
    table.appendChild(element("span", "value", `${actionsPerRound(stats.initiative)} per round`));
    this.card.appendChild(table);

    // A Justiciar's mark stays secret from the marked unit's own side.
    const shown = unit.effects.filter((e) => !(effectDef(e.def).visibility === "hiddenFromBearerSide" && unit.side === playerSide));
    if (shown.length > 0) {
      const effects = element("div", "effects");
      for (const effect of shown) {
        const tag = element("span", `effect ${effect.def}`, effectLabel(effect));
        tag.title = effectText(effect);
        effects.appendChild(tag);
      }
      this.card.appendChild(effects);
    }

    const abilities = element("ul", "abilities");
    for (const slot of unit.abilities) {
      const behavior = BEHAVIORS[slot.ref.id];
      if (!behavior || (behavior.kind === "active" && behavior.tags.includes("basic"))) continue;
      const item = element("li", behavior.kind);
      item.appendChild(element("span", "name", slot.ref.name ?? behavior.name));
      const charges = paramsOf(slot.ref)["charges"];
      if (charges !== undefined) item.appendChild(element("span", "charges", ` ${charges - slot.chargesUsed}/${charges}`));
      item.appendChild(element("div", "text", abilityText(slot.ref)));
      abilities.appendChild(item);
    }
    this.card.appendChild(abilities);
  }

  renderActions(battle: Battle, options: readonly LegalAbility[], selected: string | null, enabled: boolean): void {
    this.actions.replaceChildren();
    const unitId = battle.current?.unitId;
    const unit = unitId ? battle.units[unitId] : undefined;
    if (!enabled || !unit) return;
    for (const option of options) {
      const button = element("button", `action${option.abilityId === selected ? " selected" : ""}`);
      button.appendChild(element("span", "name", option.name));
      const ref = abilityRef(unit, option.abilityId);
      const charges = paramsOf(ref)["charges"];
      const used = unit.abilities.find((s) => s.ref.id === option.abilityId)?.chargesUsed ?? 0;
      if (charges !== undefined) button.appendChild(element("span", "tag", `${charges - used}/${charges}`));
      button.title = abilityText(ref);
      button.addEventListener("click", () => this.handlers.onAbility(option.abilityId));
      this.actions.appendChild(button);
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

function describe(event: BattleEvent, name: (id: string) => string, playerSide: Side | null): string | null {
  switch (event.type) {
    case "roundStart":
      return `Round ${event.round}`;
    case "ability": {
      const ability = BEHAVIORS[event.abilityId]?.name ?? event.abilityId;
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
    case "negated":
      return `${name(event.unitId)}'s action is negated!`;
    case "skipped":
      return event.reason === "stunned" ? `${name(event.unitId)} is stunned` : `${name(event.unitId)} cannot act`;
    case "battleEnd":
      if (event.outcome.winner === null) return "None survive.";
      return playerSide === null ? `Side ${event.outcome.winner + 1} prevails.` : event.outcome.winner === playerSide ? "Victory." : "Defeat.";
    case "turnStart":
      return null;
  }
}
