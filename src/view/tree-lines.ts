const SVG = "http://www.w3.org/2000/svg";

/** A branch of a tree on screen: the node it leads to, the node it leaves, and whether it's lit. */
export type TreeLink = readonly [child: HTMLElement, parent: HTMLElement, lit: boolean];

/**
 * The branches of a tree that grows left to right (the research trees, the leader tree): from each parent's right side
 * to its child's left, elbowed (across, down, across), lit where `lit` says, the lit ones on top. A node's portrait (`.thumb`) is its anchor
 * where it has one. Drawn once the grid has its size, and again when it changes, since the nodes' places come from
 * the layout.
 */
export function treeLines(grid: HTMLElement, links: readonly TreeLink[]): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.classList.add("connectors");
  const draw = () => {
    const box = grid.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const ends = links.map(([child, parent, lit]) => {
      const from = (parent.querySelector(".thumb") ?? parent).getBoundingClientRect();
      const to = (child.querySelector(".thumb") ?? child).getBoundingClientRect();
      return { x1: from.right - box.left, y1: from.top + from.height / 2 - box.top, x2: to.left - box.left, y2: to.top + to.height / 2 - box.top, lit };
    });
    // Every branch turns at the same distance before its child, half the shortest gap, so one that skips a column
    // runs past the nodes in it on its parent's row instead of through them.
    const turn = Math.min(...ends.map((e) => e.x2 - e.x1)) / 2;
    svg.replaceChildren(
      ...ends
        .sort((a, b) => Number(a.lit) - Number(b.lit))
        .map(({ x1, y1, x2, y2, lit }) => {
          const path = document.createElementNS(SVG, "path");
          path.setAttribute("d", `M ${x1} ${y1} H ${x2 - turn} V ${y2} H ${x2}`);
          if (lit) path.classList.add("lit");
          return path;
        }),
    );
  };
  new ResizeObserver(draw).observe(grid);
  return svg;
}
