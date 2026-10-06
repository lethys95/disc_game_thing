import { button, element } from "#view/dom";

export interface CreditsHandlers {
  onBack(): void;
}

interface Credit {
  readonly what: string;
  readonly who: string;
}

/**
 * Who and what made the game (the user, 2026-10-06: "credits (if we need a place to put those at some point, like with
 * a model needing recognition, citations […])"). Sources per file are in each asset folder's `SOURCES.md`; the
 * licences named here are the ones recorded there. Check every term again before shipping (docs/design/audio-sources.md).
 */
const CREDITS: readonly { readonly section: string; readonly entries: readonly Credit[] }[] = [
  {
    section: "Made by",
    entries: [
      { what: "Design and direction", who: "lethys95" },
      { what: "Code, prompts and production", who: "Claude (Anthropic), working for lethys95" },
    ],
  },
  {
    section: "Music",
    entries: [
      { what: "The Grove's and Jilliath's battle themes", who: "made by lethys95 with Suno" },
      { what: "Placeholder themes (Ral-Vitahl, the Jilliath map)", who: "ACE-Step 1.5 (MIT licence), generated locally" },
    ],
  },
  {
    section: "Sound",
    entries: [
      { what: "Sound effects", who: "the Sonniss #GameAudioGDC bundles (royalty-free)" },
      { what: "Card sounds", who: "Stable Audio 3 by Stability AI (Stability AI Community License), generated locally" },
      { what: "Clicks", who: "recorded by lethys95" },
    ],
  },
  {
    section: "Art",
    entries: [
      { what: "Concepts, portraits, icons, the interface and tarot cards", who: "Krea-2 Turbo, run locally in ComfyUI" },
      { what: "Buildings, props and terrain", who: "meshed locally with TRELLIS.2 and TRELLIS (Microsoft)" },
    ],
  },
  {
    section: "Type and code",
    entries: [
      { what: "Cormorant Garamond and Inter", who: "SIL Open Font License, via Google Fonts" },
      { what: "three.js", who: "MIT licence" },
      { what: "Built with", who: "TypeScript and Vite" },
    ],
  },
];

export class Credits {
  constructor(
    private readonly root: HTMLElement,
    private readonly handlers: CreditsHandlers,
  ) {}

  show(): void {
    this.root.hidden = false;
    this.root.replaceChildren();
    const page = element("div", "panel credits-page");
    page.appendChild(element("div", "title", "Credits"));
    for (const { section, entries } of CREDITS) {
      page.appendChild(element("div", "section", section));
      for (const { what, who } of entries) {
        const row = element("div", "credit");
        row.append(element("span", "what", what), element("span", "who", who));
        page.appendChild(row);
      }
    }
    page.appendChild(button("action", "Back", () => this.handlers.onBack()));
    this.root.appendChild(page);
  }

  hide(): void {
    this.root.hidden = true;
  }

  get visible(): boolean {
    return !this.root.hidden;
  }
}
