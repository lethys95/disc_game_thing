import { createBattle } from "#rules/battle";
import { App } from "#view/app";
import { Campaign } from "#view/campaign";
import { MapView } from "#view/map";
import { BattleScene } from "#view/scene";
import { Setup } from "#view/setup";
import { PRESETS } from "#view/squads";
import { Stage } from "#view/stage";

const params = new URLSearchParams(window.location.search);
const byId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
};

const stage = new Stage(byId("stage"));
if (params.has("fast")) stage.timeScale = 0.1;
const battleScene = new BattleScene(stage);
const mapView = new MapView(stage);
const app: App = new App(stage, battleScene, { onSetup: () => showSetup() });
const campaign: Campaign = new Campaign(stage, mapView, app, { onSetup: () => showSetup() });
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
  onMarch: (squads) => {
    setup.hide();
    campaign.start(squads, Number(params.get("seed") ?? Math.floor(Date.now() % 100000)));
  },
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
  campaign.start(presets, Number(params.get("seed") ?? 1));
} else if (params.has("steps") || params.has("auto") || params.has("fight")) {
  setup.hide();
  app.start(presets, params.get("auto") === "1" ? null : 0, Number(params.get("steps") ?? 0));
} else {
  showSetup();
}

if (params.has("debug")) {
  Object.assign(window, {
    discDebug: {
      tileScreen: (side: 0 | 1, row: 0 | 1 | 2, col: 0 | 1 | 2) => battleScene.screenPoint({ side, tile: { row, col } }),
      hexScreen: (q: number, r: number) => campaign.screenPoint({ q, r }),
      leaderHex: (side: 0 | 1) => campaign.hexOfLeader(side),
      reachable: () => campaign.reachableHexes(),
      log: () => [...document.querySelectorAll("#log .entry")].map((e) => e.textContent),
    },
  });
}
document.body.dataset.ready = "true";
