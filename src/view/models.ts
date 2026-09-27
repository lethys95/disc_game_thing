import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

/**
 * Map models, like art slots (`view/art-slots.ts`): a model for a piece of the map lives at
 * `assets/models/<key>.glb` and is found at build time; a fallback chain picks the first key that has a file. Where
 * none does, the hand-built placeholder stays, so every map works before its models exist.
 */
const FILES = import.meta.glob<string>("/assets/models/**/*.glb", { eager: true, query: "?url", import: "default" });

export const modelUrl = (chain: readonly string[]): string | null => {
  for (const key of chain) {
    const url = FILES[`/assets/models/${key}.glb`];
    if (url) return url;
  }
  return null;
};

/** Model slots: the map's places by kind (a Capitol may have one per faction). */
export const MODEL_CHAINS = {
  capitol: (faction: string | null) => [...(faction ? [`site/capitol-${faction}`] : []), "site/capitol"],
  city: () => ["site/city"],
  structure: (kind: string) => [`structure/${kind}`],
  node: (kind: string) => [`node/${kind}`],
  dungeon: () => ["lair/dungeon"],
} as const;

/** Loads each model once; places share its geometry and materials (`userData.shared` keeps `discard` off them). */
export class Models {
  private readonly loader = new GLTFLoader();
  private readonly loaded = new Map<string, Promise<THREE.Object3D | null>>();

  /**
   * Swaps `host`'s placeholder for the chain's model once it has loaded, fitted within `height` and `width` and
   * standing on the ground at the host's origin. Labels and children marked `userData.keep` (a lair's guard) stay.
   */
  dress(host: THREE.Group, chain: readonly string[], height: number, width: number): void {
    const url = modelUrl(chain);
    if (!url) return;
    void this.load(url).then((source) => {
      if (!source || !host.parent) return;
      for (const child of [...host.children]) {
        if (!(child instanceof CSS2DObject) && !child.userData["keep"]) child.removeFromParent();
      }
      const model = source.clone(true);
      fit(model, height, width);
      model.traverse((o) => {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData["shared"] = true;
      });
      host.add(model);
    });
  }

  private load(url: string): Promise<THREE.Object3D | null> {
    let pending = this.loaded.get(url);
    if (!pending) {
      pending = this.loader
        .loadAsync(url)
        .then((gltf) => gltf.scene)
        .catch(() => null);
      this.loaded.set(url, pending);
    }
    return pending;
  }
}

/** Scales a model to `height`, or less if it would be wider than `width`, and stands it on the ground, centered. */
function fit(model: THREE.Object3D, height: number, width: number): void {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = Math.min(size.y > 0 ? height / size.y : 1, Math.max(size.x, size.z) > 0 ? width / Math.max(size.x, size.z) : 1);
  model.scale.multiplyScalar(scale);
  const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
  model.position.set(-center.x, -box.min.y * scale, -center.z);
}
