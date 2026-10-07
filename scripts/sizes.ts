import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";

/**
 * The main screens at three window sizes (`shots/sizes/<screen>-<height>.png`): the interface is sized in rem from the
 * window's height, so each screen should look the same at every size, only sharper. Compare them side by side.
 *
 *     pnpm sizes [route…]        default: title, codex, battle, map, Capitol, new game
 */
const DEFAULT_ROUTES = ["/", "/?codex", "/?fight", "/?map", "/?map&capitol=0", "/?newgame"];
const SIZES = [[1280, 720], [1920, 1080], [2560, 1440]] as const;

const routes = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_ROUTES;
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const address = server.resolvedUrls?.local[0];
if (!address) throw new Error("vite did not report a local URL");

await mkdir("shots/sizes", { recursive: true });
const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });
const errors: string[] = [];
for (const [width, height] of SIZES) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => errors.push(`${width}×${height}: ${e.message}`));
  for (const route of routes) {
    await page.goto(new URL(route, address).href);
    await page.waitForSelector("body[data-ready=true]", { timeout: 30000 });
    await page.waitForTimeout(500);
    const name = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "title";
    await page.screenshot({ path: `shots/sizes/${name}-${height}.png` });
  }
  await page.close();
}
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`shots/sizes/: ${routes.length} screens × ${SIZES.length} sizes`);
