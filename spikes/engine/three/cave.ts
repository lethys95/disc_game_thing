import { vxgi } from "three/addons/lighting/vxgi/VXGINode.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { bilateralBlur } from "three/addons/tsl/display/BilateralBlurNode.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { depthAwareBlend } from "three/addons/tsl/display/depthAwareBlend.js";
import { godrays } from "three/addons/tsl/display/GodraysNode.js";
import { builtinGIContext, colorToDirection, directionToColor, mrt, normalView, pass, sample, screenUV } from "three/tsl";
import * as THREE from "three/webgpu";
import { aim, placeSoldier } from "./soldiers";

/**
 * The bake-off's second scene (spikes/engine/README.md): a cave lit by a bonfire, moonlight falling through a hole in
 * the roof. WebGPU: voxel global illumination (bounce light), godrays, bloom.
 */

const params = new URLSearchParams(location.search);
const at = Number(params.get("at") ?? "1.5");
const FIRE = new THREE.Vector3(0, 0, 0);
const FLAMES = 70;

/** How bright the fire burns at a time: a few unrelated sines, so it never visibly repeats. */
const flicker = (t: number) => 1 + 0.12 * Math.sin(t * 13.1) + 0.08 * Math.sin(t * 7.3 + 1.3) + 0.05 * Math.sin(t * 23.7 + 0.4);

function glowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("no 2d canvas");
  const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/** Flame sprites rising, shrinking and cooling from yellow to red; each a fixed function of time. */
class Flames {
  private readonly sprites: THREE.Sprite[] = [];

  constructor(scene: THREE.Scene) {
    const map = glowTexture();
    for (let i = 0; i < FLAMES; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      this.sprites.push(sprite);
      scene.add(sprite);
    }
  }

  update(t: number): void {
    const hot = new THREE.Color(1.0, 0.75, 0.3);
    const cool = new THREE.Color(0.9, 0.18, 0.03);
    this.sprites.forEach((sprite, i) => {
      const phase = (i * 0.618034) % 1;
      const life = (t * (0.9 + phase * 0.6) + phase) % 1;
      const angle = phase * Math.PI * 2 + t * 0.7;
      const spread = 0.22 * (1 - life);
      sprite.position.set(FIRE.x + Math.cos(angle) * spread, FIRE.y + 0.25 + life * 1.1 + 0.05 * Math.sin(t * 9 + i), FIRE.z + Math.sin(angle) * spread);
      sprite.scale.setScalar(0.55 * (1 - life * 0.75));
      sprite.material.color.copy(hot).lerp(cool, life).multiplyScalar(2.2 * (1 - life));
    });
  }
}

async function main(): Promise<void> {
  const renderer = new THREE.WebGPURenderer({ antialias: false });
  await renderer.init();
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.1;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(-3.8, 1.7, 5.2);
  camera.lookAt(0.4, 1.0, -0.2);

  const sky = await new THREE.TextureLoader().loadAsync("/assets/sky/map.webp");
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;
  scene.backgroundIntensity = 0.35;
  scene.fog = new THREE.FogExp2(new THREE.Color().setRGB(0.1, 0.08, 0.07, THREE.SRGBColorSpace), 0.03);

  const loader = new GLTFLoader();
  const cave = await loader.loadAsync("/spikes/engine/shared/cave.glb");
  cave.scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = o.receiveShadow = true;
      if (o.material instanceof THREE.MeshStandardMaterial) o.material.shadowSide = THREE.DoubleSide;
    }
  });
  scene.add(cave.scene);

  const embers = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(1, 0.35, 0.08), emissiveIntensity: 6 }));
  embers.scale.set(1, 0.35, 1);
  embers.position.copy(FIRE).setY(0.08);
  scene.add(embers);

  const fire = new THREE.PointLight(new THREE.Color(1, 0.55, 0.22), 60, 0, 2);
  fire.castShadow = true;
  fire.shadow.mapSize.set(1024, 1024);
  fire.shadow.bias = -0.002;
  scene.add(fire);

  const moon = new THREE.DirectionalLight(new THREE.Color().setRGB(0.62, 0.72, 1.0, THREE.SRGBColorSpace), 4);
  moon.position.set(3.3, 12, 2.0);
  moon.target.position.set(1.8, 0, 1.0);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = moon.shadow.camera.bottom = -10;
  moon.shadow.camera.right = moon.shadow.camera.top = 10;
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 30;
  scene.add(moon, moon.target);

  const flames = new Flames(scene);
  const soldier = await loader.loadAsync("/spikes/engine/shared/Soldier.glb");
  const target = placeSoldier(scene, soldier, new THREE.Vector3(2.2, 0, -1.2), FIRE);
  const aimer = placeSoldier(scene, soldier, new THREE.Vector3(-1.6, 0, 1.2), new THREE.Vector3(-1.6, 0, 10));
  const aimAt = new THREE.Vector3(2.2, 1.4, -1.2);

  const prePass = pass(scene, camera);
  prePass.transparent = false;
  prePass.setMRT(mrt({ output: directionToColor(normalView) }));
  const prePassNormal = sample((uv) => colorToDirection(prePass.getTextureNode().sample(uv)));
  const gi = vxgi(prePass.getTextureNode("depth"), prePassNormal, scene, camera, 128);
  const scenePass = pass(scene, camera);
  if (!params.has("nogi")) scenePass.contextNode = builtinGIContext(gi.getAONode().sample(screenUV).r, gi.getGINode().sample(screenUV).rgb);
  const sceneColor = scenePass.getTextureNode("output");
  const sceneDepth = scenePass.getTextureNode("depth");
  const rays = bilateralBlur(godrays(sceneDepth, camera, moon).getTextureNode()).getTextureNode();
  const lit = depthAwareBlend(sceneColor, rays, sceneDepth, camera, { blendColor: moon.color });
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = lit.add(bloom(lit, 0.7, 0.5, 0.75));

  const frame = (t: number, dt: number) => {
    const f = flicker(t);
    fire.intensity = 60 * f;
    fire.position.set(FIRE.x + 0.04 * Math.sin(t * 5.1), 1.3 + 0.05 * Math.sin(t * 8.3), FIRE.z + 0.04 * Math.cos(t * 4.7));
    embers.material.emissiveIntensity = 6 * f;
    flames.update(t);
    target.mixer.update(dt);
    aimer.mixer.update(dt);
    aim(aimer.body, new THREE.Vector3(0, 0, 1), aimAt);
    pipeline.render();
  };

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  if (params.has("shot")) {
    frame(at, at);
    // The voxel GI filters over frames; let it settle on the frozen moment.
    for (let i = 0; i < 40; i++) {
      frame(at, 0);
      await nextFrame();
    }
    document.body.dataset["ready"] = "true";
  } else {
    const clock = new THREE.Clock();
    let t = 0;
    let frames = 0;
    renderer.setAnimationLoop(() => {
      const dt = clock.getDelta();
      t += dt;
      frame(t, dt);
      if (t > 2) frames++;
      if (params.has("measure") && t > 7) {
        renderer.setAnimationLoop(null);
        document.body.dataset["fps"] = (frames / (t - 2)).toFixed(1);
        document.body.dataset["ready"] = "true";
      }
    });
  }
}

main().catch((e: unknown) => {
  document.body.dataset["error"] = String(e);
  console.error(e);
});
