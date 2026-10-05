import type { Tile } from "#rules/battle/types";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import type { Leader, SquadMember, SquadRef } from "#rules/world/state";
import { isLeaderOf, maxHpOf } from "#rules/world/record";
import { art } from "#view/art";
import { element } from "#view/dom";
import { memberCard, memberRow, unitName } from "#view/members";
import { showPeek } from "#view/peek";

/** One squad shown as its 3×3 grid (front row first). */
export interface GridSquad {
  readonly ref: SquadRef;
  readonly title: string;
  readonly squad: readonly SquadMember[];
  readonly leader: Leader | undefined;
  readonly capacity: number;
}

/** Something to do with an empty tile (recruit, resurrect) or with a unit (elevate). */
export interface GridChoice {
  readonly label: string;
  readonly problem: string | null;
  readonly run: () => void;
}

export interface GridOptions {
  readonly mayAct: boolean;
  /** Why a unit can't be moved there (null: it can); moving onto a unit swaps the two. */
  readonly moveProblem: (from: SquadRef, fromTile: Tile, to: SquadRef, toTile: Tile) => string | null;
  readonly move: (from: SquadRef, fromTile: Tile, to: SquadRef, toTile: Tile) => void;
  readonly emptyChoices: (ref: SquadRef, tile: Tile) => readonly GridChoice[];
  readonly unitChoices: (ref: SquadRef, member: SquadMember) => readonly GridChoice[];
  /** A unit selected in some grid (to show its details and actions), or null. */
  readonly selected: { readonly ref: SquadRef; readonly tile: Tile } | null;
  readonly select: (selection: { ref: SquadRef; tile: Tile } | null) => void;
}

const ROW_NAMES = ["Front", "Middle", "Back"] as const;
/** Laid out as the battle shows your side (user, 2026-09-27): the back row on the left, the front on the right. */
const DISPLAY_ROWS = [...ROWS].reverse();

/** Drag payloads carry the source squad and tile; kept as JSON in the drag's data. */
interface Dragged {
  readonly ref: SquadRef;
  readonly tile: Tile;
}

function readDragged(event: DragEvent): Dragged | null {
  const text = event.dataTransfer?.getData("application/x-disc-unit");
  if (!text) return null;
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || !("ref" in parsed) || !("tile" in parsed)) return null;
  const { ref, tile } = parsed;
  if (typeof ref !== "object" || ref === null || typeof tile !== "object" || tile === null) return null;
  if (!("kind" in ref) || !("row" in tile) || !("col" in tile)) return null;
  const row = tile.row;
  const col = tile.col;
  if ((row !== 0 && row !== 1 && row !== 2) || (col !== 0 && col !== 1 && col !== 2)) return null;
  if (ref.kind === "garrison" && "cityId" in ref && typeof ref.cityId === "string") return { ref: { kind: "garrison", cityId: ref.cityId }, tile: { row, col } };
  if (ref.kind === "warband" && "leaderId" in ref && typeof ref.leaderId === "string") return { ref: { kind: "warband", leaderId: ref.leaderId }, tile: { row, col } };
  return null;
}

/** A small menu under a tile: what can go there. Closes on any choice or click elsewhere. */
function openMenu(anchor: HTMLElement, choices: readonly GridChoice[]): void {
  document.querySelector(".grid-menu")?.remove();
  const menu = element("div", "grid-menu panel");
  if (choices.length === 0) menu.appendChild(element("div", "note", "Nothing can go here."));
  for (const choice of choices) {
    const item = element("button", "small", choice.label);
    item.disabled = choice.problem !== null;
    item.title = choice.problem ?? "";
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.remove();
      choice.run();
    });
    menu.appendChild(item);
  }
  const box = anchor.getBoundingClientRect();
  menu.style.left = `${Math.min(box.left, window.innerWidth - 240)}px`;
  menu.style.top = `${Math.min(box.bottom + 4, window.innerHeight - 40 * (choices.length + 1))}px`;
  document.body.appendChild(menu);
  const close = (e: MouseEvent) => {
    if (e.target instanceof Node && menu.contains(e.target)) return;
    menu.remove();
    window.removeEventListener("mousedown", close, true);
  };
  window.addEventListener("mousedown", close, true);
}

export function squadGrid(side: GridSquad, options: GridOptions): HTMLElement {
  const panel = element("div", "squad-grid");
  panel.appendChild(element("div", "section", `${side.title} · ${side.squad.length}/${side.capacity}`));
  const grid = element("div", "grid");
  for (const row of DISPLAY_ROWS) grid.appendChild(element("div", "row-label", ROW_NAMES[row]));
  for (const col of COLS) {
    for (const row of DISPLAY_ROWS) {
      const tile: Tile = { row, col };
      const member = side.squad.find((m) => sameTile(m.tile, tile));
      const isSelected = options.selected !== null && sameRef(options.selected.ref, side.ref) && sameTile(options.selected.tile, tile);
      const cell = element("div", `cell${member ? " filled" : ""}${isSelected ? " selected" : ""}`);
      if (member) {
        cell.appendChild(art({ kind: "portrait", id: member.defId, frame: "icon" }, "thumb"));
        const lead = isLeaderOf(member, side.leader);
        cell.appendChild(element("div", "name", `${lead ? "♛ " : ""}${unitName(member.defId)}${member.level > 0 ? ` ${member.level}` : ""}`));
        const bar = element("div", "hp");
        const fill = element("div", "fill");
        fill.style.width = `${(100 * member.hp) / maxHpOf(member, side.leader)}%`;
        bar.appendChild(fill);
        cell.appendChild(bar);
        cell.draggable = options.mayAct;
        cell.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("application/x-disc-unit", JSON.stringify({ ref: side.ref, tile }));
          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        });
        cell.addEventListener("click", () => options.select(isSelected ? null : { ref: side.ref, tile }));
        // Hold right-click for the unit's card: its numbers now, armor included (released on pointerup).
        cell.addEventListener("contextmenu", (e) => e.preventDefault());
        cell.addEventListener("pointerdown", (e) => {
          if (e.button !== 2) return;
          const peek = document.getElementById("peek");
          if (peek) showPeek(peek, [memberCard(member, side.leader)], e.clientX, e.clientY, 340, 360);
        });
      } else {
        cell.appendChild(element("div", "empty", options.mayAct ? "+" : ""));
        cell.addEventListener("click", () => {
          if (options.mayAct) openMenu(cell, options.emptyChoices(side.ref, tile));
        });
      }
      cell.addEventListener("dragover", (e) => {
        e.preventDefault();
        cell.classList.add("over");
      });
      cell.addEventListener("dragleave", () => cell.classList.remove("over"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        cell.classList.remove("over");
        const dragged = readDragged(e);
        if (!dragged || (sameRef(dragged.ref, side.ref) && sameTile(dragged.tile, tile))) return;
        const problem = options.moveProblem(dragged.ref, dragged.tile, side.ref, tile);
        if (problem) {
          cell.title = problem;
          cell.classList.add("refused");
          window.setTimeout(() => cell.classList.remove("refused"), 600);
          return;
        }
        options.move(dragged.ref, dragged.tile, side.ref, tile);
      });
      grid.appendChild(cell);
    }
  }
  panel.appendChild(grid);

  // The selected unit's details and what can be done with it.
  const chosen = options.selected && sameRef(options.selected.ref, side.ref) ? side.squad.find((m) => options.selected && sameTile(m.tile, options.selected.tile)) : undefined;
  if (chosen) {
    const details = element("div", "grid-details");
    details.appendChild(memberRow(chosen, side.leader));
    for (const choice of options.unitChoices(side.ref, chosen)) {
      const button = element("button", "small", choice.label);
      button.disabled = !options.mayAct || choice.problem !== null;
      button.title = choice.problem ?? "";
      button.addEventListener("click", () => choice.run());
      details.appendChild(button);
    }
    panel.appendChild(details);
  }
  return panel;
}

export const sameRef = (a: SquadRef, b: SquadRef): boolean =>
  a.kind === "garrison" ? b.kind === "garrison" && a.cityId === b.cityId : b.kind === "warband" && a.leaderId === b.leaderId;
