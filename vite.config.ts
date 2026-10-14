import { defineConfig } from "vite";
import { sharedTable } from "./scripts/mcp/vite-plugin";

// The MCP player's game, for a player who joins it from the browser (`?join`).
export default defineConfig({ plugins: [sharedTable(process.env["DISC_TABLE"] ?? ".cache/mcp/table.json")] });
