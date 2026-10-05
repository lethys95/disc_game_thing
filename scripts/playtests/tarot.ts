import type { Playtest } from "#scripts/playtests/harness";

const tarot: Playtest = {
  name: "tarot",
  about: "a fight with Tarot 3 on both sides: the hand shows before anyone acts, a pick hides it, and the held card shows with the enemy's face down",
  async run(t) {
    await t.open("/?fight=bandits&tarot=3&seed=4");
    await t.page.waitForSelector("#tarot:not([hidden]) .tarot-card");
    const cards = await t.page.locator("#tarot .tarot-card .arcana").allTextContents();
    t.log(`hand: ${cards.join(" | ")}`);
    if (cards.length !== 3) t.fail(`expected 3 cards, got ${cards.length}`);
    const hint = await t.page.locator("#hint").textContent();
    t.log(`hint while picking: ${hint}`);
    if (!hint?.includes("tarot")) t.fail(`the hint should ask for a pick: ${hint}`);
    const log = await t.page.locator("#log").textContent();
    if (log?.includes(" takes ")) t.fail("someone acted before the pick");
    await t.shot("playtest-tarot-hand");

    await t.page.locator("#tarot .tarot-card").first().click();
    await t.page.waitForSelector("#tarot", { state: "hidden" });
    await t.awaiting("battle");
    const held = await t.page.locator("#tarot-status").innerText();
    t.log(`held: ${held.replace(/\n/g, " / ")}`);
    if (!cards[0] || !held.includes(cards[0])) t.fail(`the held card should be ${cards[0]}`);
    if (!held.includes("A hidden card")) t.fail("the enemy's card should show face down");
    await t.shot("playtest-tarot-held");
  },
};

export default tarot;
