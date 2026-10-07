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
    // Picking an entry far down a list keeps the list where it was (the user, 2026-10-07: it jumped to the top).
    await t.page.click("#codex .codex-header >> text=Abilities");
    const rows = t.page.locator("#codex .codex-list .rows");
    await rows.evaluate((el) => (el.scrollTop = 600));
    const below = await rows.evaluate((el) => [...el.querySelectorAll(".codex-row")].findIndex((r) => r instanceof HTMLElement && r.offsetTop - el.offsetTop > 700));
    await t.page.locator("#codex .codex-row").nth(below).click();
    const kept = await rows.evaluate((el) => el.scrollTop);
    t.log(`codex list scroll after picking an entry: ${kept} (was 600)`);
    if (kept !== 600) t.fail(`picking an ability moved the list from 600 to ${kept}`);
    await t.page.click("#codex >> text=Back");
    await t.page.click("#title >> text=Credits");
    await t.page.waitForSelector("#credits .credits-page", { state: "visible" });
    await t.page.click("#credits >> text=Back");
    await t.page.waitForSelector("#title .title-menu", { state: "visible" });
  },
};

export default setup;
