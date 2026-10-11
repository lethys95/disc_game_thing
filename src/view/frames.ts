import { element } from "#view/dom";

/**
 * The frame a full screen's content fills, left of the screen's column: its name on a plate, the content scrolling in a
 * dark field. A greybox in flat values (`docs/design/capitol-elements.md`, "The frame") until it is painted.
 */
export function tabFrame(title: string, body: HTMLElement, tabs: HTMLElement | null): HTMLElement {
  const frame = element("div", "tab-frame");
  const field = element("div", "field");
  field.appendChild(body);
  frame.appendChild(element("div", "title", title));
  // Tabs sit on the field's top edge like a browser's, outside what scrolls.
  if (tabs) frame.appendChild(tabs);
  frame.appendChild(field);
  return frame;
}
