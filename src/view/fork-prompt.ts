import { forkOptions } from "#rules/forks";
import { EVOLUTIONS } from "#rules/units/index";
import { waitingForks } from "#rules/world/economy";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";
import { unitDefCard, unitName } from "#view/members";
import { showPeek } from "#view/peek";

/** "Paladin (Faith preserves)": a branch by the unit it leads to and the dichotomy it stands for. */
function branchName(fork: string, to: string): string {
  const label = EVOLUTIONS[fork]?.find((e) => e.to === to)?.label;
  return label ? `${unitName(to)} (${label})` : unitName(to);
}

/**
 * A unit of the player's reached an undecided fork: ask now rather than let it sit at full XP unnoticed. "Decide
 * later" puts the question off until next turn.
 */
export class ForkPrompt {
  /** Forks put off, keyed by turn so the prompt returns next turn. */
  private readonly deferred = new Set<string>();

  constructor(
    private readonly root: HTMLElement,
    private readonly peek: HTMLElement,
    private readonly act: (action: WorldAction) => void,
    private readonly rerender: () => void,
  ) {}

  render(world: World, player: PlayerId, mayAct: boolean): void {
    const fork = mayAct ? waitingForks(world, player).find((f) => !this.deferred.has(`${world.turn}:${f}`)) : undefined;
    this.root.hidden = fork === undefined;
    if (fork === undefined) return;
    this.root.replaceChildren();
    this.root.appendChild(element("div", "title", `A ${unitName(fork)} is ready to evolve`));
    this.root.appendChild(element("div", "subtitle", `Permanent: every ${unitName(fork)} in your army will take this branch.`));
    for (const to of forkOptions(fork)) {
      const choose = element("button", "action", branchName(fork, to));
      choose.title = "Hold right-click to see what it is.";
      choose.addEventListener("click", () => this.act({ type: "choose", fork, to }));
      // Hold right-click on a branch to see the unit it leads to (released on pointerup, like the formation peek).
      choose.addEventListener("contextmenu", (e) => e.preventDefault());
      choose.addEventListener("pointerdown", (e) => {
        if (e.button === 2) showPeek(this.peek, [unitDefCard(to)], e.clientX, e.clientY, 320, 300);
      });
      this.root.appendChild(choose);
    }
    this.root.appendChild(element("div", "note", "Hold right-click on a branch to see what it is."));
    const later = element("button", "small", "Decide later");
    later.addEventListener("click", () => {
      this.deferred.add(`${world.turn}:${fork}`);
      this.rerender();
    });
    this.root.appendChild(later);
  }
}
