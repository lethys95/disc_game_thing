import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { COLS, ROWS } from "#rules/grid";
import type { Battle, BattleEvent, BattleUnit, Col, Row, Side, Tile } from "#rules/types";
import { UNITS } from "#rules/units";
import { buildFigure, PALETTES } from "#view/figures";
import { EFFECT_TEXT } from "#view/text";

export interface TileRef {
  readonly side: Side;
  readonly tile: Tile;
}

export interface Highlights {
  readonly current: TileRef | null;
  readonly candidates: readonly TileRef[];
  readonly affected: readonly TileRef[];
}

interface Figure {
  readonly group: THREE.Group;
  readonly bar: HTMLDivElement;
  readonly fill: HTMLDivElement;
  readonly label: CSS2DObject;
  readonly materials: THREE.MeshStandardMaterial[];
  shownHp: number;
  maxHp: number;
  fallen: boolean;
}

interface Tween {
  readonly start: number;
  readonly duration: number;
  readonly update: (t: number) => void;
  readonly done: () => void;
}

const SPACING = 1.65;
const GAP = 1.15;

export function tilePosition(side: Side, tile: Tile): THREE.Vector3 {
  const x = (side === 0 ? -1 : 1) * (GAP + tile.row * SPACING);
  return new THREE.Vector3(x, 0, (tile.col - 1) * SPACING);
}

const key = (ref: TileRef) => `${ref.side}.${ref.tile.row}.${ref.tile.col}`;

const TILE_BASE = new THREE.Color(0x2a2724);
const TILE_CANDIDATE = new THREE.Color(0x5a1410);
const TILE_AFFECTED = new THREE.Color(0xd8321f);
const TILE_CURRENT = new THREE.Color(0x8a7040);

export class BattleScene {
  readonly renderer: THREE.WebGLRenderer;
  private readonly labels: CSS2DRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly tiles = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>();
  private readonly figures = new Map<string, Figure>();
  private readonly tweens: Tween[] = [];
  private readonly raycaster = new THREE.Raycaster();

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.appendChild(this.renderer.domElement);

    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = "labels";
    host.appendChild(this.labels.domElement);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    this.camera.position.set(-2.4, 8.2, 10.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0.4, 0.4, -0.6);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 22;
    this.controls.minPolarAngle = 0.35;
    this.controls.maxPolarAngle = 1.25;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.8);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.buildArena();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  private buildArena(): void {
    const dusk = new THREE.Color(0x0b0a0c);
    this.scene.background = dusk;
    this.scene.fog = new THREE.FogExp2(dusk, 0.03);

    this.scene.add(new THREE.HemisphereLight(0x8a90b0, 0x2a1c16, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffd6a8, 3.2);
    keyLight.position.set(-5, 11, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0x7f9cff, 1.4);
    rim.position.set(7, 5, -9);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(40, 48),
      new THREE.MeshStandardMaterial({ color: 0x121110, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(8.2, 8.6, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0x1d1b19, roughness: 0.95 }),
    );
    floor.position.y = 0.06;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1817, roughness: 0.9 });
    const emberMaterial = new THREE.MeshStandardMaterial({ color: 0xc0281c, emissive: 0xc0281c, emissiveIntensity: 3 });
    // Only behind and beside the arena: the default camera looks in from +z.
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI * (0.95 + (i / 8) * 1.1);
      const pillar = new THREE.Group();
      const height = 5 + (i % 3) * 1.2;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.7, height, 0.7), pillarMaterial);
      shaft.position.y = height / 2;
      shaft.castShadow = true;
      pillar.add(shaft);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 4), pillarMaterial);
      spire.position.y = height + 0.7;
      spire.rotation.y = Math.PI / 4;
      pillar.add(spire);
      const ember = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.08), emberMaterial);
      ember.position.set(0, 1.4, 0.34);
      pillar.add(ember);
      pillar.position.set(Math.cos(angle) * 10.5, 0, Math.sin(angle) * 10.5);
      pillar.lookAt(0, 0, 0);
      this.scene.add(pillar);
    }
    for (const x of [-6, 6]) {
      const glow = new THREE.PointLight(0xc0281c, 6, 9, 1.6);
      glow.position.set(x, 1.2, -5);
      this.scene.add(glow);
    }

    const slab = new THREE.BoxGeometry(SPACING * 0.9, 0.16, SPACING * 0.9);
    for (const side of [0, 1] as const) {
      for (const row of ROWS) {
        for (const col of COLS) {
          const ref = { side, tile: { row, col } };
          const tile = new THREE.Mesh(
            slab,
            new THREE.MeshStandardMaterial({ color: 0x2e2b28, roughness: 0.8, emissive: TILE_BASE.clone(), emissiveIntensity: 0.2 }),
          );
          tile.position.copy(tilePosition(side, ref.tile)).setY(0.2);
          tile.receiveShadow = true;
          tile.userData = ref;
          this.tiles.set(key(ref), tile);
          this.scene.add(tile);
        }
      }
    }
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.host;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
  }

  private frame(time: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tween = this.tweens[i];
      if (!tween) continue;
      const t = Math.min(1, (time - tween.start) / tween.duration);
      tween.update(t);
      if (t >= 1) {
        this.tweens.splice(i, 1);
        tween.done();
      }
    }
    this.controls.update();
    this.composer.render();
    this.labels.render(this.scene, this.camera);
  }

  private tween(duration: number, update: (t: number) => void): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.push({ start: performance.now(), duration, update, done: resolve });
    });
  }

  /** Places every figure where the battle says it is. */
  sync(battle: Battle): void {
    for (const unit of Object.values(battle.units)) {
      const figure = this.figures.get(unit.id) ?? this.addFigure(unit);
      figure.maxHp = unit.base.maxHp;
      figure.shownHp = unit.hp;
      this.updateBar(figure);
      figure.group.position.copy(tilePosition(unit.side, unit.tile)).setY(0.28);
      if (!unit.alive && !figure.fallen) this.topple(figure, 0);
    }
  }

  private addFigure(unit: BattleUnit): Figure {
    const def = UNITS[unit.defId];
    const group = buildFigure(unit.defId, def?.tier ?? 1, PALETTES[unit.side], unit.damageType === "fire");
    group.rotation.y = unit.side === 0 ? 0 : Math.PI;
    group.userData = { unitId: unit.id };
    const materials: THREE.MeshStandardMaterial[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        materials.push(child.material);
      }
    });

    const bar = document.createElement("div");
    bar.className = `hpbar side${unit.side}`;
    const fill = document.createElement("div");
    fill.className = "fill";
    bar.appendChild(fill);
    const label = new CSS2DObject(bar);
    label.position.set(0, 1.75, 0);
    group.add(label);

    this.scene.add(group);
    const figure: Figure = { group, bar, fill, label, materials, shownHp: unit.hp, maxHp: unit.base.maxHp, fallen: false };
    this.figures.set(unit.id, figure);
    return figure;
  }

  private updateBar(figure: Figure): void {
    figure.fill.style.width = `${Math.max(0, (100 * figure.shownHp) / figure.maxHp)}%`;
    figure.bar.dataset.hp = `${Math.max(0, figure.shownHp)}`;
    figure.bar.hidden = figure.fallen;
  }

  private topple(figure: Figure, duration: number): Promise<void> {
    figure.fallen = true;
    figure.bar.hidden = true;
    const startY = figure.group.position.y;
    for (const m of figure.materials) m.emissiveIntensity = 0;
    const apply = (t: number) => {
      figure.group.rotation.x = (Math.PI / 2) * t;
      figure.group.position.y = startY - 0.1 * t;
    };
    if (duration === 0) {
      apply(1);
      return Promise.resolve();
    }
    return this.tween(duration, (t) => apply(1 - (1 - t) ** 3));
  }

  setHighlights(highlights: Highlights): void {
    const candidates = new Set(highlights.candidates.map(key));
    const affected = new Set(highlights.affected.map(key));
    const current = highlights.current ? key(highlights.current) : null;
    for (const [k, tile] of this.tiles) {
      const color = affected.has(k) ? TILE_AFFECTED : candidates.has(k) ? TILE_CANDIDATE : k === current ? TILE_CURRENT : TILE_BASE;
      tile.material.emissive.copy(color);
      tile.material.emissiveIntensity = color === TILE_BASE ? 0.2 : color === TILE_AFFECTED ? 1.6 : 1;
    }
  }

  /** Where the figure on a tile shows its chest, in client pixels; used by automated play-testing. */
  screenPoint(ref: TileRef): { x: number; y: number } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const point = tilePosition(ref.side, ref.tile).setY(1.3).project(this.camera);
    return { x: rect.left + ((point.x + 1) / 2) * rect.width, y: rect.top + ((1 - point.y) / 2) * rect.height };
  }

  /** The tile under a screen point: a tile slab, or the tile of the figure standing there. */
  pick(clientX: number, clientY: number, battle: Battle): TileRef | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    const targets: THREE.Object3D[] = [...this.tiles.values()];
    for (const figure of this.figures.values()) if (!figure.fallen) targets.push(figure.group);
    for (const hit of this.raycaster.intersectObjects(targets, true)) {
      let object: THREE.Object3D | null = hit.object;
      while (object) {
        const unitId: unknown = object.userData["unitId"];
        if (typeof unitId === "string") {
          const unit = battle.units[unitId];
          if (unit?.alive) return { side: unit.side, tile: unit.tile };
        }
        const ref = asTileRef(object.userData);
        if (ref) return ref;
        object = object.parent;
      }
    }
    return null;
  }

  /** Animates one step's events, then snaps to the resulting state. */
  async play(events: readonly BattleEvent[], battle: Battle): Promise<void> {
    const pending: Promise<void>[] = [];
    for (const event of events) {
      switch (event.type) {
        case "ability":
          await Promise.all(pending.splice(0));
          await this.gesture(event.unitId, event.abilityId, event.targets);
          break;
        case "damage":
          pending.push(this.hit(event.unitId, event.amount, event.source === null));
          break;
        case "heal":
          pending.push(this.heal(event.unitId, event.amount));
          break;
        case "death": {
          const figure = this.figures.get(event.unitId);
          if (figure) pending.push(this.topple(figure, 650));
          break;
        }
        case "deathPrevented":
          this.float(event.unitId, "Spared", "spared");
          break;
        case "effect":
          if (event.effect !== "deathward") this.float(event.unitId, EFFECT_TEXT[event.effect], "effect");
          break;
        case "move":
          pending.push(this.slide(event.unitId, battle.units[event.unitId]?.side ?? 0, event.to));
          break;
        case "skipped":
          this.float(event.unitId, event.reason === "stunned" ? "Stunned" : "No action", "effect");
          break;
        case "turnStart":
        case "roundStart":
        case "battleEnd":
          break;
      }
    }
    await Promise.all(pending);
    this.sync(battle);
  }

  private async gesture(unitId: string, abilityId: string, targets: readonly string[]): Promise<void> {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    const home = figure.group.position.clone();
    const targetFigure = targets[0] ? this.figures.get(targets[0]) : undefined;
    const lunges = targetFigure && targets[0] !== unitId && abilityId !== "hook";
    if (lunges) {
      const toward = targetFigure.group.position.clone().sub(home).setY(0).normalize().multiplyScalar(0.9);
      await this.tween(170, (t) => figure.group.position.copy(home).addScaledVector(toward, t * t));
      await this.tween(230, (t) => figure.group.position.copy(home).addScaledVector(toward, 1 - t));
      figure.group.position.copy(home);
      return;
    }
    const scale = figure.group.scale.x;
    await this.tween(300, (t) => figure.group.scale.setScalar(scale * (1 + 0.12 * Math.sin(t * Math.PI))));
  }

  private async hit(unitId: string, amount: number, bleed: boolean): Promise<void> {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    figure.shownHp -= amount;
    this.updateBar(figure);
    this.float(unitId, `-${amount}`, bleed ? "bleed" : "damage");
    const body = figure.materials[0];
    if (!body) return;
    const original = body.emissive.clone();
    await this.tween(260, (t) => {
      body.emissive.setRGB(1, 0.85, 0.7).lerp(original, t);
      body.emissiveIntensity = 1.4 * (1 - t);
    });
    body.emissive.copy(original);
  }

  private async heal(unitId: string, amount: number): Promise<void> {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    figure.shownHp += amount;
    this.updateBar(figure);
    this.float(unitId, `+${amount}`, "heal");
    await this.tween(300, () => {});
  }

  private async slide(unitId: string, side: Side, to: Tile): Promise<void> {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    const from = figure.group.position.clone();
    const target = tilePosition(side, to).setY(0.28);
    await this.tween(380, (t) => figure.group.position.lerpVectors(from, target, 1 - (1 - t) ** 2));
  }

  private float(unitId: string, text: string, kind: "damage" | "bleed" | "heal" | "effect" | "spared"): void {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    const div = document.createElement("div");
    div.className = `float ${kind}`;
    div.textContent = text;
    const label = new CSS2DObject(div);
    label.position.set(0, 2.4, 0);
    figure.group.add(label);
    window.setTimeout(() => {
      figure.group.remove(label);
      div.remove();
    }, 1300);
  }
}

function asTileRef(data: Record<string, unknown>): TileRef | null {
  const side = data["side"];
  const tile = data["tile"];
  if ((side !== 0 && side !== 1) || typeof tile !== "object" || tile === null) return null;
  const row: unknown = Reflect.get(tile, "row");
  const col: unknown = Reflect.get(tile, "col");
  if (!isIndex(row) || !isIndex(col)) return null;
  return { side, tile: { row, col } };
}

function isIndex(value: unknown): value is Row & Col {
  return value === 0 || value === 1 || value === 2;
}
