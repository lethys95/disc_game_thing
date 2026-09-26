import { createBattle } from "#rules/battle/engine";
import { AiClient } from "#view/ai-client";
import { GameMenu } from "#view/menu";
import { AUTOSAVE_ID, LocalSaveStore } from "#view/saves";
import { applyOrnaments } from "#view/art";
import { App } from "#view/app";
import { byId } from "#view/dom";
import { Campaign } from "#view/campaign";
import { MapView } from "#view/map";
import { BattleScene } from "#view/scene";
import { Setup } from "#view/setup";
import { BANDIT_GROUP, NEXUS_PRESETS, PRESETS } from "#view/squads";
import { Stage } from "#view/stage";

const params = new URLSearchParams(window.location.search);

applyOrnaments(document.documentElement);
const stage = new Stage(byId("stage"));
if (params.has("fast")) stage.timeScale = 0.1;
const battleScene = new BattleScene(stage);
const mapView = new MapView(stage);
const ai = new AiClient();
const app: App = new App(stage, battleScene, ai, { onSetup: () => showSetup() });
const saves = new LocalSaveStore();
const campaign: Campaign = new Campaign(stage, mapView, app, ai, {
  onSetup: () => showSetup(),
  onAutosave: (save) => saves.write(AUTOSAVE_ID, save),
  onMenu: () => menu.show(),
});
const menu: GameMenu = new GameMenu(byId("menu"), {
  store: saves,
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
const setup = new Setup(byId("setup"), {
  onChange: (squads) => {
    battleScene.show();
    battleScene.reset();
    battleScene.sync(createBattle(squads).battle);
  },
  onFight: (squads, playerSide) => {
    setup.hide();
    app.start(squads, playerSide);
  },
  onMarch: (squads, factions, commitments) => {
    setup.hide();
    const seed = Number(params.get("seed") ?? Math.floor(Date.now() % 100000));
    campaign.start(squads, factions, commitments, seed);
  },
  onLoad: () => menu.show(),
});

function showSetup(): void {
  app.stop();
  campaign.stop();
  setup.show();
}

const presets = [PRESETS.preserve, PRESETS.punishment] as const;
// Screenshots and playtests skip the setup screen.
if (params.has("map")) {
  setup.hide();
  const nexus = params.get("map") === "nexus";
  campaign.start([PRESETS.uncommitted, nexus ? NEXUS_PRESETS.uncommitted : PRESETS.uncommitted], ["jilliath", nexus ? "nexus" : "jilliath"], [{}, {}], Number(params.get("seed") ?? 1));
  if (params.has("xp")) campaign.startingXp(Number(params.get("xp")));
  if (params.has("capitol")) campaign.openCapitol();
  if (params.has("leader")) campaign.openLeader();
} else if (params.has("steps") || params.has("auto") || params.has("fight")) {
  setup.hide();
  const fight = params.get("fight") ?? "";
  const nexusKey = fight.startsWith("nexus:") ? fight.slice(6) : "uncommitted";
  const enemy = fight.startsWith("nexus") ? (nexusKey === "scheme" || nexusKey === "overload" ? NEXUS_PRESETS[nexusKey] : NEXUS_PRESETS.uncommitted) : fight === "bandits" ? BANDIT_GROUP : presets[1];
  app.start([presets[0], enemy], params.get("auto") === "1" ? null : 0, Number(params.get("steps") ?? 0));
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
    },
  });
}
document.body.dataset.ready = "true";
