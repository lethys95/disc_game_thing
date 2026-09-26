import { ownStats } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import { LEVEL_BONUS_PERCENT } from "#rules/balance";
import { sameTile } from "#rules/battle/grid";
import { leaderEffects } from "#rules/world/leaders";
import { fullHp } from "#rules/world/state";
import type { Leader, Mark, SquadMember } from "#rules/world/state";

/** What a unit on the map brings into battle beyond its type: its marks, and the leader tree if it leads. */

export const isLeaderOf = (m: SquadMember, leader: Leader | undefined): leader is Leader => leader !== undefined && sameTile(m.tile, leader.leaderTile);

/** Every difference from the unit's baseline, each with its source: the unit's track record. */
export function recordOf(m: SquadMember, leader: Leader | undefined): Mark[] {
  const fromTree = isLeaderOf(m, leader) ? leaderEffects(leader).map(({ skill, effect }): Mark => ({ effect, source: { kind: "leaderTree", skill } })) : [];
  const fromLevels: Mark[] = m.level > 0 ? [{ effect: { def: "veteran", amount: m.level * LEVEL_BONUS_PERCENT }, source: { kind: "levels", levels: m.level } }] : [];
  return [...m.marks, ...fromLevels, ...fromTree];
}

export function placementOf(m: SquadMember, leader: Leader | undefined): Placement {
  const effects = recordOf(m, leader).map((r) => r.effect);
  return { defId: m.defId, tile: m.tile, hp: m.hp, effects, ...(isLeaderOf(m, leader) ? { leader: true } : {}) };
}

export function maxHpOf(m: SquadMember, leader: Leader | undefined): number {
  const effects = recordOf(m, leader).map((r) => r.effect);
  return effects.length === 0 ? fullHp(m.defId) : ownStats({ defId: m.defId, tile: m.tile, effects }).maxHp;
}
