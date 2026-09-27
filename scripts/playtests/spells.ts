import type { Playtest } from "#scripts/playtests/harness";

const spells: Playtest = {
  name: "spells",
  about: "learn a spell in the Capitol's Spells tab, then aim it on the map and cast it on our own warband",
  async run(t) {
    await t.open("/?map&seed=1&capitol&mana=50");
    await t.page.locator("#capitol .rail-tab", { hasText: "Spells" }).click();
    await t.page.locator(".spell-row", { hasText: "Bless warband" }).locator("button").click();
    await t.shot("playtest-spells-tab");
    const learned = await t.page.locator(".spell-row", { hasText: "Bless warband" }).textContent();
    t.log(`spells tab: ${learned}`);
    if (!learned?.includes("Learned")) t.fail("the spell wasn't learned");
    await t.page.locator("#capitol button", { hasText: "Back to the map" }).click();

    await t.page.locator(".spell-bar button", { hasText: "Bless warband" }).click();
    // Our warband stands on the Capitol at the start.
    const capitol = await t.capitolHex(0);
    if (!capitol) throw new Error("no Capitol");
    const at = await t.hexScreen(capitol);
    await t.page.mouse.move(at.x, at.y);
    await t.page.waitForFunction(() => document.getElementById("maphint")?.textContent?.includes("cast"), null, { timeout: 5000 });
    t.log(`hint: ${await t.page.textContent("#maphint")}`);
    await t.page.mouse.click(at.x, at.y);
    await t.page
      .waitForFunction(() => document.getElementById("maphint")?.textContent?.includes("You cast Bless warband"), null, { timeout: 5000 })
      .catch(async () => t.fail(`the cast wasn't announced: ${await t.page.textContent("#maphint")}`));
    t.log(`after cast: ${await t.page.textContent("#maphint")}`);
    await t.shot("playtest-spells-cast");
  },
};

export default spells;
