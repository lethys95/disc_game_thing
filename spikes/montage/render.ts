import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "../../scripts/headless";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";

/** Renders the montage spike to frames: `tsx spikes/montage/render.ts <dir> [seconds] [fps] [still-at]`. */
const dir = process.argv[2] ?? "montage-frames";
const seconds = Number(process.argv[3] ?? 24);
const fps = Number(process.argv[4] ?? 12);
const still = process.argv[5];
await mkdir(dir, { recursive: true });
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const address = server.resolvedUrls?.local[0] ?? "";
const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(new URL(`/spikes/montage/index.html?t=${still ?? 0}`, address).href);
await page.waitForSelector("body[data-ready=true]", { timeout: 120000 });
if (still !== undefined) await page.screenshot({ path: `${dir}/still.png` });
else {
  for (let i = 0; i < seconds * fps; i++) {
    await page.evaluate(`window.renderAt(${i / fps})`);
    await page.screenshot({ path: `${dir}/f_${String(i).padStart(4, "0")}.png` });
  }
}
await browser.close();
await server.close();
console.log("done", dir);
