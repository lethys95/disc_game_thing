import type { Playtest } from "#scripts/playtests/harness";

const structures: Playtest = {
  name: "structures",
  about: "at the merchant, buy a potion into the bag and sell it back for half; Escape out",
  async run(t) {
    await t.open("/?map&seed=1&structure=merchant");
    const purse = async () => Number((await t.page.textContent("#structurescreen .purse"))?.trim());
    const start = await purse();
    await t.page.locator("#structurescreen .spell-row", { hasText: "Healing potion" }).first().locator("button", { hasText: "Buy" }).click();
    await t.page.waitForFunction((g) => Number(document.querySelector("#structurescreen .purse")?.textContent?.trim()) !== g, start, { timeout: 5000 });
    const afterBuy = await purse();
    t.log(`bought: gold ${start} → ${afterBuy}`);
    if (afterBuy !== start - 60) t.fail(`the Healing potion should cost 60: ${start} → ${afterBuy}`);
    await t.shot("playtest-merchant");
    await t.page.locator("#structurescreen .spell-row", { hasText: "Healing potion" }).locator("button", { hasText: "Sell" }).click();
    await t.page.waitForFunction((g) => Number(document.querySelector("#structurescreen .purse")?.textContent?.trim()) !== g, afterBuy, { timeout: 5000 });
    const afterSell = await purse();
    t.log(`sold: gold ${afterBuy} → ${afterSell}`);
    if (afterSell !== afterBuy + 30) t.fail(`selling should pay half: ${afterBuy} → ${afterSell}`);
    await t.page.keyboard.press("Escape");
    await t.page.locator("#structurescreen").waitFor({ state: "hidden", timeout: 2000 }).catch(() => t.fail("Escape didn't close the merchant"));
    const panel = await t.page.locator('#mapcommands button[aria-label="Visit the merchant"]').count();
    if (panel !== 1) t.fail("the column offers no visit while standing on the merchant");
  },
};

export default structures;
