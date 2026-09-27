import type { Playtest } from "#scripts/playtests/harness";

const city: Playtest = {
  name: "city",
  about: "open on the home view, go to the garrison, drag a unit into it, recruit, peek at a unit, Escape out",
  async run(t) {
    await t.open("/?map&seed=1&capitol");
    // The Capitol opens on its home view: the city itself, the map showing through, the tab rail on the right.
    const home = await t.page.locator("#capitol").getAttribute("class");
    if (!home?.includes("home")) t.fail(`the Capitol didn't open on its home view: ${home}`);
    if (await t.page.locator("#mapsquad").isVisible()) t.fail("the map's warband panel shows over the home view");
    await t.page.waitForTimeout(700);
    await t.shot("playtest-city-home");
    await t.page.locator("#capitol .rail-tab", { hasText: "Garrison" }).click();
    const grids = t.page.locator("#capitol .squad-grid");
    const titles = () => grids.locator(".section").allTextContents();
    /** "Garrison · 2/4" → 2. */
    const count = (title: string | undefined) => Number(/· (\d+)\//.exec(title ?? "")?.[1] ?? -1);
    const garrisonHas = (n: number) => t.page.waitForFunction((want) => /· (\d+)\//.exec(document.querySelector("#capitol .squad-grid .section")?.textContent ?? "")?.[1] === String(want), n, { timeout: 5000 });
    /** Cells run column by column, each column back → middle → front (the battle's layout). */
    const cell = (grid: number, row: number, col: number) => grids.nth(grid).locator(".cell").nth(col * 3 + (2 - row));
    t.log(`before: ${(await titles()).join(" | ")}`);
    const start = count((await titles())[0]);
    // Visiting warband, front row middle → garrison, back row right.
    await cell(1, 0, 1).dragTo(cell(0, 2, 2));
    await garrisonHas(start + 1).catch(() => t.fail("the dragged unit didn't reach the garrison"));
    t.log(`after drag: ${(await titles()).join(" | ")}`);

    const purseBefore = Number((await t.page.textContent("#capitol .purse"))?.trim());
    await cell(0, 2, 0).click();
    await t.page.locator(".grid-menu button", { hasText: "Recruit Congregant" }).click();
    await garrisonHas(start + 2).catch(() => t.fail("the recruit didn't arrive"));
    const purse = await t.page.textContent("#capitol .purse");
    t.log(`after recruit: ${(await titles()).join(" | ")} · gold ${purse}`);
    if (Number(purse?.trim()) !== purseBefore - 40) t.fail(`recruiting should cost 40 gold: ${purseBefore} → ${purse}`);

    // Hold right-click on a unit: its card, armor included.
    const box = await cell(1, 0, 0).boundingBox();
    if (!box) throw new Error("no unit cell to peek at");
    await t.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await t.page.mouse.down({ button: "right" });
    const card = await t.page.locator("#peek").textContent();
    t.log(`peek: ${card?.slice(0, 80)}`);
    if (!card?.includes("armor")) t.fail("holding right-click on a unit shows no card with its armor");
    await t.shot("playtest-city-peek");
    await t.page.mouse.up({ button: "right" });
    await t.shot("playtest-city");
    await t.page.keyboard.press("Escape");
    await t.page.locator("#capitol").waitFor({ state: "hidden", timeout: 2000 }).catch(() => t.fail("Escape didn't close the city screen"));
  },
};

export default city;
