import { TASK_ARCANA, TASK_NAMES } from "#rules/battle/tarot";
import type { TarotCard } from "#rules/battle/tarot";
import { tarotUrl } from "#view/art";
import { element } from "#view/dom";

/**
 * Tarot cards as cards (the user, 2026-10-05): "floating and centered around the middle, where you can flick through
 * the cards. Like if you were holding cards in your hand", with a sound for flicking through, picking and flipping.
 * One fan, three uses: picking from a hand face up, watching the enemy's pick turned over, and looking at the cards
 * held. What each card says below the fan is the caller's: the owner reads a card in full, the other side only its
 * name.
 */

export type CardCue = "ui/card-flick" | "ui/card-pick" | "ui/card-flip";

export interface FanCard {
  /** The card's face; null shows only its back. */
  readonly card: TarotCard | null;
  /** What's written under the fan while this card is in focus. */
  readonly caption: () => HTMLElement;
}

interface Open {
  readonly cards: readonly FanCard[];
  readonly els: HTMLElement[];
  focus: number;
  /** Enter or a click on the focused card. */
  readonly choose: ((index: number) => void) | null;
  readonly close: (() => void) | null;
}

/** The fan's arc: degrees between neighbours, and how far apart and how much lower the outer cards sit. */
const STEP_DEG = 9;
const STEP_X = 0.58;
const DROP = 14;

export class TarotFan {
  private open: Open | null = null;
  private readonly fan = element("div", "fan");
  private readonly caption = element("div", "fan-caption");
  private readonly heading = element("div", "fan-heading");
  private readonly footer = element("div", "fan-footer");

  constructor(
    private readonly root: HTMLElement,
    private readonly cue: (sound: CardCue) => void,
  ) {
    root.replaceChildren(this.heading, this.fan, this.caption, this.footer);
    root.addEventListener("wheel", (e) => {
      if (!this.open) return;
      e.preventDefault();
      this.move(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
    });
    root.addEventListener("click", (e) => {
      if (this.open?.close && e.target === root) this.open.close();
    });
  }

  get showing(): boolean {
    return this.open !== null;
  }

  /** A hand face up to pick from. */
  pick(cards: readonly FanCard[], heading: string, onPick: (index: number) => void): void {
    this.show(cards, heading, (index) => {
      this.cue("ui/card-pick");
      this.lift(index);
      window.setTimeout(() => onPick(index), 380);
    }, null);
  }

  /** The enemy's hand face down; after a breath the picked card rises and turns over. */
  reveal(count: number, picked: number, card: TarotCard, caption: () => HTMLElement, heading: string, onDone: () => void): void {
    const cards: FanCard[] = Array.from({ length: count }, (_v, i) => ({ card: i === picked ? card : null, caption: i === picked ? caption : () => element("div", "", "") }));
    this.show(cards, heading, null, onDone);
    const el = this.open?.els[picked];
    el?.classList.add("face-down");
    this.setFocus(picked, false);
    window.setTimeout(() => {
      if (!this.open || this.open.els[picked] !== el) return;
      el?.classList.remove("face-down");
      this.cue("ui/card-flip");
    }, 650);
    this.footer.replaceChildren(this.button("Continue", onDone));
  }

  /** The cards in play, to look at; Escape, a click beside them or the button puts them away. */
  browse(cards: readonly FanCard[], heading: string, onClose: () => void): void {
    this.show(cards, heading, null, onClose);
    this.footer.replaceChildren(this.button("Put away", onClose));
  }

  close(): void {
    this.open = null;
    this.root.hidden = true;
  }

  /** Arrow keys flick through, Enter picks, Escape puts the cards away. True if the key was the fan's. */
  key(e: KeyboardEvent): boolean {
    const open = this.open;
    if (!open) return false;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") this.move(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") this.move(-1);
    else if (e.key === "Enter" || e.key === " ") {
      if (open.choose) open.choose(open.focus);
      else open.close?.();
    } else if (e.key === "Escape") open.close?.();
    else return false;
    e.preventDefault();
    return true;
  }

  private show(cards: readonly FanCard[], heading: string, choose: ((index: number) => void) | null, close: (() => void) | null): void {
    this.heading.textContent = heading;
    this.footer.replaceChildren();
    const els = cards.map((entry, index) => {
      const el = element("div", "fan-card");
      const flipper = element("div", "flipper");
      flipper.append(face(entry.card), back());
      if (!entry.card) el.classList.add("face-down");
      el.append(flipper);
      el.addEventListener("mouseenter", () => this.setFocus(index, true));
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.open?.focus !== index) this.setFocus(index, true);
        else if (this.open.choose) this.open.choose(index);
      });
      return el;
    });
    this.fan.replaceChildren(...els);
    this.open = { cards, els, focus: Math.floor((cards.length - 1) / 2), choose, close };
    this.root.hidden = false;
    this.layout();
  }

  private move(delta: number): void {
    const open = this.open;
    if (!open) return;
    this.setFocus(Math.max(0, Math.min(open.cards.length - 1, open.focus + delta)), true);
  }

  private setFocus(index: number, sound: boolean): void {
    const open = this.open;
    if (!open) return;
    if (open.focus !== index && sound) this.cue("ui/card-flick");
    open.focus = index;
    this.layout();
  }

  /** Fans the cards out around the focused one, which lifts, straightens and comes forward. */
  private layout(): void {
    const open = this.open;
    if (!open) return;
    const middle = (open.cards.length - 1) / 2;
    open.els.forEach((el, i) => {
      const from = i - middle;
      const focused = i === open.focus;
      const angle = focused ? 0 : from * STEP_DEG;
      const x = from * STEP_X * 100;
      const y = focused ? -34 : Math.abs(from) ** 2 * DROP;
      el.style.transform = `translateX(${x}%) translateY(${y}px) rotate(${angle}deg) scale(${focused ? 1.12 : 1})`;
      el.style.zIndex = String(focused ? 100 : 50 - Math.round(Math.abs(i - open.focus)));
      el.classList.toggle("focused", focused);
    });
    this.caption.replaceChildren(open.cards[open.focus]?.caption() ?? element("div"));
  }

  /** The picked card rises out of the fan; the others fall away. */
  private lift(index: number): void {
    this.open?.els.forEach((el, i) => el.classList.add(i === index ? "chosen" : "dropped"));
  }

  private button(label: string, onClick: () => void): HTMLElement {
    const button = element("button", "action", label);
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return button;
  }
}

/** A card's face: its painting (a plain face until the art exists), with its name on a plate. */
function face(card: TarotCard | null): HTMLElement {
  const side = element("div", "side front");
  if (!card) return side;
  const url = tarotUrl(TASK_ARCANA[card.task.kind]);
  const picture = element("div", url ? "picture" : "picture missing");
  if (url) picture.style.backgroundImage = `url("${url}")`;
  side.append(picture, element("div", "plate", TASK_NAMES[card.task.kind]));
  return side;
}

function back(): HTMLElement {
  const side = element("div", "side back");
  const url = tarotUrl("back");
  const picture = element("div", url ? "picture" : "picture missing");
  if (url) picture.style.backgroundImage = `url("${url}")`;
  side.append(picture);
  return side;
}

/** A small stack of the held cards for the HUD: their faces, fanned a little, as the button that opens them. */
export function miniStack(cards: readonly TarotCard[]): HTMLElement[] {
  return cards.slice(0, 4).map((card, i, all) => {
    const mini = element("span", "mini-card");
    const url = tarotUrl(TASK_ARCANA[card.task.kind]);
    if (url) mini.style.backgroundImage = `url("${url}")`;
    mini.style.transform = `rotate(${(i - (all.length - 1) / 2) * 10}deg)`;
    return mini;
  });
}
