import { resolve } from "node:path";
import { act, describe, look, raw, startGame, loadTable, storeTable, wait, WAIT_LIMIT_MS } from "#scripts/mcp/session";
import type { NewGame, Reply } from "#scripts/mcp/session";
import type { WorldAction } from "#rules/world/state";
import { RULES_PRIMER } from "#scripts/mcp/primer";

/**
 * The MCP player's tools on the command line, one call per run, the table kept on disk between runs:
 *   pnpm play new '{"faction":"jilliath","opponents":["nexus"],"seed":7,"battles":"play"}'
 *   pnpm play look | pnpm play act <option> <revision> | pnpm play order '<WorldAction JSON>' | pnpm play describe <name>
 *   pnpm play rules (what the MCP server sends a player as its instructions); pnpm play wait (the browser player's move)
 */

const TABLE = resolve(process.env["DISC_TABLE"] ?? ".cache/mcp/table.json");
const WATCH = resolve(process.env["DISC_WATCH"] ?? "shots/mcp/game.json");

async function run(args: readonly string[]): Promise<Reply | string> {
  const [command, ...rest] = args;
  if (command === "rules") return RULES_PRIMER;
  if (command === "describe") return describe(rest.join(" "));
  if (command === "new") {
    const parsed: unknown = JSON.parse(rest[0] ?? "{}");
    const setup: NewGame = typeof parsed === "object" && parsed !== null ? parsed : {};
    return startGame(setup, Date.now());
  }
  const table = loadTable(TABLE);
  if (!table) return "No game yet: start one with `pnpm play new`.";
  if (command === "look") return look(table);
  if (command === "wait") return wait(() => loadTable(TABLE), WAIT_LIMIT_MS);
  if (command === "act") return act(table, Number(rest[0]), Number(rest[1]));
  if (command === "order") {
    const action: WorldAction = JSON.parse(rest[0] ?? "{}");
    return raw(table, action);
  }
  return "Commands: rules, new, look, wait, act <option> <revision>, order <json>, describe <name>.";
}

const args = process.argv.slice(2);
const before = args[0] === "new" ? null : loadTable(TABLE);
const result = await run(args);
if (typeof result === "string") console.log(result);
else {
  // Only a changed table is written back: during the browser player's move the file is theirs.
  if (result.table && result.table.revision !== before?.revision) storeTable(TABLE, WATCH, result.table, new Date());
  console.log(result.text);
}
