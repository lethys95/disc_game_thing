import type { ManaColor } from "#rules/factions";
/** Small DOM helpers shared by the HTML panels. */

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** A button that does something when clicked. */
export function button(className: string, label: string | readonly (string | Node)[], onClick: () => void): HTMLButtonElement {
  const el = element("button", className);
  if (typeof label === "string") el.textContent = label;
  else el.append(...label);
  el.addEventListener("click", onClick);
  return el;
}

/**
 * A button that gives an order: disabled while the player may not act, or while the rules name a `problem`, which
 * is then its tooltip (otherwise `explain` is).
 */
export function orderButton(
  className: string,
  label: string | readonly (string | Node)[],
  order: { readonly mayAct: boolean; readonly problem: string | null; readonly explain: string; readonly give: () => void },
): HTMLButtonElement {
  const el = button(className, label, order.give);
  el.disabled = !order.mayAct || order.problem !== null;
  el.title = order.problem ?? order.explain;
  return el;
}

export function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

export function buttonById(id: string): HTMLButtonElement {
  const el = byId(id);
  if (!(el instanceof HTMLButtonElement)) throw new Error(`#${id} is not a button`);
  return el;
}

const COIN_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#b8862b"/><circle cx="8" cy="8" r="7" fill="none" stroke="#6e4d12" stroke-width="1"/>' +
  '<circle cx="8" cy="8" r="4.6" fill="none" stroke="#f3d27a" stroke-width="1.2"/><circle cx="6" cy="5.6" r="1.4" fill="#fbe8a8" opacity="0.8"/></svg>';

const SKULL_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2C4.3 1.2 1.8 3.7 1.8 6.9c0 2 1 3.5 2.6 4.3v2.4c0 .6.4 1 1 1h5.2c.6 0 1-.4 1-1v-2.4c1.6-.8 2.6-2.3 2.6-4.3 0-3.2-2.5-5.7-6.2-5.7Z" fill="#eadfcf" stroke="#2a1512" stroke-width=".8"/>' +
  '<circle cx="5.5" cy="7.3" r="1.7" fill="#2a1512"/><circle cx="10.5" cy="7.3" r="1.7" fill="#2a1512"/><path d="M8 9.1 7.1 10.9h1.8Z" fill="#2a1512"/>' +
  '<path d="M6.4 12.3v2.2M8 12.3v2.2M9.6 12.3v2.2" stroke="#2a1512" stroke-width=".7"/></svg>';

/** A skull: what an action that would kill shows over its victim. */
export function skull(): HTMLElement {
  const icon = element("span", "skull");
  icon.innerHTML = SKULL_SVG;
  return icon;
}

/** An amount of gold with a coin in front: currency people recognise at a glance. */
export function gold(amount: number | string, className = ""): HTMLElement {
  const el = element("span", `gold ${className}`.trim());
  const icon = element("span", "coin");
  icon.innerHTML = COIN_SVG;
  el.append(icon, `${amount}`);
  return el;
}

/** Each mana color on screen: the faction's accent (art.md). */
const MANA_HEX: Readonly<Record<ManaColor, string>> = { red: "#d0402e", teal: "#2bb8ad", green: "#5e9a3a" };

/** An amount of mana with a gem of its color in front. */
export function mana(amount: number | string, color: ManaColor): HTMLElement {
  const el = element("span", "mana");
  const icon = element("span", "gem");
  icon.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L14 7 L8 15 L2 7 Z" fill="${MANA_HEX[color]}" stroke="#111" stroke-width="0.8"/><path d="M8 1 L11 7 L8 15" fill="#fff" opacity="0.25"/></svg>`;
  el.append(icon, `${amount}`);
  return el;
}

/** Movement left as pips: ●●●○ is 3 of 4. */
export const movementPips = (left: number, max: number): string => "●".repeat(Math.max(0, Math.min(left, max))) + "○".repeat(Math.max(0, max - Math.max(0, left)));
