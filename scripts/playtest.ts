import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";

/** Plays a few player turns by clicking, like a person would, and screenshots along the way. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(new URL("/?debug", base).href);
await page.waitForSelector("body[data-ready=true]");
await mkdir("shots", { recursive: true });

type Point = { x: number; y: number };
const tile = (side: number, row: number, col: number) =>
  page.evaluate(
    (ref) => (window as unknown as { discDebug: { tileScreen: (s: number, r: number, c: number) => Point } }).discDebug.tileScreen(ref.side, ref.row, ref.col),
    { side, row, col },
  );
const waitPlayer = () => page.waitForFunction(() => document.querySelectorAll("#actions button").length > 0, null, { timeout: 20000 });

for (let turn = 0; turn < 4; turn++) {
  await waitPlayer();
  const hint = await page.textContent("#hint");
  const target = await tile(1, 0, turn % 3);
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(150);
  if (turn === 0) await page.screenshot({ path: "shots/playtest-aim.png" });
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(250);
  console.log(`turn ${turn}: ${hint}`);
}
await waitPlayer();
await page.screenshot({ path: "shots/playtest-after.png" });
const log = await page.evaluate(() => (window as unknown as { discDebug: { log: () => string[] } }).discDebug.log());
console.log(log.slice(-12).join("\n"));
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
