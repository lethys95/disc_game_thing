import { toSave, writeSave } from "#rules/save";
import { act, startGame } from "#scripts/mcp/session";
import type { Playtest } from "#scripts/playtests/harness";

/** Two saves of an MCP game a turn apart, served one after the other where `?watch` looks. */
function saves(): [string, string] {
  const first = startGame({ seed: 3, faction: "jilliath", opponents: ["nexus"], battles: "auto" }, 0);
  if (!first.table) throw new Error("no game");
  const end = /(\d+)\. End your turn/.exec(first.text)?.[1];
  const second = act(first.table, Number(end), first.table.revision);
  if (!second.table) throw new Error("no second turn");
  const at = new Date(0);
  return [writeSave(toSave(first.table.world, 3, at)), writeSave(toSave(second.table.world, 3, new Date(1000)))];
}

const watch: Playtest = {
  name: "watch",
  about: "?watch follows an outside player's game as its saves change, and takes no orders",
  async run(t) {
    const [before, after] = saves();
    let served = before;
    await t.page.route("**/watched.json", (route) => route.fulfill({ contentType: "application/json", body: served }));
    await t.open("/?watch=/watched.json");
    const hint = () => t.page.textContent("#maphint");
    await t.page.waitForFunction(() => document.getElementById("maphint")?.textContent?.includes("turn 1"), null, { timeout: 15000 });
    if (!(await t.page.isDisabled("#endturn"))) t.fail("the watched game's End turn button is enabled");
    await t.shot("watch-turn-1");
    served = after;
    await t.page.waitForFunction(() => document.getElementById("maphint")?.textContent?.includes("turn 2"), null, { timeout: 15000 });
    t.log(`hint: ${await hint()}`);
    if ((await t.awaitingNow()) !== null) t.fail("the watched game waits for orders");
  },
};

export default watch;
