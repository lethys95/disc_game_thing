import { element } from "#view/dom";
import { showPeek } from "#view/peek";

/**
 * Hold right-click on anything that carries an explanation to read it in the peek; let go and it's gone (the user,
 * 2026-10-09: captions on the instruments "will eventually come off as noise"). The interface stays shapes and
 * numbers; the words wait under the right button.
 */
export function explain(target: HTMLElement, title: string, ...lines: readonly string[]): HTMLElement {
  target.dataset["explain"] = [title, ...lines].join("\n");
  return target;
}

function explained(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>("[data-explain]") : null;
}

/** Listens for the hold on the whole page, once. */
export function wireExplanations(peek: HTMLElement): void {
  document.addEventListener("contextmenu", (e) => {
    if (explained(e.target)) e.preventDefault();
  });
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 2) return;
    const source = explained(e.target);
    if (!source) return;
    const [title = "", ...lines] = (source.dataset["explain"] ?? "").split("\n");
    showPeek(peek, [element("div", "title", title), ...lines.map((line) => element("div", "note", line))], e.clientX, e.clientY);
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 2) peek.hidden = true;
  });
}
