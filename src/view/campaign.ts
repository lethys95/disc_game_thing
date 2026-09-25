import { sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { tileAt, TERRAIN_COST } from "#rules/map";
import type { Battle, Side } from "#rules/types";
import { GUARDIAN_ID, RECRUIT_COST, RECRUITS, UNITS } from "#rules/units";
import {
  applyWorldAction,
  capitolOf,
  chooseWorldAction,
  cityById,
  concludeBattle,
  createWorld,
  elevateProblem,
  forecast,
  income,
  leaderAt,
  planMove,
  reachable,
  recruitProblem,
} from "#rules/world";
import type { Leader, MovePlan, MoveTarget, RecruitInto, SquadMember, World, WorldAction, WorldEvent } from "#rules/world";
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

const unitName = (defId: string) => UNITS[defId]?.name ?? defId;
const maxHp = (defId: string) => UNITS[defId]?.stats.maxHp ?? 0;

function leaderName(leader: Leader): string {
  const figure = leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col) ?? leader.squad[0];
  return figure ? unitName(figure.defId) : "Leader";
}

export interface CampaignOptions {
  readonly onSetup: () => void;
}

interface Forecast {
  readonly key: string;
  readonly text: string;
}

/** The map layer: select a warband, click a hex to march; walking into an enemy starts a battle. */
export class Campaign {
  private world: World | null = null;
  private seed = 0;
  private selected: string | null = null;
  private hovered: Hex | null = null;
  private busy = false;
  private generation = 0;
  private forecastCache: Forecast | null = null;
  private readonly hud = byId("maphud");
  private readonly turn = byId("mapturn");
  private readonly squad = byId("mapsquad");
  private readonly city = byId("mapcity");
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
    this.view.buildSites(this.world);
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
    this.syncView(world);
    this.hud.hidden = false;
    this.render();
    void this.runAi();
  }

  private syncView(world: World): void {
    this.view.syncLeaders(world);
    this.view.syncSites(world);
  }

  private myLeaders(): Leader[] {
    return this.world?.leaders.filter((l) => l.side === PLAYER) ?? [];
  }

  private selectedLeader(): Leader | undefined {
    const mine = this.myLeaders();
    return mine.find((l) => l.id === this.selected) ?? mine.find((l) => l.movement > 0) ?? mine[0];
  }

  private myTurn(): boolean {
    const world = this.world;
    return world !== null && !this.busy && !world.outcome && !world.engagement && world.activeSide === PLAYER;
  }

  private plan(): MovePlan | null {
    const world = this.world;
    const leader = this.selectedLeader();
    const hovered = this.hovered;
    if (!world || !leader || !hovered || !this.myTurn() || sameHex(hovered, leader.hex)) return null;
    if (leaderAt(world, hovered)?.side === PLAYER) return null;
    return planMove(world, leader.id, hovered);
  }

  private hover(x: number, y: number): void {
    if (!this.world || this.hud.hidden) return;
    this.hovered = this.view.pick(x, y);
    this.render();
  }

  private async click(): Promise<void> {
    const world = this.world;
    const target = this.hovered;
    if (!world || !target || !this.myTurn()) return;
    const own = leaderAt(world, target);
    if (own?.side === PLAYER) {
      this.selected = own.id;
      this.render();
      return;
    }
    const plan = this.plan();
    const leader = this.selectedLeader();
    if (!plan || !leader || (plan.steps === 0 && !plan.target)) return;
    await this.act({ type: "move", leaderId: leader.id, to: target });
  }

  /** Applies one order, animates it, and hands over to the battle view if it started a fight. */
  private async act(action: WorldAction): Promise<void> {
    const world = this.world;
    if (!world || this.busy || world.outcome || world.engagement) return;
    const generation = this.generation;
    this.busy = true;
    this.forecastCache = null;
    this.render();
    const step = applyWorldAction(world, action);
    for (const event of step.events) {
      if (event.type === "moved") await this.view.walk(event.leaderId, event.path);
    }
    if (generation !== this.generation) return;
    this.world = step.world;
    this.syncView(step.world);
    this.busy = false;
    const engagement = step.world.engagement;
    if (engagement) {
      this.hud.hidden = true;
      await this.stage.tween(400, () => {});
      this.app.fight(engagement.battle, PLAYER, (battle) => this.afterBattle(battle, generation));
      return;
    }
    this.render();
    this.announce(step.events);
    await this.runAi();
  }

  private afterBattle(battle: Battle, generation: number): void {
    if (generation !== this.generation || !this.world) return;
    const step = concludeBattle(this.world, battle);
    this.world = step.world;
    this.enterMap();
    this.announce(step.events);
  }

  private announce(events: readonly WorldEvent[]): void {
    const captured = events.find((e) => e.type === "captured");
    if (captured?.type === "captured") this.hint.textContent = `${captured.side === PLAYER ? "You take" : "The enemy takes"} the city.`;
  }

  private async runAi(): Promise<void> {
    const world = this.world;
    if (!world || world.outcome || world.engagement || world.activeSide === PLAYER || this.busy) return;
    const generation = this.generation;
    await this.stage.tween(AI_STEP_MS, () => {});
    if (generation !== this.generation) return;
    await this.act(chooseWorldAction(world));
  }

  /** The deterministic forecast of a fight, played by the AI on both sides; cached per hovered target. */
  private forecastText(world: World, leader: Leader, target: MoveTarget): string {
    const key = `${world.turn}:${leader.id}:${leader.hex.q},${leader.hex.r}:${JSON.stringify(target)}`;
    if (this.forecastCache?.key === key) return this.forecastCache.text;
    const result = forecast(world, leader.id, target);
    let text = "";
    if (result?.outcome) {
      const standing = (mine: boolean) => Object.values(result.units).filter((u) => u.alive && (u.side === PLAYER) === mine).length;
      text = result.outcome.winner === PLAYER ? `AI forecast: victory, ${standing(true)} of yours standing.` : `AI forecast: defeat, ${standing(false)} of theirs standing.`;
    }
    this.forecastCache = { key, text };
    return text;
  }

  private render(): void {
    const world = this.world;
    if (!world) return;
    const leader = this.selectedLeader();
    const plan = this.plan();
    const reach = leader && this.myTurn() ? reachable(world, leader.id) : new Map<string, number>();
    this.view.setHighlights({
      reachable: new Set(reach.keys()),
      path: plan?.path.hexes ?? [],
      walked: plan?.steps ?? 0,
      attack: plan?.target && plan.target.kind !== "capture" ? this.hovered : null,
    });

    this.turn.textContent = world.outcome
      ? ""
      : `Turn ${world.turn} · ${world.activeSide === PLAYER ? "your move" : "the enemy moves"} · ${world.gold[PLAYER]} gold (+${income(world, PLAYER)}/turn) · seed ${this.seed}`;
    this.endTurn.disabled = !this.myTurn();
    this.renderWarbands(leader);
    this.renderCapitol(world, leader);
    this.hint.textContent = this.hintText(world, leader, plan);
    this.renderBanner(world);
    this.stage.renderer.domElement.style.cursor = plan && (plan.steps > 0 || plan.target) ? "pointer" : "default";
  }

  private hintText(world: World, leader: Leader | undefined, plan: MovePlan | null): string {
    if (!this.myTurn()) return world.activeSide === PLAYER ? "" : "The enemy is moving…";
    if (!leader) return "You have no warbands. Elevate a garrison unit in your Capitol.";
    const hovered = this.hovered;
    const own = hovered ? leaderAt(world, hovered) : undefined;
    if (own?.side === PLAYER && own.id !== leader.id) return `Click to select ${leaderName(own)}'s warband.`;
    const tile = hovered ? tileAt(world.map, hovered) : undefined;
    const terrain = tile ? `${tile.terrain}${TERRAIN_COST[tile.terrain] === null ? " (impassable)" : `, costs ${TERRAIN_COST[tile.terrain]}`}` : "";
    if (!plan) return `${leaderName(leader)}: ${leader.movement} movement left. ${terrain ? `Hovering ${terrain}.` : "Click a hex to march."}`;
    const target = plan.target;
    if (target?.kind === "capture") return "Click to take the undefended city.";
    if (target?.kind === "leader") return `Click to attack the enemy warband. ${this.forecastText(world, leader, target)}`;
    if (target?.kind === "garrison") {
      const city = cityById(world, target.cityId);
      return `Click to storm the ${city.kind === "capitol" ? "Capitol" : "city"}. ${this.forecastText(world, leader, target)}`;
    }
    if (plan.steps === 0) return "Not enough movement left to go further. End your turn.";
    const total = plan.path.hexes.length;
    const walks = plan.steps === total ? `March there (${plan.path.cost} movement)` : `March ${plan.steps} of ${total} hexes this turn`;
    return `${walks}. Hovering ${terrain}.`;
  }

  private memberRow(m: SquadMember): HTMLElement {
    const row = element("div", "member");
    row.appendChild(element("span", "name", unitName(m.defId)));
    const bar = element("div", "hp");
    const fill = element("div", "fill");
    fill.style.width = `${(100 * m.hp) / maxHp(m.defId)}%`;
    bar.append(fill, element("span", "value", `${m.hp} / ${maxHp(m.defId)}`));
    row.appendChild(bar);
    return row;
  }

  private renderWarbands(selected: Leader | undefined): void {
    this.squad.replaceChildren();
    const mine = this.myLeaders();
    this.squad.hidden = mine.length === 0;
    this.squad.appendChild(element("div", "title", mine.length === 1 ? "Your warband" : "Your warbands"));
    for (const leader of mine) {
      const isSelected = leader.id === selected?.id;
      const head = element("button", `warband${isSelected ? " selected" : ""}`);
      head.append(element("span", "name", leaderName(leader)), element("span", "meta", `${leader.squad.length} units · ${leader.movement} move`));
      head.addEventListener("click", () => {
        this.selected = leader.id;
        this.render();
      });
      this.squad.appendChild(head);
      if (!isSelected) continue;
      for (const m of [...leader.squad].sort((a, b) => a.tile.row - b.tile.row || a.tile.col - b.tile.col)) this.squad.appendChild(this.memberRow(m));
    }
  }

  private renderCapitol(world: World, selected: Leader | undefined): void {
    this.city.replaceChildren();
    const capitol = capitolOf(world, PLAYER);
    this.city.hidden = !capitol || world.outcome !== null;
    if (!capitol) return;
    this.city.appendChild(element("div", "title", "Your Capitol"));
    const mayAct = this.myTurn();
    for (const m of capitol.garrison) {
      const row = this.memberRow(m);
      if (m.defId !== GUARDIAN_ID) {
        const problem = elevateProblem(world, m.tile);
        const elevate = element("button", "small", "Elevate");
        elevate.disabled = !mayAct || problem !== null;
        elevate.title = problem ?? "Make this unit the leader of a new warband (irreversible).";
        elevate.addEventListener("click", () => void this.act({ type: "elevate", tile: m.tile }));
        row.appendChild(elevate);
      }
      this.city.appendChild(row);
    }
    const home = selected && sameHex(selected.hex, capitol.hex) ? selected : undefined;
    for (const defId of RECRUITS) {
      const cost = RECRUIT_COST[defId] ?? 0;
      const targets: { label: string; into: RecruitInto }[] = [{ label: "to the garrison", into: { kind: "garrison" } }];
      if (home) targets.unshift({ label: `to ${leaderName(home)}'s warband`, into: { kind: "leader", leaderId: home.id } });
      for (const { label, into } of targets) {
        const problem = recruitProblem(world, defId, into);
        const recruit = element("button", "action small", `Recruit ${unitName(defId)} ${label} (${cost})`);
        recruit.disabled = !mayAct || problem !== null;
        recruit.title = problem ?? "";
        recruit.addEventListener("click", () => void this.act({ type: "recruit", defId, into }));
        this.city.appendChild(recruit);
      }
    }
    if (!home) this.city.appendChild(element("div", "note", "Warbands standing in the Capitol can recruit directly and heal each turn."));
  }

  private renderBanner(world: World): void {
    this.banner.hidden = !world.outcome;
    if (!world.outcome) return;
    this.banner.replaceChildren();
    const won = world.outcome.winner === PLAYER;
    this.banner.appendChild(element("div", "title", won ? "The enemy Guardian has fallen" : "Your Guardian has fallen"));
    this.banner.appendChild(element("div", "subtitle", `${won ? "Victory" : "Defeat"} on turn ${world.turn}`));
    const again = element("button", "action", "New game");
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

  capitolHex(side: Side): Hex | null {
    return this.world ? (capitolOf(this.world, side)?.hex ?? null) : null;
  }
}
