import { chooseAction } from "#rules/ai";
import { applyAction, createBattle, legalActions } from "#rules/battle";
import type { Placement } from "#rules/battle";
import { sameTile } from "#rules/grid";
import type { Action, Battle, LegalAbility, Side, TargetChoice } from "#rules/types";
import { Hud } from "#view/hud";
import type { BattleScene, TileRef } from "#view/scene";

export interface AppOptions {
  /** The side the human plays; null watches the AI play both sides. */
  readonly playerSide: Side | null;
  /** AI moves to apply instantly before the first frame (for screenshots). */
  readonly fastForward: number;
  readonly squads: readonly [readonly Placement[], readonly Placement[]];
}

const AI_DELAY_MS = 450;

const matches = (choice: TargetChoice, ref: TileRef) => choice.anchor.side === ref.side && sameTile(choice.anchor.tile, ref.tile);

export class App {
  private battle: Battle;
  private selected: string | null = null;
  private hovered: TileRef | null = null;
  private busy = false;
  private readonly hud: Hud;

  constructor(
    private readonly scene: BattleScene,
    private readonly options: AppOptions,
  ) {
    this.hud = new Hud({ onAbility: (id) => this.chooseAbility(id), onRestart: () => this.start() });
    this.battle = createBattle(options.squads).battle;
    const canvas = scene.renderer.domElement;
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

  start(): void {
    const step = createBattle(this.options.squads);
    this.battle = step.battle;
    this.hud.clearLog();
    this.hud.appendLog(step.events, step.battle, this.options.playerSide);
    for (let i = 0; i < this.options.fastForward && !this.battle.outcome; i++) {
      const action = chooseAction(this.battle);
      if (!action) break;
      const next = applyAction(this.battle, action);
      this.hud.appendLog(next.events, next.battle, this.options.playerSide);
      this.battle = next.battle;
    }
    this.scene.sync(this.battle);
    this.selectDefault();
    this.render();
    this.schedule();
  }

  private playersTurn(): boolean {
    const id = this.battle.current?.unitId;
    const unit = id ? this.battle.units[id] : undefined;
    return !this.busy && unit !== undefined && unit.side === this.options.playerSide;
  }

  private playerOptions(): LegalAbility[] {
    return this.playersTurn() ? legalActions(this.battle) : [];
  }

  private selectDefault(): void {
    const options = this.playerOptions();
    const attack = options.find((o) => o.abilityId === "attack" || o.abilityId === "flail");
    this.selected = attack?.abilityId ?? null;
  }

  private selectedOption(): LegalAbility | undefined {
    return this.playerOptions().find((o) => o.abilityId === this.selected);
  }

  private chooseAbility(abilityId: string): void {
    const option = this.playerOptions().find((o) => o.abilityId === abilityId);
    if (!option) return;
    const only = option.choices[0];
    const self = this.battle.current?.unitId;
    if (option.choices.length === 1 && only && self && only.affected.length === 1 && only.affected[0] === self) {
      void this.commit({ abilityId, choice: 0 });
      return;
    }
    this.selected = this.selected === abilityId ? null : abilityId;
    this.render();
  }

  private hover(x: number, y: number): void {
    this.hovered = this.scene.pick(x, y, this.battle);
    this.render();
  }

  private click(): void {
    const option = this.selectedOption();
    const hovered = this.hovered;
    if (!option || !hovered) return;
    const choice = option.choices.findIndex((c) => matches(c, hovered));
    if (choice >= 0) void this.commit({ abilityId: option.abilityId, choice });
  }

  private cancel(): void {
    this.selected = null;
    this.render();
  }

  private async commit(action: Action): Promise<void> {
    if (this.busy || this.battle.outcome) return;
    this.busy = true;
    this.render();
    const step = applyAction(this.battle, action);
    this.hud.appendLog(step.events, step.battle, this.options.playerSide);
    this.battle = step.battle;
    await this.scene.play(step.events, step.battle);
    this.busy = false;
    this.selectDefault();
    this.render();
    this.schedule();
  }

  private schedule(): void {
    if (this.battle.outcome || this.busy) return;
    const id = this.battle.current?.unitId;
    const unit = id ? this.battle.units[id] : undefined;
    if (!unit || unit.side === this.options.playerSide) return;
    window.setTimeout(() => {
      const action = chooseAction(this.battle);
      if (action) void this.commit(action);
    }, AI_DELAY_MS);
  }

  private render(): void {
    const battle = this.battle;
    const playerSide = this.options.playerSide;
    const currentId = battle.current?.unitId ?? null;
    const current = currentId ? battle.units[currentId] : undefined;
    const option = this.selectedOption();
    const hovered = this.hovered;
    const hoveredChoice = option && hovered ? option.choices.find((c) => matches(c, hovered)) : undefined;
    const affected = (hoveredChoice?.affected ?? []).flatMap((id) => {
      const unit = battle.units[id];
      return unit ? [{ side: unit.side, tile: unit.tile }] : [];
    });

    this.scene.setHighlights({
      current: current ? { side: current.side, tile: current.tile } : null,
      candidates: option ? option.choices.map((c) => c.anchor) : [],
      affected,
    });

    const inspected = hovered
      ? Object.values(battle.units).find((u) => u.alive && u.side === hovered.side && sameTile(u.tile, hovered.tile))
      : undefined;
    this.hud.renderTurns(battle, playerSide);
    this.hud.renderCard(battle, inspected?.id ?? currentId, playerSide);
    this.hud.renderActions(this.playerOptions(), this.selected, this.playersTurn());
    this.hud.showOutcome(battle, playerSide);
    this.hud.setHint(this.hint(option));
    this.scene.renderer.domElement.style.cursor = hoveredChoice ? "pointer" : "default";
  }

  private hint(option: LegalAbility | undefined): string {
    if (this.battle.outcome) return "";
    if (this.busy) return "";
    if (!this.playersTurn()) return this.options.playerSide === null ? "The AI plays both sides." : "The enemy is acting…";
    const name = this.battle.current ? this.battle.units[this.battle.current.unitId]?.name : undefined;
    if (!option) return `${name}: choose an action.`;
    return `${name}: choose a target for ${option.name}. Right-click to cancel.`;
  }
}
