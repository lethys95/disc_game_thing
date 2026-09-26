import { autoplay } from "#rules/ai";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import type { World } from "#rules/world/state";
import { PRESETS } from "#view/squads";
import { expect, test } from "vitest";

/** A whole game, map AI on both sides: M13's promise is that games end (docs/roadmap.md). */
function playOut(seed: number, maxTurn: number): World {
  let world = createWorld(seed, [PRESETS.uncommitted, PRESETS.uncommitted], [{}, {}], ["jilliath", "jilliath"]);
  for (let i = 0; world.turn <= maxTurn && !world.outcome && i < 20000; i++) {
    const battle = world.engagement?.battle;
    world = battle ? concludeBattle(world, autoplay(battle)).world : applyWorldAction(world, chooseWorldAction(world)).world;
  }
  return world;
}

test("an AI-vs-AI game ends with a fallen Guardian, not a cold war", { timeout: 120_000 }, () => {
  const world = playOut(3, 150);
  expect(world.outcome).not.toBeNull();
});
