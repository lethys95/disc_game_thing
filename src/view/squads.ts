import type { Placement } from "#rules/battle";
import type { Col, Row } from "#rules/types";

const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

/** A starting squad made only of canon units. Squad composition itself is not canon. */
export const DEFAULT_SQUAD: readonly Placement[] = [
  at("zealot", 0, 0),
  at("templar", 0, 1),
  at("paladin", 0, 2),
  at("congregant", 1, 0),
  at("punisher", 1, 1),
  at("congregant", 1, 2),
];
