import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { pass } from "three/tsl";
import * as THREE from "three/webgpu";

/**
 * Spike (2026-09-29, `docs/design/capitol-screen.md`): the Capitol montage as a real-time scene with a scripted,
 * looping camera, the way Unreal's intro was made. The Jilliath Capitol's courtyard at night, from the game's own
 * gothic models: torchlight, fog, a storm sky. `?t=seconds` freezes a moment (for rendering frames).
 */

const LOOP = 24;
const params = new URLSearchParams(location.search);

const loader = new GLTFLoader();
const models = new Map<string, Promise<THREE.Group>>();
function model(slot: string): Promise<THREE.Group> {
  let m = models.get(slot);
  if (!m) {
    m = loader.loadAsync(`/assets/models/${slot}.glb`).then((g) => {
      g.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true;
      });
      return g.scene;
    });
    models.set(slot, m);
  }
  return m;
}

/** A model fitted to a height, standing on the ground at (x, z), turned. */
async function place(scene: THREE.Scene, slot: string, x: number, z: number, height: number, turn: number): Promise<void> {
  const source = await model(slot);
  const box = new THREE.Box3().setFromObject(source);
  const node = source.clone();
  const s = height / (box.max.y - box.min.y);
  node.scale.setScalar(s);
  node.rotation.y = turn;
  node.position.set(x - ((box.min.x + box.max.x) / 2) * s, -box.min.y * s - 0.05, z - ((box.min.z + box.max.z) / 2) * s);
  scene.add(node);
}

function glowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("no 2d canvas");
  const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/** A torch on an iron post: a flickering light, a few flame sprites. Each a fixed function of time. */
class Torch {
  private readonly light: THREE.PointLight;
  private readonly flames: THREE.Sprite[] = [];
  constructor(scene: THREE.Scene, private readonly at: THREE.Vector3, private readonly seed: number, glow: THREE.Texture, shadows: boolean) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, at.y, 6), new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.8 }));
    post.position.set(at.x, at.y / 2, at.z);
    post.castShadow = true;
    scene.add(post);
    this.light = new THREE.PointLight(0xff8a3a, 18, 14, 2);
    this.light.position.copy(at).add(new THREE.Vector3(0, 0.3, 0));
    this.light.castShadow = shadows;
    this.light.shadow.mapSize.set(512, 512);
    scene.add(this.light);
    for (let i = 0; i < 10; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      this.flames.push(sprite);
      scene.add(sprite);
    }
  }
  update(t: number): void {
    const s = this.seed;
    this.light.intensity = 18 * (1 + 0.15 * Math.sin(t * 13.1 + s) + 0.1 * Math.sin(t * 7.3 + s * 2) + 0.06 * Math.sin(t * 23 + s * 3));
    this.flames.forEach((f, i) => {
      const phase = (i * 0.618 + s * 0.1) % 1;
      const life = (t * (1.2 + phase * 0.5) + phase) % 1;
      f.position.set(this.at.x + Math.sin(t * 5 + i) * 0.04 * (1 - life), this.at.y + 0.05 + life * 0.45, this.at.z + Math.cos(t * 4 + i) * 0.04 * (1 - life));
      f.scale.setScalar(0.3 * (1 - life * 0.7));
      f.material.color.setRGB(1, 0.6 - life * 0.4, 0.25 - life * 0.2).multiplyScalar(2.2 * (1 - life));
    });
  }
}

async function main(): Promise<void> {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  await renderer.init();
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
  const textures = new THREE.TextureLoader();
  const sky = await textures.loadAsync("/assets/sky/map.webp");
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;
  scene.backgroundIntensity = 0.5;
  scene.environment = sky;
  scene.environmentIntensity = 0.12;
  // The sky's horizon haze, so the land fades into it without a band.
  scene.fog = new THREE.FogExp2(new THREE.Color(0x3a4246), 0.055);

  const ground = await textures.loadAsync("/assets/ground/hills-1.webp");
  ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
  ground.repeat.set(80, 80);
  ground.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: ground, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Cold moonlight from above the keep.
  const moon = new THREE.DirectionalLight(0x8fa4d8, 0.7);
  moon.position.set(-8, 16, -10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  for (const edge of ["left", "bottom"] as const) moon.shadow.camera[edge] = -25;
  for (const edge of ["right", "top"] as const) moon.shadow.camera[edge] = 25;
  scene.add(moon, new THREE.HemisphereLight(0x3a4458, 0x100c0a, 0.25));

  // The courtyard: the keep at the back, a closed ring of the city's buildings around the plaza (the gaps showed
  // open wilderness), a second ring of rooftops behind, trees beyond.
  const ring: readonly [string, number][] = [
    ["node/cathedral", 3.6], ["node/blacksmith", 2.4], ["structure/merchant", 2.2], ["node/bell_tower", 4.6], ["node/tannery", 2.3], ["node/watchtower", 5.2],
    ["node/ossuary", 2.3], ["node/stables", 2.2], ["structure/mage", 4.4], ["node/foundry", 2.6], ["node/quarry", 2.2], ["node/siege_workshop", 2.4],
  ];
  const keepAngle = -Math.PI / 2;
  await Promise.all([
    place(scene, "site/capitol-jilliath", 0, -10, 9.5, 0),
    ...ring.map(([slot, height], i) => {
      // Around the ring, leaving the keep's arc free.
      const a = keepAngle + 0.75 + (i / (ring.length - 1)) * (Math.PI * 2 - 1.5);
      return place(scene, slot, Math.cos(a) * 9, Math.sin(a) * 9, height, -a - Math.PI / 2);
    }),
    ...Array.from({ length: 10 }, (_, i) => {
      const a = keepAngle + 0.9 + (i / 9) * (Math.PI * 2 - 1.8);
      return place(scene, "site/city", Math.cos(a) * 14, Math.sin(a) * 14, 4.2, -a);
    }),
    ...Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      const r = 20 + ((i * 37) % 7);
      return place(scene, `terrain/tree-${1 + (i % 4)}`, Math.cos(a) * r, Math.sin(a) * r, 5 + ((i * 13) % 5) * 0.4, a * 3);
    }),
  ]);

  const glow = glowTexture();
  // A ring of torches outside the camera's circle, between it and the buildings.
  const torches = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    return new Torch(scene, new THREE.Vector3(Math.cos(a) * 5.4, 1.7, Math.sin(a) * 5.4), i * 1.7, glow, i % 2 === 0);
  });

  // The camera circles inside the plaza, where nothing stands, always looking out at the ring of buildings (radius
  // 7-10) a little ahead of it: it can't clip anything, and every moment frames a building. Height and roll drift
  // slowly, the Unreal intro's glide and dutch angles.
  const eye = (u: number) => {
    const a = u * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 3.2, 2.2 + Math.sin(a * 2) * 0.9, Math.sin(a) * 3.2);
  };
  const look = (u: number) => {
    const a = u * Math.PI * 2 + 0.9;
    return new THREE.Vector3(Math.cos(a) * 9, 3.2 + Math.sin(a * 3) * 1.2, Math.sin(a) * 9);
  };

  const pipeline = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const color = scenePass.getTextureNode("output");
  pipeline.outputNode = color.add(bloom(color, 0.6, 0.6, 0.85));

  const frame = (t: number) => {
    const u = (t % LOOP) / LOOP;
    camera.position.copy(eye(u));
    camera.lookAt(look(u));
    camera.rotateZ(Math.sin(u * Math.PI * 4) * 0.1);
    for (const torch of torches) torch.update(t);
    pipeline.render();
  };

  const fixed = params.get("t");
  if (fixed !== null) {
    frame(Number(fixed));
    await new Promise((r) => requestAnimationFrame(r));
    frame(Number(fixed));
    document.body.dataset["ready"] = "true";
  } else {
    const start = performance.now();
    renderer.setAnimationLoop(() => frame((performance.now() - start) / 1000));
  }
  Object.assign(window, { renderAt: async (t: number) => { frame(t); await new Promise((r) => requestAnimationFrame(r)); frame(t); } });
}

void main();
