import { chooseAction } from "#rules/ai";
import { applyAction, createBattle, legalActions } from "#rules/battle/engine";
import { sameTile } from "#rules/battle/grid";
import type { Action, Battle, BattleEvent, BattleUnit, Enhancement, LegalAbility, Side, TargetChoice } from "#rules/battle/types";
import { PLAIN } from "#rules/battle/types";
import type { PlayerColor } from "#rules/world/colors";
import { applySideColors, colorPair } from "#view/colors";
import { actionButtons, enhancementLabel, Hud, optionKey, unitLabel, withOverload } from "#view/hud";
import { asKnown, masked } from "#view/secrecy";
import type { BannerButton } from "#view/hud";
import type { BattleScene, PreviewMark, TileRef } from "#view/scene";
import type { Squads } from "#view/setup";
import type { AiClient } from "#view/ai-client";
import type { Settings } from "#view/settings";
import type { Stage } from "#view/stage";

export interface AppOptions {
  readonly onSetup: () => void;
}

/** What happens when a battle ends: a skirmish offers a rematch, a map battle hands the result back. */
type Finish = { kind: "skirmish"; squads: Squads; colors: Colors } | { kind: "world"; onDone: (battle: Battle) => void };
type Colors = readonly [PlayerColor, PlayerColor];

/** What one action does to one unit. */
interface Outcome {
  harm: number;
  heal: number;
  dies: boolean;
  spared: boolean;
}

const change = (t: Outcome): string => (t.harm > 0 ? `−${t.harm}` : t.heal > 0 ? `+${t.heal}` : "");

const markOf = (unitId: string, t: Outcome): PreviewMark => ({
  unitId,
  text: `${change(t)}${t.dies ? " †" : t.spared ? " (spared)" : ""}`,
  kind: t.dies ? "death" : t.heal > 0 ? "heal" : "harm",
});

interface Preview {
  readonly key: string;
  readonly marks: readonly PreviewMark[];
  readonly summary: string;
}

const AI_DELAY_MS = 450;

const matches = (choice: TargetChoice, ref: TileRef) => choice.anchor.side === ref.side && sameTile(choice.anchor.tile, ref.tile);

/** The consequences of one action: everything before the next unit's turn begins. */
function ownEvents(events: readonly BattleEvent[]): readonly BattleEvent[] {
  const end = events.findIndex((e) => e.type === "turnStart");
  return end < 0 ? events : events.slice(0, end);
}

export class App {
  private battle: Battle | null = null;
  private playerSide: Side | null = 0;
  private finish: Finish = { kind: "skirmish", squads: [[], []], colors: colorPair(["jilliath", "jilliath"]) };
  /** The chosen ability variant (`optionKey`). */
  private selected: string | null = null;
  /** A replicated spell's targets picked so far (choice indices). */
  private picks: number[] = [];
  /** A unit hovered in the turn order. */
  private focus: string | null = null;
  /** Whether the player picked the selected ability themselves; if not, hovering may fall back to another. */
  private chosen = false;
  private hovered: TileRef | null = null;
  /** A unit whose card stays up (clicked), so the mouse can travel to the card to read its effects. */
  private pinned: string | null = null;
  private preview: Preview | null = null;
  /** Spells whose overload toggle is on, for the acting unit's turn. */
  private readonly overloaded = new Set<string>();
  /** The ability button under the pointer, if any. */
  private abilityHover: string | null = null;
  /** Every target's preview for one ability, cached per battle state and ability. */
  private sweep: { readonly key: string; readonly marks: readonly PreviewMark[] } | null = null;
  private busy = false;
  /** The AI plays the player's side too, until switched off. */
  private auto = false;
  /** Bumped on every start/stop so a turn still animating from an old battle can't touch the new one. */
  private generation = 0;
  private timer: number | undefined;
  private readonly hud: Hud;

  constructor(
    private readonly stage: Stage,
    private readonly scene: BattleScene,
    private readonly ai: AiClient,
    private readonly settings: Settings,
    private readonly options: AppOptions,
  ) {
    this.hud = new Hud(settings, {
      onAbility: (id) => this.chooseAbility(id),
      onOverload: (abilityId) => {
        const on = !this.overloaded.has(abilityId);
        if (on) this.overloaded.add(abilityId);
        else this.overloaded.delete(abilityId);
        // A spell being aimed switches to its other form at once.
        const selected = this.selectedOption();
        if (selected?.abilityId === abilityId) {
          const plain = this.playerOptions().find((o) => o.abilityId === abilityId && o.enhancement.kind === "none");
          if (plain) this.select(optionKey(withOverload(this.playerOptions(), plain, on)), true);
        }
        this.render();
      },
      onAbilityHover: (key) => {
        if (this.abilityHover === key) return;
        this.abilityHover = key;
        this.render();
      },
      onAuto: () => this.toggleAuto(),
      onFocus: (unitId) => {
        this.focus = unitId;
        this.render();
      },
    });
    this.hud.setVisible(false);
    const canvas = stage.renderer.domElement;
    canvas.addEventListener("pointermove", (e) => this.hover(e.clientX, e.clientY));
    canvas.addEventListener("click", () => this.click());
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.cancel();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.cancel();
      else if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) this.hotkey(e.key.toLowerCase());
    });
  }

  /** A standalone battle between two squads. */
  start(squads: Squads, playerSide: Side | null, colors: Colors, fastForward = 0): void {
    const step = createBattle(squads);
    this.run(step.battle, step.events, playerSide, colors, { kind: "skirmish", squads, colors }, fastForward);
  }

  /** A battle that came from the map; `onDone` receives the finished battle. */
  fight(battle: Battle, playerSide: Side | null, colors: Colors, onDone: (battle: Battle) => void): void {
    this.run(battle, [], playerSide, colors, { kind: "world", onDone }, 0);
  }

  private run(start: Battle, events: readonly BattleEvent[], playerSide: Side | null, colors: Colors, finish: Finish, fastForward: number): void {
    this.stop();
    this.scene.setColors(colors);
    this.scene.setLeft(playerSide ?? 0);
    applySideColors(document.documentElement, colors);
    this.playerSide = playerSide;
    this.finish = finish;
    this.auto = false;
    let battle = start;
    this.scene.show();
    this.hud.setVisible(true);
    this.hud.clearLog();
    this.hud.appendLog(masked(events, battle, playerSide), battle, playerSide);
    for (let i = 0; i < fastForward && !battle.outcome; i++) {
      const action = chooseAction(battle);
      if (!action) break;
      const next = applyAction(battle, action);
      this.hud.appendLog(masked(next.events, next.battle, playerSide), next.battle, playerSide);
      battle = next.battle;
    }
    this.battle = battle;
    this.scene.reset();
    this.scene.sync(battle);
    this.selectDefault();
    this.render();
    this.schedule();
  }

  stop(): void {
    this.generation += 1;
    window.clearTimeout(this.timer);
    this.battle = null;
    this.busy = false;
    this.preview = null;
    this.scene.showPreview([]);
    this.hud.setVisible(false);
  }

  private playersTurn(): boolean {
    const battle = this.battle;
    const id = battle?.current?.unitId;
    const unit = id ? battle?.units[id] : undefined;
    return !this.busy && !this.auto && unit !== undefined && unit.side === this.playerSide;
  }

  toggleAuto(): void {
    if (!this.battle || this.playerSide === null) return;
    this.auto = !this.auto;
    this.render();
    this.schedule();
  }

  private playerOptions(): LegalAbility[] {
    return this.battle && this.playersTurn() ? legalActions(this.battle) : [];
  }

  private selectDefault(): void {
    this.overloaded.clear();
    // The unit's basic attack if it has one, else any attack (casters): never a hard-coded ability id.
    const options = this.playerOptions().filter((o) => o.tags.includes("attack") && o.enhancement.kind === "none");
    const attack = options.find((o) => o.tags.includes("basic")) ?? options[0];
    this.select(attack ? optionKey(attack) : null);
  }

  private select(key: string | null, chosen = false): void {
    this.selected = key;
    this.chosen = chosen;
    this.picks = [];
  }

  private selectedOption(): LegalAbility | undefined {
    return this.playerOptions().find((o) => optionKey(o) === this.selected);
  }

  /**
   * The option a click on the hovered tile would use. Until the player picks one, a tile the default can't reach
   * falls back to the first plain, non-basic ability that can (a support's shield on an ally, its attack on an enemy).
   * Never onto the acting unit itself, so a stray click can't spend a self-heal.
   */
  private targetOption(): LegalAbility | undefined {
    const selected = this.selectedOption();
    const hovered = this.hovered;
    if (this.chosen || !hovered || selected?.choices.some((c) => matches(c, hovered))) return selected;
    const self = this.battle?.current ? this.battle.units[this.battle.current.unitId] : undefined;
    if (self && hovered.side === self.side && sameTile(hovered.tile, self.tile)) return selected;
    return this.playerOptions().find((o) => o.enhancement.kind === "none" && !o.tags.includes("basic") && o.choices.some((c) => matches(c, hovered))) ?? selected;
  }

  /** An ability whose definition claims this key, among the ones the player may use now. */
  private hotkey(key: string): void {
    const button = /^[1-9]$/.test(key) && this.settings.data.slotKeys ? actionButtons(this.playerOptions())[Number(key) - 1] : undefined;
    const slot = button ? withOverload(this.playerOptions(), button, this.overloaded.has(button.abilityId)) : undefined;
    const option = slot ?? this.playerOptions().find((o) => o.enhancement.kind === "none" && this.settings.keyFor(o.abilityId) === key);
    if (option) this.chooseAbility(optionKey(option));
  }

  private chooseAbility(key: string): void {
    const option = this.playerOptions().find((o) => optionKey(o) === key);
    if (!option) return;
    const only = option.choices[0];
    const self = this.battle?.current?.unitId;
    if (option.choices.length === 1 && only && self && only.affected.length === 1 && only.affected[0] === self) {
      void this.commit({ abilityId: option.abilityId, choice: 0, enhancement: option.enhancement });
      return;
    }
    this.select(this.selected === key ? null : key, true);
    this.render();
  }

  /** Targets a replicated spell needs in all: the first cast and one per copy. */
  private targetsNeeded(option: LegalAbility): number {
    return option.enhancement.kind === "replicate" ? option.enhancement.copies + 1 : 1;
  }

  private hover(x: number, y: number): void {
    if (!this.battle) return;
    this.hovered = this.scene.pick(x, y, this.battle);
    this.render();
  }

  /**
   * The action under the cursor. A replicated spell is built up target by target: until the last pick, this is the
   * cast so far (a smaller replicate, or the plain spell) so the preview shows what the picks add up to.
   */
  private hoveredAction(): Action | null {
    const option = this.targetOption();
    const hovered = this.hovered;
    if (!option || !hovered) return null;
    const choice = option.choices.findIndex((c, i) => matches(c, hovered) && !this.picks.includes(i));
    if (choice < 0) return null;
    const [first = choice, ...rest] = [...this.picks, choice];
    const copies = rest.length;
    const enhancement: Enhancement = option.enhancement.kind === "replicate" ? (copies > 0 ? { kind: "replicate", copies } : PLAIN) : option.enhancement;
    return copies > 0 ? { abilityId: option.abilityId, choice: first, enhancement, copies: rest } : { abilityId: option.abilityId, choice: first, enhancement };
  }

  private click(): void {
    const action = this.hoveredAction();
    const option = this.targetOption();
    // Clicking a target already picked casts the replicated spell with the picks so far.
    const hovered = this.hovered;
    const again = option && hovered ? option.choices.findIndex((c, i) => matches(c, hovered) && this.picks.includes(i)) : -1;
    if (option && again >= 0) {
      const [first, ...rest] = this.picks;
      if (first === undefined) return;
      void this.commit(rest.length > 0 ? { abilityId: option.abilityId, choice: first, enhancement: { kind: "replicate", copies: rest.length }, copies: rest } : { abilityId: option.abilityId, choice: first, enhancement: PLAIN });
      return;
    }
    if (action && option) {
      const picked = 1 + (action.copies?.length ?? 0);
      if (picked < this.targetsNeeded(option)) {
        this.picks = [action.choice, ...(action.copies ?? [])];
        this.render();
        return;
      }
      void this.commit(action);
      return;
    }
    const unit = this.unitAt(this.hovered);
    this.pinned = unit && unit.id !== this.pinned ? unit.id : null;
    this.render();
  }

  private unitAt(ref: TileRef | null): BattleUnit | undefined {
    const battle = this.battle;
    if (!battle || !ref) return undefined;
    return Object.values(battle.units).find((u) => u.alive && u.side === ref.side && sameTile(u.tile, ref.tile));
  }

  private cancel(): void {
    this.select(null);
    this.render();
  }

  private async commit(action: Action): Promise<void> {
    const battle = this.battle;
    if (!battle || this.busy || battle.outcome) return;
    const generation = this.generation;
    this.busy = true;
    this.preview = null;
    this.render();
    const step = applyAction(battle, action);
    const visible = masked(step.events, step.battle, this.playerSide);
    this.hud.appendLog(visible, step.battle, this.playerSide);
    this.battle = step.battle;
    await this.scene.play(visible, step.battle);
    if (generation !== this.generation) return;
    this.busy = false;
    this.selectDefault();
    this.render();
    this.schedule();
  }

  private schedule(): void {
    const battle = this.battle;
    if (!battle || battle.outcome || this.busy) return;
    const id = battle.current?.unitId;
    const unit = id ? battle.units[id] : undefined;
    if (!unit || (unit.side === this.playerSide && !this.auto)) return;
    const generation = this.generation;
    this.timer = window.setTimeout(() => {
      void this.ai.chooseAction(battle).then((action) => {
        if (generation !== this.generation || !action) return;
        void this.commit(action);
      });
    }, AI_DELAY_MS * this.stage.timeScale);
  }

  /** What an action does to each unit, on a copy of the battle as the player knows it. */
  private outcomeOf(battle: Battle, action: Action): Map<string, Outcome> {
    const totals = new Map<string, Outcome>();
    const entry = (id: string) => {
      const found = totals.get(id) ?? { harm: 0, heal: 0, dies: false, spared: false };
      totals.set(id, found);
      return found;
    };
    for (const event of ownEvents(applyAction(asKnown(battle, this.playerSide), action).events)) {
      if (event.type === "damage") entry(event.unitId).harm += event.amount;
      if (event.type === "heal") entry(event.unitId).heal += event.amount;
      if (event.type === "death") entry(event.unitId).dies = true;
      if (event.type === "deathPrevented") entry(event.unitId).spared = true;
    }
    return totals;
  }

  /** Runs the hovered action on a copy of the battle: with no randomness, the preview is exactly what will happen. */
  private previewOf(battle: Battle, action: Action): Preview {
    const key = JSON.stringify(action);
    if (this.preview?.key === key) return this.preview;
    const marks: PreviewMark[] = [];
    const parts: string[] = [];
    for (const [unitId, t] of this.outcomeOf(battle, action)) {
      const unit = battle.units[unitId];
      if (!unit) continue;
      marks.push(markOf(unitId, t));
      parts.push(`${unitLabel(unit, this.playerSide)} ${change(t)}${t.dies ? ", dies" : t.spared ? ", spared" : ""}`);
    }
    this.preview = { key, marks, summary: parts.join(" · ") };
    return this.preview;
  }

  /**
   * An ability tried on every target it can reach, before one is hovered: each unit shows what the ability would do
   * to it when aimed at it (for an area, at its anchor tile).
   */
  private sweepOf(battle: Battle, option: LegalAbility): readonly PreviewMark[] {
    const key = `${battle.round}.${battle.pass}.${battle.current?.unitId}.${JSON.stringify(battle.current)}:${optionKey(option)}:${Object.values(battle.units).map((u) => u.hp).join(",")}`;
    if (this.sweep?.key === key) return this.sweep.marks;
    const marks: PreviewMark[] = [];
    option.choices.forEach((choice, index) => {
      const outcome = this.outcomeOf(battle, { abilityId: option.abilityId, choice: index, enhancement: option.enhancement.kind === "replicate" ? PLAIN : option.enhancement });
      for (const [unitId, t] of outcome) {
        const unit = battle.units[unitId];
        const aimed = unit && unit.side === choice.anchor.side && sameTile(unit.tile, choice.anchor.tile);
        if (aimed && !marks.some((m) => m.unitId === unitId)) marks.push(markOf(unitId, t));
      }
    });
    this.sweep = { key, marks };
    return marks;
  }

  private render(): void {
    const battle = this.battle;
    if (!battle) return;
    const playerSide = this.playerSide;
    const currentId = battle.current?.unitId ?? null;
    const current = currentId ? battle.units[currentId] : undefined;
    const option = this.targetOption();
    const action = this.hoveredAction();
    const hoveredChoice = action ? option?.choices[action.choice] : undefined;
    const picked = [...this.picks, ...(action ? [action.choice, ...(action.copies ?? [])] : [])].flatMap((i) => option?.choices[i]?.affected ?? []);
    const affected = [...new Set(picked)].flatMap((id) => {
      const unit = battle.units[id];
      return unit ? [{ side: unit.side, tile: unit.tile }] : [];
    });
    const preview = action ? this.previewOf(battle, action) : null;
    if (!action) this.preview = null;
    // No target hovered: preview the hovered button's ability (or the one being aimed) on every target it can reach.
    const swept = action ? undefined : (this.playerOptions().find((o) => optionKey(o) === this.abilityHover) ?? (this.chosen ? this.selectedOption() : undefined));

    const focused = this.focus && battle.units[this.focus]?.alive ? battle.units[this.focus] : undefined;
    this.scene.setHighlights({
      current: current ? { side: current.side, tile: current.tile } : null,
      candidates: option ? option.choices.map((c) => c.anchor) : [],
      affected,
      focus: focused ? { side: focused.side, tile: focused.tile } : null,
    });
    this.scene.showPreview(preview?.marks ?? (swept && this.playersTurn() ? this.sweepOf(battle, swept) : []));

    const inspected = focused ?? this.unitAt(this.hovered);
    const pinned = this.pinned && battle.units[this.pinned]?.alive ? this.pinned : null;
    this.hud.renderTurns(battle, playerSide);
    this.hud.renderCard(battle, inspected?.id ?? pinned ?? currentId, playerSide, pinned !== null && !inspected);
    this.hud.renderActions(battle, this.playerOptions(), this.selected, this.playersTurn(), this.overloaded);
    this.hud.renderAuto(this.playerSide !== null && !battle.outcome, this.auto);
    this.hud.showOutcome(battle, playerSide, this.bannerButtons(battle));
    this.hud.setHint(preview?.summary ? `${option?.name}: ${preview.summary}` : this.hint(option));
    this.stage.renderer.domElement.style.cursor = hoveredChoice ? "pointer" : "default";
  }

  private bannerButtons(battle: Battle): BannerButton[] {
    const finish = this.finish;
    if (finish.kind === "world") {
      return [{ label: "Return to the map", onClick: () => { this.stop(); finish.onDone(battle); } }];
    }
    return [
      { label: "Fight again", onClick: () => this.start(finish.squads, this.playerSide, finish.colors) },
      { label: "Change squads", onClick: () => this.options.onSetup() },
    ];
  }

  private hint(option: LegalAbility | undefined): string {
    const battle = this.battle;
    if (!battle || battle.outcome || this.busy) return "";
    if (this.auto) return "Auto-battle: the AI is playing your side.";
    if (!this.playersTurn()) return this.playerSide === null ? "The AI plays both sides." : "The enemy is acting…";
    const name = battle.current ? battle.units[battle.current.unitId]?.name : undefined;
    if (!option) return `${name}: choose an action.`;
    const left = this.targetsNeeded(option) - this.picks.length;
    if (option.enhancement.kind === "replicate") {
      const early = this.picks.length > 0 ? " Click a picked target to cast now." : "";
      return `${name}: ${option.name}, up to ${left} more target${left === 1 ? "" : "s"}.${early} Right-click to cancel.`;
    }
    return `${name}: choose a target for ${option.name}${enhancementLabel(option.enhancement)}. Right-click to cancel.`;
  }
}
