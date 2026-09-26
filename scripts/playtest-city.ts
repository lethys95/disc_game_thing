import { chromium } from "playwright";
import { createServer } from "vite";

/** The city screen by hand: drag a unit from the visiting warband into the garrison, then recruit on an empty tile. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(new URL("/?map&seed=1&capitol", base).href);
await page.waitForSelector("body[data-ready=true]");

const grids = page.locator("#capitol .squad-grid");
const titles = () => grids.locator(".section").allTextContents();
/** "Garrison · 2/4" → 2. */
const count = (title: string | undefined) => Number(/· (\d+)\//.exec(title ?? "")?.[1] ?? -1);
const cell = (grid: number, index: number) => grids.nth(grid).locator(".cell").nth(index);
console.log(`before: ${(await titles()).join(" | ")}`);
// Visiting warband, front row middle (index 1) → garrison, back row right (index 8).
await cell(1, 1).dragTo(cell(0, 8));
await page.waitForTimeout(300);
const afterDrag = await titles();
console.log(`after drag: ${afterDrag.join(" | ")}`);
if (count(afterDrag[0]) !== 2) errors.push("the dragged unit didn't reach the garrison");

const purseBefore = Number((await page.textContent("#capitol .purse"))?.trim());
await cell(0, 6).click();
await page.locator(".grid-menu button", { hasText: "Recruit Congregant" }).click();
await page.waitForTimeout(300);
const afterRecruit = await titles();
const purse = await page.textContent("#capitol .purse");
console.log(`after recruit: ${afterRecruit.join(" | ")} · gold ${purse}`);
if (count(afterRecruit[0]) !== 3) errors.push("the recruit didn't arrive");
if (Number(purse?.trim()) !== purseBefore - 40) errors.push(`recruiting should cost 40 gold: ${purseBefore} → ${purse}`);
await page.screenshot({ path: "shots/playtest-city.png" });
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
