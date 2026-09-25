import { sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { tileAt, TERRAIN_COST } from "#rules/map";
import type { Battle, Side } from "#rules/battle/types";
import { forkOptions, openForks } from "#rules/forks";
import type { Commitment } from "#rules/forks";
import { EVOLUTIONS, GUARDIAN_ID } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle, playersIn } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { income, learnSkillProblem, waitingForks } from "#rules/world/economy";
import { LEADER_SKILLS, leadershipOf, rankOf, unspentPoints } from "#rules/world/leaders";
import { planMove, reachable } from "#rules/world/movement";
import { isLeaderOf, maxHpOf } from "#rules/world/record";
import { capitolOf, cityById, lairById, leaderAt } from "#rules/world/state";
import type { MovePlan, MoveTarget } from "#rules/world/movement";
import type { Leader, SquadMember, World, WorldAction, WorldEvent } from "#rules/world/state";
import type { AiClient } from "#view/ai-client";
import type { App } from "#view/app";
import type { MapView } from "#view/map";
import type { Squads } from "#view/setup";
import type { Stage } from "#view/stage";
import { CapitolScreen } from "#view/capitol";
import { buttonById, byId, element } from "#view/dom";
import { memberRow, unitName } from "#view/members";

const PLAYER: Side = 0;
const AI_STEP_MS = 350;

/** "Paladin (Faith preserves)": a branch by the unit it leads to and the dichotomy it stands for. */
function branchName(fork: string, to: string): string {
  const label = EVOLUTIONS[fork]?.find((e) => e.to === to)?.label;
  return label ? `${unitName(to)} (${label})` : unitName(to);
}

const LOCK_WARNING = (fork: string) => `Permanent: every ${unitName(fork)} in your army will take this branch.`;

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
  private readonly endTurn = buttonById("endturn");
  private readonly banner = byId("mapbanner");
  private readonly peek = byId("peek");
  private readonly prompt = byId("forkprompt");
  /** Forks the player put off with "Decide later", keyed by turn so the prompt returns next turn. */
  private deferred = new Set<string>();
  private capitolOpen = false;
  private readonly capitolScreen = new CapitolScreen(byId("capitol"), {
    act: (action) => void this.act(action),
    close: () => {
      this.capitolOpen = false;
      this.render();
    },
  });

  constructor(
    private readonly stage: Stage,
    private readonly view: MapView,
    private readonly app: App,
    private readonly ai: AiClient,
    private readonly options: CampaignOptions,
  ) {
    const canvas = stage.renderer.domElement;
    canvas.addEventListener("pointermove", (e) => this.hover(e.clientX, e.clientY));
    canvas.addEventListener("click", () => void this.click());
    // Hold right-click on any group to see its formation.
    canvas.addEventListener("contextmenu", (e) => {
      if (this.world) e.preventDefault();
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button === 2) this.peekAt(e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", (e) => {
      if (e.button === 2) this.peek.hidden = true;
    });
    this.endTurn.addEventListener("click", () => void this.act({ type: "endTurn" }));
  }

  start(squads: Squads, factions: readonly [Playable, Playable], commitment: readonly [Commitment, Commitment], seed: number): void {
    this.stop();
    this.seed = seed;
    this.world = createWorld(seed, squads, commitment, factions);
    this.view.build(this.world.map);
    this.view.buildSites(this.world);
    this.enterMap();
  }

  /** Screenshots and playtests: our units and leader start with this much XP (to reach a fork, to spend points). */
  startingXp(xp: number): void {
    const world = this.world;
    if (!world) return;
    const leaders = world.leaders.map((l) => (l.side === PLAYER ? { ...l, experience: xp, squad: l.squad.map((m) => ({ ...m, xp })) } : l));
    this.world = { ...world, leaders };
    this.render();
  }

  openCapitol(): void {
    this.capitolOpen = true;
    this.render();
  }

  stop(): void {
    this.generation += 1;
    this.capitolOpen = false;
    this.capitolScreen.hide();
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
    this.view.syncLairs(world);
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
      if (!playersIn(step.world, engagement).includes(PLAYER)) {
        // Not our fight (the enemy against neutrals): resolve it off-screen, as D2 does, and report the result.
        const result = await this.ai.resolve(engagement.battle);
        this.afterBattle(result, generation);
        return;
      }
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
    const lines: string[] = [];
    for (const e of events) {
      if (e.type === "captured") lines.push(`${e.side === PLAYER ? "You take" : "The enemy takes"} the city.`);
      if (e.type === "xp" && e.side === PLAYER) lines.push(`Your survivors gain ${e.each} XP each.`);
      if (e.type === "evolved" && e.side === PLAYER) lines.push(`${unitName(e.from)} becomes ${unitName(e.to)}.`);
      if (e.type === "cleared") lines.push(e.side === PLAYER ? "The bandit camp is cleared." : "The enemy cleared a bandit camp.");
      if (e.type === "leaderFell") lines.push(e.side === PLAYER ? "One of your warbands fell." : "An enemy warband fell.");
      if (e.type === "looted" && e.side === PLAYER) lines.push(`The dungeon yields ${e.gold} gold${e.joins ? ` and a ${unitName(e.joins)} joins you` : ""}.`);
    }
    if (lines.length > 0) this.hint.textContent = lines.join(" ");
  }

  private async runAi(): Promise<void> {
    const world = this.world;
    if (!world || world.outcome || world.engagement || world.activeSide === PLAYER || this.busy) return;
    const generation = this.generation;
    await this.stage.tween(AI_STEP_MS, () => {});
    if (generation !== this.generation) return;
    const action = await this.ai.chooseWorldAction(world);
    if (generation !== this.generation) return;
    await this.act(action);
  }

  /**
   * The deterministic forecast of a fight, played by the AI on both sides. Computed in the worker; the hint says
   * "thinking" until it arrives, then re-renders.
   */
  private forecastText(world: World, leader: Leader, target: MoveTarget): string {
    const key = `${world.turn}:${leader.id}:${leader.hex.q},${leader.hex.r}:${JSON.stringify(target)}`;
    if (this.forecastCache?.key === key) return this.forecastCache.text;
    this.forecastCache = { key, text: "AI forecast: thinking…" };
    const generation = this.generation;
    void this.ai.forecast(world, leader.id, target).then((result) => {
      if (generation !== this.generation || this.forecastCache?.key !== key) return;
      const text =
        result.winner === PLAYER
          ? `AI forecast: victory, ${result.standing[PLAYER]} of yours standing.`
          : `AI forecast: defeat, ${result.standing[PLAYER === 0 ? 1 : 0]} of theirs standing.`;
      this.forecastCache = { key, text };
      this.render();
    });
    return this.forecastCache.text;
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
    this.renderPrompt(world);
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
      const whose = city.owner === null ? "the bandit-held city" : city.kind === "capitol" ? "the Capitol" : "the city";
      return `Click to storm ${whose}. ${this.forecastText(world, leader, target)}`;
    }
    if (target?.kind === "lair") {
      const lair = lairById(world, target.lairId);
      const reward = lair.reward ? ` Reward: ${lair.reward.gold} gold${lair.reward.joins ? ` and a ${unitName(lair.reward.joins)} joins you` : ""}.` : "";
      return `Click to attack the ${lair.kind === "camp" ? "bandit camp" : "dungeon's guards"}.${reward} ${this.forecastText(world, leader, target)}`;
    }
    if (plan.steps === 0) return "Not enough movement left to go further. End your turn.";
    const total = plan.path.hexes.length;
    const walks = plan.steps === total ? `March there (${plan.path.cost} movement)` : `March ${plan.steps} of ${total} hexes this turn`;
    return `${walks}. Hovering ${terrain}.`;
  }

  private renderWarbands(selected: Leader | undefined): void {
    this.squad.replaceChildren();
    const mine = this.myLeaders();
    this.squad.hidden = mine.length === 0;
    this.squad.appendChild(element("div", "title", mine.length === 1 ? "Your warband" : "Your warbands"));
    for (const leader of mine) {
      const isSelected = leader.id === selected?.id;
      const head = element("button", `warband${isSelected ? " selected" : ""}`);
      head.append(element("span", "name", leaderName(leader)), element("span", "meta", `${leader.squad.length}/${leadershipOf(leader)} units · ${leader.movement} move`));
      head.addEventListener("click", () => {
        this.selected = leader.id;
        this.render();
      });
      this.squad.appendChild(head);
      if (!isSelected) continue;
      const commitment = this.world?.commitment[PLAYER];
      for (const m of [...leader.squad].sort((a, b) => a.tile.row - b.tile.row || a.tile.col - b.tile.col)) this.squad.appendChild(memberRow(m, leader, commitment));
      this.renderLeaderTree(leader);
    }
  }

  /** Points from the leader's experience, spent on the leader tree (docs/design/pillars.md). */
  private renderLeaderTree(leader: Leader): void {
    const world = this.world;
    if (!world) return;
    const points = unspentPoints(leader);
    this.squad.appendChild(element("div", "section", `Leader tree · ${leader.experience} XP · ${points} point${points === 1 ? "" : "s"} to spend`));
    const mayAct = this.myTurn();
    for (const [id, skill] of Object.entries(LEADER_SKILLS)) {
      const rank = rankOf(leader, id);
      const problem = learnSkillProblem(world, leader.id, id);
      const button = element("button", `skill small${rank > 0 ? " learned" : ""}`, `${skill.name} ${rank}/${skill.maxRank}`);
      button.disabled = !mayAct || problem !== null;
      button.title = problem ? `${skill.describe} (${problem})` : skill.describe;
      button.addEventListener("click", () => void this.act({ type: "learn", leaderId: leader.id, skill: id }));
      this.squad.appendChild(button);
    }
  }

  /** The side panel only summarises; everything you do in the Capitol happens on its own screen. */
  private renderCapitol(world: World, selected: Leader | undefined): void {
    this.city.replaceChildren();
    const capitol = capitolOf(world, PLAYER);
    this.city.hidden = !capitol || world.outcome !== null;
    if (!capitol) return;
    this.city.appendChild(element("div", "title", "Your Capitol"));
    for (const m of capitol.garrison.filter((g) => g.defId === GUARDIAN_ID)) this.city.appendChild(memberRow(m, undefined));
    const forks = openForks(world.factions[PLAYER], world.commitment[PLAYER]).length;
    const fallen = world.graveyard[PLAYER].length;
    const notes = [`${capitol.garrison.length - 1} in the garrison`, `${forks} open branch${forks === 1 ? "" : "es"}`, `${fallen} in the graveyard`];
    this.city.appendChild(element("div", "note", notes.join(" · ")));
    const enter = element("button", "action", "Enter the Capitol");
    enter.addEventListener("click", () => {
      this.capitolOpen = true;
      this.render();
    });
    this.city.appendChild(enter);
    if (this.capitolOpen) this.capitolScreen.show(world, PLAYER, this.homeLeader(world, selected), this.myTurn());
    else this.capitolScreen.hide();
  }

  /** The selected warband, if it stands in our Capitol. */
  private homeLeader(world: World, selected: Leader | undefined): Leader | undefined {
    const capitol = capitolOf(world, PLAYER);
    return selected && capitol && sameHex(selected.hex, capitol.hex) ? selected : undefined;
  }

  /** A unit of ours reached an undecided fork: ask now rather than let it sit at full XP unnoticed. */
  private renderPrompt(world: World): void {
    const fork = this.myTurn() ? waitingForks(world, PLAYER).find((f) => !this.deferred.has(`${world.turn}:${f}`)) : undefined;
    this.prompt.hidden = fork === undefined;
    if (fork === undefined) return;
    this.prompt.replaceChildren();
    this.prompt.appendChild(element("div", "title", `A ${unitName(fork)} is ready to evolve`));
    this.prompt.appendChild(element("div", "subtitle", LOCK_WARNING(fork)));
    for (const to of forkOptions(fork)) {
      const choose = element("button", "action", branchName(fork, to));
      choose.addEventListener("click", () => void this.act({ type: "choose", fork, to }));
      this.prompt.appendChild(choose);
    }
    const later = element("button", "small", "Decide later");
    later.addEventListener("click", () => {
      this.deferred.add(`${world.turn}:${fork}`);
      this.render();
    });
    this.prompt.appendChild(later);
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

  /** The squad standing on a hex, whoever it belongs to: a warband, a camp or dungeon's guards, a garrison. */
  private groupAt(hex: Hex): { title: string; squad: readonly SquadMember[]; leader: Leader | undefined } | null {
    const world = this.world;
    if (!world) return null;
    const leader = leaderAt(world, hex);
    if (leader) {
      const whose = leader.side === PLAYER ? "Your warband" : "Enemy warband";
      return { title: `${whose}, led by a ${leaderName(leader)}`, squad: leader.squad, leader };
    }
    const lair = world.lairs.find((l) => sameHex(l.hex, hex) && l.guards.length > 0);
    if (lair) return { title: lair.kind === "camp" ? "Bandit camp" : "Dungeon guards", squad: lair.guards, leader: undefined };
    const city = world.cities.find((c) => sameHex(c.hex, hex) && c.garrison.length > 0);
    if (city) {
      const whose = city.owner === null ? "Bandit-held" : city.owner === PLAYER ? "Your" : "Enemy";
      return { title: `${whose} ${city.kind === "capitol" ? "Capitol" : "city"} garrison`, squad: city.garrison, leader: undefined };
    }
    return null;
  }

  private peekAt(x: number, y: number): void {
    const hex = this.view.pick(x, y);
    const group = hex ? this.groupAt(hex) : null;
    this.peek.hidden = !group;
    if (!group) return;
    this.peek.replaceChildren(element("div", "title", group.title));
    const grid = element("div", "formation");
    for (const row of [0, 1, 2]) {
      grid.appendChild(element("div", "row-label", ["Front", "Middle", "Back"][row] ?? ""));
      for (const col of [0, 1, 2]) {
        const m = group.squad.find((s) => s.tile.row === row && s.tile.col === col);
        const cell = element("div", `cell${m ? " filled" : ""}`);
        if (m) {
          cell.appendChild(element("div", "name", `${isLeaderOf(m, group.leader) ? "♛ " : ""}${unitName(m.defId)}`));
          const bar = element("div", "hp");
          const fill = element("div", "fill");
          fill.style.width = `${(100 * m.hp) / maxHpOf(m, group.leader)}%`;
          bar.appendChild(fill);
          cell.appendChild(bar);
        }
        grid.appendChild(cell);
      }
    }
    this.peek.appendChild(grid);
    this.peek.style.left = `${Math.min(x + 16, window.innerWidth - 300)}px`;
    this.peek.style.top = `${Math.min(y + 16, window.innerHeight - 200)}px`;
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
