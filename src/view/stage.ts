import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

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

/** One renderer, camera and post-processing chain; the battle and the map take turns being shown. */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  private readonly labels = new CSS2DRenderer();
  private readonly controls: OrbitControls;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly bloom: UnrealBloomPass;
  private readonly tweens: Tween[] = [];
  private active: THREE.Scene = new THREE.Scene();
  private readonly raycaster = new THREE.Raycaster();
  /** Animation speed from the settings: multiplies every animation and AI pause. */
  private speedScale = 1;
  /** Automated play-tests run the game faster still. */
  testScale = 1;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
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

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.active, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.8);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

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
    this.renderPass.scene = scene;
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
    this.labels.render(this.active, this.camera);
  }
}
