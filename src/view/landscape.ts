import type { Hex } from "#rules/hex";
import { hexDistance, hexKey } from "#rules/hex";
import type { Terrain, WorldMap } from "#rules/map";
import { abs, attribute, float, floor, instancedBufferAttribute, max, mix, mx_fractal_noise_float, positionLocal, positionWorld, select, sin, smoothstep, step, texture, time, transformNormalToView, uniformArray, vec2, vec3 } from "three/tsl";
import * as THREE from "three/webgpu";
import type { GroundTextures } from "#view/models";

/**
 * The map's ground as one continuous landscape (M56): gentle heights flowing between hexes, the terrains' textures
 * blending into each other along noisy edges, and a faint hex grid, fog of war and move highlights drawn by the
 * shader from a small per-hex state texture. It replaced a board of separate slabs, whose gaps, sides and per-hex
 * texture stamps read as tokens rather than land.
 */

/** Hex size in world units (corner to center), as in `view/map.ts`. */
export const HEX_SIZE = 1;
const SQRT3 = Math.sqrt(3);
/** Land beyond the map's edge, in hexes, so the map sits in a world instead of floating (`MapView` dresses it). */
export const MARGIN = 3;
/** Distance between the landscape mesh's vertices, in world units. */
const SPACING = 0.1;
/** How far the terrain borders wander from the hex edges, and how wide their blend is. */
const WARP = 0.32;
const BLEND = 0.2;
/** The terrains with ground textures, in the order of the blend weights. */
const LAYERS = ["plain", "forest", "hills", "mountain"] as const;
/** Water hexes take the hills' texture under the water, darkened by the depth. */
const UNDERWATER: (typeof LAYERS)[number] = "hills";

const BASE_HEIGHT: Readonly<Record<Terrain, number>> = { plain: 0.2, forest: 0.22, hills: 0.36, mountain: 0.46, water: -0.08 };
/** How bumpy each terrain is (the amplitude of its noise). */
const RELIEF: Readonly<Record<Terrain, number>> = { plain: 0.03, forest: 0.04, hills: 0.12, mountain: 0.1, water: 0.02 };
const OUTSIDE: Terrain = "plain";
/** World units one ground texture spans. */
const GROUND_SCALE = 2.2;
export const WATER_LEVEL = 0.1;
/** Every unexplored hex lies flat at this height, so the fog doesn't give away mountains and water. */
export const UNEXPLORED_HEIGHT = 0.2;

const NONE = new THREE.Color(0);

/** How a hex looks now, packed into the state texture. */
export type Highlight = "none" | "reach" | "walk" | "later" | "attack";
const HIGHLIGHT_CODE: Readonly<Record<Highlight, number>> = { none: 0, reach: 1, walk: 2, later: 3, attack: 4 };
export type Sight = "unexplored" | "remembered" | "visible";
const SIGHT_CODE: Readonly<Record<Sight, number>> = { unexplored: 0, remembered: 1, visible: 2 };

/** World position of a hex's center (pointy-top axial layout). */
export function hexCenter(hex: Hex): THREE.Vector3 {
  return new THREE.Vector3(HEX_SIZE * SQRT3 * (hex.q + hex.r / 2), 0, HEX_SIZE * 1.5 * hex.r);
}

/** The hex a world point lies in. */
export function hexAt(x: number, z: number): Hex {
  const q = ((SQRT3 / 3) * x - z / 3) / HEX_SIZE;
  const r = ((2 / 3) * z) / HEX_SIZE;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq + 0, r: rr + 0 };
}

/** Smooth value noise, deterministic, roughly in [-1, 1]. */
function noise(x: number, z: number, salt: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const hash = (a: number, b: number) => ((Math.imul(a * 374761393 + b * 668265263 + salt * 2246822519, 3266489917) >>> 0) / 4294967295) * 2 - 1;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const top = hash(ix, iz) + (hash(ix + 1, iz) - hash(ix, iz)) * ux;
  const bottom = hash(ix, iz + 1) + (hash(ix + 1, iz + 1) - hash(ix, iz + 1)) * ux;
  return top + (bottom - top) * uz;
}

const fbm = (x: number, z: number, salt: number) => noise(x, z, salt) * 0.65 + noise(x * 2.3, z * 2.3, salt + 1) * 0.35;

/** Sample offsets for the blend: the center and six around it. */
const TAPS: readonly (readonly [number, number])[] = [[0, 0], ...Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * BLEND, Math.sin((i / 6) * Math.PI * 2) * BLEND] as const)];

interface GroundSample {
  readonly height: number;
  readonly weights: readonly [number, number, number, number];
  /** How much of the point is water (0..1). */
  readonly wet: number;
  /** The hexes the sample drew from (for fog: a point is as explored as the hexes around it). */
  readonly hexes: readonly Hex[];
}

/** The ground's shape and terrain blend at any point of the map, as a pure function of the map. */
export class GroundShape {
  constructor(private readonly map: WorldMap) {}

  terrainOf(hex: Hex): Terrain {
    return this.map.tiles[hexKey(hex)]?.terrain ?? OUTSIDE;
  }

  inMap(hex: Hex): boolean {
    return hexKey(hex) in this.map.tiles;
  }

  sample(x: number, z: number): GroundSample {
    const wx = x + fbm(x * 0.8, z * 0.8, 11) * WARP;
    const wz = z + fbm(x * 0.8, z * 0.8, 23) * WARP;
    const weights: [number, number, number, number] = [0, 0, 0, 0];
    let height = 0;
    let wet = 0;
    const hexes: Hex[] = [];
    for (const [dx, dz] of TAPS) {
      const hex = hexAt(wx + dx, wz + dz);
      hexes.push(hex);
      const terrain = this.terrainOf(hex);
      height += BASE_HEIGHT[terrain] + fbm(x * 1.7, z * 1.7, 37) * RELIEF[terrain];
      if (terrain === "water") wet += 1;
      const layer = LAYERS.indexOf(terrain === "water" ? UNDERWATER : terrain);
      weights[layer] = (weights[layer] ?? 0) + 1;
    }
    const n = TAPS.length;
    return { height: height / n, weights: [weights[0] / n, weights[1] / n, weights[2] / n, weights[3] / n], wet: wet / n, hexes };
  }

  heightAt(x: number, z: number): number {
    return this.sample(x, z).height;
  }
}

/** Packs per-hex sight and highlight into a texture the ground's shader reads. */
class HexStateTexture {
  readonly texture: THREE.DataTexture;
  readonly offset: number;
  readonly width: number;
  private readonly data: Uint8Array;

  constructor(radius: number) {
    this.offset = radius + MARGIN + 1;
    this.width = this.offset * 2 + 1;
    this.data = new Uint8Array(this.width * this.width * 4);
    this.texture = new THREE.DataTexture(this.data, this.width, this.width, THREE.RGBAFormat);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.needsUpdate = true;
  }

  private index(hex: Hex): number | null {
    const x = hex.q + this.offset;
    const y = hex.r + this.offset;
    return x < 0 || y < 0 || x >= this.width || y >= this.width ? null : (y * this.width + x) * 4;
  }

  set(hex: Hex, channel: 0 | 1 | 2, value: number): void {
    const i = this.index(hex);
    if (i !== null) this.data[i + channel] = value;
  }

  get(hex: Hex, channel: 0 | 1 | 2): number {
    const i = this.index(hex);
    return i === null ? 0 : (this.data[i + channel] ?? 0);
  }

  flush(): void {
    this.texture.needsUpdate = true;
  }
}

type Vec2Node = THREE.Node<"vec2">;

/** The hex a world point lies in, as a shader expression (see `hexAt`). */
function hexOfNode(p: Vec2Node): Vec2Node {
  const q = p.x.mul(SQRT3 / 3).sub(p.y.div(3)).div(HEX_SIZE);
  const r = p.y.mul(2 / 3).div(HEX_SIZE);
  const s = q.negate().sub(r);
  const rq = floor(q.add(0.5));
  const rr = floor(r.add(0.5));
  const rs = floor(s.add(0.5));
  const dq = abs(rq.sub(q));
  const dr = abs(rr.sub(r));
  const ds = abs(rs.sub(s));
  const fixQ = dq.greaterThan(dr).and(dq.greaterThan(ds));
  const fixR = fixQ.not().and(dr.greaterThan(ds));
  return vec2(select(fixQ, rr.negate().sub(rs), rq), select(fixR, rq.negate().sub(rs), rr));
}

/** Distance from p to the edge of its hex (pointy-top), in world units. */
function hexEdgeNode(p: Vec2Node, hex: Vec2Node) {
  const center = vec2(hex.x.add(hex.y.mul(0.5)).mul(SQRT3), hex.y.mul(1.5)).mul(HEX_SIZE);
  const d = abs(p.sub(center));
  return float((SQRT3 / 2) * HEX_SIZE).sub(max(d.x, d.x.mul(0.5).add(d.y.mul(SQRT3 / 2))));
}

/** A texture sampled at two scales and rotations, mixed by slow noise, so its repeats don't line up. */
function layerNode(tex: THREE.Texture, uv: Vec2Node) {
  const a = texture(tex, uv).rgb;
  const turned = vec2(uv.x.mul(0.8).add(uv.y.mul(0.6)), uv.x.mul(-0.6).add(uv.y.mul(0.8))).mul(0.73).add(0.37);
  const b = texture(tex, turned).rgb;
  const m = sin(uv.x.mul(1.3).add(sin(uv.y.mul(0.9)).mul(2))).mul(0.5).add(0.5);
  return mix(a, b, m.mul(0.6));
}

/** Grass tufts per square world unit, by the ground they grow on (plain, forest floor, hills, mountain). */
const GRASS_DENSITY = [60, 16, 34, 0] as const;
/** No grass right around a place (a city, a camp, a dungeon): its model stands on bare ground. */
const CLEARING = 0.5;

/**
 * Water: a deep, clear blue whose surface ripples in the wind (animated noise, its slope turned into the normal),
 * glossy enough to catch the sky.
 */
function waterMaterial(): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.28, metalness: 0, transparent: true, opacity: 0.92 });
  const p = positionWorld.xz;
  const wave = (x: Vec2Node) => mx_fractal_noise_float(vec3(x.mul(1.6), time.mul(0.35)), 3, 2.0, 0.5);
  const step = 0.02;
  const here = wave(p);
  const slopeX = wave(p.add(vec2(step, 0))).sub(here).div(step);
  const slopeZ = wave(p.add(vec2(0, step))).sub(here).div(step);
  material.normalNode = transformNormalToView(vec3(slopeX.mul(-0.025), 1, slopeZ.mul(-0.025)).normalize());
  // Brighter where the ripples rise, as light catches their crests.
  material.colorNode = mix(vec3(0.02, 0.07, 0.13), vec3(0.05, 0.14, 0.23), smoothstep(-0.3, 0.5, here));
  return material;
}

/** A tuft: five blades leaning out from one root, so it reads as a clump from the map's height. */
function grassTuft(): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const base = new THREE.Color().setRGB(0.24, 0.36, 0.1, THREE.SRGBColorSpace);
  const tip = new THREE.Color().setRGB(0.58, 0.7, 0.3, THREE.SRGBColorSpace);
  for (let b = 0; b < 5; b++) {
    const angle = (b / 5) * Math.PI * 2;
    const lean = 0.35 + (b % 2) * 0.2;
    const out = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(0.12);
    const top = out.clone().multiplyScalar(lean).setY(1 - (b % 3) * 0.12);
    const corners = [side.clone().negate(), side.clone(), top];
    for (const corner of corners) {
      positions.push(corner.x, corner.y, corner.z);
      const c = base.clone().lerp(tip, corner.y);
      colors.push(c.r, c.g, c.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(positions.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return geometry;
}

/** The landscape mesh, its water and its per-hex state. Owns its GPU resources (`dispose`). */
export class Landscape {
  readonly group = new THREE.Group();
  readonly shape: GroundShape;
  private readonly state: HexStateTexture;
  private readonly material: THREE.MeshStandardNodeMaterial;
  private readonly hexes: readonly Hex[];

  constructor(map: WorldMap, grounds: GroundTextures, highlightColors: Readonly<Record<Exclude<Highlight, "none">, THREE.Color>>) {
    this.shape = new GroundShape(map);
    this.hexes = Object.values(map.tiles).map((t) => t.hex);
    this.state = new HexStateTexture(map.radius);
    const outer = map.radius + MARGIN;
    // Every cell, the map's hexes and the land around them alike: the land outside is seen (it's scenery, nothing to
    // discover there) but has no grid.
    for (let q = -this.state.offset; q <= this.state.offset; q++) {
      for (let r = -this.state.offset; r <= this.state.offset; r++) {
        const hex = { q, r };
        const inMap = this.shape.inMap(hex);
        this.state.set(hex, 0, 255);
        this.state.set(hex, 2, inMap ? 255 : 0);
      }
    }
    this.state.flush();

    const blank = new THREE.DataTexture(new Uint8Array([90, 110, 60, 255]), 1, 1);
    blank.needsUpdate = true;
    const layer = (terrain: (typeof LAYERS)[number]) => {
      const loaded = grounds.get(terrain, 1);
      if (!loaded) return blank;
      loaded.wrapS = loaded.wrapT = THREE.RepeatWrapping;
      // Re-upload only a texture that's already loaded (another screen used it unrepeated); a pending one uploads
      // with its wrapping when it arrives, and flagging it now would make WebGPU read an image that isn't there.
      if (loaded.image) loaded.needsUpdate = true;
      return loaded;
    };
    const cellOf = (hex: Vec2Node) => texture(this.state.texture, hex.add(float(this.state.offset + 0.5)).div(float(this.state.width)));

    this.material = new THREE.MeshStandardNodeMaterial({ roughness: 0.95, metalness: 0 });
    // Unexplored ground lies flat, so the fog gives nothing away.
    const vertexCell = cellOf(attribute<"vec2">("groundHex", "vec2")).level(float(0));
    this.material.positionNode = select(vertexCell.r.lessThan(0.1), vec3(positionLocal.x, float(UNEXPLORED_HEIGHT), positionLocal.z), positionLocal);

    const world = positionWorld.xz;
    const uv = world.div(GROUND_SCALE);
    const weights = attribute<"vec4">("groundWeights", "vec4");
    const w = weights.div(max(weights.x.add(weights.y).add(weights.z).add(weights.w), 0.001));
    let ground = layerNode(layer("plain"), uv).mul(w.x)
      .add(layerNode(layer("forest"), uv).mul(w.y).mul(1.35))
      .add(layerNode(layer("hills"), uv).mul(w.z))
      .add(layerNode(layer("mountain"), uv).mul(w.w));
    ground = ground.mul(mix(float(1), float(0.45), attribute<"float">("groundWet", "float")));
    // A pale, muddy shore where the land dips to the water.
    const shore = smoothstep(WATER_LEVEL + 0.07, WATER_LEVEL + 0.005, positionWorld.y);
    ground = mix(ground, vec3(0.36, 0.31, 0.22).mul(ground.dot(vec3(0.3, 0.6, 0.1)).mul(1.6).add(0.4)), shore.mul(0.7));
    // Broad patches of lighter and darker ground break the texture's evenness at the map's scale.
    ground = ground.mul(sin(world.x.mul(0.37).add(sin(world.y.mul(0.29)).mul(2.3))).mul(0.12).add(1));
    const hex = hexOfNode(world);
    const cell = cellOf(hex);
    const sight = cell.r;
    const inMap = cell.b;
    // Remembered ground is dimmed.
    ground = ground.mul(select(sight.greaterThan(0.9), float(1), float(0.55)));
    // Unexplored land lies under drifting clouds, showing nothing of what's beneath.
    const drift = mx_fractal_noise_float(vec3(world.mul(0.35), time.mul(0.04)), 4, 2.0, 0.5);
    const clouds = mix(vec3(0.15, 0.16, 0.2), vec3(0.52, 0.54, 0.6), smoothstep(-0.35, 0.45, drift));
    ground = select(sight.lessThan(0.1), clouds, ground);
    ground = mix(ground.mul(0.9), ground, inMap);
    const edge = hexEdgeNode(world, hex);
    const line = float(1).sub(smoothstep(0.012, 0.035, edge)).mul(inMap).mul(step(0.3, sight));
    this.material.colorNode = mix(ground, ground.mul(0.45), line.mul(0.55));
    // Highlighted hexes glow faintly, their rims more.
    const tints = uniformArray<"vec3">([NONE, highlightColors.reach, highlightColors.walk, highlightColors.later, highlightColors.attack].map((c) => new THREE.Vector3(c.r, c.g, c.b)), "vec3");
    const code = cell.g.mul(255).add(0.5).toInt();
    const rim = float(1).sub(smoothstep(0.02, 0.16, edge));
    this.material.emissiveNode = tints.element(code).mul(rim.mul(0.7).add(0.12));

    const land = new THREE.Mesh(this.geometry(outer), this.material);
    land.receiveShadow = true;
    land.name = "landscape";
    this.group.add(land);

    const water = new THREE.Mesh(new THREE.CircleGeometry(HEX_SIZE * 1.5 * outer, 96).rotateX(-Math.PI / 2), waterMaterial());
    water.position.y = WATER_LEVEL;
    water.receiveShadow = true;
    this.group.add(water);

    const places = [...map.starts, ...map.sites.map((p) => p.hex), ...map.lairs.map((p) => p.hex), ...map.structures.map((p) => p.hex)].map(hexCenter);
    this.group.add(this.grass(places));
  }

  /** Grass tufts, swaying in the wind, where the ground is grassy; none on water or around places. */
  private grass(places: readonly THREE.Vector3[]): THREE.InstancedMesh {
    const blades: { x: number; z: number; y: number; height: number; turn: number; shade: number; hex: Hex }[] = [];
    let seed = 1;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const cell = 0.25;
    for (const hex of this.hexes) {
      const center = hexCenter(hex);
      for (let cx = -1; cx < 1; cx += cell) {
        for (let cz = -1; cz < 1; cz += cell) {
          const probe = this.shape.sample(center.x + cx + cell / 2, center.z + cz + cell / 2);
          if (probe.wet > 0.01) continue;
          const density = probe.weights.reduce((sum, w, i) => sum + w * (GRASS_DENSITY[i] ?? 0), 0);
          const count = Math.round(density * cell * cell);
          for (let i = 0; i < count; i++) {
            const x = center.x + cx + random() * cell;
            const z = center.z + cz + random() * cell;
            const own = hexAt(x, z);
            if (own.q !== hex.q || own.r !== hex.r) continue;
            if (places.some((p) => Math.hypot(p.x - x, p.z - z) < CLEARING)) continue;
            blades.push({ x, z, y: this.shape.heightAt(x, z), height: 0.07 + random() * 0.08, turn: random() * Math.PI * 2, shade: 0.75 + random() * 0.45, hex });
          }
        }
      }
    }
    const geometry = grassTuft();
    const hexes = instancedBufferAttribute<"vec2">(new THREE.InstancedBufferAttribute(new Float32Array(blades.flatMap((b) => [b.hex.q, b.hex.r])), 2), "vec2");
    // Each tuft's root (x, z), its turn and its scale, for the wind.
    const roots = instancedBufferAttribute<"vec4">(new THREE.InstancedBufferAttribute(new Float32Array(blades.flatMap((b) => [b.x, b.z, b.turn, b.height * 0.9])), 4), "vec4");
    const state = texture(this.state.texture, hexes.add(float(this.state.offset + 0.5)).div(float(this.state.width))).level(float(0));
    const gust = sin(time.mul(1.6).add(roots.x.mul(0.9)).add(roots.y.mul(0.6))).mul(0.5).add(0.5);
    const flutter = sin(time.mul(4.1).add(roots.x.mul(23)).add(roots.y.mul(17)));
    const tip = positionLocal.y;
    const bend = gust.mul(0.35).add(flutter.mul(0.08)).mul(tip).mul(tip).mul(0.12);
    // The wind blows the same way everywhere: turn its push back into the tuft's own frame.
    const cos = roots.z.cos();
    const sinTurn = roots.z.sin();
    const push = vec3(bend.mul(cos).sub(bend.mul(0.5).mul(sinTurn)), 0, bend.mul(sinTurn).add(bend.mul(0.5).mul(cos))).div(roots.w);
    const material = new THREE.MeshStandardNodeMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
    // Unexplored ground has no grass to give away its terrain; remembered grass is dimmed like its ground.
    material.positionNode = select(state.r.lessThan(0.1), vec3(0), positionLocal.add(push));
    material.colorNode = vec3(select(state.r.greaterThan(0.9), float(1), float(0.55)));
    // Both faces of a blade keep the upward normal, or the back faces would render dark.
    material.normalNode = transformNormalToView(vec3(0, 1, 0));
    const mesh = new THREE.InstancedMesh(geometry, material, blades.length);
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    blades.forEach((b, i) => {
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.turn);
      mesh.setMatrixAt(i, matrix.compose(new THREE.Vector3(b.x, b.y - 0.005, b.z), rotation, new THREE.Vector3(b.height * 0.9, b.height, b.height * 0.9)));
      mesh.setColorAt(i, new THREE.Color().setRGB(b.shade, b.shade, b.shade, THREE.SRGBColorSpace));
    });
    mesh.receiveShadow = true;
    mesh.name = "grass";
    // Hover and clicks find hexes through the ground; testing a hundred thousand blades each time would stall.
    mesh.raycast = () => {};
    return mesh;
  }

  private geometry(outer: number): THREE.BufferGeometry {
    const extentX = SQRT3 * HEX_SIZE * (outer + 1);
    const extentZ = 1.5 * HEX_SIZE * (outer + 1);
    const columns = Math.ceil((extentX * 2) / SPACING);
    const rows = Math.ceil((extentZ * 2) / SPACING);
    const positions: number[] = [];
    const weights: number[] = [];
    const wet: number[] = [];
    const hexOf: number[] = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const x = -extentX + col * SPACING;
        const z = -extentZ + row * SPACING;
        const sample = this.shape.sample(x, z);
        positions.push(x, sample.height, z);
        weights.push(...sample.weights);
        wet.push(sample.wet);
        const own = hexAt(x, z);
        hexOf.push(own.q, own.r);
      }
    }
    const indices: number[] = [];
    const at = (row: number, col: number) => row * (columns + 1) + col;
    const outside = (row: number, col: number) => {
      const hex = hexAt(-extentX + col * SPACING, -extentZ + row * SPACING);
      return hexDistance(hex, { q: 0, r: 0 }) > outer;
    };
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (outside(row, col) && outside(row + 1, col + 1)) continue;
        indices.push(at(row, col), at(row + 1, col), at(row, col + 1), at(row, col + 1), at(row + 1, col), at(row + 1, col + 1));
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("groundWeights", new THREE.Float32BufferAttribute(weights, 4));
    geometry.setAttribute("groundWet", new THREE.Float32BufferAttribute(wet, 1));
    geometry.setAttribute("groundHex", new THREE.Float32BufferAttribute(hexOf, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  /** Fog of war: how much of each map hex the player at this screen has seen. */
  setSight(sight: (hex: Hex) => Sight): void {
    for (const hex of this.hexes) this.state.set(hex, 0, [0, 110, 255][SIGHT_CODE[sight(hex)]] ?? 0);
    this.state.flush();
  }

  setHighlight(highlight: (hex: Hex) => Highlight): void {
    for (const hex of this.hexes) this.state.set(hex, 1, HIGHLIGHT_CODE[highlight(hex)]);
    this.state.flush();
  }

  /** Whether the ground here is shown as unexplored (flat, dark). */
  unexplored(hex: Hex): boolean {
    return this.state.get(hex, 0) < 26;
  }

  /** Where a figure stands on a hex: its center, on the ground. */
  standingPoint(hex: Hex): THREE.Vector3 {
    const at = hexCenter(hex);
    return at.setY(Math.max(this.shape.heightAt(at.x, at.z), WATER_LEVEL));
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const materials: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of materials) m.dispose();
      }
    });
    this.state.texture.dispose();
  }
}
