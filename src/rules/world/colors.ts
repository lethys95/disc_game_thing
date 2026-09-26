import type { Playable } from "#rules/units/index";

/**
 * Player colors (user, 2026-09-26: like WC3 and AoE2). They mark who owns what; a faction's mana color stays in its
 * art and magic. Cosmetic, but part of the world so saves keep them.
 */
export const PLAYER_COLORS = ["red", "teal", "blue", "violet", "gold", "orange", "green", "white"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];

/** Each faction's own color first (its mana color); a later player of the same faction gets the next free one. */
const FACTION_COLOR: Readonly<Record<Playable, PlayerColor>> = { jilliath: "red", nexus: "teal" };

export function defaultColors(factions: readonly Playable[]): PlayerColor[] {
  const colors: PlayerColor[] = [];
  for (const faction of factions) {
    const own = FACTION_COLOR[faction];
    colors.push(colors.includes(own) ? freeColor(colors) : own);
  }
  return colors;
}

/** The first color not taken that no faction owns, so a second Jilliath player isn't mistaken for Nexus. */
export function freeColor(taken: readonly PlayerColor[]): PlayerColor {
  const owned = Object.values(FACTION_COLOR);
  return PLAYER_COLORS.find((c) => !taken.includes(c) && !owned.includes(c)) ?? PLAYER_COLORS.find((c) => !taken.includes(c)) ?? "white";
}

export const fallbackColor = (taken: PlayerColor): PlayerColor => freeColor([taken]);
