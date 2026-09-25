import { hexKey, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { tileAt, TERRAIN_COST } from "#rules/map";
import type { Battle, Side } from "#rules/types";
import { UNITS } from "#rules/units";
import {
  applyWorldAction,
  chooseWorldAction,
  concludeBattle,
  createWorld,
  leaderAt,
  planMove,
  reachable,
} from "#rules/world";
import type { Leader, MovePlan, World, WorldAction } from "#rules/world";
import type { App } from "#view/app";
import type { MapView } from "#view/map";
import type { Squads } from "#view/setup";
import type { Stage } from "#view/stage";

const PLAYER: Side = 0;
const AI_STEP_MS = 350;

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function button(id: string): HTMLButtonElement {
  const el = byId(id);
  if (!(el instanceof HTMLButtonElement)) throw new Error(`#${id} is not a button`);
  return el;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export interface CampaignOptions {
  readonly onSetup: () => void;
}

/** The map layer: the player's leader moves by clicking hexes; walking into the enemy starts a battle. */
export class Campaign {
  private world: World | null = null;
  private seed = 0;
  private hovered: Hex | null = null;
  private busy = false;
  private generation = 0;
  private readonly hud = byId("maphud");
  private readonly turn = byId("mapturn");
  private readonly squad = byId("mapsquad");
  private readonly hint = byId("maphint");
  private readonly endTurn = button("endturn");
  private readonly banner = byId("mapbanner");

  constructor(
    private readonly stage: Stage,
    private readonly view: MapView,
    private readonly app: App,
    private readonly options: CampaignOptions,
  ) {
    const canvas = stage.renderer.domElement;
    canvas.addEventListener("pointermove", (e) => this.hover(e.clientX, e.clientY));
    canvas.addEventListener("click", () => void this.click());
    this.endTurn.addEventListener("click", () => void this.act({ type: "endTurn" }));
  }

  start(squads: Squads, seed: number): void {
    this.stop();
    this.seed = seed;
    this.world = createWorld(seed, squads);
    this.view.build(this.world.map);
    this.enterMap();
  }

  stop(): void {
    this.generation += 1;
    this.world = null;
    this.busy = false;
    this.hud.hidden = true;
  }

  private enterMap(): void {
    const world = this.world;
    if (!world) return;
    this.view.show();
    this.view.syncLeaders(world);
    this.hud.hidden = false;
    this.render();
    void this.runAi();
  }

  private playerLeader(): Leader | undefined {
    return this.world?.leaders.find((l) => l.side === PLAYER);
  }

  private myTurn(): boolean {
    const world = this.world;
    return world !== null && !this.busy && !world.outcome && !world.engagement && world.activeSide === PLAYER;
  }

  private plan(): MovePlan | null {
    const world = this.world;
    const leader = this.playerLeader();
    const hovered = this.hovered;
    if (!world || !leader || !hovered || !this.myTurn() || sameHex(hovered, leader.hex)) return null;
    return planMove(world, leader.id, hovered);
  }

  private hover(x: number, y: number): void {
    if (!this.world || this.hud.hidden) return;
    this.hovered = this.view.pick(x, y);
    this.render();
  }

  private async click(): Promise<void> {
    const plan = this.plan();
    const leader = this.playerLeader();
    const target = this.hovered;
    if (!plan || !leader || !target || (plan.steps === 0 && !plan.attacks)) return;
    await this.act({ type: "move", leaderId: leader.id, to: target });
  }

  /** Applies one order, animates it, and hands over to the battle view if it started a fight. */
  private async act(action: WorldAction): Promise<void> {
    const world = this.world;
    if (!world || this.busy || world.outcome || world.engagement) return;
    const generation = this.generation;
    this.busy = true;
    this.render();
    const step = applyWorldAction(world, action);
    for (const event of step.events) {
      if (event.type === "moved") await this.view.walk(event.leaderId, event.path);
    }
    if (generation !== this.generation) return;
    this.world = step.world;
    this.view.syncLeaders(step.world);
    this.busy = false;
    const engagement = step.world.engagement;
    if (engagement) {
      this.hud.hidden = true;
      await this.stage.tween(400, () => {});
      this.app.fight(engagement.battle, PLAYER, (battle) => this.afterBattle(battle, generation));
      return;
    }
    this.render();
    await this.runAi();
  }

  private afterBattle(battle: Battle, generation: number): void {
    if (generation !== this.generation || !this.world) return;
    this.world = concludeBattle(this.world, battle).world;
    this.enterMap();
  }

  private async runAi(): Promise<void> {
    const world = this.world;
    if (!world || world.outcome || world.engagement || world.activeSide === PLAYER || this.busy) return;
    const generation = this.generation;
    await this.stage.tween(AI_STEP_MS, () => {});
    if (generation !== this.generation) return;
    await this.act(chooseWorldAction(world));
  }

  private render(): void {
    const world = this.world;
    if (!world) return;
    const leader = this.playerLeader();
    const plan = this.plan();
    const reach = leader && this.myTurn() ? reachable(world, leader.id) : new Map<string, number>();
    this.view.setHighlights({
      reachable: new Set(reach.keys()),
      path: plan?.path.hexes ?? [],
      walked: plan?.steps ?? 0,
      attack: plan?.attacks ? (world.leaders.find((l) => l.id === plan.attacks)?.hex ?? null) : null,
    });

    this.turn.textContent = world.outcome
      ? ""
      : `Turn ${world.turn} · ${world.activeSide === PLAYER ? "your move" : "the enemy moves"} · map seed ${this.seed}`;
    this.endTurn.disabled = !this.myTurn();
    this.renderSquad(leader);
    this.hint.textContent = this.hintText(world, leader, plan);
    this.renderBanner(world);
    this.stage.renderer.domElement.style.cursor = plan && (plan.steps > 0 || plan.attacks) ? "pointer" : "default";
  }

  private hintText(world: World, leader: Leader | undefined, plan: MovePlan | null): string {
    if (!this.myTurn() || !leader) return "";
    const hovered = this.hovered;
    const tile = hovered ? tileAt(world.map, hovered) : undefined;
    const terrain = tile ? `${tile.terrain}${TERRAIN_COST[tile.terrain] === null ? " (impassable)" : `, costs ${TERRAIN_COST[tile.terrain]}`}` : "";
    if (!plan) {
      const enemy = hovered ? leaderAt(world, hovered) : undefined;
      if (enemy && enemy.side !== PLAYER) return "Out of reach.";
      return `${leader.movement} movement left. ${terrain ? `Hovering ${terrain}.` : "Click a hex to march."}`;
    }
    if (plan.attacks) return "Click to attack the enemy leader.";
    if (plan.steps === 0) return "Not enough movement left to go further. End your turn.";
    const total = plan.path.hexes.length;
    const walks = plan.steps === total ? `March there (${plan.path.cost} movement)` : `March ${plan.steps} of ${total} hexes this turn`;
    return `${walks}. Hovering ${terrain}.`;
  }

  private renderSquad(leader: Leader | undefined): void {
    this.squad.replaceChildren();
    this.squad.hidden = !leader;
    if (!leader) return;
    this.squad.appendChild(element("div", "title", "Your warband"));
    this.squad.appendChild(element("div", "subtitle", `${leader.movement} movement left`));
    for (const member of [...leader.squad].sort((a, b) => a.tile.row - b.tile.row || a.tile.col - b.tile.col)) {
      const def = UNITS[member.defId];
      const max = def?.stats.maxHp ?? member.hp;
      const row = element("div", "member");
      row.appendChild(element("span", "name", def?.name ?? member.defId));
      const bar = element("div", "hp");
      const fill = element("div", "fill");
      fill.style.width = `${(100 * member.hp) / max}%`;
      bar.appendChild(fill);
      bar.appendChild(element("span", "value", `${member.hp} / ${max}`));
      row.appendChild(bar);
      this.squad.appendChild(row);
    }
  }

  private renderBanner(world: World): void {
    this.banner.hidden = !world.outcome;
    if (!world.outcome) return;
    this.banner.replaceChildren();
    this.banner.appendChild(element("div", "title", world.outcome.winner === PLAYER ? "The field is yours" : "Your warband is gone"));
    this.banner.appendChild(element("div", "subtitle", `turn ${world.turn}`));
    const again = element("button", "action", "New map");
    again.addEventListener("click", () => this.options.onSetup());
    this.banner.appendChild(again);
  }

  /** Where a hex appears on screen; used by automated play-testing. */
  screenPoint(hex: Hex): { x: number; y: number } {
    return this.view.screenPoint(hex);
  }

  hexOfLeader(side: Side): Hex | null {
    return this.world?.leaders.find((l) => l.side === side)?.hex ?? null;
  }

  reachableHexes(): string[] {
    const world = this.world;
    const leader = this.playerLeader();
    return world && leader ? [...reachable(world, leader.id).keys()].filter((k) => k !== hexKey(leader.hex)) : [];
  }
}
