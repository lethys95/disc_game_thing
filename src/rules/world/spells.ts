import { hexDistance, hexKey, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { spellById } from "#rules/spells";
import type { SpellDef } from "#rules/spells";
import { alive, capitolOf, playerOf } from "#rules/world/state";
import type { PlayerId, SquadMember, World } from "#rules/world/state";
import { sightOf } from "#rules/world/vision";

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

/** A squad a spell can reach on a hex, and whose it is (null: neutrals). */
interface Group {
  readonly squad: SquadMember[];
  readonly owner: PlayerId | null;
  readonly kind: "warband" | "lair";
}

function groupsAt(world: World, hex: Hex): Group[] {
  return [
    ...world.leaders.filter((l) => sameHex(l.hex, hex)).map((l): Group => ({ squad: l.squad, owner: l.player, kind: "warband" })),
    ...world.lairs.filter((l) => sameHex(l.hex, hex) && l.guards.length > 0).map((l): Group => ({ squad: l.guards, owner: null, kind: "lair" })),
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
  const spell = spellById(id);
  const side = world.activePlayer;
  return Object.values(world.map.tiles)
    .map((t) => t.hex)
    .filter((hex) => hexDistance(hex, at) <= spell.radius)
    .flatMap((hex) => groupsAt(world, hex).filter((g) => g.owner !== side).map((g) => g.squad));
}

/** Applies a cast to a draft world (already checked). */
export function castSpell(world: World, id: string, at: Hex): void {
  const side = world.activePlayer;
  const player = playerOf(world, side);
  const spell = spellById(id);
  player.mana[spell.mana] -= spell.cost;
  player.cast.push(id);
  const effect = spell.effect;
  if (effect.kind === "damage") {
    for (const squad of spellVictims(world, id, at)) {
      squad.forEach((m, i) => {
        if (alive(m)) squad[i] = { ...m, hp: Math.max(1, m.hp - effect.amount) };
      });
    }
    return;
  }
  const enchantment = { spell: id, effect: effect.effect, until: world.turn + effect.turns - 1 };
  if (spell.target === "enemyCity") {
    for (const city of world.cities) if (sameHex(city.hex, at)) city.enchantments = [...city.enchantments.filter((e) => e.spell !== id), enchantment];
  } else {
    for (const leader of world.leaders) if (sameHex(leader.hex, at) && leader.player === side) leader.enchantments = [...leader.enchantments.filter((e) => e.spell !== id), enchantment];
  }
}
