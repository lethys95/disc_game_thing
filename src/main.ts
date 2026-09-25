import { App } from "#view/app";
import { BattleScene } from "#view/scene";
import { DEFAULT_SQUAD } from "#view/squads";

const params = new URLSearchParams(window.location.search);
const host = document.getElementById("stage");
if (!host) throw new Error("missing #stage");

const scene = new BattleScene(host);
const app = new App(scene, {
  playerSide: params.get("auto") === "1" ? null : 0,
  fastForward: Number(params.get("steps") ?? 0),
  squads: [DEFAULT_SQUAD, DEFAULT_SQUAD],
});
app.start();
if (params.has("debug")) {
  Object.assign(window, {
    discDebug: {
      tileScreen: (side: 0 | 1, row: 0 | 1 | 2, col: 0 | 1 | 2) => scene.screenPoint({ side, tile: { row, col } }),
      log: () => [...document.querySelectorAll("#log .entry")].map((e) => e.textContent),
    },
  });
}
document.body.dataset.ready = "true";
