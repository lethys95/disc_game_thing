import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * Where a picker page in `shots/` sends the user's answers from a phone (no clipboard over plain http): a POST to
 * `/picks/<name>` stores its body as `<folder>/<name>.txt`, which the next session reads.
 */
export function picksSink(folder: string): Plugin {
  const root = resolve(folder);
  return {
    name: "disc-picks-sink",
    configureServer(server) {
      server.middlewares.use("/picks", (request, response) => {
        const name = (request.url ?? "").replace(/^\//, "");
        if (request.method !== "POST" || !/^[a-z0-9-]{1,64}$/.test(name)) {
          response.statusCode = 400;
          response.end();
          return;
        }
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => {
          mkdirSync(root, { recursive: true });
          writeFileSync(resolve(root, `${name}.txt`), Buffer.concat(chunks).toString("utf8"));
          response.end("ok");
        });
      });
    },
  };
}
