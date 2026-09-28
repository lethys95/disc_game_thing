import type { Hex } from "#rules/hex";
import { hexDistance, hexKey } from "#rules/hex";
import type { Terrain, WorldMap } from "#rules/map";
import * as THREE from "three";
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
/** Land beyond the map's edge, in hexes, so the map sits in a world instead of floating. */
const MARGIN = 3;
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
const OUTSIDE: Terrain = "forest";
export const WATER_LEVEL = 0.1;
/** Every unexplored hex lies flat at this height, so the fog doesn't give away mountains and water. */
export const UNEXPLORED_HEIGHT = 0.2;

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

const VERTEX_HEAD = /* glsl */ `
attribute vec4 groundWeights;
attribute float groundWet;
attribute vec2 groundHex;
uniform sampler2D hexState;
uniform float hexStateOffset;
uniform float hexStateWidth;
uniform float unexploredHeight;
varying vec4 vGroundWeights;
varying float vGroundWet;
varying vec3 vGroundWorld;
`;

const VERTEX_BODY = /* glsl */ `
#include <begin_vertex>
vGroundWeights = groundWeights;
vGroundWet = groundWet;
vec4 hexCell = texture2D(hexState, (groundHex + hexStateOffset + 0.5) / hexStateWidth);
// Unexplored ground lies flat, so the fog gives nothing away.
if (hexCell.r < 0.1) transformed.y = unexploredHeight;
vGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

const FRAGMENT_HEAD = /* glsl */ `
uniform sampler2D groundPlain;
uniform sampler2D groundForest;
uniform sampler2D groundHills;
uniform sampler2D groundMountain;
uniform sampler2D hexState;
uniform float hexStateOffset;
uniform float hexStateWidth;
uniform float groundScale;
uniform vec3 highlightColors[5];
varying vec4 vGroundWeights;
varying float vGroundWet;
varying vec3 vGroundWorld;

vec2 groundHexOf(vec2 p) {
  float q = (0.57735027 * p.x - p.y / 3.0) / ${HEX_SIZE.toFixed(1)};
  float r = (0.66666667 * p.y) / ${HEX_SIZE.toFixed(1)};
  vec3 cube = vec3(q, r, -q - r);
  vec3 rounded = floor(cube + 0.5);
  vec3 diff = abs(rounded - cube);
  if (diff.x > diff.y && diff.x > diff.z) rounded.x = -rounded.y - rounded.z;
  else if (diff.y > diff.z) rounded.y = -rounded.x - rounded.z;
  return rounded.xy;
}

/** Distance from p to the edge of its hex (pointy-top), in world units. */
float groundEdge(vec2 p, vec2 hex) {
  vec2 center = vec2(1.7320508 * (hex.x + hex.y * 0.5), 1.5 * hex.y) * ${HEX_SIZE.toFixed(1)};
  vec2 d = abs(p - center);
  float across = max(d.x, dot(d, vec2(0.5, 0.8660254)));
  return 0.8660254 * ${HEX_SIZE.toFixed(1)} - across;
}

/** A texture sampled at two scales and rotations, mixed by slow noise, so its repeats don't line up. */
vec3 groundLayer(sampler2D tex, vec2 uv) {
  vec3 a = texture2D(tex, uv).rgb;
  vec3 b = texture2D(tex, mat2(0.8, -0.6, 0.6, 0.8) * uv * 0.73 + 0.37).rgb;
  float m = 0.5 + 0.5 * sin(uv.x * 1.3 + sin(uv.y * 0.9) * 2.0);
  return mix(a, b, m * 0.6);
}
`;

const FRAGMENT_MAP = /* glsl */ `
vec2 groundUv = vGroundWorld.xz / groundScale;
vec4 w = vGroundWeights / max(dot(vGroundWeights, vec4(1.0)), 0.001);
vec3 ground = groundLayer(groundPlain, groundUv) * w.x + groundLayer(groundForest, groundUv) * w.y * 1.35
  + groundLayer(groundHills, groundUv) * w.z + groundLayer(groundMountain, groundUv) * w.w;
ground *= mix(1.0, 0.45, vGroundWet);
// Broad patches of lighter and darker ground break the texture's evenness at the map's scale.
ground *= 0.88 + 0.24 * (0.5 + 0.5 * sin(vGroundWorld.x * 0.37 + sin(vGroundWorld.z * 0.29) * 2.3));
vec2 myHex = groundHexOf(vGroundWorld.xz);
vec4 cell = texture2D(hexState, (myHex + hexStateOffset + 0.5) / hexStateWidth);
float sight = cell.r;
float inMap = cell.b;
// Remembered ground is dimmed; unexplored ground is a plain dark slate, showing nothing of its terrain.
ground *= sight > 0.9 ? 1.0 : 0.55;
if (sight < 0.1) ground = vec3(0.045, 0.046, 0.055) * (0.85 + 0.3 * (0.5 + 0.5 * sin(vGroundWorld.x * 0.8 + sin(vGroundWorld.z * 0.7) * 2.0)));
ground = mix(ground * 0.75, ground, inMap);
float edge = groundEdge(vGroundWorld.xz, myHex);
float line = (1.0 - smoothstep(0.012, 0.035, edge)) * inMap * step(0.3, sight);
ground = mix(ground, ground * 0.45, line * 0.55);
diffuseColor.rgb = ground;
`;

const FRAGMENT_EMISSIVE = /* glsl */ `
#include <emissivemap_fragment>
{
  int code = int(cell.g * 255.0 + 0.5);
  if (code > 0) {
    vec3 tint = highlightColors[code];
    // The hex glows faintly, its rim more.
    float rim = 1.0 - smoothstep(0.02, 0.16, edge);
    totalEmissiveRadiance += tint * (0.12 + rim * 0.7);
  }
}
`;

/** Grass tufts per square world unit, by the ground they grow on (plain, forest floor, hills, mountain). */
const GRASS_DENSITY = [60, 16, 34, 0] as const;
/** No grass right around a place (a city, a camp, a dungeon): its model stands on bare ground. */
const CLEARING = 0.5;

const GRASS_VERTEX_HEAD = /* glsl */ `
uniform float grassTime;
uniform sampler2D hexState;
uniform float hexStateOffset;
uniform float hexStateWidth;
attribute vec2 grassHex;
varying float vGrassSight;
`;

const GRASS_VERTEX_BODY = /* glsl */ `
#include <begin_vertex>
vec4 grassCell = texture2D(hexState, (grassHex + hexStateOffset + 0.5) / hexStateWidth);
vGrassSight = grassCell.r;
vec4 root = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
float tip = position.y;
float gust = sin(grassTime * 1.6 + root.x * 0.9 + root.z * 0.6) * 0.5 + 0.5;
float flutter = sin(grassTime * 4.1 + root.x * 23.0 + root.z * 17.0);
float bend = (gust * 0.35 + flutter * 0.08) * tip * tip;
transformed += inverse(mat3(modelMatrix * instanceMatrix)) * vec3(bend, 0.0, bend * 0.5) * 0.12;
// Unexplored ground has no grass to give away its terrain.
if (grassCell.r < 0.1) transformed *= 0.0;
`;

const GRASS_FRAGMENT = /* glsl */ `
#include <color_fragment>
diffuseColor.rgb *= vGrassSight > 0.9 ? 1.0 : 0.55;
`;

/** Both faces of a blade keep the upward normal; three.js would flip it for the back face and leave it dark. */
const GRASS_NORMAL = /* glsl */ `
#include <normal_fragment_begin>
normal = normalize(vNormal);
`;

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
  private readonly material: THREE.MeshStandardMaterial;
  private readonly hexes: readonly Hex[];

  constructor(map: WorldMap, grounds: GroundTextures, highlightColors: Readonly<Record<Exclude<Highlight, "none">, THREE.Color>>) {
    this.shape = new GroundShape(map);
    this.hexes = Object.values(map.tiles).map((t) => t.hex);
    this.state = new HexStateTexture(map.radius);
    const outer = map.radius + MARGIN;
    // Every cell, the map's hexes and the land around them alike: the land outside is shown dimmed, like remembered ground.
    for (let q = -this.state.offset; q <= this.state.offset; q++) {
      for (let r = -this.state.offset; r <= this.state.offset; r++) {
        const hex = { q, r };
        const inMap = this.shape.inMap(hex);
        this.state.set(hex, 0, inMap ? 255 : 110);
        this.state.set(hex, 2, inMap ? 255 : 0);
      }
    }
    this.state.flush();

    const layer = (terrain: (typeof LAYERS)[number]) => {
      const texture = grounds.get(terrain, 1);
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
      }
      return { value: texture };
    };
    this.material = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
    const uniforms = {
      groundPlain: layer("plain"),
      groundForest: layer("forest"),
      groundHills: layer("hills"),
      groundMountain: layer("mountain"),
      hexState: { value: this.state.texture },
      hexStateOffset: { value: this.state.offset },
      hexStateWidth: { value: this.state.width },
      unexploredHeight: { value: UNEXPLORED_HEIGHT },
      groundScale: { value: 2.2 },
      highlightColors: { value: [new THREE.Color(0), highlightColors.reach, highlightColors.walk, highlightColors.later, highlightColors.attack] },
    };
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = VERTEX_HEAD + shader.vertexShader.replace("#include <begin_vertex>", VERTEX_BODY);
      shader.fragmentShader = FRAGMENT_HEAD + shader.fragmentShader
        .replace("#include <map_fragment>", FRAGMENT_MAP)
        .replace("#include <emissivemap_fragment>", FRAGMENT_EMISSIVE);
    };

    const land = new THREE.Mesh(this.geometry(outer), this.material);
    land.receiveShadow = true;
    land.name = "landscape";
    this.group.add(land);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(HEX_SIZE * 1.5 * outer, 96).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1d3a52, roughness: 0.35, metalness: 0.2, transparent: true, opacity: 0.88 }),
    );
    water.position.y = WATER_LEVEL;
    water.receiveShadow = true;
    this.group.add(water);

    const places = [...map.starts, ...map.sites.map((p) => p.hex), ...map.lairs.map((p) => p.hex), ...map.structures.map((p) => p.hex)].map(hexCenter);
    this.group.add(this.grass(uniforms.hexState, uniforms.hexStateOffset, uniforms.hexStateWidth, places));
  }

  /** Grass tufts, swaying in the wind, where the ground is grassy; none on water or around places. */
  private grass(hexState: { value: THREE.Texture }, hexStateOffset: { value: number }, hexStateWidth: { value: number }, places: readonly THREE.Vector3[]): THREE.InstancedMesh {
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
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
    const time = { value: 0 };
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, { grassTime: time, hexState, hexStateOffset, hexStateWidth });
      shader.vertexShader = GRASS_VERTEX_HEAD + shader.vertexShader.replace("#include <begin_vertex>", GRASS_VERTEX_BODY);
      shader.fragmentShader = "varying float vGrassSight;\n" + shader.fragmentShader.replace("#include <color_fragment>", GRASS_FRAGMENT).replace("#include <normal_fragment_begin>", GRASS_NORMAL);
    };
    const geometry = grassTuft();
    geometry.setAttribute("grassHex", new THREE.InstancedBufferAttribute(new Float32Array(blades.flatMap((b) => [b.hex.q, b.hex.r])), 2));
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
    mesh.onBeforeRender = () => {
      time.value = performance.now() / 1000;
    };
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
