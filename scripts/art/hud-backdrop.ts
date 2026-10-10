import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";
import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";

/**
 * A screen of the game with its HTML interface hidden, at 1080p-equivalent CSS size, as the backdrop for a painted
 * HUD piece's mock (the `hud-paint-in` skill, step 5).
 *
 *     pnpm tsx scripts/art/hud-backdrop.ts <out.png> "<route>"     (e.g. "?map&seed=3")
 */

const [out, route] = process.argv.slice(2);
if (out === undefined || route === undefined) throw new Error('usage: hud-backdrop.ts <out.png> "<route>"');

const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const address = server.resolvedUrls?.local[0];
if (!address) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
await page.goto(new URL(route, address).href);
await page.waitForSelector("body[data-ready=true]", { timeout: 20000 });
await page.addStyleTag({ content: "body > div:not(#stage) { display: none !important; }" });
await page.waitForTimeout(500);
await mkdir(out.substring(0, out.lastIndexOf("/")) || ".", { recursive: true });
await page.screenshot({ path: out });
await browser.close();
await server.close();
console.log(out);
