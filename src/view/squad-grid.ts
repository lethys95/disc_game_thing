import { unitName } from "#view/names";
import type { Tile } from "#rules/battle/types";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import { member } from "#rules/world/state";
import type { Leader, SquadMember, SquadRef } from "#rules/world/state";
import { element, gold } from "#view/dom";
import { squadTile } from "#view/squad-tile";

/** One squad shown as its 3×3 grid (front row first). */
export interface GridSquad {
  readonly ref: SquadRef;
  readonly title: string;
  readonly squad: readonly SquadMember[];
  readonly leader: Leader | undefined;
  readonly capacity: number;
}

/** A unit that can be recruited into an empty place, its price, and what stops it (null: nothing). */
export interface RecruitChoice {
  readonly defId: string;
  readonly price: number;
  readonly problem: string | null;
  readonly run: () => void;
}

/** Something to do with a unit (elevate). */
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
  readonly recruits: (ref: SquadRef, tile: Tile) => readonly RecruitChoice[];
  readonly unitChoices: (ref: SquadRef, member: SquadMember) => readonly GridChoice[];
  /** A unit selected in some grid (to show its details and actions), or null. */
  readonly selected: { readonly ref: SquadRef; readonly tile: Tile } | null;
  readonly select: (selection: { ref: SquadRef; tile: Tile } | null) => void;
  /** Raising one of the fallen dragged from the graveyard onto an empty place, where the screen has a graveyard. */
  readonly raise: { readonly problem: (index: number, to: SquadRef, tile: Tile) => string | null; readonly run: (index: number, to: SquadRef, tile: Tile) => void } | null;
}

/** The drag payload of one of the fallen, dragged from the graveyard: its place in the player's graveyard. */
export const FALLEN_DRAG = "application/x-disc-fallen";

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

/**
 * The recruit menu by an empty place (`docs/design/capitol-elements.md`): each unit on offer as the squad tile it will
 * be, its name and price under it, its sheet on a held right-click; one that can't be had dimmed, the reason on hover.
 * Closes on a choice or a click elsewhere.
 */
function openRecruits(anchor: HTMLElement, choices: readonly RecruitChoice[]): void {
  document.querySelector(".grid-menu")?.remove();
  const menu = element("div", "grid-menu");
  menu.appendChild(element("div", "title", "Recruit into this place"));
  if (choices.length === 0) menu.appendChild(element("div", "note", "No one can be recruited here."));
  const list = element("div", "offers");
  for (const choice of choices) {
    const item = element("button", `offer${choice.problem ? " refused" : ""}`);
    item.append(squadTile(member(choice.defId, { row: 0, col: 0 }), undefined), element("span", "name", unitName(choice.defId)), gold(choice.price));
    item.title = choice.problem ?? `Recruit a ${unitName(choice.defId)}. Hold right-click for its sheet.`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      if (choice.problem) return;
      menu.remove();
      choice.run();
    });
    list.appendChild(item);
  }
  menu.appendChild(list);
  const box = anchor.getBoundingClientRect();
  document.body.appendChild(menu);
  // Measured once it's in the page: its size follows the UI scale.
  menu.style.left = `${Math.max(0, Math.min(box.left, window.innerWidth - menu.offsetWidth))}px`;
  menu.style.top = `${Math.max(0, Math.min(box.bottom + 4, window.innerHeight - menu.offsetHeight))}px`;
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
      const cell = squadTile(member, side.leader);
      cell.classList.add("cell");
      if (member) {
        cell.classList.add("filled");
        cell.classList.toggle("selected", isSelected);
        cell.draggable = options.mayAct;
        cell.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("application/x-disc-unit", JSON.stringify({ ref: side.ref, tile }));
          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        });
        cell.addEventListener("click", () => options.select(isSelected ? null : { ref: side.ref, tile }));
      } else if (options.mayAct) {
        cell.classList.add("open");
        cell.addEventListener("click", () => openRecruits(cell, options.recruits(side.ref, tile)));
      }
      cell.addEventListener("dragover", (e) => {
        e.preventDefault();
        cell.classList.add("over");
      });
      cell.addEventListener("dragleave", () => cell.classList.remove("over"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        cell.classList.remove("over");
        const refuse = (problem: string) => {
          cell.title = problem;
          cell.classList.add("refused");
          window.setTimeout(() => cell.classList.remove("refused"), 600);
        };
        const fallen = Number(e.dataTransfer?.getData(FALLEN_DRAG) || NaN);
        if (Number.isInteger(fallen) && options.raise) {
          const problem = options.raise.problem(fallen, side.ref, tile);
          if (problem) refuse(problem);
          else options.raise.run(fallen, side.ref, tile);
          return;
        }
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

  // What can be done with the selected unit; its numbers are on its sheet (a held right-click).
  const chosen = options.selected && sameRef(options.selected.ref, side.ref) ? side.squad.find((m) => options.selected && sameTile(m.tile, options.selected.tile)) : undefined;
  const orders = chosen ? options.unitChoices(side.ref, chosen) : [];
  if (chosen && orders.length > 0) {
    const details = element("div", "grid-details");
    for (const choice of orders) {
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
