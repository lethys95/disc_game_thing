import { hexDistance, hexKey, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { spellById } from "#rules/spells";
import type { SpellDef } from "#rules/spells";
import { isLeaderOf } from "#rules/world/record";
import { alive, capitolOf, playerOf } from "#rules/world/state";
import type { Lair, Leader, PlayerId, SquadMember, World, WorldEvent } from "#rules/world/state";
import { sightOf } from "#rules/world/vision";
import { bury, clearLair, nearestWarband, settleWarbands } from "#rules/world/fate";

/** Learning and casting overworld spells (`rules/spells.ts`): who may, on what, and what it does to the world. */

export function learnSpellProblem(world: World, id: string): string | null {
  const player = playerOf(world, world.activePlayer);
  const spell = spellById(id);
  if (spell.faction !== player.faction) return "another faction's spell";
  if (player.spells.includes(id)) return "already learned";
  if (!capitolOf(world, world.activePlayer)) return "no Capitol";
  if (player.gold < spell.learnCost) return "not enough gold";
  return null;
}

/** A squad a spell can reach on a hex: a warband (with its owner) or a lair's neutral guards. */
type Group = { readonly kind: "warband"; readonly owner: PlayerId; readonly leader: Leader } | { readonly kind: "lair"; readonly owner: null; readonly lair: Lair };

const squadOf = (group: Group): SquadMember[] => (group.kind === "warband" ? group.leader.squad : group.lair.guards);

function groupsAt(world: World, hex: Hex): Group[] {
  return [
    ...world.leaders.filter((l) => sameHex(l.hex, hex)).map((leader): Group => ({ kind: "warband", owner: leader.player, leader })),
    ...world.lairs.filter((l) => sameHex(l.hex, hex) && l.guards.length > 0).map((lair): Group => ({ kind: "lair", owner: null, lair })),
  ];
}

/** Whether `hex` is something this spell can be aimed at by `side`, ignoring mana, sight and the once-a-turn rule. */
function fits(world: World, side: PlayerId, spell: SpellDef, hex: Hex): boolean {
  switch (spell.target) {
    case "enemyGroup":
      return groupsAt(world, hex).some((g) => g.owner !== side);
    case "ownWarband":
      return world.leaders.some((l) => l.player === side && sameHex(l.hex, hex));
    case "enemyCity":
      return world.cities.some((c) => c.owner !== side && sameHex(c.hex, hex));
    case "area":
      return world.map.tiles[hexKey(hex)] !== undefined;
  }
}

export function castProblem(world: World, id: string, at: Hex): string | null {
  const side = world.activePlayer;
  const player = playerOf(world, side);
  const spell = spellById(id);
  if (!player.spells.includes(id)) return "not learned";
  if (player.cast.includes(id)) return "already cast this turn";
  if (player.mana[spell.mana] < spell.cost) return "not enough mana";
  if (!sightOf(world, side).has(hexKey(at))) return "out of sight";
  if (!fits(world, side, spell, at)) return "not a valid target";
  return null;
}

/** The hexes in sight this spell could be cast at now (for the view's highlights and the AI). */
export function spellTargets(world: World, id: string): Hex[] {
  const side = world.activePlayer;
  const spell = spellById(id);
  const sight = sightOf(world, side);
  return Object.values(world.map.tiles)
    .map((t) => t.hex)
    .filter((hex) => sight.has(hexKey(hex)) && fits(world, side, spell, hex));
}

/** The squads a cast at `at` would hit: groups not the caster's, on the hex or within the spell's radius. */
export function spellVictims(world: World, id: string, at: Hex): SquadMember[][] {
  return victimGroups(world, id, at).map(squadOf);
}

function victimGroups(world: World, id: string, at: Hex): Group[] {
  const spell = spellById(id);
  const side = world.activePlayer;
  return Object.values(world.map.tiles)
    .map((t) => t.hex)
    .filter((hex) => hexDistance(hex, at) <= spell.radius)
    .flatMap((hex) => groupsAt(world, hex).filter((g) => g.owner !== side));
}

/** Applies a cast to a draft world (already checked). */
export function castSpell(world: World, id: string, at: Hex, events: WorldEvent[]): void {
  const side = world.activePlayer;
  const player = playerOf(world, side);
  const spell = spellById(id);
  player.mana[spell.mana] -= spell.cost;
  player.cast.push(id);
  const effect = spell.effect;
  if (effect.kind === "damage") {
    for (const group of victimGroups(world, id, at)) strike(world, group, effect.amount, side, events);
    // What a spell wipes out leaves its items to the caster's warband nearest to where it struck.
    settleWarbands(world, events, () => nearestWarband(world, side, at));
    return;
  }
  const enchantment = { spell: id, effect: effect.effect, until: world.turn + effect.turns - 1 };
  if (spell.target === "enemyCity") {
    for (const city of world.cities) if (sameHex(city.hex, at)) city.enchantments = [...city.enchantments.filter((e) => e.spell !== id), enchantment];
  } else {
    for (const leader of world.leaders) if (sameHex(leader.hex, at) && leader.player === side) leader.enchantments = [...leader.enchantments.filter((e) => e.spell !== id), enchantment];
  }
}

/** Spell damage on the map kills as a battle would (`world/fate.ts`); no XP either way. */
function strike(world: World, group: Group, amount: number, caster: PlayerId, events: WorldEvent[]): void {
  const squad = squadOf(group);
  const leader = group.kind === "warband" ? group.leader : undefined;
  const dead: SquadMember[] = [];
  const after = squad.flatMap((m): SquadMember[] => {
    if (!alive(m)) return [m];
    const hp = m.hp - amount;
    if (hp > 0) return [{ ...m, hp }];
    if (isLeaderOf(m, leader)) return [{ ...m, hp: 0 }];
    dead.push(m);
    return [];
  });
  if (group.kind === "lair") {
    group.lair.guards = after;
    if (after.length === 0) clearLair(world, group.lair, caster, nearestWarband(world, caster, group.lair.hex), events);
    return;
  }
  bury(world, group.owner, dead, events);
  group.leader.squad = after.some(alive) ? after : [];
}
