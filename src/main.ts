import { createBattle } from "#rules/battle";
import { App } from "#view/app";
import { BattleScene } from "#view/scene";
import { Setup } from "#view/setup";
import { PRESETS } from "#view/squads";

const params = new URLSearchParams(window.location.search);
const byId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
};

const scene = new BattleScene(byId("stage"));
const app: App = new App(scene, { onSetup: () => showSetup() });
const setup = new Setup(byId("setup"), {
  onChange: (squads) => {
    scene.reset();
    scene.sync(createBattle(squads).battle);
  },
  onFight: (squads, playerSide) => {
    setup.hide();
    app.start(squads, playerSide);
  },
});

function showSetup(): void {
  app.stop();
  setup.show();
}

// Screenshots and playtests skip the setup screen and start straight into a battle.
if (params.has("steps") || params.has("auto") || params.has("fight")) {
  setup.hide();
  app.start([PRESETS.preserve, PRESETS.punishment], params.get("auto") === "1" ? null : 0, Number(params.get("steps") ?? 0));
} else {
  showSetup();
}

if (params.has("debug")) {
  Object.assign(window, {
    discDebug: {
      tileScreen: (side: 0 | 1, row: 0 | 1 | 2, col: 0 | 1 | 2) => scene.screenPoint({ side, tile: { row, col } }),
      log: () => [...document.querySelectorAll("#log .entry")].map((e) => e.textContent),
    },
  });
}
document.body.dataset.ready = "true";
