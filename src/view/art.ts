import { fallbackKeys, slotInfo } from "#view/art-slots";
import type { Slot } from "#view/art-slots";
import { element } from "#view/dom";

/** The art that exists, found at build time: adding a file under assets/art/ is all it takes to use it. */
const FILES = import.meta.glob<string>("/assets/art/**/*.webp", { eager: true, query: "?url", import: "default" });

/** The first existing file along the slot's fallback chain, and its key, or null. */
function found(slot: Slot): { readonly url: string; readonly key: string } | null {
  for (const key of fallbackKeys(slot)) {
    const url = FILES[`/assets/art/${key}.webp`];
    if (url) return { url, key };
  }
  return null;
}

export function artUrl(slot: Slot): string | null {
  return found(slot)?.url ?? null;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/**
 * An image for the slot, or a placeholder in the faction's color with the content's initials, so every spot that
 * shows art works before the art exists. `className` sizes it.
 */
export function art(slot: Slot, className: string): HTMLElement {
  const file = found(slot);
  const info = slotInfo(slot);
  if (file) {
    // A background, not an <img>, classed by the framing actually found: a size zooms into a wider framing's head.
    const image = element("span", `art ${file.key.split("/")[0] ?? slot.kind} ${className}`);
    image.style.backgroundImage = `url("${file.url}")`;
    image.title = info.name;
    return image;
  }
  return element("span", `art placeholder ${slot.kind} faction-${info.faction} ${className}`, initials(info.name));
}

/** The UI kit (`assets/ui/<name>.webp`, and a screen's painted pieces in `assets/ui/<screen>/`), found at build time. */
const UI_KIT = import.meta.glob<string>("/assets/ui/**/*.webp", { eager: true, query: "?url", import: "default" });

/** The UI kit reaches the stylesheet as custom properties (`--ui-frame`, `--ui-battle-beam`); CSS places each piece. */
export function applyUiKit(root: HTMLElement): void {
  for (const [path, url] of Object.entries(UI_KIT)) {
    const name = /\/assets\/ui\/(.+)\.webp$/.exec(path)?.[1];
    if (name) root.style.setProperty(`--ui-${name.replaceAll("/", "-")}`, `url("${url}")`);
  }
}

/** Paintings of cities from the inside (`assets/city/<slot>.webp`), by the map's model slot chains. */
const CITY_VIEWS = import.meta.glob<string>("/assets/city/*.webp", { eager: true, query: "?url", import: "default" });

export function cityViewUrl(chain: readonly string[]): string | null {
  for (const key of chain) {
    const url = CITY_VIEWS[`/assets/city/${key.replace(/^site\//, "")}.webp`];
    if (url) return url;
  }
  return null;
}


/** Tarot card faces (`assets/tarot/<arcana>.webp`) and their back (`back.webp`), found at build time. */
const TAROT = import.meta.glob<string>("/assets/tarot/*.webp", { eager: true, query: "?url", import: "default" });

export function tarotUrl(name: string): string | null {
  return TAROT[`/assets/tarot/${name}.webp`] ?? null;
}
