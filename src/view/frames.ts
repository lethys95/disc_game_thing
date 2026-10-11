import { element } from "#view/dom";

/**
 * The painted frame a full screen's content fills (assets/ui/capitol/tab.webp, the hud-paint-in skill): its name on the
 * marble plate, the content scrolling in the dark field, left of the screen's column.
 */
export function tabFrame(title: string, body: HTMLElement): HTMLElement {
  const frame = element("div", "tab-frame");
  const field = element("div", "field");
  field.appendChild(body);
  frame.append(element("div", "title", title), field);
  return frame;
}
