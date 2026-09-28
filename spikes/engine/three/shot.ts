import { HEADLESS_GPU_ARGS } from "../../../scripts/headless";
import { chromium } from "playwright";
import { createServer } from "vite";

/** Renders the three.js bake-off scene headlessly: `node spikes/engine/three/shot.ts <out.png> [view] [seconds]`. */
const out = process.argv[2] ?? "three.png";
const view = process.argv[3] ?? "wide";
const at = process.argv[4] ?? "1.5";

const server = await createServer({ logLevel: "error", server: { port: 0 } });
await server.listen();
const address = server.resolvedUrls?.local[0];
if (!address) throw new Error("vite did not report a local URL");
const measure = view === "measure";
const browser = await chromium.launch({ args: [...HEADLESS_GPU_ARGS, "--disable-gpu-vsync", "--disable-frame-rate-limit"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(new URL(measure ? "/spikes/engine/three/index.html?measure" : `/spikes/engine/three/index.html?shot&view=${view}&at=${at}`, address).href);
await page.waitForSelector("body[data-ready=true]", { timeout: 60000 }).catch((e: unknown) => errors.push(String(e)));
if (measure) console.log(`shot: measure ${await page.evaluate(() => document.body.dataset["fps"])} fps`);
else await page.screenshot({ path: out });
await browser.close();
await server.close();
if (errors.length) console.error(errors.join("\n"));
console.log(`shot: ${out}`);
