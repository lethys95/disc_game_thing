import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { applyWorldAction } from "#rules/world/actions";
import { mapOptions } from "#scripts/mcp/map-options";
import { act, describe as rulesText, look, startGame } from "#scripts/mcp/session";
import type { Reply } from "#scripts/mcp/session";
import type { Table } from "#scripts/mcp/table";
import { decider } from "#view/shared-table";

/** The outside player's tools (`scripts/mcp/`): what they list is what the rules take, and a game plays through. */

const REFUSED = /That can't be done|There is no option|Those options were for revision/;

const options = (text: string): string[] => text.split("OPTIONS")[1]?.split("\n").filter((line) => /^\d+\. /.test(line)) ?? [];

const revisionOf = (text: string): number => Number(/revision (\d+)/.exec(text)?.[1] ?? -1);

/** A plain policy: battles by the first listed order, and on the map the first winning attack, else recruits, else scouting, else the end of the turn. */
function pick(text: string): number {
  const listed = options(text);
  const index = (test: (line: string) => boolean) => listed.findIndex(test) + 1;
  if (text.includes("BATTLE:")) return 1;
  return index((l) => l.includes("Forecast: WIN")) || index((l) => l.includes("Recruit")) || index((l) => l.includes("scouts toward")) || index((l) => l.includes("End your turn"));
}

/** Plays the seat by `pick` until the turn passes `turns`; the replies' texts go to `seen`. */
function playTurns(start: Reply, turns: number, seen: string[] = []): Reply {
  let current = start;
  for (let i = 0; i < 400 && current.table && current.table.world.turn <= turns && !current.text.includes("GAME OVER"); i++) {
    const table: Table = current.table;
    const next = act(table, pick(current.text), revisionOf(current.text));
    expect(next.text).not.toMatch(REFUSED);
    seen.push(next.text);
    current = next;
  }
  return current;
}

describe("the MCP player", () => {
  test("every listed map order is one the rules take", () => {
    let reply = startGame({ seed: 5, faction: "jilliath", opponents: ["nexus"] }, 0);
    for (let turn = 0; turn < 4 && reply.table; turn++) {
      const table = reply.table;
      if (!reply.text.includes("BATTLE:")) {
        for (const option of mapOptions(table.world, table.seat)) expect(() => applyWorldAction(table.world, option.action), option.text).not.toThrow();
      }
      const before = table.world.turn;
      reply = playTurns(reply, before);
    }
  });

  test("a game plays through its battles and the AI's turns", { timeout: 60000 }, () => {
    const seen: string[] = [];
    const end = playTurns(startGame({ seed: 2, faction: "grove", opponents: ["jilliath", "nexus"] }, 0), 8, seen);
    expect(end.table?.world.turn ?? 0).toBeGreaterThan(8);
    expect(seen.filter((t) => t.includes("BATTLE:")).length).toBeGreaterThan(5);
    expect(seen.some((t) => /VICTORY|DEFEAT/.test(t))).toBe(true);
  });

  test("auto battles leave the seat only map decisions", { timeout: 60000 }, () => {
    const end = playTurns(startGame({ seed: 4, faction: "nexus", opponents: ["grove"], battles: "auto" }, 0), 6);
    expect(end.text).not.toContain("BATTLE:");
  });

  test("with a human seat, the MCP player stops at the human's move and waits", () => {
    const start = startGame({ seed: 6, faction: "jilliath", human: "nexus" }, 0);
    const table = start.table;
    if (!table) throw new Error("no game");
    const end = Number(/(\d+)\. End your turn/.exec(start.text)?.[1]);
    const after = act(table, end, table.revision);
    expect(after.table?.world.activePlayer).toBe(1);
    expect(after.text).toContain("WAITING");
    expect(decider(after.table ?? table)).toBe("guest");
    if (!after.table) throw new Error("no game");
    expect(act(after.table, 1, after.table.revision).text).toContain("WAITING");
  });

  test("a stale revision is refused", () => {
    const reply = startGame({ seed: 1 }, 0);
    if (!reply.table) throw new Error("no game");
    expect(act(reply.table, 1, 99).text).toContain("Those options were for revision 99");
  });

  test("look and describe answer in words", () => {
    const reply = startGame({ seed: 1 }, 0);
    if (!reply.table) throw new Error("no game");
    expect(look(reply.table).text).toContain("YOUR WARBANDS");
    expect(rulesText("Congregant")).toContain("Unit Congregant");
    expect(rulesText("nothing by this name")).toContain("Nothing called");
  });

  test("the view code it borrows stays headless", () => {
    const headless = ["src/view/names.ts", "src/view/map-text.ts", "src/view/secrecy.ts", "src/view/shared-table.ts"];
    const outside = headless.flatMap((path) =>
      [...readFileSync(path, "utf8").matchAll(/from "([^"]+)"/g)].flatMap((m) => (m[1] && !m[1].startsWith("#rules/") && m[1] !== "#view/names" ? [`${path}: ${m[1]}`] : [])),
    );
    expect(outside).toEqual([]);
  });
});
