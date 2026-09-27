import { createBattle } from "#rules/battle/engine";
import { AiClient } from "#view/ai-client";
import { applySideColors, colorPair } from "#view/colors";
import { GameMenu } from "#view/menu";
import { routeKeys } from "#view/input";
import { AUTOSAVE_ID, LocalSaveStore } from "#view/saves";
import { applyOrnaments } from "#view/art";
import { App } from "#view/app";
import { byId } from "#view/dom";
import { Campaign } from "#view/campaign";
import { MapView } from "#view/map";
import { BattleScene } from "#view/scene";
import { Setup } from "#view/setup";
import { BANDIT_GROUP, NEXUS_PRESETS, PRESETS } from "#rules/units/presets";
import { ANIMATION_SPEEDS, Settings } from "#view/settings";
import { Sound } from "#view/sound";
import { Stage } from "#view/stage";
import { defaultColors } from "#rules/world/colors";
import type { Playable } from "#rules/units/index";
import { isMapSize } from "#rules/map";

const params = new URLSearchParams(window.location.search);

applyOrnaments(document.documentElement);
const stage = new Stage(byId("stage"));
const settings = new Settings();
settings.follow((s) => stage.setFeel(ANIMATION_SPEEDS[s.speed].scale, s.rotate, s.zoom));
const sound = new Sound();
settings.follow((s) => sound.setVolumes(s));
// Every button clicks.
document.addEventListener("click", (e) => {
  if (e.target instanceof Element && e.target.closest("button")) sound.play(["ui/click"]);
});
if (params.has("fast")) stage.testScale = 0.1;
const battleScene = new BattleScene(stage);
const mapView = new MapView(stage);
const ai = new AiClient();
const app: App = new App(stage, battleScene, ai, settings, sound, { onSetup: () => showSetup() });
const saves = new LocalSaveStore();
const campaign: Campaign = new Campaign(stage, mapView, app, ai, sound, {
  onSetup: () => showSetup(),
  onAutosave: (save) => saves.write(AUTOSAVE_ID, save),
  onMenu: () => menu.show(),
});
const menu: GameMenu = new GameMenu(byId("menu"), {
  store: saves,
  settings,
  current: () => {
    if (setup.visible) return null;
    if (!campaign.running) return "Skirmishes aren't saved; march onto a map for a game you can save.";
    return campaign.snapshot() ?? "Finish the battle first: saves hold the map.";
  },
  load: (save) => {
    setup.hide();
    app.stop();
    campaign.resume(save);
  },
  newGame: () => showSetup(),
});
routeKeys([menu, app, campaign]);
const setup = new Setup(byId("setup"), {
  onChange: (squads, colors) => {
    battleScene.show();
    battleScene.setColors(colors);
    applySideColors(document.documentElement, colors);
    battleScene.reset();
    battleScene.sync(createBattle(squads).battle);
  },
  onFight: (squads, playerSide, colors) => {
    setup.hide();
    app.start(squads, playerSide, colors);
  },
  onMarch: (players, size) => {
    setup.hide();
    const seed = Number(params.get("seed") ?? Math.floor(Date.now() % 100000));
    campaign.start(players, seed, size);
  },
  onLoad: () => menu.show(),
});

function showSetup(): void {
  app.stop();
  campaign.stop();
  setup.show();
  sound.mapMusic("jilliath");
  sound.ambience(null);
}

const presets = [PRESETS.preserve, PRESETS.punishment] as const;
// Screenshots and playtests skip the setup screen.
if (params.has("map")) {
  setup.hide();
  const nexus = params.get("map") === "nexus";
  // `players=N`: more AI opponents, alternating factions after the first two.
  const count = Math.min(6, Math.max(2, Number(params.get("players") ?? 2)));
  const factions = Array.from({ length: count }, (_, i): Playable => (i === 0 ? "jilliath" : i === 1 ? (nexus ? "nexus" : "jilliath") : i % 2 === 0 ? "nexus" : "jilliath"));
  const colors = defaultColors(factions);
  const sizeParam = params.get("size") ?? "";
  campaign.start(
    factions.map((faction, i) => ({ squad: faction === "nexus" ? NEXUS_PRESETS.uncommitted : PRESETS.uncommitted, faction, commitment: {}, color: colors[i] ?? "white" })),
    Number(params.get("seed") ?? 1),
    // `size=large`: a map size other than the default for the number of players.
    isMapSize(sizeParam) ? sizeParam : undefined,
  );
  if (params.has("xp")) campaign.startingXp(Number(params.get("xp")));
  if (params.has("mana")) campaign.startingMana(Number(params.get("mana")));
  if (params.has("reveal")) campaign.revealAll();
  if (params.has("capitol")) campaign.openCapitol(params.get("capitol") ?? "");
  if (params.has("leader")) campaign.openLeader();
  const structure = params.get("structure");
  if (structure) campaign.openStructure(structure);
} else if (params.has("steps") || params.has("auto") || params.has("fight")) {
  setup.hide();
  const fight = params.get("fight") ?? "";
  const nexusKey = fight.startsWith("nexus:") ? fight.slice(6) : "uncommitted";
  const enemy = fight.startsWith("nexus") ? (nexusKey === "scheme" || nexusKey === "overload" ? NEXUS_PRESETS[nexusKey] : NEXUS_PRESETS.uncommitted) : fight === "bandits" ? BANDIT_GROUP : presets[1];
  app.start([presets[0], enemy], params.get("auto") === "1" ? null : params.get("side") === "1" ? 1 : 0, colorPair(["jilliath", fight.startsWith("nexus") ? "nexus" : "jilliath"]), Number(params.get("steps") ?? 0));
} else {
  showSetup();
}

if (params.has("debug")) {
  Object.assign(window, {
    discDebug: {
      tileScreen: (side: 0 | 1, row: 0 | 1 | 2, col: 0 | 1 | 2) => battleScene.screenPoint({ side, tile: { row, col } }),
      hexScreen: (q: number, r: number) => campaign.screenPoint({ q, r }),
      leaderHex: (side: 0 | 1) => campaign.hexOfLeader(side),
      capitolHex: (side: 0 | 1) => campaign.capitolHex(side),
      log: () => [...document.querySelectorAll("#log .entry")].map((e) => e.textContent),
      /** What waits for the player's input now, so playtests wait on state rather than on time. */
      awaiting: (): "battle" | "map" | null => (app.playersTurn() ? "battle" : campaign.myTurn() ? "map" : null),
    },
  });
}
document.body.dataset.ready = "true";
