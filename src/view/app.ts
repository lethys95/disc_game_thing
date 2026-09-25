import { chooseAction } from "#rules/ai";
import { applyAction, createBattle, legalActions } from "#rules/battle/engine";
import { sameTile } from "#rules/battle/grid";
import type { Action, Battle, BattleEvent, LegalAbility, Side, TargetChoice } from "#rules/battle/types";
import { Hud, unitLabel } from "#view/hud";
import { asKnown, masked } from "#view/secrecy";
import type { BannerButton } from "#view/hud";
import type { BattleScene, PreviewMark, TileRef } from "#view/scene";
import type { Squads } from "#view/setup";
import type { AiClient } from "#view/ai-client";
import type { Stage } from "#view/stage";

export interface AppOptions {
  readonly onSetup: () => void;
}

/** What happens when a battle ends: a skirmish offers a rematch, a map battle hands the result back. */
type Finish = { kind: "skirmish"; squads: Squads } | { kind: "world"; onDone: (battle: Battle) => void };

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
  private finish: Finish = { kind: "skirmish", squads: [[], []] };
  private selected: string | null = null;
  private hovered: TileRef | null = null;
  private preview: Preview | null = null;
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
    private readonly options: AppOptions,
  ) {
    this.hud = new Hud({ onAbility: (id) => this.chooseAbility(id), onAuto: () => this.toggleAuto() });
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
    });
  }

  /** A standalone battle between two squads. */
  start(squads: Squads, playerSide: Side | null, fastForward = 0): void {
    const step = createBattle(squads);
    this.run(step.battle, step.events, playerSide, { kind: "skirmish", squads }, fastForward);
  }

  /** A battle that came from the map; `onDone` receives the finished battle. */
  fight(battle: Battle, playerSide: Side | null, onDone: (battle: Battle) => void): void {
    this.run(battle, [], playerSide, { kind: "world", onDone }, 0);
  }

  private run(start: Battle, events: readonly BattleEvent[], playerSide: Side | null, finish: Finish, fastForward: number): void {
    this.stop();
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
    // The unit's basic attack if it has one, else any attack (casters): never a hard-coded ability id.
    const options = this.playerOptions().filter((o) => o.tags.includes("attack"));
    const attack = options.find((o) => o.tags.includes("basic")) ?? options[0];
    this.selected = attack?.abilityId ?? null;
  }

  private selectedOption(): LegalAbility | undefined {
    return this.playerOptions().find((o) => o.abilityId === this.selected);
  }

  private chooseAbility(abilityId: string): void {
    const option = this.playerOptions().find((o) => o.abilityId === abilityId);
    if (!option) return;
    const only = option.choices[0];
    const self = this.battle?.current?.unitId;
    if (option.choices.length === 1 && only && self && only.affected.length === 1 && only.affected[0] === self) {
      void this.commit({ abilityId, choice: 0 });
      return;
    }
    this.selected = this.selected === abilityId ? null : abilityId;
    this.render();
  }

  private hover(x: number, y: number): void {
    if (!this.battle) return;
    this.hovered = this.scene.pick(x, y, this.battle);
    this.render();
  }

  private hoveredAction(): Action | null {
    const option = this.selectedOption();
    const hovered = this.hovered;
    if (!option || !hovered) return null;
    const choice = option.choices.findIndex((c) => matches(c, hovered));
    return choice < 0 ? null : { abilityId: option.abilityId, choice };
  }

  private click(): void {
    const action = this.hoveredAction();
    if (action) void this.commit(action);
  }

  private cancel(): void {
    this.selected = null;
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

  /** Runs the hovered action on a copy of the battle: with no randomness, the preview is exactly what will happen. */
  private previewOf(battle: Battle, action: Action): Preview {
    const key = `${action.abilityId}:${action.choice}`;
    if (this.preview?.key === key) return this.preview;
    const totals = new Map<string, { harm: number; heal: number; dies: boolean; spared: boolean }>();
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
    const marks: PreviewMark[] = [];
    const parts: string[] = [];
    for (const [unitId, t] of totals) {
      const unit = battle.units[unitId];
      if (!unit) continue;
      const change = t.harm > 0 ? `−${t.harm}` : t.heal > 0 ? `+${t.heal}` : "";
      const fate = t.dies ? " †" : t.spared ? " (spared)" : "";
      marks.push({ unitId, text: `${change}${fate}`, kind: t.dies ? "death" : t.heal > 0 ? "heal" : "harm" });
      parts.push(`${unitLabel(unit, this.playerSide)} ${change}${t.dies ? ", dies" : t.spared ? ", spared" : ""}`);
    }
    this.preview = { key, marks, summary: parts.join(" · ") };
    return this.preview;
  }

  private render(): void {
    const battle = this.battle;
    if (!battle) return;
    const playerSide = this.playerSide;
    const currentId = battle.current?.unitId ?? null;
    const current = currentId ? battle.units[currentId] : undefined;
    const option = this.selectedOption();
    const action = this.hoveredAction();
    const hoveredChoice = action ? option?.choices[action.choice] : undefined;
    const affected = (hoveredChoice?.affected ?? []).flatMap((id) => {
      const unit = battle.units[id];
      return unit ? [{ side: unit.side, tile: unit.tile }] : [];
    });
    const preview = action ? this.previewOf(battle, action) : null;
    if (!action) this.preview = null;

    this.scene.setHighlights({
      current: current ? { side: current.side, tile: current.tile } : null,
      candidates: option ? option.choices.map((c) => c.anchor) : [],
      affected,
    });
    this.scene.showPreview(preview?.marks ?? []);

    const hovered = this.hovered;
    const inspected = hovered
      ? Object.values(battle.units).find((u) => u.alive && u.side === hovered.side && sameTile(u.tile, hovered.tile))
      : undefined;
    this.hud.renderTurns(battle, playerSide);
    this.hud.renderCard(battle, inspected?.id ?? currentId, playerSide);
    this.hud.renderActions(battle, this.playerOptions(), this.selected, this.playersTurn());
    this.hud.renderAuto(this.playerSide !== null && !battle.outcome, this.auto);
    this.hud.showOutcome(battle, playerSide, this.bannerButtons(battle));
    this.hud.setHint(preview ? `${option?.name}: ${preview.summary}` : this.hint(option));
    this.stage.renderer.domElement.style.cursor = hoveredChoice ? "pointer" : "default";
  }

  private bannerButtons(battle: Battle): BannerButton[] {
    const finish = this.finish;
    if (finish.kind === "world") {
      return [{ label: "Return to the map", onClick: () => { this.stop(); finish.onDone(battle); } }];
    }
    return [
      { label: "Fight again", onClick: () => this.start(finish.squads, this.playerSide) },
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
    return `${name}: choose a target for ${option.name}. Right-click to cancel.`;
  }
}
