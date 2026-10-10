import type { Playtest } from "#scripts/playtests/harness";

const save: Playtest = {
  name: "save",
  about: "save a map game through the menu, reload the page, load it from the title screen, and compare",
  async run(t) {
    await t.open("/?map&seed=2");
    await t.awaiting("map");
    await t.page.click("#endturn");
    await t.page.waitForFunction(() => { const turn = document.getElementById("mapturn")?.dataset; return turn?.["turn"] === "2" && turn["mover"] === "you"; }, null, { timeout: 30000 });
    await t.awaiting("map");
    const before = await t.page.textContent("#mapcolumn");

    await t.page.click("#mapmenu");
    await t.page.click("#menu >> text=Save game");
    await t.page.waitForSelector("#menu >> text=Saved.");
    const listed = await t.page.locator("#menu .save-row .name").allTextContents();
    await t.shot("save-menu");

    await t.open("/");
    await t.page.click("#title >> text=Load game");
    await t.page.locator("#menu .save-row", { hasText: "Saved game" }).first().locator("text=Load").click();
    await t.page.waitForFunction(() => !document.getElementById("maphud")?.hidden, null, { timeout: 10000 });
    const after = await t.page.textContent("#mapcolumn");
    await t.shot("save-loaded");

    t.log(`saves listed: ${listed.join(", ")}`);
    t.log(`before: ${before}`);
    t.log(`after:  ${after}`);
    if (!listed.includes("Autosave") || !listed.includes("Saved game")) t.fail(`expected an autosave and a saved game, got: ${listed.join(", ")}`);
    if (before !== after) t.fail("the loaded game differs from the saved one");
  },
};

export default save;
