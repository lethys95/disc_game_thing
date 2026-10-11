import { waitingForks } from "#rules/world/economy";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";
import { unitName } from "#view/members";
import { branchCards, branchText } from "#view/branches";

/**
 * A unit of the player's reached an undecided fork: ask now rather than let it sit at full XP unnoticed. "Decide
 * later" puts the question off until next turn.
 */
export class ForkPrompt {
  /** Forks put off, keyed by turn so the prompt returns next turn. */
  private readonly deferred = new Set<string>();

  constructor(
    private readonly root: HTMLElement,
    private readonly act: (action: WorldAction) => void,
    private readonly rerender: () => void,
  ) {}

  render(world: World, player: PlayerId, mayAct: boolean): void {
    const fork = mayAct ? waitingForks(world, player).find((f) => !this.deferred.has(`${world.turn}:${f}`)) : undefined;
    this.root.hidden = fork === undefined;
    if (fork === undefined) return;
    this.root.replaceChildren();
    this.root.appendChild(element("div", "title", `A ${unitName(fork)} is ready to evolve`));
    this.root.appendChild(element("div", "body", branchText(fork)));
    this.root.appendChild(branchCards(fork, null, null, (to) => this.act({ type: "choose", fork, to })));
    const later = element("button", "dialog-close", "Decide later");
    later.addEventListener("click", () => {
      this.deferred.add(`${world.turn}:${fork}`);
      this.rerender();
    });
    const actions = element("div", "actions");
    actions.appendChild(later);
    this.root.appendChild(actions);
  }
}
