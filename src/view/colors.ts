import * as THREE from "three";
import { defaultColors, fallbackColor } from "#rules/world/colors";
import type { Playable } from "#rules/units/index";
import type { PlayerColor } from "#rules/world/colors";
import { playerOf } from "#rules/world/state";
import type { PlayerId, World } from "#rules/world/state";

/** What each player color looks like: distinct on the dark board, muted enough for the art direction. */
export const COLOR_HEX: Readonly<Record<PlayerColor, string>> = {
  red: "#c0392b",
  teal: "#1fb5a8",
  blue: "#3a78d8",
  violet: "#8e5bd0",
  gold: "#d9a932",
  orange: "#d9731c",
  green: "#4c9e4c",
  white: "#d8d2c4",
};

export const COLOR_NAMES: Readonly<Record<PlayerColor, string>> = {
  red: "Red",
  teal: "Teal",
  blue: "Blue",
  violet: "Violet",
  gold: "Gold",
  orange: "Orange",
  green: "Green",
  white: "White",
};

export const threeColor = (color: PlayerColor): THREE.Color => new THREE.Color(COLOR_HEX[color]);

/** The stylesheet marks a battle's (or the setup's) two sides with `--side0` and `--side1`. */
export function applySideColors(root: HTMLElement, colors: readonly [PlayerColor, PlayerColor]): void {
  root.style.setProperty("--side0", COLOR_HEX[colors[0]]);
  root.style.setProperty("--side1", COLOR_HEX[colors[1]]);
}

/** The two colors of a battle: the attacker's (side 0) and the defender's, neutrals taking a free color. */
export function battleColors(world: World, players: readonly [PlayerId, PlayerId | null]): [PlayerColor, PlayerColor] {
  const attacker = playerOf(world, players[0]).color;
  return [attacker, players[1] === null ? fallbackColor(attacker) : playerOf(world, players[1]).color];
}

/** Default colors for the two sides of a battle or the skirmish setup. */
export function colorPair(factions: readonly [Playable, Playable]): [PlayerColor, PlayerColor] {
  const [a = "red", b = "blue"] = defaultColors(factions);
  return [a, b];
}
