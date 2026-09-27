import type { Playtest } from "#scripts/playtests/harness";

const structures: Playtest = {
  name: "structures",
  about: "at the merchant, buy an item into the bag and sell it back for half; Escape out",
  async run(t) {
    await t.open("/?map&seed=1&structure=merchant");
    const purse = async () => Number((await t.page.textContent("#structurescreen .purse"))?.trim());
    const start = await purse();
    const helm = t.page.locator("#structurescreen .spell-row", { hasText: "Iron helm" });
    await helm.locator("button", { hasText: "Buy" }).click();
    await t.page.waitForFunction((g) => Number(document.querySelector("#structurescreen .purse")?.textContent?.trim()) !== g, start, { timeout: 5000 });
    const afterBuy = await purse();
    t.log(`bought: gold ${start} → ${afterBuy}`);
    if (afterBuy !== start - 100) t.fail(`the Iron helm should cost 100: ${start} → ${afterBuy}`);
    await t.shot("playtest-merchant");
    await t.page.locator("#structurescreen .spell-row", { hasText: "Iron helm" }).locator("button", { hasText: "Sell" }).click();
    await t.page.waitForFunction((g) => Number(document.querySelector("#structurescreen .purse")?.textContent?.trim()) !== g, afterBuy, { timeout: 5000 });
    const afterSell = await purse();
    t.log(`sold: gold ${afterBuy} → ${afterSell}`);
    if (afterSell !== afterBuy + 50) t.fail(`selling should pay half: ${afterBuy} → ${afterSell}`);
    await t.page.keyboard.press("Escape");
    await t.page.locator("#structurescreen").waitFor({ state: "hidden", timeout: 2000 }).catch(() => t.fail("Escape didn't close the merchant"));
    const panel = await t.page.locator("#mapsquad button", { hasText: "Visit the merchant" }).count();
    if (panel !== 1) t.fail("the warband panel offers no visit while standing on the merchant");
  },
};

export default structures;
