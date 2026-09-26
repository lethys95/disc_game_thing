import type { World } from "#rules/world/state";

/**
 * A saved game: the world as it stands (plain data already), with a header. There are no migrations: a save
 * from another version is refused (docs/decisions.md). Bump SAVE_VERSION whenever the World's shape changes;
 * `tests/save.test.ts` fails until you do.
 */
export const SAVE_VERSION = 10;

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

/** The header is checked; the world is trusted, since only this game writes saves of this version. */
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
  return isSave(parsed) ? { ok: true, save: parsed } : { ok: false, problem: "damaged save file" };
}

export const writeSave = (save: Save): string => JSON.stringify(save);
