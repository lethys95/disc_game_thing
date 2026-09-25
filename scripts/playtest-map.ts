import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";

/** Marches the player's leader at the enemy by clicking hexes, auto-battles the fight, and returns to the map. */
const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(new URL(`/?debug&fast&map&seed=${process.argv[2] ?? "1"}`, base).href);
await page.waitForSelector("body[data-ready=true]");
await mkdir("shots", { recursive: true });

type Hex = { q: number; r: number };
type Debug = {
  hexScreen: (q: number, r: number) => { x: number; y: number };
  leaderHex: (side: 0 | 1) => Hex | null;
};
const debug = <T>(fn: (d: Debug) => T) => page.evaluate(fn as never) as Promise<T>;
const visible = (sel: string) => page.evaluate((s) => { const el = document.querySelector(s); return !!el && !(el as HTMLElement).hidden && !(el as HTMLElement).closest("[hidden]"); }, sel);

let battles = 0;
for (let step = 0; step < 200; step++) {
  if (await visible("#mapbanner")) break;
  if (await visible("#banner")) {
    await page.screenshot({ path: `shots/map-battle-${battles}.png` });
    await page.click("#banner button");
    battles += 1;
    await page.waitForTimeout(600);
    continue;
  }
  if (await visible("#auto")) {
    if ((await page.textContent("#auto")) === "Auto-battle") await page.click("#auto");
    await page.waitForTimeout(500);
    continue;
  }
  const myTurn = await page.evaluate(() => !(document.getElementById("endturn") as HTMLButtonElement).disabled);
  if (!myTurn) {
    await page.waitForTimeout(500);
    continue;
  }
  const enemy = await debug((d) => (window as unknown as { discDebug: Debug }).discDebug.leaderHex(1));
  if (!enemy) break;
  const point = await page.evaluate((h) => (window as unknown as { discDebug: Debug }).discDebug.hexScreen(h.q, h.r), enemy);
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(150);
  if (step === 0) await page.screenshot({ path: "shots/map-aim.png" });
  const hint = await page.textContent("#maphint");
  console.log(`step ${step}: ${hint}`);
  if (hint?.startsWith("Click to attack") || hint?.startsWith("March")) await page.mouse.click(point.x, point.y);
  else await page.click("#endturn");
  await page.waitForTimeout(1200);
}
await page.screenshot({ path: "shots/map-end.png" });
console.log(`battles: ${battles}; banner: ${await page.textContent("#mapbanner")}`);
await browser.close();
await server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
