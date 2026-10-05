import type { Playtest } from "#scripts/playtests/harness";

const tarot: Playtest = {
  name: "tarot",
  about: "Tarot 3 on both sides: pick from the hand face up, see the enemy's hand face down with its pick turned over, then the tarot icon shows ours in full and theirs by name only",
  async run(t) {
    await t.open("/?fight=bandits&tarot=3&seed=4");
    await t.page.waitForSelector("#tarot:not([hidden]) button.tarot-card");
    const cards = await t.page.locator("#tarot .tarot-card .tarot-face .arcana").allTextContents();
    t.log(`hand: ${cards.join(" | ")}`);
    if (cards.length !== 3) t.fail(`expected 3 cards, got ${cards.length}`);
    const hint = await t.page.locator("#hint").textContent();
    if (!hint?.includes("tarot")) t.fail(`the hint should ask for a pick: ${hint}`);
    if ((await t.page.locator("#log").textContent())?.includes(" takes ")) t.fail("someone acted before the pick");
    await t.shot("playtest-tarot-hand");

    await t.page.locator("#tarot button.tarot-card").first().click();
    // The enemy's hand: three backs and one face, and no task text.
    await t.page.waitForSelector("#tarot:not([hidden]) .tarot-card.picked");
    const backs = await t.page.locator("#tarot .tarot-face.back").count();
    const shown = await t.page.locator("#tarot").innerText();
    t.log(`enemy hand: ${backs} face down; ${shown.split("\n").find((l) => l.includes("turns one over"))}`);
    if (backs !== 2) t.fail(`the enemy's other two cards should be face down, got ${backs}`);
    if (/Kill|Land a|Lose no|Heal your/.test(shown)) t.fail("the enemy's task should stay hidden");
    await t.shot("playtest-tarot-enemy");
    await t.page.locator("#tarot button.action", { hasText: "Continue" }).click();
    await t.page.waitForSelector("#tarot", { state: "hidden" });

    await t.awaiting("battle");
    await t.page.locator("#tarot-icon").click();
    const panel = await t.page.locator("#tarot-panel").innerText();
    t.log(`panel: ${panel.replace(/\n/g, " / ")}`);
    if (!cards[0] || !panel.includes(cards[0])) t.fail(`our card should be ${cards[0]}`);
    if (!panel.includes("The enemy's card.")) t.fail("the enemy's card should be listed by name");
    await t.shot("playtest-tarot-held");
  },
};

export default tarot;
