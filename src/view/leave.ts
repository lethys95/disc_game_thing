import { button } from "#view/dom";
import { explain } from "#view/explain";

/** An arched doorway with an arrow passing out through it: leaving the screen. */
const LEAVE_GLYPH =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M14 21V9a5 5 0 0 0-10 0v12h10"/><path d="M11 14h10"/><path d="M18 11l3 3-3 3"/></svg>';

/**
 * The way back to the map from a screen's column: a round button whose symbol says leaving (the user, 2026-10-11:
 * "Instead of 'Back to the map' add a button which symbol shows that you're leaving"); its words on hover.
 */
export function leaveButton(close: () => void): HTMLElement {
  const leave = button("back", [], close);
  leave.innerHTML = LEAVE_GLYPH;
  leave.setAttribute("aria-label", "Back to the map");
  return explain(leave, "Back to the map", "Escape does the same.");
}
