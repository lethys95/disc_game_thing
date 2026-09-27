import type { Playtest } from "#scripts/playtests/harness";

/** Seed 4: the enemy's warband is reached in a few turns. */
const SEED = 4;

const map: Playtest = {
  name: "map",
  about: "march at the enemy by clicking hexes, auto-battle the fight, and return to the map",
  async run(t) {
    await t.open(`/?fast&map&seed=${SEED}`);
    const visible = (sel: string) => t.page.locator(sel).isVisible();
    let battles = 0;
    for (let step = 0; step < 60; step++) {
      // Whatever comes next: the player's orders, a battle's end, the game's end.
      await t.page.waitForFunction(
        () => window.discDebug.awaiting() !== null || ["#banner", "#mapbanner"].some((sel) => document.querySelector<HTMLElement>(sel)?.checkVisibility()),
      );
      if (await visible("#mapbanner")) break;
      if (await visible("#banner")) {
        await t.shot(`map-battle-${battles}`);
        await t.page.click("#banner button");
        battles += 1;
        // Back on the map: orders again, or the game over.
        await t.page.waitForFunction(() => window.discDebug.awaiting() === "map" || (document.querySelector<HTMLElement>("#mapbanner")?.checkVisibility() ?? false));
        break;
      }
      if ((await t.awaitingNow()) === "battle") {
        await t.page.click("#auto");
        await t.page.waitForFunction(() => window.discDebug.awaiting() !== "battle");
        continue;
      }
      const enemy = await t.leaderHex(1);
      if (!enemy) break;
      // Like a person, pan the camera until the target isn't under a panel or a button.
      let point = await t.hexScreen(enemy);
      for (let pan = 0; pan < 12 && !(await t.page.evaluate((p) => document.elementFromPoint(p.x, p.y) instanceof HTMLCanvasElement, point)); pan++) {
        await t.page.keyboard.press(point.y < 360 ? "ArrowUp" : "ArrowDown");
        await t.page.keyboard.press(point.x < 640 ? "ArrowLeft" : "ArrowRight");
        await t.frames();
        point = await t.hexScreen(enemy);
      }
      await t.page.mouse.move(point.x, point.y);
      await t.frames();
      if (step === 0) await t.shot("map-aim");
      const hint = await t.page.textContent("#maphint");
      t.log(`step ${step}: ${hint}`);
      // The click lands when the leader moves, a battle starts, or the turn passes.
      const before = JSON.stringify([await t.leaderHex(0), await t.page.textContent("#mapturn")]);
      if (hint?.startsWith("Click to attack") || hint?.startsWith("March")) await t.page.mouse.click(point.x, point.y);
      else await t.page.click("#endturn");
      await t.page.waitForFunction(
        (b) => window.discDebug.awaiting() !== "map" || JSON.stringify([window.discDebug.leaderHex(0), document.getElementById("mapturn")?.textContent ?? null]) !== b,
        before,
      );
    }
    await t.shot("map-end");
    t.log(`battles: ${battles}`);
    if (battles === 0) t.fail("no battle was fought");
  },
};

export default map;
