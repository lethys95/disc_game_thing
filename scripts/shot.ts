import { HEADLESS_ENV, HEADLESS_GPU_ARGS } from "#scripts/headless";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";

const out = process.argv[2] ?? "shots/latest.png";
const route = process.argv[3] ?? "/";

const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const address = server.resolvedUrls?.local[0];
if (!address) throw new Error("vite did not report a local URL");

const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS], env: HEADLESS_ENV });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(new URL(route, address).href);
await page.waitForSelector("body[data-ready=true]", { timeout: 15000 });
await page.waitForTimeout(300);
await mkdir(out.substring(0, out.lastIndexOf("/")) || ".", { recursive: true });
await page.screenshot({ path: out });

await browser.close();
await server.close();

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(out);
