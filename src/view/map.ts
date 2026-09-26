import * as THREE from "three";
import type { PlayerColor } from "#rules/world/colors";
import { cityOfNode } from "#rules/world/state";
import type { PlayerId } from "#rules/world/state";
import type { Vision } from "#rules/world/vision";
import { threeColor } from "#view/colors";
import { movementOf } from "#rules/world/leaders";
import { movementPips } from "#view/dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { hexKey } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { Terrain, WorldMap } from "#rules/map";
import { UNITS } from "#rules/units/index";
import type { City, Leader, World } from "#rules/world/state";
import { buildFigure } from "#view/figures";
import type { CameraPose, Stage } from "#view/stage";

const SIZE = 1;

export function hexPosition(hex: Hex): THREE.Vector3 {
  return new THREE.Vector3(SIZE * Math.sqrt(3) * (hex.q + hex.r / 2), 0, SIZE * 1.5 * hex.r);
}

const TERRAIN_LOOK: Readonly<Record<Terrain, { color: number; height: number }>> = {
  plain: { color: 0x3d3a2e, height: 0.22 },
  forest: { color: 0x27301f, height: 0.24 },
  hills: { color: 0x4a4133, height: 0.42 },
  mountain: { color: 0x2e2b29, height: 0.5 },
  water: { color: 0x14202a, height: 0.1 },
};

export interface MapHighlights {
  readonly reachable: ReadonlySet<string>;
  readonly path: readonly Hex[];
  /** The part of the path walked this turn; the rest is shown dimmer. */
  readonly walked: number;
  readonly attack: Hex | null;
}

interface HexTile {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  readonly top: number;
  readonly color: THREE.Color;
  readonly roughness: number;
  readonly metalness: number;
  /** Trees, peaks and mounds on the hex, hidden until it's explored. */
  readonly decoration: THREE.Object3D[];
}

/** Unexplored hexes are all alike; explored ones out of sight are dimmed (fog of war). */
const UNEXPLORED = new THREE.Color(0x0d0c0e);
/** Every unexplored hex has the same height, so the fog doesn't give away mountains and water. */
const UNEXPLORED_HEIGHT = 0.2;
const REMEMBERED = 0.4;

interface SiteModel {
  readonly group: THREE.Group;
  readonly banner: THREE.MeshStandardMaterial;
  readonly label: HTMLDivElement;
}

const NEUTRAL_LINK = new THREE.Color(0x6a6058);
const NEUTRAL_BANNER = new THREE.Color(0x4a4744);

interface LeaderFigure {
  readonly group: THREE.Group;
  readonly label: HTMLDivElement;
  defId: string;
}

const NONE = new THREE.Color(0x000000);
const REACH = new THREE.Color(0x3a2a16);
const WALK = new THREE.Color(0xb08a4a);
const LATER = new THREE.Color(0x4a3a24);
const ATTACK = new THREE.Color(0xd8321f);

/** Deterministic per-hex jitter so decoration varies without randomness. */
function jitter(hex: Hex, salt: number): number {
  const h = Math.imul(hex.q * 73856093 ^ hex.r * 19349663 ^ salt * 83492791, 2654435761) >>> 0;
  return (h % 1000) / 1000;
}

export class MapView {
  private colors: THREE.Color[] = [];

  /** Each player's color, for warbands placed from now on (call before `build`). */
  setColors(colors: readonly PlayerColor[]): void {
    this.colors = colors.map(threeColor);
  }

  private colorOf(player: PlayerId): THREE.Color {
    return this.colors[player] ?? NEUTRAL_LINK;
  }

  readonly scene = new THREE.Scene();
  readonly pose: CameraPose = {
    position: new THREE.Vector3(-3, 11, 11.5),
    target: new THREE.Vector3(0, 0, 0.3),
    minDistance: 8,
    maxDistance: 26,
  };
  private readonly terrain = new THREE.Group();
  private readonly hexes = new Map<string, HexTile>();
  private readonly leaders = new Map<string, LeaderFigure>();
  private readonly sites = new Map<string, SiteModel>();
  private vision: Vision | null = null;
  /** Each node's link to its city, recolored when the city changes hands. */
  private readonly links = new Map<string, { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; city: string }>();
  private readonly nodeModels = new Map<string, THREE.Group>();
  private readonly lairs = new Map<string, { group: THREE.Group; label: HTMLDivElement }>();
  private readonly siteLayer = new THREE.Group();

  constructor(private readonly stage: Stage) {
    const dusk = new THREE.Color(0x0b0a0c);
    this.scene.background = dusk;
    this.scene.fog = new THREE.FogExp2(dusk, 0.028);
    this.scene.add(new THREE.HemisphereLight(0x8a90b0, 0x2a1c16, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffd6a8, 3);
    keyLight.position.set(-6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    for (const edge of ["left", "bottom"] as const) keyLight.shadow.camera[edge] = -12;
    for (const edge of ["right", "top"] as const) keyLight.shadow.camera[edge] = 12;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0x7f9cff, 1.2);
    rim.position.set(8, 5, -10);
    this.scene.add(rim);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: 0x0f0e0d, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(this.terrain);
    this.scene.add(this.siteLayer);
  }

  show(): void {
    this.stage.show(this.scene, this.pose);
  }

  build(map: WorldMap): void {
    this.terrain.clear();
    this.hexes.clear();
    const prism = new THREE.CylinderGeometry(SIZE * 0.95, SIZE * 0.97, 1, 6);
    const trunk = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 });
    const canopy = new THREE.MeshStandardMaterial({ color: 0x1c2418, roughness: 0.95 });
    const rock = new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 0.9, flatShading: true });
    for (const tile of Object.values(map.tiles)) {
      const look = TERRAIN_LOOK[tile.terrain];
      const material = new THREE.MeshStandardMaterial({
        color: look.color,
        roughness: tile.terrain === "water" ? 0.25 : 0.95,
        metalness: tile.terrain === "water" ? 0.35 : 0,
        emissive: NONE.clone(),
      });
      const mesh = new THREE.Mesh(prism, material);
      const at = hexPosition(tile.hex);
      mesh.scale.y = look.height;
      mesh.position.set(at.x, look.height / 2, at.z);
      mesh.receiveShadow = true;
      mesh.userData = { hex: tile.hex };
      this.terrain.add(mesh);
      const decoration: THREE.Object3D[] = [];
      this.hexes.set(hexKey(tile.hex), { mesh, top: look.height, color: material.color.clone(), roughness: material.roughness, metalness: material.metalness, decoration });

      if (tile.terrain === "forest") {
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 + jitter(tile.hex, i) * 1.5;
          const tree = new THREE.Group();
          const height = 0.5 + jitter(tile.hex, i + 10) * 0.35;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, height, 5), trunk);
          stem.position.y = height / 2;
          const crown = new THREE.Mesh(new THREE.ConeGeometry(0.2, height * 0.9, 6), canopy);
          crown.position.y = height * 0.85;
          tree.add(stem, crown);
          tree.position.set(at.x + Math.cos(angle) * 0.45, look.height, at.z + Math.sin(angle) * 0.45);
          tree.traverse((o) => {
            o.castShadow = true;
          });
          this.terrain.add(tree);
          decoration.push(tree);
        }
      }
      if (tile.terrain === "mountain") {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1 + jitter(tile.hex, 3) * 0.6, 5), rock);
        peak.position.set(at.x, look.height + 0.5, at.z);
        peak.rotation.y = jitter(tile.hex, 4) * Math.PI;
        peak.castShadow = true;
        this.terrain.add(peak);
        decoration.push(peak);
      }
      if (tile.terrain === "hills") {
        const mound = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), material);
        mound.scale.y = 0.45;
        mound.position.set(at.x, look.height, at.z);
        mound.castShadow = true;
        this.terrain.add(mound);
        decoration.push(mound);
      }
    }
  }

  /** Builds the cities and their gold mines; call after `build`. Ownership colours follow in `syncSites`. */
  buildSites(world: World): void {
    for (const site of this.sites.values()) site.label.remove();
    for (const lair of this.lairs.values()) lair.label.remove();
    this.siteLayer.clear();
    this.sites.clear();
    this.lairs.clear();
    const stone = new THREE.MeshStandardMaterial({ color: 0x3b3733, roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1f1c1a, roughness: 0.85 });
    const ore = new THREE.MeshStandardMaterial({ color: 0xd9a431, emissive: 0xd9a431, emissiveIntensity: 1.4, roughness: 0.4 });
    const forge = new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff6a1a, emissiveIntensity: 2, roughness: 0.5 });
    for (const city of world.cities) {
      const group = new THREE.Group();
      const banner = new THREE.MeshStandardMaterial({ color: NEUTRAL_BANNER.clone(), emissive: new THREE.Color(0), roughness: 0.6 });
      if (city.kind === "capitol") {
        const keep = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.62), stone);
        keep.position.y = 0.45;
        group.add(keep);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 4), dark);
        spire.position.y = 1.35;
        spire.rotation.y = Math.PI / 4;
        group.add(spire);
        for (const [x, z] of [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]] as const) {
          const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.75, 6), stone);
          tower.position.set(x, 0.38, z);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.35, 6), dark);
          cap.position.set(x, 0.92, z);
          group.add(tower, cap);
        }
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.2), banner);
        flag.position.set(0, 1.75, 0.1);
        group.add(flag);
      } else {
        for (const [x, z, h] of [[-0.18, -0.1, 0.55], [0.2, -0.05, 0.4], [0, 0.22, 0.7]] as const) {
          const tower = new THREE.Mesh(new THREE.BoxGeometry(0.26, h, 0.26), stone);
          tower.position.set(x, h / 2, z);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.3, 4), dark);
          roof.position.set(x, h + 0.15, z);
          roof.rotation.y = Math.PI / 4;
          group.add(tower, roof);
        }
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.16), banner);
        flag.position.set(0, 1.0, 0.3);
        group.add(flag);
      }
      group.traverse((o) => {
        o.castShadow = true;
      });
      // Towers sit at the back of the hex so a leader standing there stays visible in front.
      group.position.copy(this.standingPoint(city.hex)).add(new THREE.Vector3(0.1, 0, -0.32));
      group.userData = { hex: city.hex };
      const label = document.createElement("div");
      label.className = "site-label";
      const tag = new CSS2DObject(label);
      tag.position.set(0, city.kind === "capitol" ? 2.05 : 1.3, 0);
      group.add(tag);
      this.siteLayer.add(group);
      this.sites.set(city.id, { group, banner, label });
    }

    this.links.clear();
    this.nodeModels.clear();
    for (const node of world.nodes) {
      const model = node.kind === "blacksmith" ? anvil(dark, forge) : orePile(node.hex, ore, dark);
      model.position.copy(this.standingPoint(node.hex));
      model.userData = { hex: node.hex };
      model.traverse((o) => {
        o.castShadow = true;
      });
      this.siteLayer.add(model);
      this.nodeModels.set(node.id, model);
      // A thin road from the node to its city, in the owner's color: which city it feeds (user, 2026-09-26).
      const city = cityOfNode(world, node);
      if (!city) continue;
      const lift = new THREE.Vector3(0, 0.04, 0);
      const from = this.standingPoint(node.hex).add(lift);
      const to = this.standingPoint(city.hex).add(lift);
      const material = new THREE.MeshStandardMaterial({ color: NEUTRAL_LINK, emissive: NEUTRAL_LINK, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 });
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, from.distanceTo(to)), material);
      link.position.copy(from).lerp(to, 0.5);
      link.lookAt(to);
      this.siteLayer.add(link);
      this.links.set(node.id, { mesh: link, material, city: city.id });
    }
  }

  /** Camps show their bandits; dungeons show a dark entrance with their guards before it. */
  syncLairs(world: World): void {
    const present = new Set(world.lairs.map((l) => l.id));
    for (const [id, model] of this.lairs) {
      if (present.has(id)) continue;
      this.siteLayer.remove(model.group);
      model.label.remove();
      this.lairs.delete(id);
    }
    for (const lair of world.lairs) {
      let model = this.lairs.get(lair.id);
      if (!model) {
        const group = new THREE.Group();
        if (lair.kind === "dungeon") {
          const rock = new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.95, flatShading: true });
          const mouth = new THREE.MeshStandardMaterial({ color: 0x050404, emissive: new THREE.Color(0x5a3010), emissiveIntensity: 0.8 });
          const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), rock);
          mound.scale.set(1, 0.7, 1);
          mound.position.set(0.05, 0.25, -0.2);
          const entrance = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12, 0, Math.PI), mouth);
          entrance.position.set(0.05, 0.02, 0.28);
          group.add(mound, entrance);
        }
        const leaderDef = lair.guards[0]?.defId ?? "brigand";
        const figure = buildFigure(leaderDef, 1, null);
        figure.scale.multiplyScalar(0.55);
        figure.rotation.y = -Math.PI / 2;
        figure.position.set(lair.kind === "dungeon" ? -0.25 : 0, 0, lair.kind === "dungeon" ? 0.25 : 0);
        figure.name = "guard";
        group.add(figure);
        group.traverse((o) => {
          o.castShadow = true;
        });
        group.position.copy(this.standingPoint(lair.hex));
        group.userData = { hex: lair.hex };
        const label = document.createElement("div");
        label.className = "site-label neutral";
        const tag = new CSS2DObject(label);
        tag.position.set(0, 1.35, 0);
        group.add(tag);
        this.siteLayer.add(group);
        model = { group, label };
        this.lairs.set(lair.id, model);
      }
      const guard = model.group.getObjectByName("guard");
      if (guard) guard.visible = lair.guards.length > 0;
      // A cleared camp is gone until it regrows.
      model.group.visible = lair.kind === "dungeon" || lair.guards.length > 0;
      model.label.hidden = !model.group.visible;
      model.label.textContent =
        lair.kind === "camp"
          ? `Bandits · ${lair.guards.length}`
          : lair.looted
            ? "Dungeon (looted)"
            : `Dungeon · ${lair.guards.length} guards`;
    }
  }

  /**
   * Cities, nodes and their links as the player at this screen knows them (`knownWorld`): a place it hasn't found
   * is hidden, one out of sight shows as last seen.
   */
  syncSites(world: World): void {
    const cities = new Set(world.cities.map((c) => c.id));
    for (const [id, site] of this.sites) {
      site.group.visible = cities.has(id);
      site.label.hidden = !cities.has(id);
    }
    const nodes = new Set(world.nodes.map((n) => n.id));
    for (const [id, model] of this.nodeModels) model.visible = nodes.has(id);
    for (const [id, link] of this.links) link.mesh.visible = nodes.has(id) && cities.has(link.city);
    for (const city of world.cities) {
      const site = this.sites.get(city.id);
      if (!site) continue;
      const owner = city.owner;
      site.banner.color.copy(owner === null ? NEUTRAL_BANNER : this.colorOf(owner));
      site.banner.emissive.copy(owner === null ? NONE : this.colorOf(owner));
      site.banner.emissiveIntensity = owner === null ? 0 : 0.8;
      site.label.textContent = siteName(city);
      site.label.className = `site-label ${owner === null ? "neutral" : "owned"}`;
      site.label.style.color = owner === null ? "" : `#${this.colorOf(owner).getHexString()}`;
      site.label.style.borderColor = site.label.style.color;
    }
    for (const link of this.links.values()) {
      const owner = world.cities.find((c) => c.id === link.city)?.owner ?? null;
      const color = owner === null ? NEUTRAL_LINK : this.colorOf(owner);
      link.material.color.copy(color);
      link.material.emissive.copy(color);
      link.material.emissiveIntensity = owner === null ? 0.2 : 0.9;
    }
  }

  syncLeaders(world: World): void {
    const present = new Set(world.leaders.map((l) => l.id));
    for (const [id, figure] of this.leaders) {
      if (present.has(id)) continue;
      this.scene.remove(figure.group);
      figure.label.remove();
      this.leaders.delete(id);
    }
    for (const leader of world.leaders) {
      const defId = figureDef(leader);
      let figure = this.leaders.get(leader.id);
      if (figure && figure.defId !== defId) {
        this.scene.remove(figure.group);
        figure.label.remove();
        figure = undefined;
      }
      figure ??= this.addLeader(leader, defId);
      figure.group.position.copy(this.standingPoint(leader.hex));
      figure.group.userData = { hex: leader.hex };
      const alive = leader.squad.length;
      // Your own warbands also show the movement they have left.
      const move = leader.player === 0 ? ` · ${movementPips(leader.movement, movementOf(leader))}` : "";
      figure.label.textContent = `${UNITS[defId]?.name ?? defId} · ${alive} unit${alive === 1 ? "" : "s"}${move}`;
    }
  }

  private addLeader(leader: Leader, defId: string): LeaderFigure {
    const group = new THREE.Group();
    const owner = this.colorOf(leader.player);
    // Statues: light for the player at this screen, dark for everyone else.
    const figure = buildFigure(defId, leader.player === 0 ? 0 : 1, owner);
    figure.scale.multiplyScalar(0.62);
    figure.rotation.y = leader.player === 0 ? -Math.PI / 4 : (Math.PI * 3) / 4;
    group.add(figure);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.05, 6, 24),
      new THREE.MeshStandardMaterial({ color: owner, emissive: owner, emissiveIntensity: 0.6 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    group.add(ring);
    const label = document.createElement("div");
    label.className = "leader-label";
    label.style.color = `#${owner.getHexString()}`;
    const tag = new CSS2DObject(label);
    tag.position.set(0, 1.45, 0);
    group.add(tag);
    this.scene.add(group);
    const created = { group, label, defId };
    this.leaders.set(leader.id, created);
    return created;
  }

  private standingPoint(hex: Hex): THREE.Vector3 {
    return hexPosition(hex).setY(this.hexes.get(hexKey(hex))?.top ?? 0.2);
  }

  /** Fog of war: what the player at this screen has explored and sees now (null: everything). */
  setVision(vision: Vision | null): void {
    this.vision = vision;
    for (const [key, tile] of this.hexes) {
      const explored = !vision || vision.explored.has(key);
      const visible = !vision || vision.visible.has(key);
      const { mesh } = tile;
      mesh.material.color.copy(explored ? tile.color : UNEXPLORED);
      if (explored && !visible) mesh.material.color.multiplyScalar(REMEMBERED);
      mesh.material.roughness = explored ? tile.roughness : 1;
      mesh.material.metalness = explored ? tile.metalness : 0;
      mesh.scale.y = explored ? tile.top : UNEXPLORED_HEIGHT;
      mesh.position.y = mesh.scale.y / 2;
      for (const o of tile.decoration) o.visible = explored;
    }
  }

  /** Whether the player at this screen sees this hex now. */
  sees(hex: Hex): boolean {
    return !this.vision || this.vision.visible.has(hexKey(hex));
  }

  setHighlights(highlights: MapHighlights): void {
    const walked = new Set(highlights.path.slice(0, highlights.walked).map(hexKey));
    const later = new Set(highlights.path.slice(highlights.walked).map(hexKey));
    const attack = highlights.attack ? hexKey(highlights.attack) : null;
    for (const [key, { mesh }] of this.hexes) {
      const color = key === attack ? ATTACK : walked.has(key) ? WALK : later.has(key) ? LATER : highlights.reachable.has(key) ? REACH : NONE;
      mesh.material.emissive.copy(color);
      mesh.material.emissiveIntensity = color === ATTACK ? 1.2 : color === WALK ? 0.7 : 1;
    }
  }

  pick(clientX: number, clientY: number): Hex | null {
    const targets: THREE.Object3D[] = [
      ...[...this.hexes.values()].map((h) => h.mesh),
      ...[...this.leaders.values()].map((l) => l.group),
      ...this.siteLayer.children,
    ];
    for (const hit of this.stage.intersect(clientX, clientY, targets)) {
      let object: THREE.Object3D | null = hit.object;
      while (object) {
        const hex: unknown = object.userData["hex"];
        if (isHex(hex)) return hex;
        object = object.parent;
      }
    }
    return null;
  }

  screenPoint(hex: Hex): { x: number; y: number } {
    return this.stage.project(this.standingPoint(hex).add(new THREE.Vector3(0, 0.1, 0)));
  }

  /** Walks a warband's figure along its path; someone else's only as far as the player at this screen sees it go. */
  async walk(leaderId: string, path: readonly Hex[], ours: boolean): Promise<void> {
    const figure = this.leaders.get(leaderId);
    if (!figure) return;
    for (const hex of path) {
      if (!ours && !this.sees(hex)) return;
      const from = figure.group.position.clone();
      const to = this.standingPoint(hex);
      await this.stage.tween(190, (t) => {
        figure.group.position.lerpVectors(from, to, t);
        figure.group.position.y += Math.sin(t * Math.PI) * 0.12;
      });
    }
  }
}

/** A gold mine: a heap of rock around a glowing seam. */
function orePile(hex: Hex, ore: THREE.Material, rock: THREE.Material): THREE.Group {
  const pile = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + jitter(hex, i) * 0.06, 0), i === 0 ? ore : rock);
    stone.position.set((jitter(hex, i + 5) - 0.5) * 0.5, 0.08, (jitter(hex, i + 9) - 0.5) * 0.5);
    pile.add(stone);
  }
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), ore);
  crystal.position.y = 0.25;
  crystal.scale.y = 1.8;
  pile.add(crystal);
  return pile;
}

/** A Blacksmith: an anvil on a block beside a glowing forge. */
function anvil(iron: THREE.Material, fire: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), iron);
  block.position.y = 0.09;
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.16), iron);
  top.position.y = 0.22;
  const hearth = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 6), iron);
  hearth.position.set(-0.28, 0.06, 0.12);
  const coals = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), fire);
  coals.position.set(-0.28, 0.14, 0.12);
  g.add(block, top, hearth, coals);
  return g;
}

function siteName(city: City): string {
  const owner = city.owner === null ? "Neutral" : city.owner === 0 ? "Your" : "Enemy";
  return city.kind === "capitol" ? `${owner} Capitol` : `${owner} city`;
}

function figureDef(leader: Leader): string {
  const member = leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col);
  return member?.defId ?? leader.squad[0]?.defId ?? "congregant";
}

function isHex(value: unknown): value is Hex {
  if (typeof value !== "object" || value === null) return false;
  return typeof Reflect.get(value, "q") === "number" && typeof Reflect.get(value, "r") === "number";
}
