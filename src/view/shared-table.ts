import type { Action, Side } from "#rules/battle/types";
import type { PlayerId, World } from "#rules/world/state";

/**
 * A game outside players share: an MCP player on `seat` (`scripts/mcp/`) and, when one joins, a player in the browser
 * on `guest` (`?join`); the map AI plays every other seat. It is one file on disk: whoever's decision it is acts and
 * writes it, the other picks it up (the dev server serves it to the browser, `scripts/mcp/vite-plugin.ts`). Pure: no
 * DOM, so the MCP server uses it too.
 */
export interface SharedTable {
  readonly seed: number;
  readonly seat: PlayerId;
  readonly guest: PlayerId | null;
  /** `play`: the MCP player gives its own battle orders; `auto`: the battle AI gives them for it. */
  readonly battles: "play" | "auto";
  readonly world: World;
  /** Raised by every write: a reader takes a table only when it is newer than the one it has. */
  readonly revision: number;
  /** The orders given so far in a battle between the seat and the guest: each replays the other's to see them. */
  readonly moves: readonly BattleMove[];
}

export type BattleMove = { readonly kind: "act"; readonly side: Side; readonly action: Action } | { readonly kind: "tarot"; readonly side: Side; readonly hand: number; readonly card: number };

/** Who must act next: an outside player, the map or battle AI (run by whoever handed it the turn), or nobody. */
export type Decider = "seat" | "guest" | "ai" | "none";

export function decider(table: SharedTable): Decider {
  const world = table.world;
  if (world.outcome) return "none";
  const who = (player: PlayerId | null): Decider => (player === table.seat ? "seat" : player !== null && player === table.guest ? "guest" : "ai");
  const engagement = world.engagement;
  if (!engagement) return who(world.activePlayer);
  const sides = [who(engagement.players[0]), who(engagement.players[1])] as const;
  const outsider = sides.find((d) => d !== "ai") ?? "ai";
  const battle = engagement.battle;
  // A finished battle is written back by the player whose map turn it is; on an AI's turn, by the outside player in it.
  if (battle.outcome) {
    const mover = who(world.activePlayer);
    return mover === "ai" ? outsider : mover;
  }
  const guestSide = sides.indexOf("guest");
  if (guestSide >= 0 && battle.tarot.some((h) => h.side === guestSide && h.chosen === null)) return "guest";
  const acting = battle.current ? battle.units[battle.current.unitId]?.side : undefined;
  const actor = acting === undefined ? "ai" : sides[acting];
  return actor === "ai" || actor === undefined ? outsider : actor;
}

/** The side each outside player fights on in the current engagement, or null. */
export function sideOf(table: SharedTable, player: PlayerId | null): Side | null {
  const engagement = table.world.engagement;
  if (!engagement || player === null) return null;
  if (engagement.players[0] === player) return 0;
  return engagement.players[1] === player ? 1 : null;
}

/** The table with a changed world: a battle that starts here starts with no moves. Writers raise the revision. */
export function withWorld(table: SharedTable, world: World): SharedTable {
  const started = table.world.engagement === null && world.engagement !== null;
  return { ...table, world, moves: started ? [] : table.moves };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Only the game's own tools write tables: the header is checked, the world trusted. */
export function isSharedTable(value: unknown): value is SharedTable {
  return (
    isRecord(value) &&
    typeof value["seed"] === "number" &&
    typeof value["seat"] === "number" &&
    (value["guest"] === null || typeof value["guest"] === "number") &&
    typeof value["revision"] === "number" &&
    Array.isArray(value["moves"]) &&
    isRecord(value["world"])
  );
}
