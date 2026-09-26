import { chromium } from "playwright";
import { createServer } from "vite";

/** Settings by hand: remap Defend, pick an animation speed, reload, and find both kept and in use. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

const openSettings = async () => {
  await page.click("#mapmenu");
  await page.locator("#menu button", { hasText: "Settings" }).click();
};
const defendKey = () => page.locator("#menu .save-row", { hasText: "Defend" }).locator(".key").textContent();

await page.goto(new URL("/?map&seed=1", base).href);
await page.waitForSelector("body[data-ready=true]");
await openSettings();
await page.locator("#menu .save-row", { hasText: "Defend" }).locator("button").click();
await page.keyboard.press("x");
await page.locator("#menu .segmented button", { hasText: "Fastest" }).click();
console.log(`after remap: Defend ${await defendKey()}`);
await page.screenshot({ path: "shots/playtest-settings.png" });

await page.reload();
await page.waitForSelector("body[data-ready=true]");
await openSettings();
const kept = await defendKey();
const speed = await page.locator("#menu .segmented button.selected").textContent();
console.log(`after reload: Defend ${kept}, speed ${speed}`);
if (kept !== "X") errors.push(`the remapped key wasn't kept: ${kept}`);
if (speed !== "Fastest") errors.push(`the speed wasn't kept: ${speed}`);

// In a battle, Defend now answers to X.
await page.goto(new URL("/?fight", base).href);
await page.waitForSelector("body[data-ready=true]");
await page.waitForSelector("#actions button");
const defend = page.locator("#actions button", { hasText: "Defend" });
const shown = await defend.locator(".key").textContent();
console.log(`battle: Defend button shows ${shown}`);
if (shown !== "X") errors.push(`the Defend button shows ${shown}`);
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
