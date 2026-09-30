import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import sharp from "sharp";
import { allSlots, fallbackKeys, slotKey } from "#view/art-slots";
import type { Slot, SlotKind } from "#view/art-slots";
import { runBatch } from "#scripts/art/batch";
import type { Candidate } from "#scripts/art/batch";
import { promptFor } from "#scripts/art/prompts";

/**
 * The art pipeline, driven by the game's own content (`src/view/art-slots.ts`):
 *   pnpm art report                     which slots have art, which fall back, which are placeholders
 *   pnpm art generate <kind|key> [n]    candidates for slots without their own art, n seeds each
 *   pnpm art accept <png> <key>         a candidate becomes the slot's art (resized WebP + provenance)
 */
const ART = "assets/art";
const PROVENANCE = `${ART}/provenance.json`;
/** Width in pixels of a slot's file in the game; height follows the image. */
const WIDTH: Readonly<Record<SlotKind, number>> = { portrait: 384, ability: 256, effect: 256 };

const has = (key: string) => existsSync(`${ART}/${key}.webp`);

function report(): void {
  const rows = allSlots().map((slot) => {
    const key = slotKey(slot);
    const via = fallbackKeys(slot).find(has);
    return { slot, key, state: has(key) ? "art" : via ? `falls back to ${via}` : "placeholder" };
  });
  const kinds: SlotKind[] = ["portrait", "ability", "effect"];
  const lines = kinds.map((kind) => {
    const mine = rows.filter((r) => r.slot.kind === kind);
    const done = mine.filter((r) => r.state === "art").length;
    return `${kind.padEnd(9)} ${done}/${mine.length} with art`;
  });
  const missing = rows.filter((r) => r.state !== "art").map((r) => `  ${r.key.padEnd(28)} ${r.state}`);
  console.log([...lines, "", "Without their own art:", ...missing].join("\n"));
}

async function generateMissing(filter: string, seeds: number): Promise<void> {
  const slots = allSlots().filter((s) => (s.kind === filter || slotKey(s) === filter) && !has(slotKey(s)));
  if (slots.length === 0) throw new Error(`no slots without art match "${filter}"`);
  const jobs = slots.map((slot: Slot) => ({ id: `${slot.kind}_${slot.id}`, ...promptFor(slot) }));
  await runBatch(`art/candidates/slots/${filter.replace("/", "_")}`, jobs, Array.from({ length: seeds }, (_, i) => 1000 + i));
}

async function accept(file: string, key: string): Promise<void> {
  const slot = allSlots().find((s) => slotKey(s) === key);
  const family = key.split("/")[1]?.startsWith("_");
  if (!slot && !family) throw new Error(`unknown slot "${key}"; see pnpm art report`);
  const kind = key.split("/")[0];
  const width = kind === "portrait" || kind === "ability" || kind === "effect" ? WIDTH[kind] : 256;
  const target = `${ART}/${key}.webp`;
  await mkdir(dirname(target), { recursive: true });
  await sharp(file).resize({ width }).webp({ quality: 86 }).toFile(target);
  const manifestFile = `${dirname(file)}/manifest.json`;
  const manifest: Candidate[] = existsSync(manifestFile) ? JSON.parse(await readFile(manifestFile, "utf8")) : [];
  const source = manifest.find((m) => m.file === basename(file));
  const provenance: Record<string, Candidate & { from: string }> = existsSync(PROVENANCE) ? JSON.parse(await readFile(PROVENANCE, "utf8")) : {};
  if (source) provenance[key] = { ...source, from: file };
  await writeFile(PROVENANCE, `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(`${target}${source ? "" : " (no manifest entry: provenance not recorded)"}`);
}

const [command, a, b] = process.argv.slice(2);
if (command === "report") report();
else if (command === "generate" && a) await generateMissing(a, Number(b ?? "2"));
else if (command === "accept" && a && b) await accept(a, b);
else throw new Error("usage: pnpm art report | generate <kind|key> [seeds] | accept <png> <key>");
