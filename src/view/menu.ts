import { readSave } from "#rules/save";
import type { Save } from "#rules/save";
import { FACTIONS } from "#rules/factions";
import { BEHAVIORS } from "#rules/abilities/index";
import { element } from "#view/dom";
import { ANIMATION_SPEEDS, assignable, CAMERA_RANGE, DEFAULT_SETTINGS, remappable, SPEED_ORDER, withHotkey } from "#view/settings";
import type { Settings } from "#view/settings";
import { AUTOSAVE_ID, exportSave } from "#view/saves";
import type { SaveStore } from "#view/saves";

export interface MenuOptions {
  readonly store: SaveStore;
  readonly settings: Settings;
  /** The game to save now, or a reason it can't be saved; null when there's no game (the setup screen). */
  readonly current: () => Save | string | null;
  readonly load: (save: Save) => void;
  readonly newGame: () => void;
}

const describe = (save: Save) => {
  const when = new Date(save.savedAt).toLocaleString();
  return `Turn ${save.world.turn} · ${save.world.players.map((p) => FACTIONS[p.faction].name).join(" vs ")} · seed ${save.seed} · ${when}`;
};

/** The game menu: save, load, export and import saves, start over; and the settings. */
export class GameMenu {
  private message = "";
  private page: "game" | "settings" = "game";
  /** The ability whose new key the menu is waiting for. */
  private capturing: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly options: MenuOptions,
  ) {
    // Capture phase: while the menu waits for a key, nothing else (a battle's hotkeys) may see it.
    window.addEventListener(
      "keydown",
      (e) => {
        if (this.root.hidden) return;
        if (this.capturing !== null) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.captured(e.key);
          return;
        }
        if (e.key === "Escape") this.hide();
      },
      { capture: true },
    );
  }

  show(): void {
    this.root.hidden = false;
    this.render();
  }

  hide(): void {
    this.root.hidden = true;
    this.message = "";
    this.page = "game";
    this.capturing = null;
  }

  private render(): void {
    if (this.page === "settings") this.renderSettings();
    else this.renderGame();
  }

  private captured(key: string): void {
    const ability = this.capturing;
    this.capturing = null;
    if (ability && assignable(key)) this.options.settings.update(withHotkey(this.options.settings.data, ability, key.toLowerCase()));
    this.render();
  }

  private renderSettings(): void {
    const { settings } = this.options;
    const data = settings.data;
    this.root.replaceChildren();
    this.root.appendChild(element("div", "title", "Settings"));

    this.root.appendChild(element("div", "section", "Animation speed"));
    const speeds = element("div", "segmented");
    for (const id of SPEED_ORDER) {
      const button = element("button", `small${data.speed === id ? " selected" : ""}`, ANIMATION_SPEEDS[id].label);
      button.addEventListener("click", () => {
        settings.update({ ...settings.data, speed: id });
        this.render();
      });
      speeds.appendChild(button);
    }
    this.root.append(speeds, element("div", "note", "Also how long the AI pauses between its moves."));

    this.root.appendChild(element("div", "section", "Sound"));
    for (const [field, label] of [["masterVolume", "Master volume"], ["effectsVolume", "Effects"], ["musicVolume", "Music"]] as const) {
      const row = element("label", "slider-row");
      const slider = element("input", "slider");
      slider.type = "range";
      slider.min = "0";
      slider.max = "1";
      slider.step = "0.05";
      slider.value = String(data[field]);
      const value = element("span", "value", `${Math.round(data[field] * 100)}%`);
      slider.addEventListener("input", () => {
        settings.update({ ...settings.data, [field]: Number(slider.value) });
        value.textContent = `${Math.round(Number(slider.value) * 100)}%`;
      });
      row.append(element("span", "name", label), slider, value);
      this.root.appendChild(row);
    }

    this.root.appendChild(element("div", "section", "Camera"));
    for (const [field, label] of [["rotate", "Rotation speed"], ["zoom", "Zoom speed"]] as const) {
      const row = element("label", "slider-row");
      const slider = element("input", "slider");
      slider.type = "range";
      slider.min = String(CAMERA_RANGE.min);
      slider.max = String(CAMERA_RANGE.max);
      slider.step = "0.05";
      slider.value = String(data[field]);
      const value = element("span", "value", `${data[field].toFixed(2)}×`);
      slider.addEventListener("input", () => {
        settings.update({ ...settings.data, [field]: Number(slider.value) });
        value.textContent = `${Number(slider.value).toFixed(2)}×`;
      });
      row.append(element("span", "name", label), slider, value);
      this.root.appendChild(row);
    }

    this.root.appendChild(element("div", "section", "Hotkeys"));
    for (const abilityId of remappable()) {
      const row = element("div", "save-row");
      const key = settings.keyFor(abilityId);
      const waiting = this.capturing === abilityId;
      row.append(element("div", "name", BEHAVIORS[abilityId]?.name ?? abilityId), element("span", "key", waiting ? "…" : (key ?? "").toUpperCase()));
      const change = element("button", "small", waiting ? "Press a key (Esc cancels)" : "Change");
      change.addEventListener("click", () => {
        this.capturing = waiting ? null : abilityId;
        this.render();
      });
      row.appendChild(change);
      this.root.appendChild(row);
    }
    this.root.appendChild(element("div", "note", "A key already in use swaps with the one you're changing. Digits are kept for the ability slots."));
    const slots = element("label", "check-row");
    const box = element("input", "check");
    box.type = "checkbox";
    box.checked = data.slotKeys;
    box.addEventListener("change", () => settings.update({ ...settings.data, slotKeys: box.checked }));
    slots.append(box, element("span", "", "Keys 1–9 choose the battle's ability buttons by position"));
    this.root.appendChild(slots);

    this.root.appendChild(element("div", "section", "Display"));
    const full = element("button", "small", document.fullscreenElement ? "Leave fullscreen" : "Fullscreen");
    full.addEventListener("click", () => void this.toggleFullscreen());
    this.root.appendChild(full);

    const footer = element("div", "menu-footer");
    const reset = element("button", "action", "Restore defaults");
    reset.addEventListener("click", () => {
      settings.update(DEFAULT_SETTINGS);
      this.render();
    });
    const back = element("button", "action", "Back");
    back.addEventListener("click", () => {
      this.page = "game";
      this.capturing = null;
      this.render();
    });
    footer.append(reset, back);
    this.root.appendChild(footer);
  }

  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Refused by the browser (an embedded page, a policy): nothing to do.
    }
    this.render();
  }

  private renderGame(): void {
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
    const open = element("button", "action", "Settings");
    open.addEventListener("click", () => {
      this.page = "settings";
      this.render();
    });
    footer.appendChild(open);
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
