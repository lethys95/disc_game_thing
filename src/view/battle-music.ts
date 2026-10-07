import { actionsPerRound, effectiveStatsOf, strongestHits } from "#rules/battle/engine";
import type { Battle, Side } from "#rules/battle/types";

/**
 * The battle's music follows whoever is winning (the user, 2026-10-03: a tug of war; the side ahead is the side whose
 * theme plays). Provisional (`provisional.md` #62): the numbers below are Claude's.
 */

/** How far past even the other side must get before the music turns to it, as a share of the whole. */
export const LEAD_MARGIN = 0.08;
/** The music holds a side at least this long after turning to it, so a seesaw fight doesn't flicker. */
export const LEAD_COOLDOWN_MS = 15000;

/**
 * Side 0's share of the field's strength, from 0 to 1. A side's strength is its health (HP and shield) times its
 * damage per round, both summed over its living units (Lanchester's square law: a rough guess at who wins a
 * slugging match, which ignores healing, spells and position).
 */
export function standing(battle: Battle): number {
  const stats = effectiveStatsOf(battle);
  const hits = strongestHits(battle);
  const strength = [0, 1].map((side) => {
    let health = 0;
    let damage = 0;
    for (const unit of Object.values(battle.units)) {
      const own = stats[unit.id];
      if (unit.side !== side || !unit.alive || !own) continue;
      health += unit.hp + unit.shield;
      damage += (hits[unit.id] ?? 0) * actionsPerRound(own.initiative);
    }
    return health * damage;
  });
  const [a = 0, b = 0] = strength;
  return a + b === 0 ? 0.5 : a / (a + b);
}

/** Who the music is with: the side ahead, turning only past the margin and not again within the cooldown. */
export class Tug {
  private since: number;

  constructor(
    private side: Side,
    now: number,
  ) {
    this.since = now;
  }

  get leader(): Side {
    return this.side;
  }

  /** Side 0's share now (`standing`); returns the side whose theme should play. */
  update(share: number, now: number): Side {
    const ahead: Side = share >= 0.5 ? 0 : 1;
    if (ahead !== this.side && Math.abs(share - 0.5) >= LEAD_MARGIN && now - this.since >= LEAD_COOLDOWN_MS) {
      this.side = ahead;
      this.since = now;
    }
    return this.side;
  }
}

/** The side ahead as a battle starts; even goes to the attacker. */
export const openingLeader = (share: number): Side => (share >= 0.5 ? 0 : 1);
