import { autoplay } from "#rules/ai";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import type { WorldAction } from "#rules/world/state";
import { commitmentOf } from "#rules/forks";
import { UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { NEXUS_PRESETS, PRESETS } from "#view/squads";

/**
 * Whole games with the map AI on both sides: `A=punishment B=nexus:overload pnpm sim:world [seeds...]`.
 * A side is a Jilliath preset key, or `nexus[:preset]`; default `uncommitted` Jilliath.
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
const verbose = process.env["VERBOSE"] === "1";
const sides = [parse(process.env["A"]), parse(process.env["B"])] as const;
for (const seed of seeds.length > 0 ? seeds : [1, 2, 3, 4, 5]) {
  let world = createWorld(
    seed,
    [squadOf(sides[0]), squadOf(sides[1])],
    [commitmentOf(squadOf(sides[0]).map((p) => p.defId)) ?? {}, commitmentOf(squadOf(sides[1]).map((p) => p.defId)) ?? {}],
    [sides[0].faction, sides[1].faction],
  );
  const tally: Record<string, number> = {};
  const timeline: string[] = [];
  let battles = 0;
  const count = (action: WorldAction) => {
    tally[action.type] = (tally[action.type] ?? 0) + 1;
  };
  // Past 150 turns it's a cold war: no side can win a fight its forecast allows.
  for (let i = 0; world.turn <= 150 && !world.outcome && i < 20000; i++) {
    const battle = world.engagement?.battle;
    if (battle) {
      battles += 1;
      const defender = world.engagement?.defender.kind ?? "?";
      const attacker = world.leaders.find((l) => l.id === world.engagement?.attackerId)?.side;
      const done = autoplay(battle);
      if (verbose) timeline.push(`t${world.turn}:${attacker}>${defender}${done.outcome?.winner === attacker ? "" : "(lost)"}`);
      world = concludeBattle(world, done).world;
      continue;
    }
    const action = chooseWorldAction(world);
    count(action);
    world = applyWorldAction(world, action).world;
  }
  const owners = world.cities.map((c) => `${c.id}:${c.owner ?? "-"}`).join(" ");
  if (verbose) {
    const armies = world.leaders.map((l) => `${l.side}[${l.squad.map((m) => `${m.defId}:${UNITS[m.defId]?.tier ?? 0}`).join(",")}]`).join(" ");
    const garrisons = world.cities.filter((c) => c.kind === "capitol").map((c) => `${c.owner}{${c.garrison.map((m) => m.defId).join(",")}}`).join(" ");
    console.log(`  battles ${timeline.join(" ")}\n  lairs left ${world.lairs.filter((l) => l.guards.length > 0).length}\n  armies ${armies}\n  capitols ${garrisons}`);
  }
  console.log(`seed ${seed}: ${world.outcome ? `side ${world.outcome.winner} wins` : "cold war"} on turn ${world.turn}, ${battles} battles, gold ${world.gold.join("/")}, leaders ${world.leaders.length} | ${owners} | ${JSON.stringify(tally)}`);
}
