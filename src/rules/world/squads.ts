import { GARRISON_LIMIT } from "#rules/balance";
import type { Side, Tile } from "#rules/battle/types";
import { sameTile } from "#rules/battle/grid";
import { hexDistance, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { GUARDIAN_ID } from "#rules/units/index";
import { leadershipOf } from "#rules/world/leaders";
import { cityById, leaderById } from "#rules/world/state";
import type { SquadMember, SquadRef, World } from "#rules/world/state";

/**
 * Squads on the map as places units can be put: a city's garrison or a warband. Units move between squads that
 * meet (pillars.md, "Cities" and "Warbands meeting") through the transfer action.
 */

export function squadAt(world: World, ref: SquadRef): SquadMember[] {
  return ref.kind === "garrison" ? cityById(world, ref.cityId).garrison : leaderById(world, ref.leaderId).squad;
}

/** How many units the squad can hold: a warband's Leadership, or the garrison's slots. */
export function capacityOf(world: World, ref: SquadRef): number {
  return ref.kind === "garrison" ? GARRISON_LIMIT : leadershipOf(leaderById(world, ref.leaderId));
}

export function ownerOf(world: World, ref: SquadRef): Side | null {
  return ref.kind === "garrison" ? cityById(world, ref.cityId).owner : leaderById(world, ref.leaderId).side;
}

export function hexOf(world: World, ref: SquadRef): Hex {
  return ref.kind === "garrison" ? cityById(world, ref.cityId).hex : leaderById(world, ref.leaderId).hex;
}

export const sameSquad = (a: SquadRef, b: SquadRef): boolean =>
  a.kind === "garrison" ? b.kind === "garrison" && a.cityId === b.cityId : b.kind === "warband" && a.leaderId === b.leaderId;

/**
 * Whether two squads can trade units: a squad with itself (rearranging), a warband with the garrison of the city it
 * stands in, and two warbands on neighbouring hexes. Two garrisons never meet.
 */
export function canMeet(world: World, a: SquadRef, b: SquadRef): boolean {
  if (sameSquad(a, b)) return true;
  if (a.kind === "garrison" && b.kind === "garrison") return false;
  const [ha, hb] = [hexOf(world, a), hexOf(world, b)];
  return a.kind === "warband" && b.kind === "warband" ? hexDistance(ha, hb) === 1 : sameHex(ha, hb);
}

/** A unit that can't leave its squad: a warband's leader, and the Guardian. It can still move within the squad. */
function bound(world: World, ref: SquadRef, member: SquadMember): boolean {
  if (member.defId === GUARDIAN_ID) return true;
  return ref.kind === "warband" && sameTile(member.tile, leaderById(world, ref.leaderId).leaderTile);
}

export interface Transfer {
  readonly from: SquadRef;
  readonly fromTile: Tile;
  readonly to: SquadRef;
  readonly toTile: Tile;
}

/** Why this move can't happen, or null. Moving onto an occupied tile swaps the two units. */
export function transferProblem(world: World, transfer: Transfer): string | null {
  const { from, fromTile, to, toTile } = transfer;
  const side = world.activeSide;
  if (ownerOf(world, from) !== side || ownerOf(world, to) !== side) return "not your squad";
  if (!canMeet(world, from, to)) return "these squads aren't together";
  const source = squadAt(world, from);
  const target = squadAt(world, to);
  const moving = source.find((m) => sameTile(m.tile, fromTile));
  if (!moving) return "nobody there";
  const displaced = target.find((m) => sameTile(m.tile, toTile));
  if (sameSquad(from, to)) return null;
  if (bound(world, from, moving) || (displaced && bound(world, to, displaced))) return "a leader stays with its warband, and the Guardian with its Capitol";
  if (!displaced && target.length >= capacityOf(world, to)) return "no room";
  return null;
}

/** Applies a transfer to a draft world (already checked). */
export function transfer(world: World, move: Transfer): void {
  const { from, fromTile, to, toTile } = move;
  const source = squadAt(world, from);
  const target = squadAt(world, to);
  const moving = source.find((m) => sameTile(m.tile, fromTile));
  if (!moving) return;
  const displaced = target.find((m) => sameTile(m.tile, toTile));
  if (sameSquad(from, to)) {
    const i = source.indexOf(moving);
    const j = displaced ? source.indexOf(displaced) : -1;
    source[i] = { ...moving, tile: toTile };
    if (displaced) source[j] = { ...displaced, tile: fromTile };
    // The leader's figure follows its unit around the grid.
    if (from.kind === "warband") {
      const leader = leaderById(world, from.leaderId);
      if (sameTile(leader.leaderTile, fromTile)) leader.leaderTile = toTile;
      else if (displaced && sameTile(leader.leaderTile, toTile)) leader.leaderTile = fromTile;
    }
    return;
  }
  source.splice(source.indexOf(moving), 1);
  if (displaced) {
    target.splice(target.indexOf(displaced), 1);
    source.push({ ...displaced, tile: fromTile });
  }
  target.push({ ...moving, tile: toTile });
}
