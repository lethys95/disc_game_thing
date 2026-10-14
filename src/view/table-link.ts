import type { Action, Battle, Side } from "#rules/battle/types";
import type { World } from "#rules/world/state";
import { isSharedTable, withWorld } from "#view/shared-table";
import type { BattleMove, SharedTable } from "#view/shared-table";

/** How often the shared table is read for the other player's moves. */
const POLL_MS = 1000;

/**
 * The other side of a battle, fought by a player elsewhere (the MCP player): its orders arrive here, the player's go
 * out. The battle screen plays them like the AI's.
 */
export interface RemoteSide {
  /** The other side's next order, once it has been given. */
  next(): Promise<Action>;
  /** An order of the player's (or a tarot pick), with the battle after it. */
  sent(move: BattleMove, battle: Battle): void;
}

/**
 * The browser player's end of a game shared with the MCP player (`?join`, `view/shared-table.ts`): it reads the table
 * as the other player changes it and writes it after every change made here. Writes go out one at a time, in order.
 */
export class TableLink implements RemoteSide {
  private table: SharedTable;
  /** Battle moves of the current fight already played here (both sides'). */
  private played = 0;
  private side: Side = 0;
  private waiting: ((action: Action) => void) | null = null;
  private writing: Promise<void> = Promise.resolve();
  private running = false;

  constructor(
    table: SharedTable,
    private readonly url: string,
    /** A newer table, written by the other player. */
    private readonly onNewer: (table: SharedTable) => void,
  ) {
    this.table = table;
  }

  get current(): SharedTable {
    return this.table;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.poll();
  }

  stop(): void {
    this.running = false;
    this.waiting = null;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      await new Promise((done) => setTimeout(done, POLL_MS));
      const newer = await this.read();
      if (!this.running || !newer || newer.revision <= this.table.revision) continue;
      this.table = newer;
      this.deliver();
      this.onNewer(newer);
    }
  }

  private async read(): Promise<SharedTable | null> {
    const response = await fetch(this.url, { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return null;
    const parsed: unknown = await response.json().catch(() => null);
    return isSharedTable(parsed) ? parsed : null;
  }

  private write(): void {
    const body = JSON.stringify(this.table);
    this.writing = this.writing.then(async () => {
      await fetch(this.url, { method: "POST", body, headers: { "content-type": "application/json" } }).catch(() => null);
    });
  }

  /** The world changed here: the next revision goes out. */
  publish(world: World): void {
    this.table = { ...withWorld(this.table, world), revision: this.table.revision + 1 };
    this.write();
  }

  /** A fight against the MCP player opens here, on `side`: its moves from now on are the ones still to play. */
  fighting(side: Side): void {
    this.side = side;
    this.played = this.table.moves.length;
  }

  sent(move: BattleMove, battle: Battle): void {
    const world = this.table.world;
    const engagement = world.engagement;
    if (!engagement) return;
    this.table = { ...this.table, world: { ...world, engagement: { ...engagement, battle } }, moves: [...this.table.moves, move], revision: this.table.revision + 1 };
    this.played = this.table.moves.length;
    this.write();
  }

  next(): Promise<Action> {
    return new Promise((resolve) => {
      this.waiting = resolve;
      this.deliver();
    });
  }

  /** Hands the next unplayed move of the other side to whoever waits for it. */
  private deliver(): void {
    const waiting = this.waiting;
    if (!waiting) return;
    for (; this.played < this.table.moves.length; this.played++) {
      const move = this.table.moves[this.played];
      if (move?.kind === "act" && move.side !== this.side) {
        this.played += 1;
        this.waiting = null;
        waiting(move.action);
        return;
      }
    }
  }
}
