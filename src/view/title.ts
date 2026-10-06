import { art } from "#view/art";
import { button, element } from "#view/dom";

export interface TitleChoices {
  /** Back into the autosaved game; absent when there is none. */
  readonly resume?: () => void;
  readonly newGame: () => void;
  readonly skirmish: () => void;
  readonly load: () => void;
  readonly codex: () => void;
  readonly settings: () => void;
  readonly credits: () => void;
}

/** A few of the painted units stand behind the menu; the rest live in the codex. */
const PARADE = ["zealot", "punisher", "custodian", "etherborn", "psychopomp", "bog_giant", "soothsayer", "omen"];

/**
 * The title screen (the user, 2026-10-06: "a proper start screen into faction select, settings, credits… some sort of
 * guide book/bestiary"). The game's name is a placeholder until the user names it.
 */
export class TitleScreen {
  constructor(private readonly root: HTMLElement) {}

  show(choices: TitleChoices): void {
    this.root.hidden = false;
    this.root.replaceChildren();
    const parade = element("div", "title-parade");
    for (const id of PARADE) parade.appendChild(art({ kind: "portrait", id }, "parade"));
    const panel = element("div", "title-panel");
    panel.appendChild(element("div", "title-name", "disc"));
    const menu = element("div", "title-menu");
    if (choices.resume) menu.appendChild(button("action", "Continue", choices.resume));
    menu.append(
      button("action", "New game", choices.newGame),
      button("action", "Skirmish", choices.skirmish),
      button("action", "Load game", choices.load),
      button("action", "Codex", choices.codex),
      button("action", "Settings", choices.settings),
      button("action", "Credits", choices.credits),
    );
    panel.appendChild(menu);
    this.root.append(parade, panel);
  }

  hide(): void {
    this.root.hidden = true;
  }

  get visible(): boolean {
    return !this.root.hidden;
  }
}
