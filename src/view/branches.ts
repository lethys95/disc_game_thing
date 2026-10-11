import { forkOptions } from "#rules/forks";
import { EVOLUTIONS } from "#rules/units/index";
import { art } from "#view/art";
import { element } from "#view/dom";
import { unitDefCard, unitName } from "#view/members";
import { showPeek } from "#view/peek";

/** Why choosing a branch matters, said the same way wherever a branch is chosen. */
export const branchText = (fork: string): string =>
  `Every ${unitName(fork)} in your army will take this branch. It's free and permanent: the other branch closes.`;

/**
 * A fork's branches as cards to pick from, the one way a branch is chosen (the evolve prompt on the map and the research
 * tree's dialog): each the portrait of the unit it leads to, its name and the dichotomy it stands for; its sheet on a
 * held right-click. `marked`: the branch the player clicked to get here, if any.
 */
export function branchCards(fork: string, marked: string | null, problem: string | null, pick: (to: string) => void): HTMLElement {
  const row = element("div", "branch-cards");
  for (const to of forkOptions(fork)) {
    const card = element("button", `branch-card${to === marked ? " marked" : ""}`);
    const label = EVOLUTIONS[fork]?.find((e) => e.to === to)?.label;
    card.append(art({ kind: "portrait", id: to, frame: "icon" }, "thumb"), element("span", "name", unitName(to)));
    if (label) card.appendChild(element("span", "label", label));
    card.disabled = problem !== null;
    card.title = problem ?? `Choose ${unitName(to)}. Hold right-click to see what it is.`;
    card.addEventListener("click", () => pick(to));
    card.addEventListener("contextmenu", (e) => e.preventDefault());
    card.addEventListener("pointerdown", (e) => {
      const peek = document.getElementById("peek");
      if (e.button === 2 && peek) showPeek(peek, [unitDefCard(to)], e.clientX, e.clientY);
    });
    row.appendChild(card);
  }
  return row;
}
