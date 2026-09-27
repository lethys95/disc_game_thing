import { sameTile } from "#rules/battle/grid";
import type { Tile } from "#rules/battle/types";
import { sameHex } from "#rules/hex";
import { itemById } from "#rules/items";
import { spellById } from "#rules/spells";
import { hireCost, resalePrice } from "#rules/structures";
import { freeTile, newcomer } from "#rules/world/economy";
import { leadershipOf } from "#rules/world/leaders";
import { maxHpOf } from "#rules/world/record";
import { leaderById, playerOf } from "#rules/world/state";
import type { Leader, Structure, World, WorldEvent } from "#rules/world/state";

/**
 * Visiting map structures (`rules/structures.ts`): a warband standing on one trades there, on its player's turn.
 * Each order has its `*Problem` (null when it may happen) and a function that applies it to a draft world.
 */

/** The structure standing on the same hex as this leader, if any. */
export function structureAt(world: World, leader: Leader): Structure | undefined {
  return world.structures.find((s) => sameHex(s.hex, leader.hex));
}

/** Why this leader can't trade at a structure of this kind now, or null; and the structure when it can. */
function visitProblem<K extends Structure["kind"]>(world: World, leaderId: string, kind: K): { problem: string } | { structure: Extract<Structure, { kind: K }>; leader: Leader } {
  const leader = leaderById(world, leaderId);
  if (leader.player !== world.activePlayer) return { problem: "not your warband" };
  const structure = structureAt(world, leader);
  if (!structure || structure.kind !== kind) return { problem: "the warband must stand there" };
  if (leader.fellOnTurn !== null) return { problem: "its leader has fallen" };
  return { structure: narrow(structure, kind), leader };
}

function narrow<K extends Structure["kind"]>(structure: Structure, kind: K): Extract<Structure, { kind: K }> {
  const matches = (s: Structure): s is Extract<Structure, { kind: K }> => s.kind === kind;
  if (!matches(structure)) throw new Error(`not a ${kind}`);
  return structure;
}

export function hireProblem(world: World, leaderId: string, index: number, tile?: Tile): string | null {
  const visit = visitProblem(world, leaderId, "mercenaries");
  if ("problem" in visit) return visit.problem;
  const hire = visit.structure.stock[index];
  if (!hire) return "nobody left to hire";
  if (playerOf(world, world.activePlayer).gold < hireCost(hire)) return "not enough gold";
  const squad = visit.leader.squad;
  if (squad.length >= leadershipOf(visit.leader)) return `squad full (Leadership ${leadershipOf(visit.leader)})`;
  if (tile && squad.some((m) => sameTile(m.tile, tile))) return "that spot is taken";
  if (!tile && !freeTile(squad, hire.defId)) return "no free spot";
  return null;
}

export function hire(world: World, leaderId: string, index: number, tile: Tile | undefined, events: WorldEvent[]): void {
  const problem = hireProblem(world, leaderId, index, tile);
  const visit = visitProblem(world, leaderId, "mercenaries");
  if (problem || "problem" in visit) throw new Error(`cannot hire: ${problem}`);
  const [hired] = visit.structure.stock.splice(index, 1);
  const spot = tile ?? (hired ? freeTile(visit.leader.squad, hired.defId) : null);
  if (!hired || !spot) throw new Error("cannot hire: no free spot");
  playerOf(world, world.activePlayer).gold -= hireCost(hired);
  // It comes seasoned: its levels, and the health they bring, at full.
  const seasoned = { ...newcomer(world, world.activePlayer, hired.defId, spot), level: hired.level };
  visit.leader.squad.push({ ...seasoned, hp: maxHpOf(seasoned, undefined) });
  events.push({ type: "hired", leaderId, defId: hired.defId });
}

export function buyItemProblem(world: World, leaderId: string, item: string): string | null {
  const visit = visitProblem(world, leaderId, "merchant");
  if ("problem" in visit) return visit.problem;
  if (!visit.structure.stock.includes(item)) return "not for sale here";
  if (playerOf(world, world.activePlayer).gold < itemById(item).price) return "not enough gold";
  return null;
}

export function buyItem(world: World, leaderId: string, item: string, events: WorldEvent[]): void {
  const problem = buyItemProblem(world, leaderId, item);
  const visit = visitProblem(world, leaderId, "merchant");
  if (problem || "problem" in visit) throw new Error(`cannot buy ${item}: ${problem}`);
  visit.structure.stock.splice(visit.structure.stock.indexOf(item), 1);
  playerOf(world, world.activePlayer).gold -= itemById(item).price;
  visit.leader.bag.push(item);
  events.push({ type: "bought", leaderId, item });
}

/** Only what's in the bag sells: take an item off first. */
export function sellItemProblem(world: World, leaderId: string, item: string): string | null {
  const visit = visitProblem(world, leaderId, "merchant");
  if ("problem" in visit) return visit.problem;
  if (!visit.leader.bag.includes(item)) return visit.leader.worn.includes(item) ? "take it off first" : "not carried";
  return null;
}

export function sellItem(world: World, leaderId: string, item: string, events: WorldEvent[]): void {
  const problem = sellItemProblem(world, leaderId, item);
  const visit = visitProblem(world, leaderId, "merchant");
  if (problem || "problem" in visit) throw new Error(`cannot sell ${item}: ${problem}`);
  const gold = resalePrice(itemById(item).price);
  visit.leader.bag.splice(visit.leader.bag.indexOf(item), 1);
  visit.structure.stock.push(item);
  playerOf(world, world.activePlayer).gold += gold;
  events.push({ type: "sold", leaderId, item, gold });
}

export function buySpellProblem(world: World, leaderId: string, spell: string): string | null {
  const visit = visitProblem(world, leaderId, "mage");
  if ("problem" in visit) return visit.problem;
  const player = playerOf(world, world.activePlayer);
  if (!visit.structure.stock.includes(spell)) return "not for sale here";
  if (player.spells.includes(spell)) return "already learned";
  if (player.gold < spellById(spell).learnCost) return "not enough gold";
  return null;
}

export function buySpell(world: World, leaderId: string, spell: string, events: WorldEvent[]): void {
  const problem = buySpellProblem(world, leaderId, spell);
  if (problem) throw new Error(`cannot buy ${spell}: ${problem}`);
  const player = playerOf(world, world.activePlayer);
  player.gold -= spellById(spell).learnCost;
  player.spells.push(spell);
  events.push({ type: "spellLearned", player: world.activePlayer, spell });
}
