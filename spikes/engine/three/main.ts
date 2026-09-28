import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { aim, placeSoldier } from "./soldiers";

/** The engine bake-off scene (spikes/engine/README.md), the same as the Godot one: a clearing, sky light, a soldier aiming aside. */

const GRASS_COUNT = 60000;
const GRASS_RADIUS = 16;
const TREES = ["tree-1", "tree-2", "tree-3", "tree-4"];
const UNDERGROWTH = ["bush-1", "bush-2", "rock-1", "rock-2"];

const params = new URLSearchParams(location.search);
const at = Number(params.get("at") ?? "1.5");
const view = params.get("view") ?? "wide";

/** A deterministic random stream, so both engines place things alike (not the same numbers as Godot's). */
function stream(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const wind = { value: 0 };

/** Makes a standard material sway with the wind, more toward its top (`base`, `height` in the model's own units). */
function sway(material: THREE.MeshStandardMaterial, base: number, height: number, strength: number, perInstance: boolean): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = wind;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      ${perInstance ? "vec4 root = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);" : "vec4 root = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);"}
      float h = clamp((position.y - ${base.toFixed(4)}) / ${height.toFixed(4)}, 0.0, 1.0);
      ${perInstance
        ? "float gust = sin(uTime * 1.7 + root.x * 0.35 + root.z * 0.2) * 0.5 + 0.5; float flutter = sin(uTime * 4.3 + root.x * 17.0 + root.z * 7.0); float bend = (gust * 0.18 + flutter * 0.03) * h * h; vec3 local = inverse(mat3(modelMatrix * instanceMatrix)) * vec3(bend, 0.0, bend * 0.4); transformed += local;"
        : `float s = sin(uTime * 1.2 + root.x * 0.3 + root.z * 0.2) * ${strength.toFixed(4)} * ${height.toFixed(4)} * h * h; transformed.x += s; transformed.z += s * 0.5;`}`,
    );
  };
}

async function main(): Promise<void> {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.AgXToneMapping;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
  if (view === "close") {
    camera.position.set(0.6, 1.9, 3.2);
    camera.lookAt(-0.6, 1.1, 0);
  } else {
    camera.position.set(3.6, 3.0, 7.4);
    camera.lookAt(-1.4, 1.0, 1.0);
  }

  const textures = new THREE.TextureLoader();
  const sky = await textures.loadAsync("/assets/sky/map.webp");
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;
  scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(sky).texture;
  scene.environmentIntensity = 0.5;
  scene.fog = new THREE.FogExp2(new THREE.Color().setRGB(0.62, 0.68, 0.72, THREE.SRGBColorSpace), 0.012);
  // No global illumination in three.js: a hemisphere light stands in for the green bounce off the ground.
  scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(0.62, 0.7, 0.8, THREE.SRGBColorSpace), new THREE.Color().setRGB(0.3, 0.36, 0.16, THREE.SRGBColorSpace), 0.9));

  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.94, 0.84), 2.6);
  sun.position.set(-12, 16, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -25;
  sun.shadow.camera.right = sun.shadow.camera.top = 25;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  const groundTexture = await textures.loadAsync("/assets/ground/forest-1.webp");
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(80, 80);
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.add(grass());
  const loader = new GLTFLoader();
  await forest(scene, loader);

  const soldier = await loader.loadAsync("/spikes/engine/shared/Soldier.glb");
  const target = placeSoldier(scene, soldier, new THREE.Vector3(-5.2, 0, 3), new THREE.Vector3(0, 0, 0));
  const aimer = placeSoldier(scene, soldier, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 10));
  const aimAt = new THREE.Vector3(-5.2, 1.4, 3);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.updateGtaoMaterial({ radius: 0.5, distanceFallOff: 1, thickness: 1 });
  composer.addPass(ao);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.15, 0.4, 0.9));
  composer.addPass(new OutputPass());

  const frame = (t: number, dt: number) => {
    wind.value = t;
    target.mixer.update(dt);
    aimer.mixer.update(dt);
    aim(aimer.body, new THREE.Vector3(0, 0, 1), aimAt);
    composer.render();
  };

  if (params.has("shot")) {
    frame(at, at);
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

function blade(): THREE.BufferGeometry {
  const rows: [number, number][] = [[0, 0.05], [0.35, 0.04], [0.7, 0.025], [1, 0]];
  const positions: number[] = [];
  const colors: number[] = [];
  const base = new THREE.Color().setRGB(0.10, 0.20, 0.05, THREE.SRGBColorSpace);
  const tip = new THREE.Color().setRGB(0.45, 0.58, 0.22, THREE.SRGBColorSpace);
  for (let i = 0; i < rows.length - 1; i++) {
    const [ay, aw] = rows[i] ?? [0, 0];
    const [by, bw] = rows[i + 1] ?? [0, 0];
    const quad: [number, number][] = [[-aw, ay], [aw, ay], [bw, by], [-bw, by]];
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const [x, y] = quad[index] ?? [0, 0];
      positions.push(x, y, 0);
      const c = base.clone().lerp(tip, y);
      colors.push(c.r, c.g, c.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(positions.map((_, i) => [0, 1, 0][i % 3] ?? 0), 3));
  return geometry;
}

function grass(): THREE.InstancedMesh {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
  sway(material, 0, 1, 0, true);
  const bend = material.onBeforeCompile;
  // Both faces of a blade keep the upward normal; three.js would flip it for the back face and leave it dark.
  material.onBeforeCompile = (shader, renderer) => {
    bend(shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n normal = normalize(vNormal);");
  };
  const mesh = new THREE.InstancedMesh(blade(), material, GRASS_COUNT);
  const random = stream(7);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < GRASS_COUNT; i++) {
    const r = GRASS_RADIUS * Math.sqrt(random());
    const a = random() * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    const height = (0.12 + random() * 0.2) * (p.length() < 1.2 ? 0.4 : 1);
    const tilt = (random() - 0.5) * 0.4;
    q.setFromEuler(e.set(tilt, random() * Math.PI * 2, 0, "YXZ"));
    mesh.setMatrixAt(i, m.compose(p, q, new THREE.Vector3(1, height, 1)));
    const shade = 0.8 + 0.4 * random();
    mesh.setColorAt(i, new THREE.Color().setRGB(shade, shade, shade, THREE.SRGBColorSpace));
  }
  mesh.receiveShadow = true;
  return mesh;
}

async function forest(scene: THREE.Scene, loader: GLTFLoader): Promise<void> {
  const random = stream(11);
  const place = async (slot: string, r: number, height: number) => {
    // Order of draws: radius, height, angle, turn (the Godot scene draws in the same order).
    const a = random() * Math.PI * 2;
    await prop(scene, loader, slot, new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), height, random() * Math.PI * 2);
  };
  for (let i = 0; i < 34; i++) await place(TREES[i % TREES.length] ?? "", 7 + random() * 15, 4 + random() * 2.5);
  for (let i = 0; i < 26; i++) await place(UNDERGROWTH[i % UNDERGROWTH.length] ?? "", 3.5 + random() * 10.5, 0.5 + random() * 0.7);
}

const models = new Map<string, Promise<THREE.Group>>();

/** A generated prop, fitted to a height, standing on the ground, swaying with the wind. */
async function prop(scene: THREE.Scene, loader: GLTFLoader, slot: string, at: THREE.Vector3, height: number, turn: number): Promise<void> {
  let model = models.get(slot);
  if (!model) {
    model = loader.loadAsync(`/assets/models/terrain/${slot}.glb`).then((gltf) => {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const strength = slot.startsWith("tree") ? 0.06 : slot.startsWith("bush") ? 0.03 : 0;
      gltf.scene.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
          o.material.metalness = 0;
          o.material.roughness = 0.9;
          if (strength > 0) sway(o.material, box.min.y, box.max.y - box.min.y, strength, false);
          o.castShadow = o.receiveShadow = true;
        }
      });
      return gltf.scene;
    });
    models.set(slot, model);
  }
  const source = await model;
  const box = new THREE.Box3().setFromObject(source);
  const node = source.clone();
  const s = height / (box.max.y - box.min.y);
  node.scale.setScalar(s);
  node.rotation.y = turn;
  node.position.copy(at).setY(-box.min.y * s - 0.05 * height);
  scene.add(node);
}

void main();
