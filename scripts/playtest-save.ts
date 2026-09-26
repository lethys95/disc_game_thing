import { chromium } from "playwright";
import { createServer } from "vite";

/** Saves a map game through the menu, reloads the page, loads it from the setup screen, and compares. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

const myTurn = () => page.waitForFunction(() => !(document.getElementById("endturn") as HTMLButtonElement | null)?.disabled, null, { timeout: 30000 });

await page.goto(new URL("/?map&seed=2", base).href);
await page.waitForSelector("body[data-ready=true]");
await myTurn();
await page.click("#endturn");
await page.waitForFunction(() => document.getElementById("mapturn")?.textContent?.startsWith("Turn 2 · your move"), null, { timeout: 30000 });
const before = await page.textContent("#mapturn");

await page.click("#mapmenu");
await page.click("#menu >> text=Save game");
await page.waitForSelector("#menu >> text=Saved.");
const listed = await page.locator("#menu .save-row .name").allTextContents();
await page.screenshot({ path: "shots/save-menu.png" });

await page.goto(new URL("/", base).href);
await page.waitForSelector("body[data-ready=true]");
await page.click("#setup >> text=Load game");
await page.locator("#menu .save-row", { hasText: "Saved game" }).first().locator("text=Load").click();
await page.waitForFunction(() => !document.getElementById("maphud")?.hidden, null, { timeout: 10000 });
const after = await page.textContent("#mapturn");
await page.screenshot({ path: "shots/save-loaded.png" });

console.log(`saves listed: ${listed.join(", ")}\nbefore: ${before}\nafter:  ${after}`);
if (!listed.includes("Autosave") || !listed.includes("Saved game")) errors.push(`expected an autosave and a saved game, got: ${listed.join(", ")}`);
if (before !== after) errors.push("the loaded game differs from the saved one");
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
