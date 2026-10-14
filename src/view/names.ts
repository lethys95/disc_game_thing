import { UNITS } from "#rules/units/index";
import type { City, Leader, Tribe } from "#rules/world/state";

/** What the interface calls things. Pure, so headless tools (the MCP player) name things as the screens do. */

export const unitName = (defId: string) => UNITS[defId]?.name ?? defId;

/** Placeholder city names until the user names them. */
export const cityName = (city: City): string => (city.kind === "capitol" ? "Capitol" : `City ${city.id.replace("city", "")}`);

/** The tribes' names are placeholders until the user names them (`faction-stuff/neutrals/`). */
export const TRIBE_NAMES: Readonly<Record<Tribe, string>> = {
  bandits: "Bandits", gnolls: "Gnolls", drawn: "The Drawn", carnival: "The carnival",
  wild: "The Wild", tusk: "The Tuskclans", scaled: "The Scaled", herd: "The Herd", clans: "The barbarian clans",
};

export function leaderName(leader: Leader): string {
  const figure = leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col) ?? leader.squad[0];
  return figure ? unitName(figure.defId) : "Leader";
}
