import { mkdir, writeFile } from "node:fs/promises";
import { paintIn } from "#scripts/art/comfy";

/**
 * Paints a HUD layout drawn as two greyboxes (`docs/design/hud-pieces.md`, "Box out, then paint in"). Each layout's
 * greyboxes live in `art/greybox/<layout>/`: `values.html` and `depth.html` are the sources, rendered to
 * `values.png` and `depth.png` at the paint size. The prompt names materials only; the greyboxes carry the layout.
 *
 *     pnpm tsx scripts/art/hud-paint-in.ts <layout> [seed…]   (candidates into art/candidates/ui/paint-in/<layout>/)
 */

interface Layout {
  readonly prompt: string;
  readonly denoise: number;
  readonly depthStrength: number;
}

/** The 3x3 squad columns (the user, 2026-10-10: squads are 3x3 grids; "too much lighting"; adult angels). */
const LAYOUTS: Readonly<Record<string, Layout>> = {
  "map-column-window": {
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. In the middle, a gothic lancet window of lead and stained glass in deep red and amber: tracery glass in its pointed head, and below it a three by three grid of square panes, each empty and black. Behind the sockets, low gothic tracery in the same dark iron. At the foot, a large round disc of lit amber glass held up by two adult angels carved in low relief in the dark iron, tall robed figures with grown, solemn faces, their wings raised around it. No text, no letters.",
  },
  "map-column-lattice": {
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. In the middle, a square iron lattice framed by a band of deep red stained glass: a three by three grid of square panes, each empty and black, with a small amber glass roundel where the bars cross. Behind the sockets, low gothic tracery in the same dark iron. At the foot, a large round disc of lit amber glass held up by two adult angels carved in low relief in the dark iron, tall robed figures with grown, solemn faces, their wings raised around it. No text, no letters.",
  },
  "map-column": {
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, lit from the upper left. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. A large arched portrait well, and below it a row of five small arched portrait niches side by side, each empty and black. Behind the sockets, low gothic tracery and vault ribs in the same dark iron. At the foot, a large round disc of lit amber glass, with two small angels carved in low relief in the dark iron either side of it, their wings raised around it. No text, no letters.",
  },
};

const [name, ...rest] = process.argv.slice(2);
const layout = name === undefined ? undefined : LAYOUTS[name];
if (name === undefined || layout === undefined) throw new Error(`name a layout: ${Object.keys(LAYOUTS).join(", ")}`);
const seeds = rest.length > 0 ? rest.map(Number) : [1, 2, 3, 4];
const out = `art/candidates/ui/paint-in/${name}`;
await mkdir(out, { recursive: true });
for (const seed of seeds) {
  const started = Date.now();
  const png = await paintIn({ ...layout, seed, values: `art/greybox/${name}/values.png`, depth: `art/greybox/${name}/depth.png` }, `disc/paint-in-${name}`);
  await writeFile(`${out}/${name}-${seed}.png`, png);
  console.log(`${out}/${name}-${seed}.png (${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
