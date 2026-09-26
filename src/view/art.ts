import { fallbackKeys, ORNAMENTS, slotInfo } from "#view/art-slots";
import type { Slot } from "#view/art-slots";
import { element } from "#view/dom";

/** The art that exists, found at build time: adding a file under assets/art/ is all it takes to use it. */
const FILES = import.meta.glob<string>("/assets/art/**/*.webp", { eager: true, query: "?url", import: "default" });

/** The first existing file along the slot's fallback chain, or null. */
export function artUrl(slot: Slot): string | null {
  for (const key of fallbackKeys(slot)) {
    const url = FILES[`/assets/art/${key}.webp`];
    if (url) return url;
  }
  return null;
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
  const url = artUrl(slot);
  const info = slotInfo(slot);
  if (url) {
    // A background, not an <img>: each size crops differently (a thumbnail zooms into a portrait's head).
    const image = element("span", `art ${slot.kind} ${className}`);
    image.style.backgroundImage = `url("${url}")`;
    image.title = info.name;
    return image;
  }
  return element("span", `art placeholder ${slot.kind} faction-${info.faction} ${className}`, initials(info.name));
}

/** Ornaments reach the stylesheet as custom properties (`--ornament-frame-corner`); CSS decides where they go. */
export function applyOrnaments(root: HTMLElement): void {
  for (const id of ORNAMENTS) {
    const url = artUrl({ kind: "ornament", id });
    if (url) root.style.setProperty(`--ornament-${id}`, `url("${url}")`);
  }
}
