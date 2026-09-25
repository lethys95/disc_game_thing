import { autoplay } from "#rules/ai";
import { applyWorldAction, chooseWorldAction, concludeBattle, createWorld } from "#rules/world";
import type { WorldAction } from "#rules/world";
import { DOCTRINES } from "#rules/doctrine";
import type { Doctrine } from "#rules/doctrine";
import { NEXUS_PRESET, PRESETS } from "#view/squads";

const isDoctrine = (d: string): d is Doctrine => d in DOCTRINES;

/** Whole games with the map AI on both sides: `A=punishment B=nexus pnpm sim:world [seeds...]` (a Jilliath doctrine or `nexus`; default uncommitted). */
const seeds = process.argv.slice(2).map(Number);
for (const seed of seeds.length > 0 ? seeds : [1, 2, 3, 4, 5]) {
  const doctrines = [process.env["A"] ?? "uncommitted", process.env["B"] ?? "uncommitted"].map((d) => (isDoctrine(d) ? d : "uncommitted"));
  const [a = "uncommitted", b = "uncommitted"] = doctrines;
  const nexus = [process.env["A"] === "nexus", process.env["B"] === "nexus"];
  let world = createWorld(
    seed,
    [nexus[0] ? NEXUS_PRESET : PRESETS[a], nexus[1] ? NEXUS_PRESET : PRESETS[b]],
    [DOCTRINES[a].commitment, DOCTRINES[b].commitment],
    [nexus[0] ? "nexus" : "jilliath", nexus[1] ? "nexus" : "jilliath"],
  );
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
