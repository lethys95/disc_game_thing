import { autoplay } from "#rules/ai";
import { applyWorldAction, chooseWorldAction, concludeBattle, createWorld } from "#rules/world";
import type { WorldAction } from "#rules/world";
import { doctrine } from "#rules/doctrine";
import type { Playable } from "#rules/units/index";
import { NEXUS_PRESETS, PRESETS } from "#view/squads";

/**
 * Whole games with the map AI on both sides: `A=punishment B=nexus:overload pnpm sim:world [seeds...]`.
 * A side is a Jilliath doctrine key, or `nexus[:doctrine]`; default `uncommitted` Jilliath.
 */
const parse = (spec: string | undefined): { faction: Playable; key: string } => {
  const [head = "uncommitted", tail] = (spec ?? "uncommitted").split(":");
  return head === "nexus" ? { faction: "nexus", key: tail ?? "uncommitted" } : { faction: "jilliath", key: head };
};
const isJilliathPreset = (key: string): key is keyof typeof PRESETS => key in PRESETS;
const isNexusPreset = (key: string): key is keyof typeof NEXUS_PRESETS => key in NEXUS_PRESETS;
const squadOf = (s: { faction: Playable; key: string }) =>
  s.faction === "nexus" ? (isNexusPreset(s.key) ? NEXUS_PRESETS[s.key] : NEXUS_PRESETS.uncommitted) : isJilliathPreset(s.key) ? PRESETS[s.key] : PRESETS.uncommitted;

const seeds = process.argv.slice(2).map(Number);
const sides = [parse(process.env["A"]), parse(process.env["B"])] as const;
for (const seed of seeds.length > 0 ? seeds : [1, 2, 3, 4, 5]) {
  let world = createWorld(
    seed,
    [squadOf(sides[0]), squadOf(sides[1])],
    [doctrine(sides[0].faction, sides[0].key).commitment, doctrine(sides[1].faction, sides[1].key).commitment],
    [sides[0].faction, sides[1].faction],
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
