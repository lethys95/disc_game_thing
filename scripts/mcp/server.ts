import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { WorldAction } from "#rules/world/state";
import { act, describe, look, raw, startGame, loadTable, storeTable } from "#scripts/mcp/session";
import type { Reply } from "#scripts/mcp/session";
import { RULES_PRIMER } from "#scripts/mcp/primer";

/**
 * disc for an outside player over MCP (stdio): one seat is the caller's, the map AI plays the others. The game is
 * kept on disk after every call (`DISC_TABLE`), and the map as a disc save (`DISC_WATCH`) for the browser to show.
 * Run from the repo root: `pnpm --silent mcp`.
 */

const TABLE = resolve(process.env["DISC_TABLE"] ?? ".cache/mcp/table.json");
const WATCH = resolve(process.env["DISC_WATCH"] ?? "shots/mcp/game.json");

const text = (body: string) => ({ content: [{ type: "text" as const, text: body }] });

function kept(result: Reply) {
  if (result.table) storeTable(TABLE, WATCH, result.table, new Date());
  return text(result.text);
}

function withTable(run: (table: NonNullable<ReturnType<typeof loadTable>>) => Reply) {
  const table = loadTable(TABLE);
  return table ? kept(run(table)) : text("No game is running. Start one with new_game.");
}

const server = new McpServer({ name: "disc", version: "1.0.0" }, { instructions: RULES_PRIMER });

server.registerTool(
  "new_game",
  {
    description: "Start a new game of disc (replacing any game in progress). You are player 0; the game's own AI plays the others. Returns the map, your forces and your numbered options.",
    inputSchema: {
      faction: z.enum(["jilliath", "nexus", "grove"]).optional().describe("Your faction (default jilliath)."),
      opponents: z.array(z.enum(["jilliath", "nexus", "grove"])).min(1).max(5).optional().describe("The AI players' factions (default one nexus)."),
      seed: z.number().int().optional().describe("Map seed: the same seed makes the same map."),
      size: z.enum(["small", "medium", "large", "huge"]).optional().describe("Map size (default by player count)."),
      battles: z.enum(["play", "auto"]).optional().describe("play: you give every battle order yourself (default); auto: the battle AI fights your battles."),
    },
  },
  (args) => kept(startGame(args, Date.now())),
);

server.registerTool(
  "look",
  {
    description: "The full picture: your warbands unit by unit, your cities, everything you know of the map (nearest first), a drawing of the hexes, and your numbered options.",
    inputSchema: {},
  },
  () => withTable(look),
);

server.registerTool(
  "act",
  {
    description: "Take one of the numbered options from the latest listing. Give its number and the listing's revision. Returns what happened (including the other players' turns after you end yours) and the new options.",
    inputSchema: {
      option: z.number().int().min(1).describe("The option's number."),
      revision: z.number().int().min(0).describe("The revision printed above the options."),
    },
  },
  ({ option, revision }) => withTable((table) => act(table, option, revision)),
);

server.registerTool(
  "order",
  {
    description:
      'A map order that is not in the listing, as the game\'s own action object. Mostly for marching to any hex: {"type":"move","leaderId":"leader0","to":{"q":1,"r":-2}}. Also {"type":"transfer","from":{"kind":"warband","leaderId":"leader0"},"fromTile":{"row":0,"col":1},"to":{"kind":"garrison","cityId":"capitol0"},"toTile":{"row":1,"col":1}} to rearrange squads (rows: 0 front, 1 middle, 2 back; cols 0-2), and {"type":"choose","fork":"<unit id>","to":"<unit id>"} to choose a branch early.',
    inputSchema: {
      action: z.record(z.string(), z.unknown()).describe("The action object."),
    },
  },
  ({ action }) =>
    withTable((table) => {
      // The rules check every order and say why one can't be given; a malformed one fails the same way.
      const order: WorldAction = JSON.parse(JSON.stringify(action));
      return raw(table, order);
    }),
);

server.registerTool(
  "describe",
  {
    description: "Rules text for a unit, ability, effect, item, spell, node, research or leader skill, by its name as the game writes it.",
    inputSchema: { name: z.string().describe('For example "Congregant", "Bleed", "Healing potion".') },
  },
  ({ name }) => text(describe(name)),
);

await server.connect(new StdioServerTransport());
