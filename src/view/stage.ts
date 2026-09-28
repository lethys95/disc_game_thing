import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { smaa } from "three/addons/tsl/display/SMAANode.js";
import { colorToDirection, diffuseColor, directionToColor, float, mrt, normalView, output, pass, renderOutput, sample, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";

/** `scene.userData` key: the scene wants screen-space global illumination (see `Stage.chain`). */
export const BOUNCE_LIGHT = "bounceLight";

export interface CameraPose {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly minDistance: number;
  readonly maxDistance: number;
}

interface Tween {
  readonly start: number;
  readonly duration: number;
  readonly update: (t: number) => void;
  readonly done: () => void;
}

/**
 * One renderer, camera and post-processing chain; the battle and the map take turns being shown. WebGPU (M57), where
 * three.js keeps its modern lighting; it falls back to WebGL 2 by itself where a browser has no WebGPU.
 */
/** How quickly a glide eases towards its speed, and to a stop (per second, exponential). */
const GLIDE_EASE = 8;

export class Stage {
  private readonly glideVelocity = new THREE.Vector2();
  private readonly glideTarget = new THREE.Vector2();
  private glideLimit = 0;
  private lastFrame = 0;
  readonly renderer: THREE.WebGPURenderer;
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  private readonly labels = new CSS2DRenderer();
  private readonly controls: OrbitControls;
  private readonly pipeline: THREE.RenderPipeline;
  private readonly tweens: Tween[] = [];
  private active: THREE.Scene = new THREE.Scene();
  private readonly raycaster = new THREE.Raycaster();
  /** Animation speed from the settings: multiplies every animation and AI pause. */
  private speedScale = 1;
  /** Automated play-tests run the game faster still. */
  testScale = 1;

  constructor(private readonly host: HTMLElement) {
    // Antialiasing happens at the end of the chain (SMAA): screen-space lighting can't read a multisampled depth buffer.
    this.renderer = new THREE.WebGPURenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.appendChild(this.renderer.domElement);
    this.labels.domElement.className = "labels";
    host.appendChild(this.labels.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Middle-drag pans over the ground; right-click stays free for peeks and cancelling.
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: null };
    this.controls.enableDamping = true;
    this.controls.minPolarAngle = 0.35;
    this.controls.maxPolarAngle = 1.25;

    this.pipeline = new THREE.RenderPipeline(this.renderer);
    this.pipeline.outputColorTransform = false;
    this.pipeline.outputNode = this.chain(this.active);

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  show(scene: THREE.Scene, pose: CameraPose): void {
    if (scene === this.active) return;
    // CSS2DRenderer only updates labels of the scene it renders; hide the outgoing scene's labels itself.
    this.active.traverse((object) => {
      if (object instanceof CSS2DObject) object.element.style.display = "none";
    });
    this.active = scene;
    this.pipeline.outputNode = this.chain(scene);
    this.pipeline.needsUpdate = true;
    this.camera.position.copy(pose.position);
    this.controls.target.copy(pose.target);
    this.controls.minDistance = pose.minDistance;
    this.controls.maxDistance = pose.maxDistance;
    this.controls.update();
  }

  get timeScale(): number {
    return this.speedScale * this.testScale;
  }

  /** The player's settings: how fast animations run, how fast the camera turns and zooms. */
  setFeel(speedScale: number, rotate: number, zoom: number): void {
    this.speedScale = speedScale;
    this.controls.rotateSpeed = rotate;
    this.controls.zoomSpeed = zoom;
  }

  /**
   * Slides the camera and what it looks at over the ground: `forward` along the view, `right` across it, in world
   * units; the target stays within `limit` of the origin.
   */
  pan(right: number, forward: number, limit: number): void {
    const ahead = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).setY(0).normalize();
    const side = new THREE.Vector3().crossVectors(ahead, new THREE.Vector3(0, 1, 0));
    const move = ahead.multiplyScalar(forward).add(side.multiplyScalar(right));
    const target = this.controls.target.clone().add(move);
    const flat = new THREE.Vector2(target.x, target.z);
    if (flat.length() > limit) move.sub(new THREE.Vector3(target.x, 0, target.z).setLength(flat.length() - limit));
    this.controls.target.add(move);
    this.camera.position.add(move);
    this.controls.update();
  }

  /**
   * Sets the speed the camera glides over the ground at (world units per second; zero to stop). It eases into and
   * out of it rather than stepping. `limit` as for `pan`.
   */
  glide(right: number, forward: number, limit: number): void {
    this.glideTarget.set(right, forward);
    this.glideLimit = limit;
  }

  /** Lights `scene` with a panorama (its sky): soft, colored light from all around, and reflections on rough surfaces. */
  lightWith(scene: THREE.Scene, panorama: THREE.Texture, intensity: number): void {
    scene.environment = panorama;
    scene.environmentIntensity = intensity;
  }

  /**
   * The post-processing for a scene: soft shadow where things meet, a little bloom on what glows, then tone mapping
   * and antialiasing. A scene that asks for it (`BOUNCE_LIGHT`: the map) also gets screen-space global
   * illumination, light bouncing off the ground onto what stands on it. The battle doesn't: its paper standees
   * wash out under it. Both are denoised within each frame, not over frames, so a still picture stays sharp.
   */
  private chain(scene: THREE.Scene) {
    const scenePass = pass(scene, this.camera);
    scenePass.setMRT(mrt({ output, diffuseColor, normal: directionToColor(normalView) }));
    for (const name of ["diffuseColor", "normal"]) scenePass.getTexture(name).type = THREE.UnsignedByteType;
    const color = scenePass.getTextureNode("output");
    const depth = scenePass.getTextureNode("depth");
    const normal = sample((uv) => colorToDirection(scenePass.getTextureNode("normal").sample(uv)));
    let lit;
    if (scene.userData[BOUNCE_LIGHT] === true) {
      const light = ssgi(color, depth, normal, this.camera);
      light.useTemporalFiltering = false;
      light.sliceCount.value = 3;
      light.stepCount.value = 8;
      light.radius.value = 2.5;
      light.giIntensity.value = 0.6;
      lit = vec4(color.rgb.mul(light.a).add(scenePass.getTextureNode("diffuseColor").rgb.mul(light.rgb)), color.a);
    } else {
      const occlusion = ao(depth, normal, this.camera);
      occlusion.resolutionScale = 0.5;
      occlusion.radius.value = 0.6;
      occlusion.distanceExponent.value = 1.5;
      occlusion.thickness.value = 1;
      occlusion.scale.value = 1.2;
      lit = color.mul(float(1).sub(float(0.85).mul(float(1).sub(occlusion.getTextureNode().r))));
    }
    return smaa(renderOutput(lit.add(bloom(lit, 0.55, 0.5, 0.8))));
  }

  tween(duration: number, update: (t: number) => void): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.push({ start: performance.now(), duration: Math.max(1, duration * this.timeScale), update, done: resolve });
    });
  }

  /** Objects under a screen point, nearest first. */
  intersect(clientX: number, clientY: number, targets: readonly THREE.Object3D[]): THREE.Intersection[] {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    return this.raycaster.intersectObjects([...targets], true);
  }

  /** Where a world point appears on screen, in client pixels. */
  project(point: THREE.Vector3): { x: number; y: number } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const p = point.clone().project(this.camera);
    return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height };
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.host;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
  }

  private frame(time: number): void {
    const dt = Math.min(0.05, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    this.glideVelocity.lerp(this.glideTarget, 1 - Math.exp(-dt * GLIDE_EASE));
    if (this.glideVelocity.lengthSq() > 1e-4) this.pan(this.glideVelocity.x * dt, this.glideVelocity.y * dt, this.glideLimit);
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
    this.pipeline.render();
    this.labels.render(this.active, this.camera);
  }
}

/**
 * Takes `object` out of the scene and frees what it holds on the GPU (geometries, materials, their textures) and its
 * floating labels. Three.js never frees them by itself; a fresh map or battle would otherwise leak the old one's.
 */
export function discard(object: THREE.Object3D): void {
  object.removeFromParent();
  object.traverse((child) => {
    if (child instanceof CSS2DObject) child.element.remove();
    // A loaded model's geometry and materials are shared by every place that shows it (`view/models.ts`).
    if (!(child instanceof THREE.Mesh) || child.userData["shared"]) return;
    child.geometry.dispose();
    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      // Textures a cache hands out (`view/models.ts`) outlive any one place.
      if (material instanceof THREE.MeshStandardMaterial && !material.map?.userData["shared"]) material.map?.dispose();
      material.dispose();
    }
  });
}

/** `discard` for everything under `parent`, keeping `parent` itself. */
export function discardChildren(parent: THREE.Object3D): void {
  for (const child of [...parent.children]) discard(child);
}
