import { FACTIONS } from "#rules/factions";
import type { Playable } from "#rules/units/index";

/**
 * Player colors (user, 2026-09-26: like WC3 and AoE2). They mark who owns what; a faction's mana color stays in its
 * art and magic. Cosmetic, but part of the world so saves keep them.
 */
export const PLAYER_COLORS = ["red", "teal", "blue", "violet", "gold", "orange", "green", "white"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];

/** Each faction's own color first (its mana color); a later player of the same faction gets the next free one. */

export function defaultColors(factions: readonly Playable[]): PlayerColor[] {
  const colors: PlayerColor[] = [];
  for (const faction of factions) {
    const own = FACTIONS[faction].color;
    colors.push(colors.includes(own) ? freeColor(colors) : own);
  }
  return colors;
}

/** The first color not taken that no faction owns, so a second Jilliath player isn't mistaken for Nexus. */
export function freeColor(taken: readonly PlayerColor[]): PlayerColor {
  const owned = Object.values(FACTIONS).map((f) => f.color);
  return PLAYER_COLORS.find((c) => !taken.includes(c) && !owned.includes(c)) ?? PLAYER_COLORS.find((c) => !taken.includes(c)) ?? "white";
}

export const fallbackColor = (taken: PlayerColor): PlayerColor => freeColor([taken]);
