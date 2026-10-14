import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { isSharedTable } from "#view/shared-table";

/**
 * The shared table (`view/shared-table.ts`) on the dev server, for the browser player (`?join`): GET reads it, POST
 * writes it. A write older than the table on disk is refused, so a slow browser can't undo the MCP player's move.
 */
export function sharedTable(file: string): Plugin {
  const path = resolve(file);
  const revisionOnDisk = (): number => {
    try {
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      return isSharedTable(parsed) ? parsed.revision : -1;
    } catch {
      return -1;
    }
  };
  return {
    name: "disc-shared-table",
    configureServer(server) {
      server.middlewares.use("/mcp/table", (request, response) => {
        if (request.method === "GET") {
          let text: string;
          try {
            text = readFileSync(path, "utf8");
          } catch {
            response.statusCode = 404;
            response.end("no game");
            return;
          }
          response.setHeader("content-type", "application/json");
          response.setHeader("cache-control", "no-store");
          response.end(text);
          return;
        }
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = null;
          }
          if (!isSharedTable(parsed)) {
            response.statusCode = 400;
            response.end("not a table");
            return;
          }
          if (parsed.revision <= revisionOnDisk()) {
            response.statusCode = 409;
            response.end("stale");
            return;
          }
          mkdirSync(dirname(path), { recursive: true });
          const temporary = `${path}.vite.tmp`;
          writeFileSync(temporary, text);
          renameSync(temporary, path);
          response.end("ok");
        });
      });
    },
  };
}
