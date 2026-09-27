/**
 * Keys go to one place: the topmost layer that's open (the menu over the map and its screens, a battle over the
 * map), and no further, so Escape closes only the top screen and a battle's D doesn't also pan the map.
 */
export interface KeyLayer {
  /** Whether this layer is on screen and takes keys. */
  open(): boolean;
  /** Handles the key; true if it used it (the browser then doesn't). */
  key(event: KeyboardEvent): boolean;
}

/** Listens once, for the whole page; `layers` run top first. */
export function routeKeys(layers: readonly KeyLayer[]): void {
  window.addEventListener("keydown", (event) => {
    const top = layers.find((layer) => layer.open());
    if (top?.key(event)) event.preventDefault();
  });
}

/** Keys typed into a form field, or with a modifier held, are the browser's. */
export const plainKey = (event: KeyboardEvent): boolean =>
  !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement);
