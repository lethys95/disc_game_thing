import { chromium } from "playwright";
import { createServer } from "vite";

/** The setup screen by hand: add two AI opponents (one Ral-Vitahl), march, and find four players in the game. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(new URL("/", base).href);
await page.waitForSelector("body[data-ready=true]");

const add = page.locator("button", { hasText: "Add an AI opponent" });
await add.click();
await add.click();
await page.locator(".setup-extras .extra").nth(1).locator("button", { hasText: "Ral-Vitahl" }).click();
await page.screenshot({ path: "shots/playtest-setup.png" });
await page.locator("button", { hasText: "March" }).click();
await page.waitForSelector("#mapmenu", { state: "visible" });
await page.click("#mapmenu");
const autosave = await page.locator("#menu .save-row", { hasText: "Autosave" }).locator(".note").textContent();
console.log(`autosave: ${autosave}`);
if (!autosave?.includes("Jilliath vs Jilliath vs Jilliath vs Ral-Vitahl")) errors.push(`expected four players in the game: ${autosave}`);
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
