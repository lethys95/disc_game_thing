import * as THREE from "three";
import { hexKey } from "#rules/hex";
import type { Biome, Terrain } from "#rules/map";
import type { PlayerId, World } from "#rules/world/state";
import { COLOR_HEX } from "#view/colors";
import { hexPosition } from "#view/map";
import type { MapView } from "#view/map";

/** Each terrain as a flat value: the minimap reads at a glance, not as a picture. */
const TERRAIN_FILL: Readonly<Record<Terrain, string>> = { plain: "#55513f", forest: "#2f3e2b", hills: "#6b5f4a", mountain: "#8a857c", water: "#26394a" };
const UNEXPLORED = "#141210";
/** Each patch biome's tint over the terrain fills, so the patches show at a glance. */
const BIOME_TINT: Readonly<Record<Biome, string | null>> = { temperate: null, desert: "#b8925a", swamp: "#3f5a3a", tundra: "#c8d4dc", haunted: "#5a4f63" };
const NEUTRAL = "#9a948a";
const INK = "#0d0b0a";
const LIGHT = "#e6dccb";

/**
 * The overworld's minimap (`docs/design/map-elements.md`, "The minimap"): the land as you have explored it, cities in
 * their holders' colours, warbands as far as you see them, a ring where the camera looks; a click moves the camera
 * there. It draws the world as the player knows it (`knownWorld`), never more.
 */
export class Minimap {
  private readonly canvas = document.createElement("canvas");
  private readonly land = document.createElement("canvas");
  /** World x/z to canvas pixels: scale and offset, set when the land is drawn. */
  private fit = { scale: 1, x: 0, z: 0 };
  private lastFrame = "";
  /** The world last drawn: the land is redrawn only when it changes, not on every hover. */
  private drawn: World | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly view: MapView,
    private readonly column: HTMLElement,
  ) {
    this.canvas.className = "minimap-canvas";
    host.appendChild(this.canvas);
    this.canvas.addEventListener("click", (e) => {
      const box = this.canvas.getBoundingClientRect();
      const px = ((e.clientX - box.left) / box.width) * this.canvas.width;
      const py = ((e.clientY - box.top) / box.height) * this.canvas.height;
      this.view.lookAt(new THREE.Vector3((px - this.fit.x) / this.fit.scale, 0, (py - this.fit.z) / this.fit.scale));
      this.lastFrame = "";
    });
    const tick = () => {
      if (this.host.getClientRects().length > 0) this.drawView();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** Redraws the land, cities and warbands from the world as `player` knows it. */
  render(known: World, player: PlayerId, explored: ReadonlySet<string>): void {
    if (known === this.drawn && this.canvas.width > 0) return;
    this.drawn = known;
    const size = Math.round(this.host.clientWidth * window.devicePixelRatio) || 256;
    for (const c of [this.canvas, this.land]) {
      c.width = size;
      c.height = size;
    }
    const tiles = Object.values(known.map.tiles);
    const points = tiles.map((t) => hexPosition(t.hex));
    const xs = points.map((p) => p.x);
    const zs = points.map((p) => p.z);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;
    const scale = size / Math.max(maxX - minX, maxZ - minZ);
    this.fit = { scale, x: (size - (maxX - minX) * scale) / 2 - minX * scale, z: (size - (maxZ - minZ) * scale) / 2 - minZ * scale };
    const g = this.land.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, size, size);
    const radius = scale * 0.98;
    tiles.forEach((tile, i) => {
      const p = points[i];
      if (!p) return;
      const seen = explored.has(hexKey(tile.hex));
      g.fillStyle = seen ? TERRAIN_FILL[tile.terrain] : UNEXPLORED;
      this.hex(g, p.x * scale + this.fit.x, p.z * scale + this.fit.z, radius);
      const tint = BIOME_TINT[tile.biome];
      if (seen && tint && tile.terrain !== "water") {
        g.globalAlpha = 0.45;
        g.fillStyle = tint;
        this.hex(g, p.x * scale + this.fit.x, p.z * scale + this.fit.z, radius);
        g.globalAlpha = 1;
      }
    });
    // Neutral places have no hue (every hue is a player's): lairs dark with a light rim, structures light with a dark one.
    for (const lair of known.lairs) {
      if (lair.guards.length === 0) continue;
      const p = this.at(hexPosition(lair.hex));
      this.mark(g, [[0, -1], [0.75, 0], [0, 1], [-0.75, 0]], p, scale * 0.85, INK, LIGHT);
    }
    for (const structure of known.structures) {
      const p = this.at(hexPosition(structure.hex));
      this.mark(g, [[0, -0.9], [0.85, 0.6], [-0.85, 0.6]], p, scale * 0.85, LIGHT, INK);
    }
    const colorOf = (owner: PlayerId | null) => (owner === null ? NEUTRAL : COLOR_HEX[known.players[owner]?.color ?? "white"]);
    for (const city of known.cities) {
      const p = this.at(hexPosition(city.hex));
      const half = scale * (city.kind === "capitol" ? 1.3 : 0.9);
      g.fillStyle = INK;
      g.fillRect(p.x - half - 1.5, p.y - half - 1.5, half * 2 + 3, half * 2 + 3);
      g.fillStyle = colorOf(city.owner);
      g.fillRect(p.x - half, p.y - half, half * 2, half * 2);
    }
    for (const leader of known.leaders) {
      const p = this.at(hexPosition(leader.hex));
      g.beginPath();
      g.arc(p.x, p.y, scale * (leader.player === player ? 0.95 : 0.8), 0, Math.PI * 2);
      g.fillStyle = colorOf(leader.player);
      g.fill();
      g.lineWidth = Math.max(1, scale * 0.25);
      g.strokeStyle = INK;
      g.stroke();
    }
    this.lastFrame = "";
    this.drawView();
  }

  private at(point: THREE.Vector3): { x: number; y: number } {
    return { x: point.x * this.fit.scale + this.fit.x, y: point.z * this.fit.scale + this.fit.z };
  }

  /** A small outlined shape, its corners in units of `size` around `at`. */
  private mark(g: CanvasRenderingContext2D, corners: readonly (readonly [number, number])[], at: { x: number; y: number }, size: number, fill: string, rim: string): void {
    g.beginPath();
    for (const [x, y] of corners) g.lineTo(at.x + x * size, at.y + y * size);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = Math.max(1, size * 0.3);
    g.lineJoin = "round";
    g.strokeStyle = rim;
    g.stroke();
  }

  private hex(g: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      g.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    g.closePath();
    g.fill();
  }

  /** The land, then the ground the camera sees as a frame; redrawn only when the camera has moved. */
  private drawView(): void {
    const right = (2 * this.column.getBoundingClientRect().left) / window.innerWidth - 1;
    const width = Math.max(1.5, this.fit.scale * 0.35);
    const corners = clipped(this.view.footprint(right).map((c) => this.at(c)), width / 2, this.canvas.width - width / 2);
    const key = `${corners.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")} ${this.canvas.width}`;
    if (key === this.lastFrame) return;
    this.lastFrame = key;
    const g = this.canvas.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.drawImage(this.land, 0, 0);
    g.beginPath();
    for (const c of corners) g.lineTo(c.x, c.y);
    g.closePath();
    g.lineWidth = width;
    g.lineJoin = "round";
    g.strokeStyle = "#e8c36c";
    g.stroke();
  }
}

type Point = { readonly x: number; readonly y: number };

/** A polygon cut to the square from `low` to `high` on both axes, so a frame larger than the minimap still shows its edges. */
function clipped(polygon: readonly Point[], low: number, high: number): Point[] {
  const edges: readonly [(p: Point) => number, (a: Point, b: Point) => Point][] = [
    [(p) => p.x - low, (a, b) => crossing(a, b, (a.x - low) / (a.x - b.x))],
    [(p) => high - p.x, (a, b) => crossing(a, b, (high - a.x) / (b.x - a.x))],
    [(p) => p.y - low, (a, b) => crossing(a, b, (a.y - low) / (a.y - b.y))],
    [(p) => high - p.y, (a, b) => crossing(a, b, (high - a.y) / (b.y - a.y))],
  ];
  let points: Point[] = [...polygon];
  for (const [inside, cut] of edges) {
    const kept: Point[] = [];
    points.forEach((b, i) => {
      const a = points[(i + points.length - 1) % points.length];
      if (!a) return;
      if (inside(b) >= 0) {
        if (inside(a) < 0) kept.push(cut(a, b));
        kept.push(b);
      } else if (inside(a) >= 0) kept.push(cut(a, b));
    });
    points = kept;
  }
  return points;
}

function crossing(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
