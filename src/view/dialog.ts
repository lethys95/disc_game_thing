import { element } from "#view/dom";

export interface DialogAction {
  readonly label: string | readonly (string | Node)[];
  /** Why it can't be done now, or null. */
  readonly problem: string | null;
  readonly run: () => void;
}

/**
 * A small dialog over a screen: a question or a choice, its actions, and Close. Closes on Close, a click outside it, or
 * `closeDialog` (the screen's Escape). One at a time.
 */
export function openDialog(host: HTMLElement, title: string, body: readonly (string | Node)[], actions: readonly DialogAction[]): void {
  closeDialog(host);
  const veil = element("div", "dialog-veil");
  const dialog = element("div", "dialog");
  dialog.appendChild(element("div", "title", title));
  const text = element("div", "body");
  text.append(...body);
  dialog.appendChild(text);
  const row = element("div", "actions");
  for (const action of actions) {
    const button = element("button", "dialog-action");
    button.append(...(typeof action.label === "string" ? [action.label] : action.label));
    button.disabled = action.problem !== null;
    button.title = action.problem ?? "";
    button.addEventListener("click", () => {
      veil.remove();
      action.run();
    });
    row.appendChild(button);
  }
  const close = element("button", "dialog-close", "Close");
  close.addEventListener("click", () => veil.remove());
  row.appendChild(close);
  dialog.appendChild(row);
  veil.appendChild(dialog);
  veil.addEventListener("mousedown", (e) => {
    if (e.target === veil) veil.remove();
  });
  host.appendChild(veil);
}

/** Closes the host's dialog; whether one was open. */
export function closeDialog(host: HTMLElement): boolean {
  const open = host.querySelector(".dialog-veil");
  open?.remove();
  return open !== null;
}
