import * as THREE from "three";

/**
 * A paper standee: the unit's portrait on an upright card in a frame of its owner's color, on a small base, always
 * turned toward the camera. A stand-in for battle figures (docs/design/art.md), not the look that ships.
 */

const CARD_WIDTH = 1.25;
/** Portraits are 384 × 494. */
const CARD_HEIGHT = CARD_WIDTH * (494 / 384);
const LIFT = 0.12;

const loader = new THREE.TextureLoader();

/** `owner` is the owner's player color. */
export function buildStandee(url: string, owner: THREE.Color): THREE.Group {
  const group = new THREE.Group();
  const texture = loader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  // The card pivots on its bottom edge, where it meets the base.
  const card = new THREE.Group();
  card.position.y = LIFT;
  // The first material is the one the scene flashes on hits.
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0, emissive: new THREE.Color(0x000000) }),
  );
  face.position.set(0, CARD_HEIGHT / 2, 0.012);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(CARD_WIDTH + 0.1, CARD_HEIGHT + 0.1, 0.02),
    new THREE.MeshStandardMaterial({ color: owner, roughness: 0.6, metalness: 0.2 }),
  );
  frame.position.y = CARD_HEIGHT / 2;
  card.add(face, frame);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.38, LIFT, 24),
    new THREE.MeshStandardMaterial({ color: owner, roughness: 0.7, metalness: 0.3 }),
  );
  base.position.y = LIFT / 2;

  // Faces the camera, leaning back from its bottom edge so the high battle camera doesn't flatten it.
  const parentTurn = new THREE.Quaternion();
  face.onBeforeRender = (_renderer, _scene, camera) => {
    // A fallen unit's card keeps its last turn and topples with the figure.
    if (group.userData["fallen"] === true) return;
    group.getWorldQuaternion(parentTurn);
    card.quaternion.copy(parentTurn.invert().multiply(camera.quaternion));
    card.updateMatrixWorld(true);
  };

  group.add(card, base);
  return group;
}
