import { cityName, unitName } from "#view/names";
import { hangingFor } from "#rules/world/fate";
import { cityById } from "#rules/world/state";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { element } from "#view/dom";

/**
 * A storm on a Gallows city failed: one of the fallen attackers hangs, never to be raised. The player picks which
 * (its own dead at the Gallows' first level, the enemy's at its second); the turn can't end until it has.
 */
export class GallowsPrompt {
  constructor(
    private readonly root: HTMLElement,
    private readonly act: (action: WorldAction) => void,
  ) {}

  render(world: World, player: PlayerId, mayAct: boolean): void {
    const hanging = mayAct ? hangingFor(world, player) : undefined;
    this.root.hidden = hanging === undefined;
    if (!hanging) return;
    const own = hanging.owner === player;
    const city = cityName(cityById(world, hanging.cityId));
    this.root.replaceChildren(
      element("div", "title", `The Gallows of ${city}`),
      element("div", "body", own ? "Your storm failed. One of your fallen hangs and can never be raised: choose which. The others go to your graveyard." : "Their storm failed. Choose which of the enemy's fallen hangs: it can never be raised."),
    );
    const choices = element("div", "actions");
    hanging.dead.forEach((fallen, index) => {
      const button = element("button", "dialog-close", `${unitName(fallen.defId)}${fallen.level > 0 ? ` · level ${fallen.level}` : ""}`);
      button.addEventListener("click", () => this.act({ type: "hang", index }));
      choices.appendChild(button);
    });
    this.root.appendChild(choices);
  }
}
