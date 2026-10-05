import type { Playtest } from "#scripts/playtests/harness";

const tarot: Playtest = {
  name: "tarot",
  about: "Tarot 3 on both sides: flick through the hand fanned out face up and pick, watch the enemy's pick turn over from a face-down fan, then open the held cards from the HUD stack: ours in full, theirs by name only",
  async run(t) {
    await t.open("/?fight=bandits&tarot=3&seed=4");
    await t.page.waitForSelector("#tarot:not([hidden]) .fan-card");
    const cards = await t.page.locator("#tarot .fan-card .plate").allTextContents();
    t.log(`hand: ${cards.join(" | ")}`);
    if (cards.length !== 3) t.fail(`expected 3 cards, got ${cards.length}`);
    if (!(await t.page.locator("#hint").textContent())?.includes("tarot")) t.fail("the hint should ask for a pick");
    if ((await t.page.locator("#log").textContent())?.includes(" takes ")) t.fail("someone acted before the pick");
    // Flicking through: the focused card's caption follows.
    await t.page.keyboard.press("ArrowLeft");
    const focused = await t.page.locator("#tarot .caption .arcana").textContent();
    t.log(`after a flick left: ${focused}`);
    if (focused !== cards[0]) t.fail(`the first card should be in focus, got ${focused}`);
    await t.shot("playtest-tarot-hand");
    await t.page.keyboard.press("Enter");

    // The enemy's hand: a face-down fan, the picked card turned over, no task text.
    await t.page.waitForSelector("#tarot .fan-footer button");
    await t.page.waitForTimeout(900);
    const down = await t.page.locator("#tarot .fan-card.face-down").count();
    const caption = await t.page.locator("#tarot .fan-caption").innerText();
    t.log(`enemy hand: ${down} face down; caption: ${caption.replace(/\n/g, " / ")}`);
    if (down !== 2) t.fail(`the enemy's other two cards should be face down, got ${down}`);
    if (/Kill|Land a|Lose no|Heal your|Done:/.test(caption)) t.fail("the enemy's task should stay hidden");
    await t.shot("playtest-tarot-enemy");
    await t.page.locator("#tarot .fan-footer button").click();
    await t.page.waitForSelector("#tarot", { state: "hidden" });

    await t.awaiting("battle");
    const minis = await t.page.locator("#tarot-icon .mini-card").count();
    t.log(`HUD stack: ${minis} cards`);
    if (minis !== 2) t.fail(`the HUD should show both cards in play, got ${minis}`);
    await t.page.locator("#tarot-icon").click();
    await t.page.waitForSelector("#tarot:not([hidden]) .fan-card");
    const ours = await t.page.locator("#tarot .fan-caption").innerText();
    await t.page.keyboard.press("ArrowRight");
    const theirs = await t.page.locator("#tarot .fan-caption").innerText();
    t.log(`held: ${ours.replace(/\n/g, " / ")} || ${theirs.replace(/\n/g, " / ")}`);
    if (!cards[0] || !ours.includes(cards[0]) || !ours.includes("Done:")) t.fail("our card should read in full");
    if (!theirs.includes("only they know")) t.fail("the enemy's card should read by name only");
    await t.shot("playtest-tarot-held");
    await t.page.keyboard.press("Escape");
    await t.page.waitForSelector("#tarot", { state: "hidden" });
  },
};

export default tarot;
