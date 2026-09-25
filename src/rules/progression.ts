import { hasBranch } from "#rules/doctrine";
import type { Commitment } from "#rules/doctrine";
import { EVOLUTIONS, UNITS } from "#rules/units";

/**
 * XP and evolution. Canon: defeated enemies feed a pool the winners' survivors split, valued deterministically
 * from stats; tiers 2–3 common, 4 uncommon, 5 rare. The numbers are provisional (docs/questions.md).
 */
export const XP_TO_EVOLVE: Readonly<Record<number, number>> = { 1: 100, 2: 250, 3: 500, 4: 1000 };

/** What defeating one unit of this kind is worth. */
export function xpValue(defId: string): number {
  const stats = UNITS[defId]?.stats;
  return stats ? Math.round(stats.maxHp / 2 + stats.damage + stats.armor) : 0;
}

/** XP needed for this unit's next form, or null for units at the end of their line. */
export function xpToEvolve(defId: string): number | null {
  const tier = UNITS[defId]?.tier ?? 0;
  return (EVOLUTIONS[defId]?.length ?? 0) > 0 ? (XP_TO_EVOLVE[tier] ?? null) : null;
}

/** The form this unit evolves into for a faction with this commitment; null while the fork is uninvested. */
export function nextForm(defId: string, commitment: Commitment): string | null {
  return EVOLUTIONS[defId]?.find((e) => hasBranch(commitment, e.requires))?.to ?? null;
}

export interface Growth {
  readonly defId: string;
  readonly xp: number;
  /** Forms passed through, in order, if the unit evolved. */
  readonly evolvedInto: readonly string[];
}

/**
 * Adds XP and evolves as far as it reaches. Evolving resets XP to zero (overflow is lost). A unit whose next fork
 * isn't invested yet waits with a full bar and evolves as soon as the faction commits (call with `gained` 0).
 */
export function grow(defId: string, xp: number, gained: number, commitment: Commitment): Growth {
  let form = defId;
  let total = xp + gained;
  const evolvedInto: string[] = [];
  for (;;) {
    const needed = xpToEvolve(form);
    if (needed === null) return { defId: form, xp: total, evolvedInto };
    const next = nextForm(form, commitment);
    if (!next) return { defId: form, xp: Math.min(total, needed), evolvedInto };
    if (total < needed) return { defId: form, xp: total, evolvedInto };
    form = next;
    total = 0;
    evolvedInto.push(next);
  }
}
