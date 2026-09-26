import { readSave, writeSave } from "#rules/save";
import type { ReadResult, Save } from "#rules/save";

/** Where saves live. The browser keeps them in localStorage; a desktop build would swap in files. */
export interface SaveStore {
  list(): SaveEntry[];
  read(id: string): ReadResult;
  write(id: string, save: Save): void;
  remove(id: string): void;
}

export interface SaveEntry {
  readonly id: string;
  /** Null when the save can't be read by this version; the problem says why. */
  readonly save: Save | null;
  readonly problem: string | null;
}

export const AUTOSAVE_ID = "autosave";

const PREFIX = "disc.save.";

export class LocalSaveStore implements SaveStore {
  list(): SaveEntry[] {
    const entries: SaveEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const id = key.slice(PREFIX.length);
      const result = this.read(id);
      entries.push(result.ok ? { id, save: result.save, problem: null } : { id, save: null, problem: result.problem });
    }
    // The autosave first, then newest first.
    return entries.sort((a, b) => Number(b.id === AUTOSAVE_ID) - Number(a.id === AUTOSAVE_ID) || (b.save?.savedAt ?? "").localeCompare(a.save?.savedAt ?? ""));
  }

  read(id: string): ReadResult {
    const text = localStorage.getItem(PREFIX + id);
    return text === null ? { ok: false, problem: "no such save" } : readSave(text);
  }

  write(id: string, save: Save): void {
    localStorage.setItem(PREFIX + id, writeSave(save));
  }

  remove(id: string): void {
    localStorage.removeItem(PREFIX + id);
  }
}

/** Offers a save as a file download. */
export function exportSave(save: Save, name: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([writeSave(save)], { type: "application/json" }));
  link.download = `${name}.disc-save.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}
