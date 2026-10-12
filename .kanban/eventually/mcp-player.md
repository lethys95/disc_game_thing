# An outside AI plays over MCP

- **What:** a local stdio MCP server in `scripts/mcp/` running a headless game (the rules are pure, like `sim:world`); the other seats are the map AI. Tools: new_game, look (a compact text view of `knownWorld`, so fog keeps it fair), options, act, end_turn, battle_state / battle_act (or autoplay). Writes a save after each turn to load in the browser and watch. The user wants to play in that game too (2026-09-26): the browser and the MCP server then share one live game (a small local server the browser connects to, e.g. a websocket), which is more than the headless version. The real work: a compact, readable state description; a list of what a player can do now on the map (the rules only answer "why not"). Dev tooling, kept out of `src/`.
- **Why:** The user (2026-09-26): "for shits and giggles"; not soon.
- **Done when:** An AI can play a whole game over MCP, and the user can join it from the browser.
- **Who:** Claude, when the user asks for it.
