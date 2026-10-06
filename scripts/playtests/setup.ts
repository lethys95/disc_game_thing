import type { Playtest } from "#scripts/playtests/harness";

const setup: Playtest = {
  name: "setup",
  about: "from the title: a new game as the Grove against three opponents (one Ral-Vitahl), a Large map, march, and find four players in the game; then the codex and credits open and close",
  async run(t) {
    await t.open("/");
    await t.shot("playtest-title");
    await t.page.click("#title >> text=New game");
    await t.page.locator(".faction-card", { hasText: "Sylvan" }).click();
    const add = t.page.locator("#newgame button", { hasText: "Add an opponent" });
    await add.click();
    await add.click();
    await t.page.locator("#newgame .row", { hasText: "Opponent 2" }).locator("button", { hasText: "Ral-Vitahl" }).click();
    const picked = t.page.locator("#newgame .map-size button.selected");
    const byDefault = await picked.textContent();
    t.log(`map size by default for four players: ${byDefault}`);
    if (byDefault !== "Medium") t.fail(`four players should default to a Medium map: ${byDefault}`);
    await t.page.locator("#newgame .map-size button", { hasText: "Large" }).click();
    if ((await picked.textContent()) !== "Large") t.fail("picking Large didn't take");
    await t.shot("playtest-newgame");
    await t.page.locator("#newgame button", { hasText: "March" }).click();
    await t.page.waitForSelector("#mapmenu", { state: "visible" });
    await t.page.click("#mapmenu");
    const autosave = await t.page.locator("#menu .save-row", { hasText: "Autosave" }).locator(".note").textContent();
    t.log(`autosave: ${autosave}`);
    if (!autosave?.startsWith("Turn 1 · Sylvan vs ") || !autosave.includes("Ral-Vitahl") || (autosave.match(/ vs /g) ?? []).length !== 3)
      t.fail(`expected you as Sylvan against three, one of them Ral-Vitahl: ${autosave}`);

    await t.open("/");
    await t.page.click("#title >> text=Codex");
    await t.page.click("#codex >> text=Sylvan");
    await t.page.click("#codex .codex-row >> text=Psychopomp");
    const shown = await t.page.textContent("#codex .codex-top .name");
    t.log(`codex shows: ${shown}`);
    if (shown !== "Psychopomp") t.fail(`the codex should show the Psychopomp: ${shown}`);
    await t.shot("playtest-codex");
    await t.page.click("#codex >> text=Back");
    await t.page.click("#title >> text=Credits");
    await t.page.waitForSelector("#credits .credits-page", { state: "visible" });
    await t.page.click("#credits >> text=Back");
    await t.page.waitForSelector("#title .title-menu", { state: "visible" });
  },
};

export default setup;
