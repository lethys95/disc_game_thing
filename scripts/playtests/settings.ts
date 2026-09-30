import type { Playtest } from "#scripts/playtests/harness";

const settings: Playtest = {
  name: "settings",
  about: "remap Defend, pick an animation speed, show the frame rate, reload, and find all three kept and in use",
  async run(t) {
    const openSettings = async () => {
      await t.page.click("#mapmenu");
      await t.page.locator("#menu button", { hasText: "Settings" }).click();
    };
    const defendKey = () => t.page.locator("#menu .save-row", { hasText: "Defend" }).locator(".key").textContent();

    await t.open("/?map&seed=1");
    await openSettings();
    await t.page.locator("#menu .save-row", { hasText: "Defend" }).locator("button").click();
    await t.page.keyboard.press("x");
    await t.page.locator("#menu .segmented button", { hasText: "Fastest" }).click();
    await t.page.locator("#menu label", { hasText: "Show the frame rate" }).locator("input").check();
    await t.page.waitForSelector(".fps-meter");
    t.log(`after remap: Defend ${await defendKey()}`);
    await t.page.locator("#menu label", { hasText: "Show the frame rate" }).scrollIntoViewIfNeeded();
    await t.shot("playtest-settings");

    await t.open("/?map&seed=1");
    await openSettings();
    const kept = await defendKey();
    const speed = await t.page.locator("#menu .segmented button.selected").textContent();
    t.log(`after reload: Defend ${kept}, speed ${speed}`);
    if (kept !== "X") t.fail(`the remapped key wasn't kept: ${kept}`);
    if (speed !== "Fastest") t.fail(`the speed wasn't kept: ${speed}`);
    const meter = await t.page.locator(".fps-meter").textContent();
    t.log(`after reload: frame rate ${meter}`);
    if (!meter?.includes("fps")) t.fail(`the frame-rate readout wasn't kept: ${meter}`);

    // In a battle, Defend now answers to X.
    await t.open("/?fight");
    await t.awaiting("battle");
    const shown = await t.page.locator("#actions button", { hasText: "Defend" }).locator(".key").textContent();
    t.log(`battle: Defend button shows ${shown}`);
    if (shown !== "X") t.fail(`the Defend button shows ${shown}`);
    // Keys 1–9 pick buttons by position: the last button's number chooses it.
    const buttons = t.page.locator("#actions button");
    const count = await buttons.count();
    const last = await buttons.nth(count - 1).locator(".slot").textContent();
    t.log(`battle: ${count} buttons, the last numbered ${last}`);
    if (last !== String(count)) t.fail(`the last button should be numbered ${count}: ${last}`);
    await t.shot("playtest-settings-battle");
  },
};

export default settings;
