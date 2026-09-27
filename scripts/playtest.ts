import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "vite";
import battle from "#scripts/playtests/battle";
import city from "#scripts/playtests/city";
import { harness } from "#scripts/playtests/harness";
import type { Playtest } from "#scripts/playtests/harness";
import map from "#scripts/playtests/map";
import save from "#scripts/playtests/save";
import settings from "#scripts/playtests/settings";
import setup from "#scripts/playtests/setup";
import spells from "#scripts/playtests/spells";
import structures from "#scripts/playtests/structures";

/**
 * Plays the game by hand, like a person would: `pnpm playtest [name…]` runs the named playtests (all by default)
 * against one dev server and one browser, each in a fresh context (its own storage). Fails on any page error.
 */
const PLAYTESTS: readonly Playtest[] = [battle, map, save, city, settings, setup, spells, structures];

const wanted = process.argv.slice(2).filter((a) => a !== "--");
const unknown = wanted.filter((w) => !PLAYTESTS.some((p) => p.name === w));
if (unknown.length > 0) throw new Error(`no playtest named ${unknown.join(", ")}; there are ${PLAYTESTS.map((p) => p.name).join(", ")}`);
const chosen = wanted.length > 0 ? PLAYTESTS.filter((p) => wanted.includes(p.name)) : PLAYTESTS;

const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error("vite did not report a local URL");
const browser = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-gpu", "--ignore-gpu-blocklist"] });
await mkdir("shots", { recursive: true });

const failures: string[] = [];
for (const test of chosen) {
  const started = Date.now();
  console.log(`${test.name}: ${test.about}`);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => failures.push(`${test.name}: page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") failures.push(`${test.name}: console error: ${m.text()}`);
  });
  try {
    await test.run(harness(page, base, failures, test.name));
  } catch (error) {
    failures.push(`${test.name}: ${error instanceof Error ? error.message : String(error)}`);
    await page.screenshot({ path: `shots/failed-${test.name}.png` });
  }
  await context.close();
  console.log(`  (${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
await browser.close();
await server.close();
if (failures.length > 0) {
  console.error(`\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`${chosen.length} playtests passed`);
