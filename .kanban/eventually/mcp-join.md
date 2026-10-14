# Join the MCP game from the browser

- **What:** the user plays a seat in the game an outside AI plays over MCP (`testing/mcp-player`): one live game the browser and the MCP server share. A sketch: the server also listens on a local port; a `?join` route plays the browser's seat (its orders and battles as now, the world sent back after each), the server stops at that seat's turn, and the AI gets a `wait` tool. Open: who fights a battle between the two outside players (each their own side, turn by turn, or the battle AI for the MCP side).
- **Why:** The user (2026-09-26) wants to play in that game too.
- **Done when:** The user and an MCP player play one game together, each on their own seat.
- **Who:** Claude.
