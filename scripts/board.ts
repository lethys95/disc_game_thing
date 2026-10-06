import { readdir, readFile, writeFile } from "node:fs/promises";

/**
 * The board (`.kanban/`) as a page, `shots/board.html`, served over Tailscale like the other pages (`pnpm board`).
 * The files are the truth; this only shows them side by side.
 */

const COLUMNS = [
  ["in-progress", "In progress"],
  ["todo", "To do"],
  ["testing", "Waiting for you to look"],
  ["maybe", "Maybe"],
  ["eventually", "Eventually"],
  ["ongoing", "Ongoing"],
  ["done", "Done"],
] as const;

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bold, italics and `code` only: the stories are short and plain. */
const inline = (text: string) =>
  escape(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");

async function story(path: string): Promise<string> {
  const lines = (await readFile(path, "utf8")).split("\n").filter((l) => l.trim() !== "");
  const title = lines[0]?.replace(/^#\s*/, "") ?? path;
  const body = lines.slice(1).map((l) => `<p>${inline(l.replace(/^-\s*/, ""))}</p>`).join("");
  return `<details class="story"><summary>${inline(title)}</summary>${body}</details>`;
}

const intro = (await readFile(".kanban/README.md", "utf8")).split("\n\n")[1] ?? "";
const columns: string[] = [];
for (const [dir, name] of COLUMNS) {
  const files = (await readdir(`.kanban/${dir}`)).filter((f) => f.endsWith(".md")).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const stories = await Promise.all(files.map((f) => story(`.kanban/${dir}/${f}`)));
  columns.push(`<section><h2>${name} <span>${files.length}</span></h2>${stories.join("") || '<p class="empty">nothing</p>'}</section>`);
}
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>disc board</title>
<style>
:root { color-scheme: dark; }
body { margin: 0; padding: 16px; background: #111012; color: #e0dcd6; font: 14px/1.45 system-ui, sans-serif; }
h1 { font-size: 22px; margin: 0 0 6px; }
.intro { color: #b5ada4; max-width: 900px; margin: 0 0 16px; }
.board { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 12px; align-items: start; }
section { background: #1a1719; border: 1px solid #2c2622; border-radius: 6px; padding: 10px; }
h2 { font-size: 15px; margin: 0 0 8px; color: #d9b36a; }
h2 span { color: #8d8373; font-weight: 400; }
.story { border-top: 1px solid #2c2622; padding: 6px 0; }
.story summary { cursor: pointer; font-weight: 600; }
.story p { color: #b5ada4; margin: 4px 0 0 12px; font-size: 13px; }
code { font-size: 12px; color: #d9cfbd; }
.empty { color: #6b625a; }
</style>
<h1>The board</h1><p class="intro">${inline(intro)}</p><div class="board">${columns.join("")}</div>`;
await writeFile("shots/board.html", html);
console.log("shots/board.html");
