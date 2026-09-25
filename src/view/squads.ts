import type { Placement } from "#rules/battle";
import type { Doctrine } from "#rules/doctrine";
import type { Col, Row } from "#rules/types";

const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

/** Starting formations per doctrine, made only of canon units. The formations themselves are not canon. */
export const PRESETS: Readonly<Record<Doctrine, readonly Placement[]>> = {
  preserve: [
    at("paladin", 0, 0), at("templar", 0, 1), at("paladin", 0, 2),
    at("congregant", 1, 0), at("congregant", 1, 1), at("congregant", 1, 2),
  ],
  punishment: [
    at("zealot", 0, 0), at("punisher", 0, 1), at("zealot", 0, 2),
    at("congregant", 1, 0), at("torturer", 1, 1), at("congregant", 1, 2),
  ],
  sacrifice: [
    at("zealot", 0, 0), at("fanatic", 0, 1), at("zealot", 0, 2),
    at("congregant", 1, 0), at("chosen", 1, 1), at("congregant", 1, 2),
  ],
};
