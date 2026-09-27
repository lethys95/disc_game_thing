import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";

/**
 * Many whole AI games at once, one process per game across the CPU cores, for quick balance signals:
 * `pnpm sim:many [--seeds 1-16] [--jobs N] "uncommitted,nexus" "backline,nexus:overload" …`
 * Each quoted matchup is a PLAYERS list for `sim-world.ts`; every seed is played for every matchup.
 */

interface Game {
  readonly matchup: string;
  readonly seed: number;
}

interface Result extends Game {
  readonly winner: number | null;
  readonly turn: number;
  readonly battles: number;
  readonly failed: string | null;
}

function parseSeeds(text: string): number[] {
  const [from, to] = text.split("-").map(Number);
  if (from === undefined || Number.isNaN(from)) throw new Error(`bad seeds: ${text}`);
  return Array.from({ length: (to ?? from) - from + 1 }, (_, i) => from + i);
}

const args = process.argv.slice(2);
let seeds = parseSeeds("1-8");
let jobs = Math.max(1, availableParallelism() - 4);
const matchups: string[] = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i] ?? "";
  if (arg === "--seeds") seeds = parseSeeds(args[++i] ?? "");
  else if (arg === "--jobs") jobs = Number(args[++i]);
  else if (arg !== "--") matchups.push(arg);
}
if (matchups.length === 0) matchups.push("uncommitted,uncommitted");

function play(game: Game): Promise<Result> {
  return new Promise((resolve) => {
    // The bundled sim (`pnpm sim:many` builds it first).
    const child = spawn(process.execPath, [".sim/sim-world.mjs", String(game.seed)], { env: { ...process.env, PLAYERS: game.matchup }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => (out += d.toString()));
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("close", () => {
      const line = /^RESULT (.*)$/m.exec(out)?.[1];
      if (!line) {
        resolve({ ...game, winner: null, turn: 0, battles: 0, failed: err.trim().split("\n").slice(-1)[0] ?? "no result" });
        return;
      }
      const result: { winner: number | null; turn: number; battles: number } = JSON.parse(line);
      resolve({ ...game, ...result, failed: null });
    });
  });
}

const queue: Game[] = matchups.flatMap((matchup) => seeds.map((seed) => ({ matchup, seed })));
const results: Result[] = [];
const started = Date.now();
async function worker(): Promise<void> {
  for (let game = queue.shift(); game; game = queue.shift()) results.push(await play(game));
}
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, () => worker()));

const median = (xs: readonly number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted.length === 0 ? 0 : (sorted[Math.floor((sorted.length - 1) / 2)] ?? 0);
};
const lines = matchups.map((matchup) => {
  const games = results.filter((r) => r.matchup === matchup);
  const players = matchup.split(",");
  const wins = players.map((spec, id) => `${spec} ${games.filter((g) => g.winner === id).length}`).join(" · ");
  const cold = games.filter((g) => g.winner === null && !g.failed).length;
  const failed = games.filter((g) => g.failed);
  const ended = games.filter((g) => g.winner !== null);
  const note = failed.length > 0 ? ` · ${failed.length} FAILED (${failed[0]?.failed})` : "";
  return `${matchup.padEnd(32)} ${wins} · cold wars ${cold} · median turn ${median(ended.map((g) => g.turn))}, battles ${median(ended.map((g) => g.battles))}${note}`;
});
console.log(`${lines.join("\n")}\n${results.length} games, seeds ${seeds[0]}–${seeds[seeds.length - 1]}, ${jobs} at a time, ${Math.round((Date.now() - started) / 1000)} s`);
