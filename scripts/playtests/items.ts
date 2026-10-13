import type { Playtest } from "#scripts/playtests/harness";

const items: Playtest = {
  name: "items",
  about: "put on items in the leader's screen, then aim Salt of the old kings on the map and see the salted hex",
  async run(t) {
    await t.open("/?map&seed=1&leader&items=salt_of_the_old_kings,grudgebearer:2,spyglass_helm,penitents_chains,veterans_standard:7");
    await t.page.locator("#leaderscreen .tab", { hasText: "Equipment" }).click();
    for (const name of ["Grudgebearer", "Spyglass helm", "Penitent's chains", "Veteran's standard"]) {
      await t.page.locator("#leaderscreen .slot-row", { hasText: name }).locator("button", { hasText: "Put on" }).click();
    }
    await t.shot("playtest-items-worn");
    const worn = await t.page.locator("#leaderscreen .slot-row", { hasText: "Grudgebearer" }).textContent();
    t.log(`grudgebearer: ${worn}`);
    if (!worn?.includes("2 so far")) t.fail("the Grudgebearer doesn't show its count");

    await t.page.locator("#leaderscreen .slot-row", { hasText: "Salt of the old kings" }).locator("button", { hasText: "Use" }).click();
    const leader = await t.leaderHex(0);
    if (!leader) throw new Error("no warband");
    const around = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([dq, dr]) => ({ q: leader.q + (dq ?? 0), r: leader.r + (dr ?? 0) }));
    let salted = false;
    for (const hex of around) {
      const at = await t.hexScreen(hex);
      await t.page.mouse.move(at.x, at.y);
      await t.frames();
      if (!(await t.page.textContent("#maphint"))?.includes("Click to use")) continue;
      t.log(`hint: ${await t.page.textContent("#maphint")}`);
      await t.page.mouse.click(at.x, at.y);
      salted = true;
      break;
    }
    if (!salted) t.fail("no hex beside the warband took the salt");
    await t.page
      .waitForFunction(() => [...document.querySelectorAll(".site-label")].some((l) => l.textContent?.startsWith("Salted")), null, { timeout: 5000 })
      .catch(() => t.fail("no salted hex on the map"));
    await t.shot("playtest-items-salt");
  },
};

export default items;
