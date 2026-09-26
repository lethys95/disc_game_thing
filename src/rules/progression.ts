import type { Commitment } from "#rules/forks";
import { EVOLUTIONS, UNITS } from "#rules/units/index";

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

/** XP a unit of this tier needs for its next step (evolution or level); tiers past the table use its last entry. */
function xpForTier(tier: number): number | null {
  if (tier < 1) return null;
  const tiers = Object.keys(XP_TO_EVOLVE).map(Number);
  return XP_TO_EVOLVE[Math.min(tier, Math.max(...tiers))] ?? null;
}

/**
 * XP for the next level of a unit at the end of its line (D2, user 2026-09-26): it keeps leveling without changing
 * tier, and the requirement stays fixed. Null for units that still evolve, and for the tierless Guardian.
 */
export function xpToLevel(defId: string): number | null {
  return (EVOLUTIONS[defId]?.length ?? 0) > 0 ? null : xpForTier(UNITS[defId]?.tier ?? 0);
}

/** XP needed for this unit's next form, or null for units at the end of their line. */
export function xpToEvolve(defId: string): number | null {
  const tier = UNITS[defId]?.tier ?? 0;
  return (EVOLUTIONS[defId]?.length ?? 0) > 0 ? (XP_TO_EVOLVE[tier] ?? null) : null;
}

/** The form this unit evolves into given its owner's choices; null while its fork is undecided. */
export function nextForm(defId: string, commitment: Commitment): string | null {
  const evolutions = EVOLUTIONS[defId] ?? [];
  if (evolutions.length === 1) return evolutions[0]?.to ?? null;
  return commitment[defId] ?? null;
}

export interface Growth {
  readonly defId: string;
  readonly xp: number;
  /** Forms passed through, in order, if the unit evolved. */
  readonly evolvedInto: readonly string[];
  /** Levels gained at the end of the line. */
  readonly levels: number;
}

/**
 * Adds XP and evolves as far as it reaches. Evolving resets XP to zero (overflow is lost). A unit whose next fork
 * isn't decided yet waits with a full bar and evolves as soon as its owner chooses (call with `gained` 0).
 */
export function grow(defId: string, xp: number, gained: number, commitment: Commitment): Growth {
  let form = defId;
  let total = xp + gained;
  const evolvedInto: string[] = [];
  for (;;) {
    const needed = xpToEvolve(form);
    if (needed === null) {
      const perLevel = xpToLevel(form);
      if (perLevel === null) return { defId: form, xp: total, evolvedInto, levels: 0 };
      return { defId: form, xp: total % perLevel, evolvedInto, levels: Math.floor(total / perLevel) };
    }
    const next = nextForm(form, commitment);
    if (!next) return { defId: form, xp: Math.min(total, needed), evolvedInto, levels: 0 };
    if (total < needed) return { defId: form, xp: total, evolvedInto, levels: 0 };
    form = next;
    total = 0;
    evolvedInto.push(next);
  }
}
