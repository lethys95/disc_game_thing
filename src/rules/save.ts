import { ITEMS } from "#rules/items";
import { RESEARCH } from "#rules/research";
import { SPELLS } from "#rules/spells";
import { UNITS } from "#rules/units/index";
import type { World } from "#rules/world/state";

/**
 * A saved game: the world as it stands (plain data already), with a header. There are no migrations: a save
 * from another version is refused (docs/decisions.md). Bump SAVE_VERSION whenever the World's shape changes;
 * `tests/save.test.ts` fails until you do.
 */
export const SAVE_VERSION = 18;

export interface Save {
  readonly format: "disc-save";
  readonly version: number;
  /** ISO time the save was written. */
  readonly savedAt: string;
  /** The map seed, shown to the player. */
  readonly seed: number;
  readonly world: World;
}

export function toSave(world: World, seed: number, savedAt: Date): Save {
  return { format: "disc-save", version: SAVE_VERSION, savedAt: savedAt.toISOString(), seed, world };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/**
 * The first id in the world that this game's content lacks: a unit, item, spell or research renamed or removed
 * since the save was written, without the shape changing. Null when all are known.
 */
export function unknownContent(world: World): string | null {
  const squads = [
    ...world.leaders.map((l) => l.squad),
    ...world.cities.map((c) => c.garrison),
    ...world.lairs.map((l) => l.guards),
    ...world.players.flatMap((p) => [...p.memory.cities.map((c) => c.garrison), ...p.memory.lairs.map((l) => l.guards)]),
  ];
  const structures = [...world.structures, ...world.players.flatMap((p) => p.memory.structures)];
  const hires = structures.flatMap((s) => (s.kind === "mercenaries" ? s.stock.map((h) => h.defId) : []));
  const units = [...squads.flat(), ...world.players.flatMap((p) => p.graveyard)].map((m) => m.defId).concat(hires);
  const items = [...world.leaders.flatMap((l) => [...l.worn, ...l.bag]), ...structures.flatMap((s) => (s.kind === "merchant" ? s.stock : []))];
  const spells = [...world.players.flatMap((p) => p.spells), ...structures.flatMap((s) => (s.kind === "mage" ? s.stock : []))];
  const research = world.players.flatMap((p) => p.research);
  const missing = [
    ...units.filter((id) => !UNITS[id]).map((id) => `unit ${id}`),
    ...items.filter((id) => !ITEMS.some((i) => i.id === id)).map((id) => `item ${id}`),
    ...spells.filter((id) => !SPELLS.some((s) => s.id === id)).map((id) => `spell ${id}`),
    ...research.filter((id) => !RESEARCH.some((r) => r.id === id)).map((id) => `research ${id}`),
  ];
  return missing[0] ?? null;
}

/** The header is checked; the world's shape is trusted, since only this game writes saves of this version. */
function isSave(value: unknown): value is Save {
  return (
    isRecord(value) &&
    value["format"] === "disc-save" &&
    value["version"] === SAVE_VERSION &&
    typeof value["savedAt"] === "string" &&
    typeof value["seed"] === "number" &&
    isRecord(value["world"])
  );
}

export type ReadResult = { readonly ok: true; readonly save: Save } | { readonly ok: false; readonly problem: string };

export function readSave(text: string): ReadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, problem: "not a save file" };
  }
  if (!isRecord(parsed) || parsed["format"] !== "disc-save") return { ok: false, problem: "not a save file" };
  if (parsed["version"] !== SAVE_VERSION) return { ok: false, problem: `made by another version of the game (save version ${String(parsed["version"])}, this game reads ${SAVE_VERSION})` };
  if (!isSave(parsed)) return { ok: false, problem: "damaged save file" };
  const unknown = unknownContent(parsed.world);
  return unknown ? { ok: false, problem: `made by another version of the game (it has a ${unknown} this game doesn't)` } : { ok: true, save: parsed };
}

export const writeSave = (save: Save): string => JSON.stringify(save);
