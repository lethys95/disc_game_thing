import { describeReward, describeTask, TASK_NAMES } from "#rules/battle/tarot";
import type { TarotCard, TarotHand } from "#rules/battle/tarot";
import { BEHAVIORS, chargesOf } from "#rules/abilities/index";
import { abilityRow } from "#view/ability-text";
import { hitChange } from "#view/members";
import { effectDef } from "#rules/effects";
import { abilityRef, actionsPerRound, effectiveStats, unitAbilities, upcomingSlots } from "#rules/battle/engine";
import type { AbilityRef, Battle, BattleEvent, BattleUnit, EffectInstance, Enhancement, LegalAbility, Side, Stats } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import { art } from "#view/art";
import { miniStack, TarotFan } from "#view/tarot-hand";
import type { CardCue, FanCard } from "#view/tarot-hand";
import { byId, element, skull } from "#view/dom";
import { explain } from "#view/explain";
import { sees } from "#view/secrecy";
import type { Settings } from "#view/settings";
import { armorReduction } from "#rules/battle/damage";

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
  /** Play the rest of the battle at once, without animations (D2's auto-resolve). */
  onResolve(): void;
  /** A tarot card is flicked through, picked or turned over. */
  onCue(sound: CardCue): void;
}

export interface BannerButton {
  readonly label: string;
  readonly onClick: () => void;
}

const ROW_NAMES = ["front", "middle", "back"] as const;
const ROMAN = ["", "I", "II", "III", "IV", "V"] as const;
const COL_NAMES = ["left", "centre", "right"] as const;

export function unitLabel(unit: BattleUnit, playerSide: Side | null): string {
  const owner = playerSide === null ? `Side ${unit.side + 1}` : unit.side === playerSide ? "Your" : "Enemy";
  return `${owner} ${unit.name}`;
}

function place(unit: BattleUnit): string {
  return `${ROW_NAMES[unit.tile.row]} ${COL_NAMES[unit.tile.col]}`;
}

/**
 * The battle's interface as one piece of architecture around the field (`docs/design/hud-kit.md`): a beam across the
 * top carrying the turn order, a sill along the bottom with the ability sockets, the unit card as a stele rising from
 * its left end and the log as a shorter one at its right.
 */
export class Hud {
  private turnsKey = "";
  private readonly battlehud = byId("battlehud");
  private readonly turns = byId("turns");
  private readonly card = byId("card");
  private readonly actions = byId("actions");
  private readonly rules = byId("rules");
  private readonly hint = byId("hint");
  private readonly log = byId("log");
  private readonly logStele = byId("logstele");
  private readonly banner = byId("banner");
  private readonly auto = byId("auto");
  private readonly resolve = byId("resolve");
  private readonly tarot = byId("tarot");
  private readonly tarotIcon = byId("tarot-icon");
  private readonly fan: TarotFan;
  private tarotEntries: FanCard[] = [];
  private tarotKeyShown = "";
  /** The socket under the pointer: re-renders replace the sockets, and its rules must stay up. */
  private ruled: string | null = null;
  /** The hint line's own text, and what names a hovered object in its place (`setHint`). */
  private hintText = "";
  private hovered: string | null = null;

  constructor(
    private readonly settings: Settings,
    private readonly handlers: HudHandlers,
  ) {
    this.auto.addEventListener("click", () => handlers.onAuto());
    this.resolve.addEventListener("click", () => handlers.onResolve());
    this.resolve.setAttribute("aria-label", "Resolve now");
    explain(this.resolve, "Resolve now", "Plays the rest of the battle at once, without animations.");
    this.resolve.dataset["hint"] = "Resolve now: play the rest of the battle at once.";
    for (const object of [this.auto, this.resolve]) {
      object.addEventListener("mouseenter", () => this.hover(object.dataset["hint"] ?? null));
      object.addEventListener("mouseleave", () => this.hover(null));
    }
    byId("unroll").addEventListener("click", () => this.unrollLog(!this.logStele.classList.contains("open")));
    this.fan = new TarotFan(this.tarot, (sound) => handlers.onCue(sound));
    this.tarotIcon.addEventListener("click", () => {
      if (this.fan.showing) return this.fan.close();
      this.fan.browse(this.tarotEntries, "The cards in play.", () => this.fan.close());
    });
  }

  /** The two objects hanging from the beam: an hourglass (resolve now) and a puppeteer's cross (the AI plays you). */
  renderAuto(available: boolean, on: boolean): void {
    this.auto.hidden = !available;
    this.resolve.hidden = !available;
    const name = on ? "Take control" : "Auto-battle";
    this.auto.setAttribute("aria-label", name);
    explain(this.auto, name, on ? "The AI is playing your side. Click to play it yourself again." : "Let the AI play your side. Click again to take it back.");
    this.auto.dataset["hint"] = on ? "Take control: play your side yourself again." : "Auto-battle: the AI plays your side.";
    this.auto.classList.toggle("selected", on);
  }

  setVisible(visible: boolean): void {
    this.battlehud.hidden = !visible;
    if (!visible) {
      this.card.hidden = true;
      this.banner.hidden = true;
      this.unrollLog(false);
      this.hideTarot();
      this.tarotIcon.hidden = true;
    }
  }

  private hover(name: string | null): void {
    this.hovered = name;
    this.hint.textContent = name ?? this.hintText;
  }

  /** The log's stele shows its last lines; unrolled, the whole battle reads as a scroll. */
  private unrollLog(open: boolean): void {
    this.logStele.classList.toggle("open", open);
    this.log.scrollTop = this.log.scrollHeight;
  }

  /**
   * Tarot, the user's way (2026-10-05): the owner sees a hand face up and picks one; the other side sees as many cards
   * face down, then the picked one turned over: its name and picture, never what it asks or pays. Cards float in a fan
   * at the centre, to flick through (`view/tarot-hand.ts`).
   */
  showTarot(hand: TarotHand, battle: Battle, playerSide: Side | null, onPick: (card: number) => void): void {
    const name = unitNamer(battle, playerSide);
    const drawer = battle.units[hand.unitId];
    this.fan.pick(
      hand.cards.map((card) => ({ card, caption: () => ownCaption(card, name, "open") })),
      `${drawer?.name ?? "Your unit"} draws ${hand.cards.length} cards. Pick one: the enemy will see which, never what it does.`,
      onPick,
    );
  }

  /** The enemy's hand as the other side sees it: face down, then the picked card turned over. */
  showEnemyTarot(hand: TarotHand, battle: Battle, onDone: () => void): void {
    const picked = hand.cards[hand.chosen ?? 0];
    if (!picked || hand.chosen === null) return onDone();
    this.fan.reveal(
      hand.cards.length,
      hand.chosen,
      picked,
      () => theirCaption(picked),
      `The enemy ${battle.units[hand.unitId]?.name ?? "unit"} draws ${hand.cards.length} cards and turns one over.`,
      onDone,
    );
  }

  hideTarot(): void {
    if (this.fan.showing) this.fan.close();
  }

  /** The fan's keys while it's open (arrows, Enter, Escape). */
  tarotKey(e: KeyboardEvent): boolean {
    return this.fan.key(e);
  }

  /**
   * The held cards as a small fanned stack in the HUD, once any card is in play; it opens them in the fan: the player's
   * in full (task, reward, state), the enemy's by name and picture only.
   */
  renderTarotStatus(battle: Battle, playerSide: Side | null): void {
    const held = battle.tarot.filter((h) => h.chosen !== null);
    this.tarotIcon.hidden = held.length === 0;
    if (held.length === 0) return;
    const name = unitNamer(battle, playerSide);
    const entries = held.flatMap((hand) => {
      const card = hand.cards[hand.chosen ?? 0];
      if (!card) return [];
      const ours = playerSide === null || hand.side === playerSide;
      return [{ card, caption: () => (ours ? ownCaption(card, name, hand.state) : theirCaption(card)) }];
    });
    const key = held.map((h) => `${h.side}${h.chosen}${h.state}${h.cards.length}`).join("|");
    if (key !== this.tarotKeyShown) {
      this.tarotKeyShown = key;
      this.tarotIcon.replaceChildren(...miniStack(entries.map((e) => e.card)));
      explain(this.tarotIcon, `Tarot: ${entries.length} card${entries.length === 1 ? "" : "s"} in play`, "Click to look at them.");
    }
    this.tarotEntries = entries;
  }

  /**
   * The turn order on the beam: the round's medallion, then a niche per unit in acting order, the acting one larger,
   * each over a band of its side's colour. Hovering one highlights the unit. Rebuilt only when the order changes, so a
   * hovered portrait isn't replaced under the pointer.
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
    const round = element("div", "round");
    round.append(element("span", "label", "Round"), element("span", "number", String(battle.round)));
    this.turns.appendChild(explain(round, `Round ${battle.round}`, "The faces along the beam act in this order."));
    upcoming.forEach((unit, index) => {
      const niche = element("div", `niche side${unit.side}${index === 0 ? " now" : index === 1 ? " next" : ""}`);
      const window = element("div", "window");
      window.appendChild(art({ kind: "portrait", id: unit.defId, frame: "icon" }, index === 0 ? "queue-now" : "queue"));
      niche.append(window, element("span", "band"));
      if (index < 2) niche.appendChild(element("span", "when", index === 0 ? "now" : "next"));
      explain(niche, unitLabel(unit, playerSide), `Stands ${place(unit)}. ${index === 0 ? "Acting now." : index === 1 ? "Acts next." : "Acts later this round or the next."}`);
      niche.addEventListener("mouseenter", () => this.handlers.onFocus(unit.id));
      niche.addEventListener("mouseleave", () => this.handlers.onFocus(null));
      this.turns.appendChild(niche);
    });
  }

  renderCard(battle: Battle, unitId: string | null, playerSide: Side | null, pinned = false): void {
    const unit = unitId ? battle.units[unitId] : undefined;
    this.card.hidden = !unit;
    if (!unit) return;
    const stats = effectiveStats(battle, unit.id);
    const def = UNITS[unit.defId];
    this.card.replaceChildren();
    // The niche: a hooded figure holding the portrait at her chest, her hands over its frame, her wings rising whole.
    const niche = element("div", "niche");
    const window = element("div", "window");
    window.appendChild(art({ kind: "portrait", id: unit.defId, frame: "bust" }, "niche-portrait"));
    niche.append(element("div", "figure"), window, element("div", "hands"));
    if (pinned) niche.appendChild(explain(element("span", "pin"), "Pinned", "This card stays put. Click the unit again to release it."));
    this.card.appendChild(niche);
    // The plate in the stone below says who: its enamel band is the side's colour, the numeral its tier, a crown a
    // leader; the words (whose, where it stands) wait under a held right-click.
    const tier = def?.tier ?? 1;
    const plate = element("div", `plate side${unit.side}`);
    if (unit.leader) plate.appendChild(element("span", "crown", "♛"));
    plate.append(element("span", "tier", ROMAN[tier] ?? String(tier)), unit.name);
    this.card.appendChild(explain(plate, unitLabel(unit, playerSide), `Tier ${tier}${unit.leader ? ", leading its warband" : ""}. Stands ${place(unit)}.`));

    // Everything with words sits in one recessed panel, so the stone around it can be carved and the text stays legible.
    const inset = element("div", "inset");
    inset.appendChild(instruments(unit, stats, def?.spellCharges));
    // Secret effects (a Justiciar's mark) show only to the side that applied them.
    const shown = unit.effects.filter((e) => sees(battle, playerSide, e.def, e.source));
    if (shown.length > 0) {
      const effects = element("div", "effects");
      for (const effect of shown) {
        const tag = element("span", `effect ${effect.def}`);
        tag.append(art({ kind: "effect", id: effect.def }, "tiny"), effectLabel(effect));
        explain(tag, effectLabel(effect), effectDef(effect.def).describe(effect));
        effects.appendChild(tag);
      }
      inset.appendChild(effects);
    }
    const abilities = element("ul", "abilities");
    for (const ref of unitAbilities(battle, unit.id)) {
      const behavior = BEHAVIORS[ref.id];
      if (!behavior || (behavior.kind === "active" && behavior.tags.includes("common"))) continue;
      const item = element("li", behavior.kind);
      const charges = chargesOf(ref);
      const head = [element("span", "name", ref.name ?? behavior.name), ...(charges !== undefined ? [element("span", "charges", ` ${charges - (unit.chargesUsed[ref.id] ?? 0)}/${charges}`)] : [])];
      item.appendChild(abilityRow(unit.defId, ref, head, stats.abilityPower));
      abilities.appendChild(item);
    }
    inset.appendChild(abilities);
    this.card.appendChild(inset);
  }

  /**
   * The sockets: one per active ability of the acting unit, in its own order. One that can't be used now (spent, no
   * target, not after a wait) stays as a dark socket instead of disappearing: the sill never changes shape. Keys 1–9
   * number only the usable ones, as the keyboard does (`actionButtons`). While the player waits, the sill keeps as many
   * sockets, empty, as the player's next unit will have. `overloaded`: the abilities whose overload toggle is on.
   */
  renderActions(battle: Battle, playerSide: Side | null, options: readonly LegalAbility[], selected: string | null, enabled: boolean, overloaded: ReadonlySet<string>): void {
    this.actions.replaceChildren();
    const unitId = battle.current?.unitId;
    const unit = unitId ? battle.units[unitId] : undefined;
    if (!enabled || !unit) {
      const next = upcomingSlots(battle).map((id) => battle.units[id]).find((u) => u?.alive && u.side === playerSide);
      const count = next ? activeAbilities(battle, next.id).length : 0;
      for (let i = 0; i < count; i++) this.actions.appendChild(element("div", "socket empty"));
      this.showRules(null);
      return;
    }
    const buttons = actionButtons(options);
    const power = effectiveStats(battle, unit.id).abilityPower;
    const refs = activeAbilities(battle, unit.id);
    for (const ref of refs) {
      const index = buttons.findIndex((b) => b.abilityId === ref.id);
      const shown = buttons[index];
      this.actions.appendChild(shown ? this.socket(battle, unit, options, shown, index, selected, overloaded) : this.darkSocket(unit, ref, power));
    }
    const ruled = refs.find((ref) => ref.id === this.ruled);
    this.showRules(ruled ? rulesSlip(unit, ruled, power, buttons.some((b) => b.abilityId === ruled.id)) : null);
  }

  private socket(battle: Battle, unit: BattleUnit, options: readonly LegalAbility[], shown: LegalAbility, index: number, selected: string | null, overloaded: ReadonlySet<string>): HTMLElement {
    const option = withOverload(options, shown, overloaded.has(shown.abilityId));
    const chosen = optionKey(option) === selected;
    const socket = element("div", `socket${chosen ? " selected" : ""}`);
    const button = element("button", `action ability${chosen ? " selected" : ""}`);
    // The icon fills the socket (user, 2026-09-27); the name sits on it, the keys and uses hang below it.
    const well = element("span", "well");
    const replicate = option.enhancement.kind === "replicate";
    well.append(art({ kind: "ability", id: option.abilityId }, "fill"), element("span", "name", `${option.name}${replicate ? " (replicate)" : ""}`));
    button.appendChild(well);
    if (this.settings.data.slotKeys && index < 9) button.appendChild(element("span", "slot", String(index + 1)));
    const key = option.enhancement.kind === "none" ? this.settings.keyFor(option.abilityId) : undefined;
    if (key) button.appendChild(element("span", "key", key.toUpperCase()));
    const charges = chargesOf(abilityRef(battle, unit.id, option.abilityId));
    if (charges !== undefined) button.appendChild(beads(charges - (unit.chargesUsed[option.abilityId] ?? 0), charges));
    const plain = options.find((o) => o.abilityId === option.abilityId && o.enhancement.kind === "none");
    const perCopy = replicate && plain && option.enhancement.kind === "replicate" ? (option.spellCost - plain.spellCost) / option.enhancement.copies : 0;
    if (option.spellCost > 0) button.appendChild(cells(replicate ? perCopy : option.spellCost));
    button.addEventListener("click", () => this.handlers.onAbility(optionKey(option)));
    button.addEventListener("mouseenter", () => {
      this.ruled = option.abilityId;
      this.handlers.onAbilityHover(optionKey(option));
    });
    button.addEventListener("mouseleave", () => {
      this.ruled = null;
      this.handlers.onAbilityHover(null);
    });
    socket.appendChild(button);
    const overload = options.find((o) => o.abilityId === shown.abilityId && o.enhancement.kind === "overload");
    if (overload && shown.enhancement.kind === "none") {
      const on = overloaded.has(shown.abilityId);
      const toggle = element("button", `overload${on ? " on" : ""}`, `+${overload.spellCost - shown.spellCost}`);
      explain(toggle, on ? "Overloaded" : "Overload", `It reaches wider, for ${overload.spellCost - shown.spellCost} more charges.`, on ? "Click to cast it plain." : "Click to overload it.");
      toggle.addEventListener("click", () => this.handlers.onOverload(shown.abilityId));
      socket.appendChild(toggle);
    }
    return socket;
  }

  private darkSocket(unit: BattleUnit, ref: AbilityRef, power: number): HTMLElement {
    const socket = element("div", "socket dark");
    const well = element("span", "well");
    well.append(art({ kind: "ability", id: ref.id }, "fill"), element("span", "name", ref.name ?? BEHAVIORS[ref.id]?.name ?? ref.id));
    socket.appendChild(well);
    const charges = chargesOf(ref);
    if (charges !== undefined) socket.appendChild(beads(charges - (unit.chargesUsed[ref.id] ?? 0), charges));
    socket.addEventListener("mouseenter", () => {
      this.ruled = ref.id;
      this.showRules(rulesSlip(unit, ref, power, false));
    });
    socket.addEventListener("mouseleave", () => {
      this.ruled = null;
      this.showRules(null);
    });
    return socket;
  }

  /** The hovered socket's rules on a parchment slip right above the sill (or nothing). */
  private showRules(slip: HTMLElement | null): void {
    this.rules.hidden = !slip;
    this.rules.replaceChildren(...(slip ? [slip] : []));
  }

  /** The hint line says what the game wants now, or names the object under the pointer while one is hovered. */
  setHint(text: string): void {
    this.hintText = text;
    this.hint.textContent = this.hovered ?? text;
  }

  appendLog(events: readonly BattleEvent[], battle: Battle, playerSide: Side | null): void {
    const name = (id: string) => {
      const unit = battle.units[id];
      return unit ? unitLabel(unit, playerSide) : id;
    };
    for (const event of events) {
      const line = describe(event, name, playerSide, battle);
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

/** A unit's abilities it acts with (not its passives), in its own order. */
function activeAbilities(battle: Battle, unitId: string): AbilityRef[] {
  return unitAbilities(battle, unitId).filter((ref) => BEHAVIORS[ref.id]?.kind === "active");
}

/**
 * The card's instruments: each value its own shape (`docs/design/hud-kit.md`). Health is a channel with the current
 * number in a seal; armour a shield, initiative an hourglass with a stud per action, ability power a rayed disc, spell
 * charges a row of cells.
 */
function instruments(unit: BattleUnit, stats: Stats, battery: number | undefined): HTMLElement {
  const box = element("div", "instruments");
  const health = element("div", "health");
  const seal = element("span", "seal", unit.alive ? String(unit.hp) : "");
  if (!unit.alive) seal.appendChild(skull());
  if (stats.shield > 0) seal.appendChild(element("span", "shield-seal", String(unit.shield)));
  const channel = element("div", "channel");
  const fill = element("div", "fill");
  fill.style.width = `${(100 * unit.hp) / stats.maxHp}%`;
  channel.appendChild(fill);
  if (stats.shield > 0) {
    const band = element("div", "shield");
    band.style.width = `${(100 * unit.shield) / stats.shield}%`;
    channel.appendChild(band);
  }
  health.append(seal, channel, element("span", "max", unit.alive ? String(stats.maxHp) : ""));
  const shieldLine = stats.shield > 0 ? [`Shield ${unit.shield} of ${stats.shield}: it takes hits before health does.`] : [];
  explain(health, unit.alive ? `Health ${unit.hp} of ${stats.maxHp}` : "Fallen", ...shieldLine);
  box.appendChild(health);

  const badges = element("div", "badges");
  const actions = actionsPerRound(stats.initiative);
  badges.append(
    badge("armor", "Armor", stats.armor, unit.base.armor, stats.armor > 0 ? `Takes ${armorReduction(stats.armor)}% off each hit.` : "No armor: hits land in full."),
    badge("initiative", "Initiative", stats.initiative, unit.base.initiative, `${actions} action${actions === 1 ? "" : "s"} a round, one stud each.`, actions),
    badge("power", "Ability power", stats.abilityPower, unit.base.abilityPower, "Its abilities' numbers grow with it."),
  );
  if (battery !== undefined) {
    badges.appendChild(explain(element("span", "badge charges"), `Spell charges ${unit.spellCharges} of ${battery}`, "Its spells spend them. They come back after the battle."));
    badges.lastElementChild?.appendChild(cells(unit.spellCharges, battery));
  }
  const hits = hitChange(stats);
  if (hits) {
    const dealt = element("span", `badge hits ${stats.hitBonus + stats.hitPercent > 0 ? "up" : "down"}`);
    dealt.append(element("span", "shape"), element("span", "value", hits.replace(" to its hits", "")));
    badges.appendChild(explain(dealt, "Damage dealt", `${capitalize(hits)}, from its effects.`));
  }
  box.appendChild(badges);
  return box;
}

/** A value in its shape, lit when raised and red when lowered against the unit's own. What it means: hold right-click. */
function badge(kind: string, name: string, value: number, base: number, meaning: string, studs = 0): HTMLElement {
  const box = element("span", `badge ${kind}`);
  const delta = value - base;
  box.append(element("span", "shape"), element("span", `value${delta > 0 ? " up" : delta < 0 ? " down" : ""}`, String(value)));
  if (studs > 0) box.appendChild(element("span", "studs", "●".repeat(studs)));
  const change = delta === 0 ? [] : [`${base} of its own, ${delta > 0 ? "+" : ""}${delta} from effects.`];
  return explain(box, `${name} ${value}`, meaning, ...change);
}

/** Uses left as beads that go dark when spent ("1/1" before). */
function beads(left: number, of: number): HTMLElement {
  const row = element("span", "uses");
  explain(row, `${left} of ${of} left`, "Uses for this battle.");
  for (let i = 0; i < of; i++) row.appendChild(element("span", i < left ? "bead" : "bead spent"));
  return row;
}

/** Spell charges as cells: `of` cells with `full` lit, or `full` lit cells alone for a cost. */
function cells(full: number, of = full): HTMLElement {
  const row = element("span", "cells");
  explain(row, of === full ? `Costs ${full} spell charge${full === 1 ? "" : "s"}` : `${full} of ${of} spell charges`);
  for (let i = 0; i < of; i++) row.appendChild(element("span", i < full ? "cell" : "cell spent"));
  return row;
}

/** A socket's rules for its slip: its row as on the card, and why it's dark when it is. */
function rulesSlip(unit: BattleUnit, ref: AbilityRef, power: number, usable: boolean): HTMLElement {
  const charges = chargesOf(ref);
  const left = charges === undefined ? undefined : charges - (unit.chargesUsed[ref.id] ?? 0);
  const head = [element("span", "name", ref.name ?? BEHAVIORS[ref.id]?.name ?? ref.id), ...(charges !== undefined ? [element("span", "charges", ` ${left}/${charges}`)] : [])];
  const slip = element("div", "slip");
  slip.appendChild(abilityRow(unit.defId, ref, head, power));
  if (!usable) slip.appendChild(element("div", "why", left === 0 ? "Spent for this battle." : "Not now: nothing it can reach, or not on this action."));
  return slip;
}

/** "Punished ×2", "Bleeding 30": an effect's name with its stacks and amount. */
function effectLabel(effect: EffectInstance): string {
  const stacks = effect.stacks > 1 ? ` ×${effect.stacks}` : "";
  const amount = effect.amount > 0 ? ` ${effect.amount}` : "";
  return `${effectDef(effect.def).name}${stacks}${amount}`;
}

function describe(event: BattleEvent, name: (id: string) => string, playerSide: Side | null, battle: Battle): string | null {
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
    case "revived":
      return `${name(event.unitId)} rises`;
    case "crit":
      return `${name(event.unitId)}: a critical hit on ${name(event.target)}`;
    case "evaded":
      return `${name(event.unitId)} evades the hit`;
    case "tarotDrawn": {
      const hand = battle.tarot[event.hand];
      return hand ? `${name(hand.unitId)} draws ${hand.cards.length} more tarot cards.` : null;
    }
    case "tarotChosen": {
      if (playerSide === null || event.side === playerSide) return null;
      // The user (2026-10-05): the other side sees which card was picked, never what it asks or pays.
      const hand = battle.tarot[event.hand];
      const card = hand?.cards[hand.chosen ?? 0];
      return card ? `The enemy turns over a tarot card: ${TASK_NAMES[card.task.kind]}.` : null;
    }
    case "tarot": {
      const hand = battle.tarot[event.hand];
      const card = hand?.cards[hand.chosen ?? 0];
      const ours = playerSide === null || event.side === playerSide;
      if (!card) return null;
      if (event.state === "failed") return ours ? `Your tarot card fails: ${TASK_NAMES[card.task.kind]}.` : null;
      const twice = event.payouts > 1 ? ` (${event.payouts} times)` : "";
      // The other side learns that it came to pass, never what it asked or paid.
      if (!ours) return `The enemy's ${TASK_NAMES[card.task.kind]} comes to pass${twice}.`;
      return `Your tarot card is fulfilled: ${TASK_NAMES[card.task.kind]}. ${capitalize(describeReward(card.reward))}${twice}.`;
    }
    case "effect": {
      const def = effectDef(event.effect);
      return def.quiet ? null : `${name(event.unitId)}: ${def.name.toLowerCase()}`;
    }
    case "effectEnded":
      return null;
    case "absorbed":
      return `${name(event.unitId)}'s ${effectDef(event.by).name.toLowerCase()} absorbs ${event.amount}`;
    case "move":
      return `${name(event.unitId)} is moved`;
    case "countered":
      return `${name(event.unitId)}'s action is countered!`;
    case "fled":
      return `${name(event.unitId)} flees the battle.`;
    case "skipped":
      return event.reason === "lostTurn" ? `${name(event.unitId)} loses its turn` : `${name(event.unitId)} cannot act`;
    case "battleEnd":
      if (event.outcome.winner === null) return "None survive.";
      if (event.outcome.withdrew) return `Neither side can finish the other: the attackers withdraw. ${playerSide === null ? "The defenders hold the field." : event.outcome.winner === playerSide ? "Victory." : "Defeat."}`;
      return playerSide === null ? `Side ${event.outcome.winner + 1} prevails.` : event.outcome.winner === playerSide ? "Victory." : "Defeat.";
    case "turnStart":
      return null;
  }
}

/** "Your Paladin", "the enemy Marauder": names in tarot texts. */
function unitNamer(battle: Battle, playerSide: Side | null): (id: string) => string {
  return (id) => {
    const unit = battle.units[id];
    return unit ? unitLabel(unit, playerSide).replace(/^Enemy /, "the enemy ") : id;
  };
}

/** What the owner reads under a card: its name, what it asks, what it pays, and how it stands. */
function ownCaption(card: TarotCard, name: (id: string) => string, state: TarotHand["state"]): HTMLElement {
  const box = element("div", `caption state-${state}`);
  const standing = state === "open" ? "" : state === "fulfilled" ? " Fulfilled." : " Failed.";
  box.append(element("div", "arcana", TASK_NAMES[card.task.kind]), element("div", "task", `${describeTask(card.task, name)}${standing}`), element("div", "reward", `Done: ${describeReward(card.reward)}.`));
  return box;
}

/** What the other side reads under the enemy's card: its name, and nothing it does. */
function theirCaption(card: TarotCard): HTMLElement {
  const box = element("div", "caption");
  box.append(element("div", "arcana", TASK_NAMES[card.task.kind]), element("div", "reward", "The enemy's card. What it asks, and what it pays, only they know."));
  return box;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
