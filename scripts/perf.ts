import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";
import { chromium } from "playwright";
import { createServer } from "vite";

/**
 * Frame rate on the headless integrated Radeon, the nearest thing here to the user's laptop: the `?fps` readout after
 * the scene settles, with bounce light on and off. `pnpm tsx scripts/perf.ts [route]` (default: the revealed map).
 */
const route = process.argv[2] ?? "/?map&seed=1&reveal";

const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const address = server.resolvedUrls?.local[0];
if (!address) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });

for (const bounceLight of [true, false]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await context.addInitScript((on: boolean) => window.localStorage.setItem("disc-settings", JSON.stringify({ bounceLight: on })), bounceLight);
  const page = await context.newPage();
  await page.goto(new URL(`${route}&fps`, address).href);
  await page.waitForSelector("body[data-ready=true]", { timeout: 30000 });
  await page.waitForTimeout(6000);
  const readings: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(1500);
    readings.push((await page.textContent(".fps-meter")) ?? "no meter");
  }
  console.log(`bounce light ${bounceLight ? "on " : "off"}: ${readings.join(" | ")}`);
  await context.close();
}

await browser.close();
await server.close();
