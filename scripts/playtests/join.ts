import { neighbors, sameHex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { cityAt, lairAt, leaderAt } from "#rules/world/state";
import { act, startGame } from "#scripts/mcp/session";
import type { Reply } from "#scripts/mcp/session";
import type { Table } from "#scripts/mcp/table";
import { decider, isSharedTable } from "#view/shared-table";
import type { Playtest } from "#scripts/playtests/harness";

/** The numbered option whose text has `needle`, from a reply's listing. */
function option(reply: Reply, needle: string): number {
  const lines = reply.text.split("OPTIONS")[1]?.split("\n").filter((l) => /^\d+\. /.test(l)) ?? [];
  return lines.findIndex((l) => l.includes(needle)) + 1;
}

/**
 * A game of the MCP player's with a human seat, the MCP player's warband set down beside the human's, and the MCP
 * player's attack on it: the browser joins in the middle of that battle.
 */
function opening(): Table {
  const start = startGame({ seed: 3, faction: "nexus", human: "jilliath", battles: "play" }, 0);
  const table = start.table;
  if (!table) throw new Error("no game");
  const world = table.world;
  const theirs = world.leaders.find((l) => l.player === 1);
  const ours = world.leaders.find((l) => l.player === 0);
  const beside = theirs && neighbors(theirs.hex).find((h) => stepCost(world.map, h) !== null && !leaderAt(world, h) && !cityAt(world, h) && !lairAt(world, h) && !world.structures.some((s) => sameHex(s.hex, h)));
  if (!theirs || !ours || !beside) throw new Error("no place beside the human's warband");
  const placed: Table = { ...table, world: { ...world, leaders: world.leaders.map((l) => (l.id === ours.id ? { ...l, hex: beside } : l)) } };
  const listed: Reply = { table: placed, text: act(placed, 1, -1).text };
  const attack = option(listed, "attacks player 1's warband");
  if (attack === 0) throw new Error(`no attack on the human's warband listed:\n${listed.text}`);
  const attacked = act(placed, attack, placed.revision).table;
  if (!attacked?.world.engagement) throw new Error("the attack didn't start a battle");
  return attacked;
}

/** The MCP player's turn, as a cheap one would play it: the first battle order, and on the map, the end of its turn. */
function mcpMoves(start: Table): Table {
  let table = start;
  for (let i = 0; i < 200 && decider(table) === "seat"; i++) {
    const shown = act(table, 1, -1).text;
    const reply: Reply = { table, text: shown };
    const pick = table.world.engagement ? 1 : option(reply, "End your turn");
    const next = act(table, pick, table.revision).table;
    if (!next || next === table) break;
    table = next;
  }
  return table;
}

const join: Playtest = {
  name: "join",
  about: "?join plays the human seat of an MCP game: a battle against the MCP player, order by order, then turns back and forth",
  async run(t) {
    let table = mcpMoves(opening());
    let writes = 0;
    await t.page.route("**/mcp/table", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        const posted: unknown = JSON.parse(request.postData() ?? "null");
        if (isSharedTable(posted) && posted.revision > table.revision) {
          table = mcpMoves(posted);
          writes += 1;
        }
        await route.fulfill({ body: "ok" });
        return;
      }
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(table) });
    });
    await t.open("/?join");
    await t.page.waitForFunction(() => document.getElementById("auto")?.checkVisibility() ?? false, null, { timeout: 20000 });
    await t.shot("join-battle");
    // Our side's orders go to the battle AI here; each goes to the table, and the MCP player answers its own turns.
    await t.page.click("#auto");
    await t.page.waitForSelector("#banner button", { state: "visible", timeout: 120000 });
    const moves = table.moves;
    const sides = new Set(moves.map((m) => m.side));
    t.log(`battle moves on the table: ${moves.length}, from sides ${[...sides].join(" and ")}`);
    if (sides.size < 2) t.fail("the battle's moves don't come from both players");
    await t.page.click("#banner button");
    await t.page.waitForFunction(() => !document.getElementById("maphud")?.hidden, null, { timeout: 30000 });
    await t.page.waitForFunction(() => window.discDebug.awaiting() === "map", null, { timeout: 60000 });
    if (table.world.engagement) t.fail("the battle was never written back to the table");
    const turn = table.world.turn;
    await t.page.click("#endturn");
    await t.page.waitForFunction((before) => window.discDebug.awaiting() === "map" && Number(document.getElementById("mapturn")?.dataset["turn"]) > before, turn, { timeout: 60000 });
    await t.shot("join-next-turn");
    t.log(`writes from the browser: ${writes}; now turn ${table.world.turn}, revision ${table.revision}`);
  },
};

export default join;
