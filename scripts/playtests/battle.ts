import { COLS, ROWS } from "#rules/battle/grid";
import type { Playtest, Point } from "#scripts/playtests/harness";

const TILES = ROWS.flatMap((row) => COLS.map((col) => ({ row, col })));

const battle: Playtest = {
  name: "battle",
  about: "a few turns of a fight by clicking, then Defend by its hotkey",
  async run(t) {
    await t.open("/?fight");
    for (let turn = 0; turn < 4; turn++) {
      await t.awaiting("battle");
      const hint = await t.page.textContent("#hint");
      // The first enemy the default action can reach (hovering it previews the hit); with none in reach, Wait.
      let target: Point | null = null;
      for (const tile of TILES) {
        const point = await t.tileScreen(1, tile.row, tile.col);
        await t.page.mouse.move(point.x, point.y);
        await t.frames();
        if ((await t.page.textContent("#hint"))?.includes("−")) {
          target = point;
          break;
        }
      }
      if (turn === 0) await t.shot("playtest-aim");
      const before = (await t.battleLog()).length;
      if (target) await t.page.mouse.click(target.x, target.y);
      else await t.page.locator("#actions button", { hasText: "Wait" }).click();
      await t.page.waitForFunction((n) => window.discDebug.log().length > n, before);
      t.log(`turn ${turn}: ${hint}`);
    }
    await t.awaiting("battle");
    const before = (await t.battleLog()).length;
    await t.page.keyboard.press("d");
    await t.page.waitForFunction((n) => window.discDebug.log().length > n, before, { timeout: 5000 });
    const pressed = (await t.battleLog()).slice(before);
    t.log(`hotkey d: ${pressed[0]}`);
    if (!pressed[0]?.includes("Defend")) t.fail(`the D hotkey did not defend: ${pressed.join(" | ")}`);
    await t.awaiting("battle");
    await t.shot("playtest-after");
    t.log((await t.battleLog()).slice(-6).join("\n  "));
  },
};

export default battle;
