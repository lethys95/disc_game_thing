import { readSave } from "#rules/save";
import type { Save } from "#rules/save";
import { FACTION_NAMES } from "#rules/units/index";
import { element } from "#view/dom";
import { AUTOSAVE_ID, exportSave } from "#view/saves";
import type { SaveStore } from "#view/saves";

export interface MenuOptions {
  readonly store: SaveStore;
  /** The game to save now, or a reason it can't be saved; null when there's no game (the setup screen). */
  readonly current: () => Save | string | null;
  readonly load: (save: Save) => void;
  readonly newGame: () => void;
}

const describe = (save: Save) => {
  const [a, b] = save.world.factions;
  const when = new Date(save.savedAt).toLocaleString();
  return `Turn ${save.world.turn} · ${FACTION_NAMES[a]} vs ${FACTION_NAMES[b]} · seed ${save.seed} · ${when}`;
};

/** The game menu: save, load, export and import saves, start over. Settings will live here too. */
export class GameMenu {
  private message = "";

  constructor(
    private readonly root: HTMLElement,
    private readonly options: MenuOptions,
  ) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.root.hidden) this.hide();
    });
  }

  show(): void {
    this.root.hidden = false;
    this.render();
  }

  hide(): void {
    this.root.hidden = true;
    this.message = "";
  }

  private render(): void {
    const { store } = this.options;
    this.root.replaceChildren();
    this.root.appendChild(element("div", "title", "Game"));
    const current = this.options.current();
    if (current !== null) {
      const save = element("button", "action", "Save game");
      save.disabled = typeof current === "string";
      save.title = typeof current === "string" ? current : "";
      save.addEventListener("click", () => {
        const now = this.options.current();
        if (now === null || typeof now === "string") return;
        store.write(`save-${Date.now()}`, now);
        this.message = "Saved.";
        this.render();
      });
      this.root.appendChild(save);
    }

    this.root.appendChild(element("div", "section", "Saved games"));
    const entries = store.list();
    if (entries.length === 0) this.root.appendChild(element("div", "note", "No saved games yet."));
    for (const entry of entries) {
      const row = element("div", "save-row");
      const text = element("div", "save-text");
      text.append(element("div", "name", entry.id === AUTOSAVE_ID ? "Autosave" : "Saved game"), element("div", "note", entry.save ? describe(entry.save) : `Can't be loaded: ${entry.problem}`));
      row.appendChild(text);
      const saved = entry.save;
      if (saved) {
        const load = element("button", "small", "Load");
        load.addEventListener("click", () => {
          this.hide();
          this.options.load(saved);
        });
        const out = element("button", "small", "Export");
        out.addEventListener("click", () => exportSave(saved, `disc-turn${saved.world.turn}-${entry.id}`));
        row.append(load, out);
      }
      const remove = element("button", "small", "Delete");
      remove.addEventListener("click", () => {
        store.remove(entry.id);
        this.render();
      });
      row.appendChild(remove);
      this.root.appendChild(row);
    }

    const file = element("input", "hidden-file");
    file.type = "file";
    file.accept = ".json,application/json";
    file.addEventListener("change", () => void this.importFile(file));
    const importing = element("button", "action", "Import a save file");
    importing.addEventListener("click", () => file.click());
    this.root.append(file, importing);

    const footer = element("div", "menu-footer");
    if (current !== null) {
      const fresh = element("button", "action", "New game");
      fresh.addEventListener("click", () => {
        this.hide();
        this.options.newGame();
      });
      footer.appendChild(fresh);
    }
    const close = element("button", "action", "Close");
    close.addEventListener("click", () => this.hide());
    footer.appendChild(close);
    this.root.appendChild(footer);
    if (this.message) this.root.appendChild(element("div", "note message", this.message));
  }

  private async importFile(input: HTMLInputElement): Promise<void> {
    const chosen = input.files?.[0];
    if (!chosen) return;
    const result = readSave(await chosen.text());
    if (!result.ok) {
      this.message = `That file can't be loaded: ${result.problem}.`;
      this.render();
      return;
    }
    this.options.store.write(`save-${Date.now()}`, result.save);
    this.message = "Imported.";
    this.render();
  }
}
