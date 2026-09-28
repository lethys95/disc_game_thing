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

/** Ground textures for hex tops, `assets/ground/<terrain>-<n>.webp`, loaded once each. */
const GROUND = import.meta.glob<string>("/assets/ground/*.webp", { eager: true, query: "?url", import: "default" });
export const GROUND_VARIANTS = 3;

export class GroundTextures {
  private readonly loader = new THREE.TextureLoader();
  private readonly loaded = new Map<string, THREE.Texture>();

  /** The texture for this terrain and variant (falling back to variant 1), or null if the terrain has none. */
  get(terrain: string, variant: number): THREE.Texture | null {
    const url = GROUND[`/assets/ground/${terrain}-${variant}.webp`] ?? GROUND[`/assets/ground/${terrain}-1.webp`];
    if (!url) return null;
    let texture = this.loaded.get(url);
    if (!texture) {
      texture = this.loader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.userData["shared"] = true;
      this.loaded.set(url, texture);
    }
    return texture;
  }
}

/** The haze where the sky's painted mountains meet the land (`assets/sky/map.webp`); fog fades into it. */
export const HORIZON_MIST = 0x5a70a0;

const SKIES = import.meta.glob<string>("/assets/sky/*.webp", { eager: true, query: "?url", import: "default" });

/** A panorama wrapped around a scene as its background (`assets/sky/<name>.webp`), or null if there's none. */
export function skyTexture(name: string, loaded?: (texture: THREE.Texture) => void): THREE.Texture | null {
  const url = SKIES[`/assets/sky/${name}.webp`];
  if (!url) return null;
  const texture = new THREE.TextureLoader().load(url, loaded);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** How many variants each terrain prop has (`terrain/<kind>-<n>.glb`). */
export const TERRAIN_VARIANTS = { tree: 4, mountain: 3, hill: 2, rock: 2, bush: 2 } as const;

/** Every model slot the map can show, for the orphan check (`tests/models.test.ts`). */
export function modelSlots(factions: readonly string[], structures: readonly string[], nodes: readonly string[]): string[] {
  return [
    ...factions.flatMap((f) => MODEL_CHAINS.capitol(f)),
    ...MODEL_CHAINS.city(),
    ...structures.flatMap((s) => MODEL_CHAINS.structure(s)),
    ...nodes.flatMap((n) => MODEL_CHAINS.node(n)),
    ...MODEL_CHAINS.dungeon(),
    ...MODEL_CHAINS.portal(),
    ...Object.entries(TERRAIN_VARIANTS).flatMap(([kind, count]) => Array.from({ length: count }, (_, i) => `terrain/${kind}-${i + 1}`)),
  ];
}

/** Model slots: the map's places by kind (a Capitol may have one per faction). */
export const MODEL_CHAINS = {
  capitol: (faction: string | null) => [...(faction ? [`site/capitol-${faction}`] : []), "site/capitol"],
  city: () => ["site/city"],
  structure: (kind: string) => [`structure/${kind}`],
  node: (kind: string) => [`node/${kind}`],
  dungeon: () => ["lair/dungeon"],
  portal: () => ["structure/portal"],
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
