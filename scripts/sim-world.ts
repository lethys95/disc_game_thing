import { autoplay } from "#rules/ai";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import type { BattleMemo } from "#rules/world/ai";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import type { PlayerSetup } from "#rules/world/create";
import { defaultColors } from "#rules/world/colors";
import type { WorldAction } from "#rules/world/state";
import { commitmentOf } from "#rules/forks";
import { UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { GROVE_PRESETS, NEXUS_PRESETS, PRESETS } from "#rules/units/presets";
import { defaultMapSize, isMapSize } from "#rules/map";

/**
 * Whole games with the map AI on every side: `PLAYERS=punishment,nexus:overload [SIZE=large] pnpm sim:world [seeds...]`.
 * Each player is a Jilliath preset key, `nexus[:preset]` or `grove[:preset]`; two or more players; default two
 * `uncommitted` Jilliath.
 */
const parse = (spec: string): { faction: Playable; key: string } => {
  const [head = "uncommitted", tail] = spec.split(":");
  if (head === "nexus" || head === "grove") return { faction: head, key: tail ?? "uncommitted" };
  return { faction: "jilliath", key: head };
};
const isJilliathPreset = (key: string): key is keyof typeof PRESETS => key in PRESETS;
const isNexusPreset = (key: string): key is keyof typeof NEXUS_PRESETS => key in NEXUS_PRESETS;
const isGrovePreset = (key: string): key is keyof typeof GROVE_PRESETS => key in GROVE_PRESETS;
const squadOf = (s: { faction: Playable; key: string }) => {
  if (s.faction === "nexus") return isNexusPreset(s.key) ? NEXUS_PRESETS[s.key] : NEXUS_PRESETS.uncommitted;
  if (s.faction === "grove") return isGrovePreset(s.key) ? GROVE_PRESETS[s.key] : GROVE_PRESETS.uncommitted;
  return isJilliathPreset(s.key) ? PRESETS[s.key] : PRESETS.uncommitted;
};

const seeds = process.argv.slice(2).map(Number);
const verbose = process.env["VERBOSE"] === "1";
const SIZE = process.env["SIZE"] ?? "";
const specs = (process.env["PLAYERS"] ?? "uncommitted,uncommitted").split(",").map(parse);
const colors = defaultColors(specs.map((s) => s.faction));
const setups: PlayerSetup[] = specs.map((s, i) => ({
  squad: squadOf(s),
  faction: s.faction,
  commitment: commitmentOf(squadOf(s).map((p) => p.defId)) ?? {},
  color: colors[i] ?? "white",
}));
for (const seed of seeds.length > 0 ? seeds : [1, 2, 3, 4, 5]) {
  let world = createWorld(seed, setups, isMapSize(SIZE) ? SIZE : defaultMapSize(setups.length));
  const memo: BattleMemo = new Map();
  const tally: Record<string, number> = {};
  // Per player: actions by kind, and battles fought and won as attacker (the audit, 2026-10-06).
  const byPlayer = setups.map(() => ({ actions: {} as Record<string, number>, attacks: 0, won: 0 }));
  const timeline: string[] = [];
  let battles = 0;
  const count = (action: WorldAction) => {
    tally[action.type] = (tally[action.type] ?? 0) + 1;
    const mine = byPlayer[world.activePlayer]?.actions;
    if (mine) mine[action.type] = (mine[action.type] ?? 0) + 1;
  };
  // Past 150 turns it's a cold war: no side can win a fight its forecast allows.
  for (let i = 0; world.turn <= 150 && !world.outcome && i < 20000; i++) {
    const battle = world.engagement?.battle;
    if (battle) {
      battles += 1;
      const defender = world.engagement?.defender.kind ?? "?";
      const attacker = world.leaders.find((l) => l.id === world.engagement?.attackerId)?.player;
      const done = autoplay(battle);
      const record = attacker === undefined ? undefined : byPlayer[attacker];
      if (record) {
        record.attacks += 1;
        if (done.outcome?.winner === 0) record.won += 1;
      }
      if (verbose) timeline.push(`t${world.turn}:${attacker}>${defender}${done.outcome?.winner === 0 ? "" : "(lost)"}`);
      world = concludeBattle(world, done).world;
      continue;
    }
    const action = chooseWorldAction(world, memo);
    count(action);
    world = applyWorldAction(world, action).world;
  }
  const owners = world.cities.map((c) => `${c.id}:${c.owner ?? "-"}`).join(" ");
  if (verbose) {
    const armies = world.leaders.map((l) => `${l.player}[${l.squad.map((m) => `${m.defId}:${UNITS[m.defId]?.tier ?? 0}`).join(",")}]`).join(" ");
    const garrisons = world.cities.filter((c) => c.kind === "capitol").map((c) => `${c.owner}{${c.garrison.map((m) => m.defId).join(",")}}`).join(" ");
    const nodes = world.nodes.map((n) => `${n.kind}:${n.level}`).join(" ");
    const walls = world.cities.map((c) => `${c.id}:${c.tier}`).join(" ");
    const spells = world.players.map((p, i) => `${i}[${p.spells.join(",")}]`).join(" ");
    console.log(`  battles ${timeline.join(" ")}\n  lairs left ${world.lairs.filter((l) => l.guards.length > 0).length}\n  armies ${armies}\n  capitols ${garrisons}\n  nodes ${nodes}\n  city levels ${walls}\n  spells ${spells}`);
  }
  // For `sim-many`: the result as data, on a line of its own.
  console.log(`RESULT ${JSON.stringify({ winner: world.outcome?.winner ?? null, turn: world.turn, battles, players: byPlayer, gold: world.players.map((p) => p.gold) })}`);
  console.log(`seed ${seed}: ${world.outcome ? `player ${world.outcome.winner} wins` : "cold war"} on turn ${world.turn}, ${battles} battles, gold ${world.players.map((p) => p.gold).join("/")}, leaders ${world.leaders.length} | ${owners} | ${JSON.stringify(tally)}`);
}
