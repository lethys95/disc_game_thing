import { EFFECTS } from "#rules/effects";
import { BEHAVIORS } from "#rules/abilities/index";
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { effectiveStats } from "#rules/battle/engine";
import { COLS, ROWS } from "#rules/battle/grid";
import type { Battle, BattleEvent, BattleUnit, Col, Row, Side, Tile } from "#rules/battle/types";
import { artUrl } from "#view/art";
import { element, skull } from "#view/dom";
import type { PlayerColor } from "#rules/world/colors";
import { threeColor } from "#view/colors";
import { buildFigure } from "#view/figures";
import { buildStandee } from "#view/standee";
import { discard, discardChildren } from "#view/stage";
import type { CameraPose, Stage } from "#view/stage";
import { effectDef } from "#rules/effects";
import { UNITS } from "#rules/units/index";
import type { Terrain } from "#rules/map";
import type { BattleSetting } from "#view/battle-setting";
import { GROUND_LOOK, GroundTextures, groundName, HORIZON_MIST, Models, skyTexture, terrainChain, TERRAIN_VARIANTS } from "#view/models";

export interface TileRef {
  readonly side: Side;
  readonly tile: Tile;
}

/** What the hovered action would do to one unit, exactly: health and shield lost, health gained, and whether it dies. */
export interface PreviewMark {
  readonly unitId: string;
  readonly harm: number;
  readonly shield: number;
  readonly heal: number;
  readonly dies: boolean;
  readonly spared: boolean;
}

export interface Highlights {
  readonly current: TileRef | null;
  /** A unit hovered elsewhere (the turn order): shown brighter than anything else. */
  readonly focus?: TileRef | null;
  readonly candidates: readonly TileRef[];
  readonly affected: readonly TileRef[];
}

interface Figure {
  readonly group: THREE.Group;
  readonly bar: HTMLDivElement;
  readonly fill: HTMLDivElement;
  readonly label: CSS2DObject;
  readonly preview: HTMLDivElement;
  /** The stretch of the health bar the previewed action would take away or give back. */
  readonly loss: HTMLDivElement;
  readonly gain: HTMLDivElement;
  readonly materials: THREE.MeshStandardMaterial[];
  /** Each material's glow while standing: a fallen figure goes dark, a risen one gets it back. */
  readonly glow: readonly number[];
  shownHp: number;
  maxHp: number;
  readonly shieldFill: HTMLDivElement;
  /** Spell-charge pips over a caster's bar: filled for charges left, hollow for spent. */
  readonly charges: HTMLDivElement;
  shownShield: number;
  maxShield: number;
  fallen: boolean;
}

/** How high a standing figure's group sits; a fallen one sinks 0.1 below. */
const STANDING_Y = 0.28;
const SPACING = 1.65;
const GAP = 1.15;

export function tilePosition(side: Side, tile: Tile): THREE.Vector3 {
  const x = (side === 0 ? -1 : 1) * (GAP + tile.row * SPACING);
  return new THREE.Vector3(x, 0, (tile.col - 1) * SPACING);
}

const key = (ref: TileRef) => `${ref.side}.${ref.tile.row}.${ref.tile.col}`;

const TILE_BASE = new THREE.Color(0x2a2724);

/**
 * A tile's state as brackets at its four corners, drawn in the interface's own line language
 * (`docs/design/hud-kit.md`): candlelight for the acting unit and a hovered one, red for what an action can pick and
 * what it hits. Brighter means more certain.
 */
const BRACKET = {
  focus: { color: 0xffe2a0, opacity: 1 },
  affected: { color: 0xff4a32, opacity: 1 },
  candidate: { color: 0xc0392b, opacity: 0.75 },
  current: { color: 0xe8c36c, opacity: 0.9 },
} as const;

/** Four L-shaped corners lying flat around a square of `size`, each arm `arm` long and `width` wide. */
function bracketGeometry(size: number, arm: number, width: number): THREE.BufferGeometry {
  const h = size / 2;
  const quads: number[][] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * h;
      const cz = sz * h;
      // Along x from the corner inward, then along z.
      quads.push([cx, cz, cx - sx * arm, cz - sz * width]);
      quads.push([cx, cz, cx - sx * width, cz - sz * arm]);
    }
  }
  const positions: number[] = [];
  for (const [x0, z0, x1, z1] of quads) {
    const [ax, bx] = [Math.min(x0 ?? 0, x1 ?? 0), Math.max(x0 ?? 0, x1 ?? 0)];
    const [az, bz] = [Math.min(z0 ?? 0, z1 ?? 0), Math.max(z0 ?? 0, z1 ?? 0)];
    positions.push(ax, 0, az, ax, 0, bz, bx, 0, bz, ax, 0, az, bx, 0, bz, bx, 0, az);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/** What rings the arena on each terrain: model kind, how many, how far, how big (provisional look). */
const ARENA_PROPS: Readonly<Record<Terrain, readonly { kind: keyof typeof TERRAIN_VARIANTS; variants: number; count: number; radius: [number, number]; height: number; width: number; offset: number }[]>> = {
  plain: [
    { kind: "bush", variants: TERRAIN_VARIANTS.bush, count: 8, radius: [9, 13], height: 0.9, width: 1.3, offset: 0.1 },
    { kind: "rock", variants: TERRAIN_VARIANTS.rock, count: 5, radius: [10, 14], height: 1.1, width: 1.6, offset: 0.4 },
    { kind: "tree", variants: TERRAIN_VARIANTS.tree, count: 5, radius: [15, 20], height: 3.4, width: 2.4, offset: 0.7 },
  ],
  forest: [
    { kind: "tree", variants: TERRAIN_VARIANTS.tree, count: 22, radius: [9.5, 17], height: 3.6, width: 2.4, offset: 0.2 },
    { kind: "bush", variants: TERRAIN_VARIANTS.bush, count: 8, radius: [8.5, 11], height: 0.8, width: 1.2, offset: 0.6 },
  ],
  hills: [
    { kind: "hill", variants: TERRAIN_VARIANTS.hill, count: 5, radius: [13, 18], height: 1.6, width: 7, offset: 0.3 },
    { kind: "rock", variants: TERRAIN_VARIANTS.rock, count: 8, radius: [9, 13], height: 1.2, width: 1.8, offset: 0.8 },
  ],
  mountain: [
    { kind: "mountain", variants: TERRAIN_VARIANTS.mountain, count: 4, radius: [17, 23], height: 8, width: 11, offset: 0.15 },
    { kind: "rock", variants: TERRAIN_VARIANTS.rock, count: 9, radius: [9, 13], height: 1.3, width: 1.9, offset: 0.55 },
  ],
  water: [{ kind: "rock", variants: TERRAIN_VARIANTS.rock, count: 6, radius: [9, 13], height: 1.1, width: 1.6, offset: 0.2 }],
};

export class BattleScene {
  readonly scene = new THREE.Scene();
  /** Aimed short of the field's middle, so the field sits high on the screen, clear of the bottom bar. */
  readonly pose: CameraPose = {
    position: new THREE.Vector3(-2.94, 8.2, 12.53),
    target: new THREE.Vector3(-0.14, 0.4, 1.53),
    minDistance: 8,
    maxDistance: 22,
  };
  private readonly tiles = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>();
  private readonly brackets = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>();
  private readonly figures = new Map<string, Figure>();
  private left: Side = 0;
  /** The ground, textured per terrain (`setSetting`). */
  private readonly ground = new THREE.Mesh(new THREE.CircleGeometry(120, 64), new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 1 }));
  /** The terrain's props and the backdrop around the arena; rebuilt when the setting changes. */
  private readonly settingLayer = new THREE.Group();
  private setting: BattleSetting | null = null;
  private readonly models = new Models();
  private readonly grounds = new GroundTextures();
  private colors: [THREE.Color, THREE.Color] = [threeColor("red"), threeColor("blue")];

  constructor(private readonly stage: Stage) {
    this.buildArena();
  }

  show(): void {
    this.stage.show(this.scene, this.pose);
  }

  private buildArena(): void {
    const sky = skyTexture("map", (panorama) => this.stage.lightWith(this.scene, panorama, 0.6));
    this.scene.background = sky ?? new THREE.Color(0x0b0a0c);
    this.scene.fog = sky ? new THREE.Fog(HORIZON_MIST, 22, 60) : new THREE.FogExp2(0x0b0a0c, 0.03);

    this.scene.add(new THREE.HemisphereLight(0x8a98b8, 0x2a2420, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffe0bc, 3.2);
    keyLight.position.set(-5, 11, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0x7f9cff, 1.2);
    rim.position.set(7, 5, -9);
    this.scene.add(rim);

    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground, this.settingLayer);

    const slab = new THREE.BoxGeometry(SPACING * 0.9, 0.16, SPACING * 0.9);
    const corners = bracketGeometry(SPACING * 0.9, SPACING * 0.24, SPACING * 0.045);
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
          const bracket = new THREE.Mesh(corners, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
          bracket.position.y = 0.085;
          bracket.visible = false;
          tile.add(bracket);
          this.tiles.set(key(ref), tile);
          this.brackets.set(key(ref), bracket);
          this.scene.add(tile);
        }
      }
    }
  }

  /**
   * Dresses the arena for where the fight is: that terrain's ground, a ring of its props (behind and beside the
   * lines: the camera looks in from the front), and the place fought over as a backdrop. Placement is fixed, so a
   * setting always looks the same.
   */
  setSetting(setting: BattleSetting): void {
    if (this.setting && JSON.stringify(this.setting) === JSON.stringify(setting)) return;
    this.setting = setting;
    discardChildren(this.settingLayer);
    const texture = this.grounds.get(groundName(setting.biome, setting.terrain), 1) ?? this.grounds.get(setting.terrain, 1);
    const material = this.ground.material;
    material.map?.dispose();
    material.map = null;
    if (texture) {
      const tiled = texture.clone();
      tiled.userData = {};
      const look = GROUND_LOOK[setting.biome];
      tiled.wrapS = tiled.wrapT = look.seamless ? THREE.RepeatWrapping : THREE.MirroredRepeatWrapping;
      tiled.repeat.set(44, 44);
      tiled.needsUpdate = true;
      material.map = tiled;
      material.color.setScalar(look.tone);
    } else material.color.set(0x1c2230);
    material.needsUpdate = true;
    for (const prop of ARENA_PROPS[setting.terrain]) {
      for (let i = 0; i < prop.count; i++) {
        // Spread over the back arc and the flanks, by golden-angle steps so props don't line up.
        const t = (i * 0.618 + prop.offset) % 1;
        const angle = Math.PI * (0.92 + t * 1.16);
        const radius = prop.radius[0] + ((i * 0.37 + prop.offset) % 1) * (prop.radius[1] - prop.radius[0]);
        const host = new THREE.Group();
        host.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        host.rotation.y = i * 2.3;
        this.settingLayer.add(host);
        const variant = 1 + (i % prop.variants);
        const scale = 0.8 + ((i * 0.53) % 1) * 0.4;
        this.models.dress(host, terrainChain(setting.biome, prop.kind, variant), prop.height * scale, prop.width * scale);
      }
    }
    if (setting.backdrop) {
      const host = new THREE.Group();
      host.position.set(0, 0, -13);
      this.settingLayer.add(host);
      this.models.dress(host, setting.backdrop, 6, 11);
    }
  }

  /**
   * Which battle side is drawn on the left: the player's own, so your squad is on the left whether you attack
   * (side 0) or defend (side 1). Call before `reset`.
   */
  setLeft(side: Side): void {
    this.left = side;
    for (const tile of this.tiles.values()) {
      const ref = asTileRef(tile.userData);
      if (ref) tile.position.copy(this.position(ref.side, ref.tile)).setY(0.2);
    }
  }

  private position(side: Side, tile: Tile): THREE.Vector3 {
    return tilePosition(side === this.left ? 0 : 1, tile);
  }

  /** The owners' player colors, for figures made from now on (call before `reset`). */
  setColors(colors: readonly [PlayerColor, PlayerColor]): void {
    this.colors = [threeColor(colors[0]), threeColor(colors[1])];
  }

  /** Places every figure where the battle says it is. */
  sync(battle: Battle): void {
    for (const unit of Object.values(battle.units)) {
      const figure = this.figures.get(unit.id) ?? this.addFigure(unit);
      figure.maxHp = effectiveStats(battle, unit.id).maxHp;
      figure.shownHp = unit.hp;
      figure.maxShield = unit.base.shield;
      figure.shownShield = unit.shield;
      const battery = UNITS[unit.defId]?.spellCharges ?? 0;
      figure.charges.hidden = battery === 0 || !unit.alive;
      figure.charges.replaceChildren(
        ...Array.from({ length: battery }, (_, i) => {
          const pip = document.createElement("span");
          pip.className = i < unit.spellCharges ? "pip" : "pip spent";
          return pip;
        }),
      );
      this.updateBar(figure);
      figure.group.position.copy(this.position(unit.side, unit.tile)).setY(STANDING_Y);
      // Off the field for now (Spiritwalk): hidden until it returns.
      figure.group.visible = !unit.fled && !unit.effects.some((e) => EFFECTS.get(e.def)?.absent);
      if (!unit.alive && !unit.fled && !figure.fallen) this.topple(figure, 0);
      if (unit.alive && figure.fallen) this.rise(figure, 0);
    }
  }

  private addFigure(unit: BattleUnit): Figure {
    const portrait = artUrl({ kind: "portrait", id: unit.defId });
    const owner = this.colors[unit.side];
    // Statues: light for the side on the left (yours), dark for the other.
    const group = portrait ? buildStandee(portrait, owner) : buildFigure(unit.defId, unit.side === this.left ? 0 : 1, owner);
    group.rotation.y = unit.side === this.left ? 0 : Math.PI;
    group.userData = { unitId: unit.id };
    if (unit.leader) group.add(crown());
    const materials: THREE.MeshStandardMaterial[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        materials.push(child.material);
      }
    });

    const bar = document.createElement("div");
    bar.className = "hpbar";
    const fill = document.createElement("div");
    fill.className = "fill";
    bar.appendChild(fill);
    const label = new CSS2DObject(bar);
    // Standees are taller than the statues; their bars sit above the card.
    const top = portrait ? 2.1 : 1.75;
    label.position.set(0, top, 0);
    group.add(label);
    const preview = document.createElement("div");
    preview.className = "preview";
    preview.hidden = true;
    const previewLabel = new CSS2DObject(preview);
    previewLabel.position.set(0, top + 0.4, 0);
    group.add(previewLabel);

    this.scene.add(group);
    const shieldFill = document.createElement("div");
    shieldFill.className = "shield";
    bar.appendChild(shieldFill);
    const charges = document.createElement("div");
    charges.className = "charges";
    bar.appendChild(charges);
    const loss = document.createElement("div");
    loss.className = "loss";
    loss.hidden = true;
    const gain = document.createElement("div");
    gain.className = "gain";
    gain.hidden = true;
    bar.append(loss, gain);
    const figure: Figure = {
      group, bar, fill, label, preview, loss, gain, materials, charges, glow: materials.map((m) => m.emissiveIntensity),
      shownHp: unit.hp, maxHp: unit.base.maxHp,
      shieldFill, shownShield: unit.shield, maxShield: unit.base.shield,
      fallen: false,
    };
    this.figures.set(unit.id, figure);
    return figure;
  }

  private updateBar(figure: Figure): void {
    figure.fill.style.width = `${Math.max(0, (100 * figure.shownHp) / figure.maxHp)}%`;
    figure.shieldFill.hidden = figure.maxShield === 0;
    figure.shieldFill.style.width = figure.maxShield === 0 ? "0" : `${Math.max(0, (100 * figure.shownShield) / figure.maxShield)}%`;
    figure.bar.dataset.hp = `${Math.max(0, figure.shownHp)}`;
    figure.bar.hidden = figure.fallen;
  }

  private topple(figure: Figure, duration: number): Promise<void> {
    figure.fallen = true;
    figure.group.userData["fallen"] = true;
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
    return this.stage.tween(duration, (t) => apply(1 - (1 - t) ** 3));
  }

  /** Topple played backwards: a fallen unit brought back (Resurrection). */
  private rise(figure: Figure, duration: number): Promise<void> {
    figure.fallen = false;
    figure.group.userData["fallen"] = false;
    figure.bar.hidden = false;
    figure.materials.forEach((m, i) => (m.emissiveIntensity = figure.glow[i] ?? 0));
    const apply = (t: number) => {
      figure.group.rotation.x = (Math.PI / 2) * (1 - t);
      figure.group.position.y = STANDING_Y - 0.1 * (1 - t);
    };
    if (duration === 0) {
      apply(1);
      return Promise.resolve();
    }
    return this.stage.tween(duration, (t) => apply(1 - (1 - t) ** 3));
  }

  /** Removes every figure, for a fresh battle or a new formation preview. */
  reset(): void {
    for (const figure of this.figures.values()) discard(figure.group);
    this.figures.clear();
    this.setHighlights({ current: null, candidates: [], affected: [] });
  }

  /** Shows the exact outcome of the hovered action above each figure it touches, and on its health bar. */
  showPreview(marks: readonly PreviewMark[]): void {
    for (const [unitId, figure] of this.figures) {
      const mark = marks.find((m) => m.unitId === unitId);
      figure.preview.hidden = !mark;
      figure.loss.hidden = !mark || mark.harm <= 0;
      figure.gain.hidden = !mark || mark.heal <= 0;
      if (!mark) continue;
      const hp = Math.max(0, figure.shownHp);
      const share = (amount: number) => `${Math.max(0, Math.min(100, (100 * amount) / figure.maxHp))}%`;
      const lost = Math.min(mark.harm, hp);
      figure.loss.style.left = share(hp - lost);
      figure.loss.style.width = share(lost);
      figure.gain.style.left = share(hp);
      figure.gain.style.width = share(Math.min(mark.heal, figure.maxHp - hp));
      figure.preview.className = `preview ${mark.dies ? "death" : mark.heal > mark.harm ? "heal" : "harm"}`;
      figure.preview.replaceChildren();
      if (mark.dies) figure.preview.appendChild(skull());
      if (mark.harm > 0) figure.preview.appendChild(element("span", "amount", `−${mark.harm}`));
      if (mark.heal > 0) figure.preview.appendChild(element("span", "amount heal", `+${mark.heal}`));
      if (mark.shield > 0) figure.preview.appendChild(element("span", "amount shield", `−${mark.shield}`));
      if (mark.spared) figure.preview.appendChild(element("span", "note", "spared"));
      if (mark.dies) figure.preview.title = "Lethal";
    }
  }

  setHighlights(highlights: Highlights): void {
    const candidates = new Set(highlights.candidates.map(key));
    const affected = new Set(highlights.affected.map(key));
    const current = highlights.current ? key(highlights.current) : null;
    const focus = highlights.focus ? key(highlights.focus) : null;
    for (const [k, bracket] of this.brackets) {
      const state = k === focus ? BRACKET.focus : affected.has(k) ? BRACKET.affected : candidates.has(k) ? BRACKET.candidate : k === current ? BRACKET.current : null;
      bracket.visible = state !== null;
      if (!state) continue;
      bracket.material.color.setHex(state.color);
      bracket.material.opacity = state.opacity;
    }
  }

  /** Where the figure on a tile shows its chest, in client pixels; used by automated play-testing. */
  screenPoint(ref: TileRef): { x: number; y: number } {
    return this.stage.project(this.position(ref.side, ref.tile).setY(1.3));
  }

  /** The tile under a screen point: a tile slab, or the tile of the figure standing there. */
  pick(clientX: number, clientY: number, battle: Battle): TileRef | null {
    const targets: THREE.Object3D[] = [...this.tiles.values()];
    for (const figure of this.figures.values()) if (!figure.fallen) targets.push(figure.group);
    for (const hit of this.stage.intersect(clientX, clientY, targets)) {
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
        case "shieldHit":
          pending.push(this.shieldChange(event.unitId, -event.amount));
          break;
        case "shieldRestored":
          pending.push(this.shieldChange(event.unitId, event.amount));
          break;
        case "heal":
          pending.push(this.heal(event.unitId, event.amount));
          break;
        case "death": {
          const figure = this.figures.get(event.unitId);
          if (figure) pending.push(this.topple(figure, 650));
          break;
        }
        case "fled": {
          const figure = this.figures.get(event.unitId);
          if (figure) {
            this.float(event.unitId, "Fled", "effect");
            figure.group.visible = false;
          }
          break;
        }
        case "deathPrevented":
          this.float(event.unitId, "Spared", "spared");
          break;
        case "revived": {
          const figure = this.figures.get(event.unitId);
          if (figure) pending.push(this.rise(figure, 650));
          this.float(event.unitId, "Risen", "spared");
          break;
        }
        case "crit":
          this.float(event.target, "Crit!", "spared");
          break;
        case "evaded":
          this.float(event.unitId, "Evaded", "effect");
          break;
        case "effect":
          if (!effectDef(event.effect).quiet) this.float(event.unitId, effectDef(event.effect).name, "effect");
          break;
        case "move":
          pending.push(this.slide(event.unitId, battle.units[event.unitId]?.side ?? 0, event.to));
          break;
        case "absorbed":
          this.float(event.unitId, `-${event.amount}`, "shield");
          break;
        case "effectEnded":
          break;
        case "countered":
          this.float(event.unitId, "Countered!", "spared");
          break;
        case "skipped":
          this.float(event.unitId, event.reason === "lostTurn" ? "Loses turn" : "No action", "effect");
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
    // Melee lunges at its target; spells, pulls and the like don't (by tag, never by ability).
    const behavior = BEHAVIORS[abilityId];
    const melee = behavior?.kind === "active" && behavior.tags.includes("melee");
    const lunges = targetFigure && targets[0] !== unitId && melee;
    if (lunges) {
      const toward = targetFigure.group.position.clone().sub(home).setY(0).normalize().multiplyScalar(0.9);
      await this.stage.tween(170, (t) => figure.group.position.copy(home).addScaledVector(toward, t * t));
      await this.stage.tween(230, (t) => figure.group.position.copy(home).addScaledVector(toward, 1 - t));
      figure.group.position.copy(home);
      return;
    }
    const scale = figure.group.scale.x;
    await this.stage.tween(300, (t) => figure.group.scale.setScalar(scale * (1 + 0.12 * Math.sin(t * Math.PI))));
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
    await this.stage.tween(260, (t) => {
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
    await this.stage.tween(300, () => {});
  }

  private async slide(unitId: string, side: Side, to: Tile): Promise<void> {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    const from = figure.group.position.clone();
    const target = this.position(side, to).setY(STANDING_Y);
    await this.stage.tween(380, (t) => figure.group.position.lerpVectors(from, target, 1 - (1 - t) ** 2));
  }

  private async shieldChange(unitId: string, amount: number): Promise<void> {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    figure.shownShield += amount;
    this.updateBar(figure);
    this.float(unitId, amount < 0 ? `${amount}` : `+${amount}`, "shield");
    await this.stage.tween(260, () => {});
  }

  private float(unitId: string, text: string, kind: "damage" | "bleed" | "heal" | "effect" | "spared" | "shield"): void {
    const figure = this.figures.get(unitId);
    if (!figure) return;
    // CSS2DRenderer positions the outer element through its transform; the animation must live on an inner one.
    const div = document.createElement("div");
    const inner = document.createElement("div");
    inner.className = `float ${kind}`;
    inner.textContent = text;
    div.appendChild(inner);
    const label = new CSS2DObject(div);
    // Anchored in the world, not on the figure: a toppling figure would swing its own damage number around.
    label.position.copy(figure.group.position).add(new THREE.Vector3(0, 2.4, 0));
    this.scene.add(label);
    window.setTimeout(() => {
      this.scene.remove(label);
      div.remove();
    }, 1300);
  }
}

/** A small gold crown floating over a leader's head. */
function crown(): THREE.Group {
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b36a, emissive: 0xd9a431, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.35 });
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 12, 1, true), gold);
  g.add(band);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 4), gold);
    point.position.set(Math.cos(angle) * 0.16, 0.08, Math.sin(angle) * 0.16);
    g.add(point);
  }
  g.position.y = 2.0;
  return g;
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
