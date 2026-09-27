import type { Playtest } from "#scripts/playtests/harness";

const setup: Playtest = {
  name: "setup",
  about: "add two AI opponents (one Ral-Vitahl), pick a Large map, march, and find four players in the game",
  async run(t) {
    await t.open("/");
    const add = t.page.locator("button", { hasText: "Add an AI opponent" });
    await add.click();
    await add.click();
    await t.page.locator(".setup-extras .extra").nth(1).locator("button", { hasText: "Ral-Vitahl" }).click();
    const picked = t.page.locator(".map-size button.selected");
    const byDefault = await picked.textContent();
    t.log(`map size by default for four players: ${byDefault}`);
    if (byDefault !== "Medium") t.fail(`four players should default to a Medium map: ${byDefault}`);
    await t.page.locator(".map-size button", { hasText: "Large" }).click();
    if ((await picked.textContent()) !== "Large") t.fail("picking Large didn't take");
    await t.shot("playtest-setup");
    await t.page.locator("button", { hasText: "March" }).click();
    await t.page.waitForSelector("#mapmenu", { state: "visible" });
    await t.page.click("#mapmenu");
    const autosave = await t.page.locator("#menu .save-row", { hasText: "Autosave" }).locator(".note").textContent();
    t.log(`autosave: ${autosave}`);
    if (!autosave?.includes("Jilliath vs Jilliath vs Jilliath vs Ral-Vitahl")) t.fail(`expected four players in the game: ${autosave}`);
  },
};

export default setup;
