import * as THREE from "three";
import type { PlayerColor } from "#rules/world/colors";

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

/** The stylesheet marks sides with `--side0` and `--side1`. */
export function applySideColors(root: HTMLElement, colors: readonly [PlayerColor, PlayerColor]): void {
  root.style.setProperty("--side0", COLOR_HEX[colors[0]]);
  root.style.setProperty("--side1", COLOR_HEX[colors[1]]);
}
