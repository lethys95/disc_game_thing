import { sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { Battle, Side } from "#rules/battle/types";
import { toSave } from "#rules/save";
import type { Save } from "#rules/save";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle, playersIn } from "#rules/world/battles";
import { fallbackColor } from "#rules/world/colors";
import { createWorld } from "#rules/world/create";
import type { PlayerSetup } from "#rules/world/create";
import { income, manaIncome } from "#rules/world/economy";
import { movementOf } from "#rules/world/leaders";
import { planMove, reachable } from "#rules/world/movement";
import type { MovePlan } from "#rules/world/movement";
import { capitolOf, leaderAt, playerOf } from "#rules/world/state";
import type { Leader, PlayerId, World, WorldAction } from "#rules/world/state";
import { knownWorld, visionOf } from "#rules/world/vision";
import { castProblem, spellTargets } from "#rules/world/spells";
import { FACTIONS } from "#rules/factions";
import { hexKey } from "#rules/hex";
import type { AiClient } from "#view/ai-client";
import type { App } from "#view/app";
import { CityScreen } from "#view/city";
import type { Place } from "#view/city";
import { applySideColors, battleColors } from "#view/colors";
import { buttonById, byId, element, gold, mana, movementPips } from "#view/dom";
import { Forecasts } from "#view/forecasts";
import { ForkPrompt } from "#view/fork-prompt";
import { LeaderScreen } from "#view/leader";
import { HEX_STEP_MS } from "#view/map";
import type { MapView } from "#view/map";
import { MapPanels } from "#view/map-panels";
import { castHint, hintText, leaderName, newsText } from "#view/map-text";
import { formation, groupAt, placeInfo, showPeek } from "#view/peek";
import type { Stage } from "#view/stage";
import type { Sound } from "#view/sound";
import { worldCues } from "#view/sound-cues";
import { plainKey } from "#view/input";
import type { KeyLayer } from "#view/input";
import { StructureScreen } from "#view/structure";
import { structureAt } from "#rules/world/structures";
import { defaultMapSize } from "#rules/map";
import type { MapSize } from "#rules/map";
import { battleSetting } from "#view/battle-setting";

const AI_STEP_MS = 350;

export interface CampaignOptions {
  readonly onSetup: () => void;
  /** Called at the start of each of the player's turns with a save of the game. */
  readonly onAutosave: (save: Save) => void;
  readonly onMenu: () => void;
}

/** The map layer: select a warband, click a hex to march; walking into an enemy starts a battle. */
/** World units per second while an arrow key or WASD is held. */
const PAN_SPEED = 14;

const PAN: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
};

export class Campaign implements KeyLayer {
  private world: World | null = null;
  /**
   * The player at this screen (not a battle side). Player 0 for now: games are you against the AI. Hotseat or network
   * play will change it between turns.
   */
  private viewer: PlayerId = 0;
  private knownCache: { readonly world: World; readonly known: World } | null = null;
  private seed = 0;
  private selected: string | null = null;
  private hovered: Hex | null = null;
  private busy = false;
  private generation = 0;
  private readonly forecasts: Forecasts;
  private readonly hud = byId("maphud");
  private readonly turn = byId("mapturn");
  private readonly hint = byId("maphint");
  private readonly endTurn = buttonById("endturn");
  private readonly peek = byId("peek");
  private readonly forkPrompt = new ForkPrompt(byId("forkprompt"), this.peek, (action) => void this.act(action), () => this.render());
  private readonly panels = new MapPanels({
    select: (leaderId) => {
      this.selected = leaderId;
      this.render();
    },
    openLeader: (leaderId) => {
      this.leaderOpen = leaderId;
      this.render();
    },
    visit: (leaderId) => {
      this.visiting = leaderId;
      this.render();
    },
    openPlace: (place) => {
      this.place = place;
      this.render();
    },
    newGame: () => this.options.onSetup(),
    pickSpell: (id) => {
      this.casting = id;
      this.render();
    },
  });
  /** The spell being aimed on the map, if any: the next click on a valid hex casts it. */
  private casting: string | null = null;
  /** Pan keys held down now. */
  private readonly panning = new Set<string>();
  /** The city (or meeting warbands) whose screen is open. */
  private place: Place | null = null;
  private leaderOpen: string | null = null;
  private readonly leaderScreen = new LeaderScreen(byId("leaderscreen"), {
    act: (action) => void this.act(action),
    close: () => {
      this.leaderOpen = null;
      this.render();
    },
  });
  /** The warband whose visit to the structure it stands on is open. */
  private visiting: string | null = null;
  private readonly structureScreen = new StructureScreen(byId("structurescreen"), {
    act: (action) => void this.act(action),
    close: () => {
      this.visiting = null;
      this.render();
    },
  });
  private readonly cityScreen = new CityScreen(byId("capitol"), {
    act: (action) => void this.act(action),
    close: () => {
      this.place = null;
      this.render();
    },
  });

  constructor(
    private readonly stage: Stage,
    private readonly view: MapView,
    private readonly app: App,
    private readonly ai: AiClient,
    private readonly sound: Sound,
    private readonly options: CampaignOptions,
  ) {
    this.forecasts = new Forecasts(ai, () => this.render());
    const canvas = stage.renderer.domElement;
    // A city's home view lets the map show through (to look at the city); the map itself takes no orders then.
    canvas.addEventListener("pointermove", (e) => {
      if (!this.cityScreen.open()) this.hover(e.clientX, e.clientY);
    });
    canvas.addEventListener("click", () => {
      if (!this.cityScreen.open()) void this.click();
    });
    // Hold right-click on any group to see its formation, or on a node, structure or portal to see what it does.
    canvas.addEventListener("contextmenu", (e) => {
      if (this.world) e.preventDefault();
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 2 || this.cityScreen.open()) return;
      // Right-click stops aiming a spell; otherwise it peeks at a formation.
      if (this.casting) {
        this.casting = null;
        this.render();
      } else this.peekAt(e.clientX, e.clientY);
    });
    // Letting go of a pan key (or leaving the window) eases the glide out.
    window.addEventListener("keyup", (e) => {
      if (this.panning.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key)) this.glide();
    });
    window.addEventListener("blur", () => {
      this.panning.clear();
      this.glide();
    });
    window.addEventListener("pointerup", (e) => {
      if (e.button === 2) this.peek.hidden = true;
    });
    this.endTurn.addEventListener("click", () => void this.act({ type: "endTurn" }));
    buttonById("mapmenu").addEventListener("click", () => this.options.onMenu());
  }

  /** The camera glides while pan keys are held: the sum of their directions. */
  private glide(): void {
    let right = 0;
    let forward = 0;
    for (const key of this.panning) {
      const step = PAN[key];
      if (step) {
        right += step[0];
        forward += step[1];
      }
    }
    this.view.glide(right * PAN_SPEED, forward * PAN_SPEED);
  }

  /** The map, with its own screens (a city, a leader) over it. */
  open(): boolean {
    return this.world !== null;
  }

  key(e: KeyboardEvent): boolean {
    if (this.cityScreen.open()) return this.cityScreen.key(e);
    if (this.leaderScreen.open()) return this.leaderScreen.key(e);
    if (this.structureScreen.open()) return this.structureScreen.key(e);
    if (e.key === "Escape" && this.casting) {
      this.casting = null;
      this.render();
      return true;
    }
    // Arrow keys and WASD pan the map camera (user, 2026-09-27: panning shouldn't need a warband to move).
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!PAN[key] || this.hud.hidden || !plainKey(e)) return false;
    this.panning.add(key);
    this.glide();
    return true;
  }

  /** A new game; player 0 is the human at this screen, the others are played by the AI. */
  start(setups: readonly PlayerSetup[], seed: number, size?: MapSize): void {
    this.stop();
    this.seed = seed;
    this.world = createWorld(seed, setups, size ?? defaultMapSize(setups.length));
    this.view.viewer = this.viewer;
    this.view.setColors(setups.map((s) => s.color));
    this.view.build(this.world.map);
    this.view.buildSites(this.world);
    this.view.centerOn(this.world.map.starts[this.viewer] ?? { q: 0, r: 0 });
    this.enterMap();
    this.autosave();
  }

  /** Picks up a saved game where it left off, the AI's turn included. */
  resume(save: Save): void {
    this.stop();
    this.seed = save.seed;
    this.world = save.world;
    this.view.viewer = this.viewer;
    this.view.setColors(save.world.players.map((p) => p.color));
    this.view.build(save.world.map);
    this.view.buildSites(save.world);
    this.view.centerOn(save.world.map.starts[this.viewer] ?? { q: 0, r: 0 });
    this.enterMap();
  }

  /** Whether a map game is running (not a skirmish, not the setup screen). */
  get running(): boolean {
    return this.world !== null;
  }

  /** The game as it stands, or null in the middle of a battle (saves hold the map, not a battle in progress). */
  snapshot(): Save | null {
    const world = this.world;
    return world && !world.engagement ? toSave(world, this.seed, new Date()) : null;
  }

  private autosave(): void {
    const save = this.snapshot();
    if (save) this.options.onAutosave(save);
  }

  /** Screenshots and playtests: our units and leader start with this much XP (to reach a fork, to spend points). */
  startingXp(xp: number): void {
    const world = this.world;
    if (!world) return;
    const leaders = world.leaders.map((l) => (l.player === this.viewer ? { ...l, experience: xp, squad: l.squad.map((m) => ({ ...m, xp })) } : l));
    this.world = { ...world, leaders };
    this.render();
  }

  /** Screenshots and playtests: we start with this much mana of every color (to try spells). */
  startingMana(amount: number): void {
    const world = this.world;
    if (!world) return;
    this.world = { ...world, players: world.players.map((p, id) => (id === this.viewer ? { ...p, mana: { red: amount, teal: amount } } : p)) };
    this.render();
  }

  /** Screenshots: the player at this screen has explored the whole map (the fog stays over what it can't see now). */
  revealAll(): void {
    const world = this.world;
    if (!world) return;
    const explored = Object.keys(world.map.tiles);
    // Places out of sight show as remembered: remember them as they are now.
    const memory = structuredClone({ cities: world.cities, lairs: world.lairs, nodes: world.nodes, structures: world.structures });
    const next = { ...world, players: world.players.map((p, id) => (id === this.viewer ? { ...p, explored, memory } : p)) };
    this.world = next;
    this.syncView(next);
    this.render();
  }

  /** Screenshots and playtests: the first warband stands on a structure of this kind, visiting it. */
  openStructure(kind: string): void {
    const world = this.world;
    const leader = this.myLeaders()[0];
    const structure = world?.structures.find((s) => s.kind === kind);
    if (!world || !leader || !structure) return;
    this.world = { ...world, leaders: world.leaders.map((l) => (l.id === leader.id ? { ...l, hex: structure.hex } : l)) };
    this.visiting = leader.id;
    this.syncView(this.world);
    this.render();
  }

  openLeader(): void {
    this.leaderOpen = this.myLeaders()[0]?.id ?? null;
    this.render();
  }

  /** Screenshots and playtests: the Capitol's screen, on a tab by name (its home view otherwise). */
  openCapitol(tab: string): void {
    const capitol = this.world ? capitolOf(this.world, this.viewer) : undefined;
    this.place = capitol ? { kind: "city", cityId: capitol.id } : null;
    this.render();
    this.cityScreen.openTab(tab);
  }

  stop(): void {
    this.generation += 1;
    this.forecasts.clear();
    this.place = null;
    this.cityScreen.hide();
    this.leaderOpen = null;
    this.leaderScreen.hide();
    this.visiting = null;
    this.structureScreen.hide();
    this.world = null;
    this.busy = false;
    this.hud.hidden = true;
  }

  private enterMap(): void {
    const world = this.world;
    if (!world) return;
    this.sound.mapMusic(playerOf(world, this.viewer).faction);
    this.sound.ambience(["ambience/map"]);
    // Outside battles, --side0 is you and --side1 your first opponent.
    const you = playerOf(world, this.viewer).color;
    applySideColors(document.documentElement, [you, world.players.find((_, id) => id !== this.viewer)?.color ?? fallbackColor(you)]);
    this.view.show();
    this.syncView(world);
    this.hud.hidden = false;
    this.render();
    void this.runAi();
  }

  /** Everything on the map is drawn as the player at this screen knows it (fog of war). */
  private syncView(world: World): void {
    const known = this.known() ?? knownWorld(world, this.viewer);
    this.view.setVision(visionOf(world, this.viewer));
    this.view.syncLeaders(known);
    this.view.syncSites(known);
    this.view.syncLairs(known);
    this.view.syncStructures(known);
  }

  /** The world as the player at this screen knows it: what hovering, planning and forecasts may use. */
  private known(): World | null {
    const world = this.world;
    if (!world) return null;
    // One known world per state: hovering asks for it several times per render.
    if (this.knownCache?.world !== world) this.knownCache = { world, known: knownWorld(world, this.viewer) };
    return this.knownCache.known;
  }

  private myLeaders(): Leader[] {
    return this.world?.leaders.filter((l) => l.player === this.viewer) ?? [];
  }

  private selectedLeader(): Leader | undefined {
    const mine = this.myLeaders();
    return mine.find((l) => l.id === this.selected) ?? mine.find((l) => l.movement > 0) ?? mine[0];
  }

  /** Whether the map waits for the viewer's orders. */
  myTurn(): boolean {
    const world = this.world;
    return world !== null && !this.busy && !world.outcome && !world.engagement && world.activePlayer === this.viewer;
  }

  private plan(): MovePlan | null {
    if (this.casting) return null;
    const world = this.known();
    const leader = this.selectedLeader();
    const hovered = this.hovered;
    if (!world || !leader || !hovered || !this.myTurn() || sameHex(hovered, leader.hex)) return null;
    if (leaderAt(world, hovered)?.player === this.viewer) return null;
    return planMove(world, leader.id, hovered);
  }

  private hover(x: number, y: number): void {
    if (!this.world || this.hud.hidden) return;
    const hex = this.view.pick(x, y);
    // Most pointer moves stay on the same hex: nothing to redraw.
    if (hex === this.hovered || (hex && this.hovered && sameHex(hex, this.hovered))) return;
    this.hovered = hex;
    this.render();
  }

  private async click(): Promise<void> {
    const world = this.known();
    const target = this.hovered;
    if (!world || !target || !this.myTurn()) return;
    const spell = this.casting;
    if (spell) {
      if (this.world && castProblem(this.world, spell, target) === null) {
        this.casting = null;
        await this.act({ type: "castSpell", spell, at: target });
      }
      return;
    }
    const own = leaderAt(world, target);
    if (own?.player === this.viewer) {
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
    this.forecasts.clear();
    this.render();
    const step = applyWorldAction(world, action);
    const stepMs = HEX_STEP_MS * this.stage.timeScale;
    for (const cue of worldCues(step.events, this.viewer, world.activePlayer, stepMs)) this.sound.play(cue.chain, cue.delay, cue.duration);
    for (const event of step.events) {
      if (event.type === "moved") await this.view.walk(event.leaderId, event.path, world.leaders.some((l) => l.id === event.leaderId && l.player === this.viewer));
    }
    if (generation !== this.generation) return;
    this.world = step.world;
    // A march that ends on a structure opens it, as D2's shops do.
    if (action.type === "move" && world.activePlayer === this.viewer) {
      const mover = step.world.leaders.find((l) => l.id === action.leaderId);
      if (mover && structureAt(step.world, mover) && !step.world.engagement) this.visiting = mover.id;
    }
    if (step.events.some((e) => e.type === "turnStarted" && e.player === this.viewer)) this.autosave();
    this.syncView(step.world);
    this.busy = false;
    const engagement = step.world.engagement;
    if (engagement) {
      this.hud.hidden = true;
      await this.stage.tween(400, () => {});
      if (!playersIn(engagement).includes(this.viewer)) {
        // Not our fight (other players, or one against neutrals): resolve it off-screen, as D2 does, and report it.
        const result = await this.ai.resolve(engagement.battle);
        this.afterBattle(result, generation);
        return;
      }
      const side: Side = engagement.players[0] === this.viewer ? 0 : 1;
      this.app.fight(engagement.battle, side, battleColors(step.world, engagement.players), battleSetting(step.world, engagement), (battle) => this.afterBattle(battle, generation));
      return;
    }
    this.render();
    this.announce(newsText(step.events, step.world, this.viewer));
    await this.runAi();
  }

  private afterBattle(battle: Battle, generation: number): void {
    if (generation !== this.generation || !this.world) return;
    const step = concludeBattle(this.world, battle);
    this.world = step.world;
    this.enterMap();
    this.announce(newsText(step.events, step.world, this.viewer));
  }

  private announce(news: string): void {
    if (news) this.hint.textContent = news;
  }

  private async runAi(): Promise<void> {
    const world = this.world;
    // Once you're out, the game is over for this screen, even if others would play on.
    if (!world || world.outcome || world.engagement || world.activePlayer === this.viewer || this.busy || playerOf(world, this.viewer).eliminated) return;
    const generation = this.generation;
    await this.stage.tween(AI_STEP_MS, () => {});
    if (generation !== this.generation) return;
    const action = await this.ai.chooseWorldAction(world);
    if (generation !== this.generation) return;
    await this.act(action);
  }

  private render(): void {
    const world = this.world;
    if (!world) return;
    const leader = this.selectedLeader();
    const plan = this.plan();
    const known = this.known() ?? knownWorld(world, this.viewer);
    if (this.casting && !this.myTurn()) this.casting = null;
    const casting = this.casting;
    const aimed = casting && this.hovered && castProblem(known, casting, this.hovered) === null ? this.hovered : null;
    const reach = casting ? new Set(spellTargets(known, casting).map(hexKey)) : new Set((leader && this.myTurn() ? reachable(known, leader.id) : new Map<string, number>()).keys());
    this.view.setHighlights({
      reachable: reach,
      path: plan?.path.hexes ?? [],
      walked: plan?.steps ?? 0,
      attack: aimed ?? (plan?.target && plan.target.kind !== "capture" ? this.hovered : null),
    });

    this.turn.replaceChildren();
    if (!world.outcome) {
      const color = FACTIONS[playerOf(world, this.viewer).faction].mana;
      this.turn.append(
        `Turn ${world.turn} · ${world.activePlayer === this.viewer ? "your move" : "the enemy moves"} · `,
        gold(playerOf(world, this.viewer).gold),
        ` (+${income(world, this.viewer)}) · `,
        mana(playerOf(world, this.viewer).mana[color], color),
        ` (+${manaIncome(world, this.viewer)})`,
      );
      if (leader) this.turn.append(" · ", element("span", "movement", `Movement ${movementPips(leader.movement, movementOf(leader))}`));
    }
    this.endTurn.disabled = !this.myTurn();
    this.panels.render(world, this.viewer, leader, this.casting, this.myTurn());
    this.renderCityScreen(world);
    this.hint.textContent = casting && this.myTurn()
      ? castHint(known, casting, this.hovered)
      : this.myTurn()
      ? hintText({ known, player: this.viewer, leader, hovered: this.hovered, plan, forecast: (l, target) => this.forecasts.text(known, l, target) })
      : world.activePlayer === this.viewer
        ? ""
        : "The enemy is moving…";
    this.renderLeaderScreen(world);
    this.renderStructureScreen(world);
    this.forkPrompt.render(world, this.viewer, this.myTurn());
    this.stage.renderer.domElement.style.cursor = aimed || (plan && (plan.steps > 0 || plan.target)) ? "pointer" : "default";
  }

  private renderLeaderScreen(world: World): void {
    const leader = world.leaders.find((l) => l.id === this.leaderOpen && l.player === this.viewer);
    if (leader) this.leaderScreen.show(world, leader, `${leaderName(leader)}, leader`, this.myTurn());
    else this.leaderScreen.hide();
  }

  private renderStructureScreen(world: World): void {
    const leader = world.leaders.find((l) => l.id === this.visiting && l.player === this.viewer);
    const structure = leader ? structureAt(world, leader) : undefined;
    if (leader && structure) this.structureScreen.show(world, leader, structure, this.myTurn());
    else {
      this.visiting = null;
      this.structureScreen.hide();
    }
  }

  private renderCityScreen(world: World): void {
    const place = this.place;
    const valid =
      place &&
      (place.kind === "city"
        ? world.cities.some((c) => c.id === place.cityId && c.owner === this.viewer)
        : [place.a, place.b].every((id) => world.leaders.some((l) => l.id === id && l.player === this.viewer)));
    if (place && valid) this.cityScreen.show(world, this.viewer, place, this.myTurn());
    else {
      this.place = null;
      this.cityScreen.hide();
    }
  }

  private peekAt(x: number, y: number): void {
    const hex = this.view.pick(x, y);
    const known = this.known();
    const group = hex && known ? groupAt(known, this.viewer, hex, this.view.sees(hex)) : null;
    const info = !group && hex && known ? placeInfo(known, this.viewer, hex, this.view.sees(hex)) : null;
    if (group) showPeek(this.peek, formation(group), x, y, 300, 200);
    else if (info) showPeek(this.peek, info, x, y, 300, 140);
    else this.peek.hidden = true;
  }

  /** Where a hex appears on screen; used by automated play-testing. */
  screenPoint(hex: Hex): { x: number; y: number } {
    return this.view.screenPoint(hex);
  }

  hexOfLeader(player: PlayerId): Hex | null {
    return this.world?.leaders.find((l) => l.player === player)?.hex ?? null;
  }

  capitolHex(player: PlayerId): Hex | null {
    return this.world ? (capitolOf(this.world, player)?.hex ?? null) : null;
  }

  /** Where the node of this player's Capitol stands (its own gold mine). */
  homeNodeHex(player: PlayerId): Hex | null {
    const capitol = this.world ? capitolOf(this.world, player) : undefined;
    return capitol ? (this.world?.nodes.find((n) => n.cityId === capitol.id)?.hex ?? null) : null;
  }
}
