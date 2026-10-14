import { FACTIONS } from "#rules/factions";
import { forkOptions, isFork } from "#rules/forks";
import { hexDistance, hexKey, sameHex } from "#rules/hex";
import { itemById } from "#rules/items";
import { NODES } from "#rules/nodes";
import { xpToEvolve, xpToLevel } from "#rules/progression";
import { STRUCTURES } from "#rules/structures";
import { UNITS } from "#rules/units/index";
import { income, manaIncome } from "#rules/world/economy";
import { leadershipOf, movementOf, unspentPoints } from "#rules/world/leaders";
import { isLeaderOf, maxHpOf } from "#rules/world/record";
import { cityAt, lairAt, leaderAt, playerOf, tribeAt } from "#rules/world/state";
import type { Leader, PlayerId, SquadMember, World } from "#rules/world/state";
import type { Hex } from "#rules/hex";
import { knownWorld, sightOf } from "#rules/world/vision";
import { cityName, TRIBE_NAMES, unitName } from "#view/names";
import { at, placeText, warbandName } from "#scripts/mcp/map-options";

/** The map as the seat knows it, in words: what it has, what it has seen, and a small drawing of the hexes. */

const place = (m: SquadMember): string => `${"FMB"[m.tile.row] ?? "?"}${m.tile.col + 1}`;

function memberLine(m: SquadMember, leader: Leader | undefined, commitment: Readonly<Record<string, string>>): string {
  const def = UNITS[m.defId];
  const parts = [`tier ${def?.tier ?? "?"}`, `${m.hp}/${maxHpOf(m, leader)} HP`];
  const evolve = xpToEvolve(m.defId);
  const level = xpToLevel(m.defId);
  if (evolve !== null) {
    const waiting = isFork(m.defId) && commitment[m.defId] === undefined && m.xp >= evolve;
    parts.push(waiting ? `XP full: choose its branch (${forkOptions(m.defId).map(unitName).join(" or ")})` : `${m.xp}/${evolve} XP to evolve`);
  } else if (level !== null) parts.push(`${m.xp}/${level} XP to level ${m.level + 1}`);
  if (m.level > 0) parts.push(`level ${m.level}`);
  return `[${place(m)}]${isLeaderOf(m, leader) ? " (leader)" : ""} ${unitName(m.defId)}: ${parts.join(", ")}`;
}

/** A squad as others last saw it: who's in it, without the numbers only its owner knows. */
const glimpse = (squad: readonly SquadMember[]): string => squad.map((m) => `${unitName(m.defId)} [${place(m)}] ${m.hp} HP`).join(", ");

/** One line per hex row; each hex one character, offset so neighbours touch as on the map. */
function drawing(known: World, seat: PlayerId): string[] {
  const radius = known.map.radius;
  const explored = new Set(playerOf(known, seat).explored);
  const sight = sightOf(known, seat);
  const mine = known.leaders.filter((l) => l.player === seat);
  const lines: string[] = [];
  for (let r = -radius; r <= radius; r++) {
    const cells: string[] = [];
    for (let q = Math.max(-radius, -r - radius); q <= Math.min(radius, -r + radius); q++) {
      const hex = { q, r };
      const key = hexKey(hex);
      const tile = known.map.tiles[key];
      if (!tile || !explored.has(key)) {
        cells.push("?");
        continue;
      }
      const own = mine.findIndex((l) => sameHex(l.hex, hex));
      const leader = leaderAt(known, hex);
      const city = cityAt(known, hex);
      const lair = lairAt(known, hex);
      const structure = known.structures.find((s) => sameHex(s.hex, hex));
      if (own >= 0) cells.push(String(own + 1));
      else if (leader) cells.push("E");
      else if (city) cells.push(city.owner === seat ? (city.kind === "capitol" ? "H" : "O") : city.kind === "capitol" ? "X" : "C");
      else if (lair && lair.guards.length > 0) cells.push("L");
      else if (structure) cells.push("$");
      else if (known.nodes.some((n) => sameHex(n.hex, hex))) cells.push("n");
      else cells.push({ plain: sight.has(key) ? "." : ",", forest: "f", hills: "h", mountain: "^", water: "~" }[tile.terrain]);
    }
    lines.push(`${" ".repeat(Math.abs(r))}${cells.join(" ")}   r=${r}, q from ${Math.max(-radius, -r - radius)}`);
  }
  return lines;
}

export const MAP_LEGEND =
  "Legend: 1-9 your warbands (in the order listed), H your Capitol, O your city, X enemy Capitol, C other city, E enemy warband, L lair (camp/dungeon), $ structure (merchant, mercenaries, mage), n node, . plain in sight, , plain out of sight, f forest, h hills, ^ mountain (impassable), ~ water (impassable), ? unexplored. Hexes use axial coordinates (q,r); each row lists q rising left to right.";

/** What a warband stands on: a city, a structure, or the terrain. */
function groundText(world: World, seat: PlayerId, hex: Hex): string {
  const city = cityAt(world, hex);
  if (city) return `in ${city.owner === seat ? "your" : "a"} ${cityName(city)}`;
  const structure = world.structures.find((s) => sameHex(s.hex, hex));
  if (structure) return `at the ${STRUCTURES[structure.kind].name}`;
  return `on ${world.map.tiles[hexKey(hex)]?.terrain ?? "unknown"} ground`;
}

/** The seat's purse and turn, in one line. */
export function statusLine(world: World, seat: PlayerId): string {
  const me = playerOf(world, seat);
  return `Turn ${world.turn}. You are player ${seat} (${FACTIONS[me.faction].name}). Gold ${me.gold} (+${income(world, seat)}/turn), mana ${me.mana} (+${manaIncome(world, seat)}/turn).`;
}

/** Each warband in one line: where it is, its movement, how full and how hurt. */
export function warbandLines(world: World, seat: PlayerId): string[] {
  return world.leaders
    .filter((l) => l.player === seat)
    .map((l, i) => {
      const hp = l.squad.reduce((sum, m) => sum + m.hp, 0);
      const max = l.squad.reduce((sum, m) => sum + maxHpOf(m, l), 0);
      const fallen = l.fellOnTurn !== null ? " Its leader has fallen: revive it at the Capitol." : "";
      return `${i + 1}. ${warbandName(l)} at ${at(l.hex)}, ${groundText(world, seat, l.hex)}: movement ${l.movement}/${movementOf(l)}, ${l.squad.length}/${leadershipOf(l)} units, ${hp}/${max} HP.${fallen}`;
    });
}

export function lookText(world: World, seat: PlayerId): string {
  const known = knownWorld(world, seat);
  const me = playerOf(world, seat);
  const lines = [statusLine(world, seat)];
  const mine = world.leaders.filter((l) => l.player === seat);
  lines.push("", "YOUR WARBANDS");
  if (mine.length === 0) lines.push("None. Elevate a garrison unit in your Capitol to lead one.");
  mine.forEach((l, i) => {
    lines.push(warbandLines(world, seat)[i] ?? "");
    const extras = [unspentPoints(l) > 0 ? `${unspentPoints(l)} leader skill point(s) to spend` : "", l.worn.length > 0 ? `wears ${l.worn.map((id) => itemById(id).name).join(", ")}` : "", l.bag.length > 0 ? `carries ${l.bag.map((id) => itemById(id).name).join(", ")}` : ""].filter(Boolean);
    if (extras.length > 0) lines.push(`   ${extras.join("; ")}.`);
    for (const m of [...l.squad].sort((a, b) => a.tile.row - b.tile.row || a.tile.col - b.tile.col)) lines.push(`   ${memberLine(m, l, me.commitment)}`);
  });
  lines.push("", "YOUR CITIES");
  for (const city of world.cities.filter((c) => c.owner === seat)) {
    const nodes = world.nodes.filter((n) => n.cityId === city.id).map((n) => `${NODES[n.kind].name} L${n.level}`);
    lines.push(`${cityName(city)} at ${at(city.hex)}, walls tier ${city.tier}${nodes.length > 0 ? `, nodes: ${nodes.join(", ")}` : ""}. Garrison:`);
    for (const m of city.garrison) lines.push(`   ${memberLine(m, undefined, me.commitment)}`);
  }
  if (me.graveyard.length > 0) lines.push(`Graveyard: ${me.graveyard.map((f) => unitName(f.defId)).join(", ")}.`);
  if (me.spells.length > 0) lines.push(`Spells learned: ${me.spells.join(", ")}.`);
  const base = mine[0]?.hex ?? world.cities.find((c) => c.owner === seat)?.hex ?? { q: 0, r: 0 };
  const sight = sightOf(world, seat);
  const seen = (hex: { q: number; r: number }) => (sight.has(hexKey(hex)) ? "" : " (as last seen)");
  lines.push("", "WHAT YOU KNOW OF THE MAP (nearest first)");
  const places = [
    ...known.cities.filter((c) => c.owner !== seat).map((c) => ({ hex: c.hex, text: `${placeText(known, seat, c.hex)}: ${glimpse(c.garrison)}` })),
    ...known.leaders.filter((l) => l.player !== seat).map((l) => ({ hex: l.hex, text: `player ${l.player}'s warband: ${glimpse(l.squad)}` })),
    ...known.lairs.filter((l) => l.guards.length > 0).map((l) => ({ hex: l.hex, text: `${TRIBE_NAMES[tribeAt(known.map, l.hex)]} ${l.kind}${l.kind === "dungeon" ? ` (reward: ${l.reward.gold} gold${l.reward.joins ? `, a ${unitName(l.reward.joins)} joins` : ""}${l.reward.item ? `, an item` : ""})` : ""}: ${glimpse(l.guards)}` })),
    ...known.structures.map((s) => ({ hex: s.hex, text: `${STRUCTURES[s.kind].name}: ${STRUCTURES[s.kind].describe}` })),
    ...known.nodes.filter((n) => known.cities.find((c) => c.id === n.cityId)?.owner !== seat).map((n) => {
      const city = known.cities.find((c) => c.id === n.cityId);
      return { hex: n.hex, text: `${NODES[n.kind].name} L${n.level} node (it belongs to whoever holds ${city ? `${cityName(city)} at ${at(city.hex)}` : "a city you haven't seen"}): ${NODES[n.kind].describe(n.level)}` };
    }),
  ].sort((a, b) => hexDistance(base, a.hex) - hexDistance(base, b.hex));
  for (const p of places) lines.push(`- ${at(p.hex)}, ${hexDistance(base, p.hex)} hexes away: ${p.text}${seen(p.hex)}`);
  const explored = me.explored.length;
  lines.push("", `MAP (${explored} of ${Object.keys(world.map.tiles).length} hexes explored)`, ...drawing(known, seat), MAP_LEGEND);
  return lines.join("\n");
}
