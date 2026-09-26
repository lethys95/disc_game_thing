import { chromium } from "playwright";
import { createServer } from "vite";

/** Spells by hand: learn one in the Capitol's Spells tab, then aim it on the map and cast it on our own warband. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(new URL("/?map&seed=1&capitol&mana=50&debug", base).href);
await page.waitForSelector("body[data-ready=true]");

await page.locator("#capitol .tabs button", { hasText: "Spells" }).click();
await page.locator(".spell-row", { hasText: "Bless warband" }).locator("button").click();
await page.screenshot({ path: "shots/playtest-spells-tab.png" });
const learned = await page.locator(".spell-row", { hasText: "Bless warband" }).textContent();
console.log(`spells tab: ${learned}`);
if (!learned?.includes("Learned")) errors.push("the spell wasn't learned");
await page.locator("#capitol button", { hasText: "Back to the map" }).click();

await page.locator(".spell-bar button", { hasText: "Bless warband" }).click();
// Our warband stands on the Capitol at the start.
const at = await page.evaluate(() => {
  const debug = Reflect.get(window, "discDebug");
  const hex = debug?.capitolHex(0);
  return hex ? debug.hexScreen(hex.q, hex.r) : null;
});
if (!at) throw new Error("no screen point for the Capitol");
await page.mouse.move(at.x, at.y);
await page.waitForTimeout(200);
console.log(`hint: ${await page.textContent("#maphint")}`);
await page.mouse.click(at.x, at.y);
await page.waitForTimeout(500);
const hint = await page.textContent("#maphint");
console.log(`after cast: ${hint}`);
if (!hint?.includes("You cast Bless warband")) errors.push(`the cast wasn't announced: ${hint}`);
await page.screenshot({ path: "shots/playtest-spells-cast.png" });
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
