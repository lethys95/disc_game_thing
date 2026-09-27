import type { Page } from "playwright";

/**
 * What a playtest gets: a fresh page (its own storage), and helpers that wait on the game's state instead of on
 * time. The runner (`scripts/playtest.ts`) serves the game once and runs every playtest against it.
 */
export interface Harness {
  readonly page: Page;
  /** Loads a route (debug hooks on) and waits until the game is ready. */
  open(route: string): Promise<void>;
  /** Records a failure; the playtest carries on, the run fails at the end. */
  fail(message: string): void;
  log(message: string): void;
  shot(name: string): Promise<void>;
  /** Waits until the view waits for the player: in a battle, on the map, or either. */
  awaiting(what: "battle" | "map" | "any", timeout?: number): Promise<"battle" | "map">;
  /** What waits for the player right now, if anything. */
  awaitingNow(): Promise<"battle" | "map" | null>;
  /** Two animation frames: long enough for a hover to redraw. */
  frames(): Promise<void>;
  /** The battle log's entries. */
  battleLog(): Promise<string[]>;
  hexScreen(hex: Hex): Promise<Point>;
  tileScreen(side: 0 | 1, row: 0 | 1 | 2, col: 0 | 1 | 2): Promise<Point>;
  leaderHex(player: number): Promise<Hex | null>;
  capitolHex(player: number): Promise<Hex | null>;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Hex {
  readonly q: number;
  readonly r: number;
}

export interface Playtest {
  readonly name: string;
  /** One line: what it does by hand. */
  readonly about: string;
  run(t: Harness): Promise<void>;
}

/** The page's debug hooks (`src/main.ts`, `?debug`). */
interface Debug {
  tileScreen(side: 0 | 1, row: 0 | 1 | 2, col: 0 | 1 | 2): Point;
  hexScreen(q: number, r: number): Point;
  leaderHex(player: number): Hex | null;
  capitolHex(player: number): Hex | null;
  log(): string[];
  awaiting(): "battle" | "map" | null;
}

declare global {
  interface Window {
    readonly discDebug: Debug;
  }
}

export function harness(page: Page, base: string, failures: string[], name: string): Harness {
  const awaitingNow = () => page.evaluate(() => window.discDebug.awaiting());
  return {
    page,
    async open(route) {
      const url = new URL(route, base);
      url.searchParams.set("debug", "");
      await page.goto(url.href);
      await page.waitForSelector("body[data-ready=true]");
    },
    fail: (message) => failures.push(`${name}: ${message}`),
    log: (message) => console.log(`  ${message}`),
    shot: async (file) => {
      await page.screenshot({ path: `shots/${file}.png` });
    },
    async awaiting(what, timeout = 30000) {
      const handle = await page.waitForFunction((w) => {
        const now = window.discDebug.awaiting();
        return now !== null && (w === "any" || now === w) ? now : null;
      }, what, { timeout });
      const found = await handle.jsonValue();
      if (found === null) throw new Error("awaiting resolved without a state");
      return found;
    },
    awaitingNow,
    frames: () => page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())))),
    battleLog: () => page.evaluate(() => window.discDebug.log()),
    hexScreen: (hex) => page.evaluate((h) => window.discDebug.hexScreen(h.q, h.r), hex),
    tileScreen: (side, row, col) => page.evaluate((a) => window.discDebug.tileScreen(a.side, a.row, a.col), { side, row, col }),
    leaderHex: (player) => page.evaluate((p) => window.discDebug.leaderHex(p), player),
    capitolHex: (player) => page.evaluate((p) => window.discDebug.capitolHex(p), player),
  };
}
