import { autoplay } from "#rules/ai";
import { applyWorldAction, chooseWorldAction, concludeBattle, createWorld } from "#rules/world";
import type { WorldAction } from "#rules/world";
import { PRESETS } from "#view/squads";

/** Whole games with the map AI on both sides, for a quick read on pacing: `pnpm sim:world [seeds...]`. */
const seeds = process.argv.slice(2).map(Number);
for (const seed of seeds.length > 0 ? seeds : [1, 2, 3, 4, 5]) {
  let world = createWorld(seed, [PRESETS.preserve, PRESETS.punishment]);
  const tally: Record<string, number> = {};
  let battles = 0;
  const count = (action: WorldAction) => {
    tally[action.type] = (tally[action.type] ?? 0) + 1;
  };
  // Past 150 turns it's a cold war: no side can win a fight its forecast allows.
  for (let i = 0; world.turn <= 150 && !world.outcome && i < 20000; i++) {
    const battle = world.engagement?.battle;
    if (battle) {
      battles += 1;
      world = concludeBattle(world, autoplay(battle)).world;
      continue;
    }
    const action = chooseWorldAction(world);
    count(action);
    world = applyWorldAction(world, action).world;
  }
  const owners = world.cities.map((c) => `${c.id}:${c.owner ?? "-"}`).join(" ");
  console.log(`seed ${seed}: ${world.outcome ? `side ${world.outcome.winner} wins` : "cold war"} on turn ${world.turn}, ${battles} battles, gold ${world.gold.join("/")}, leaders ${world.leaders.length} | ${owners} | ${JSON.stringify(tally)}`);
}
