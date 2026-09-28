import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const CHAIN = ["Spine", "Spine1", "Spine2", "Neck", "Head"];
const SHARE = [0.2, 0.25, 0.25, 0.15, 0.15];

export interface Soldier {
  readonly body: THREE.Object3D;
  readonly mixer: THREE.AnimationMixer;
}

/** A copy of the soldier at a spot, facing a point, playing its idle loop. */
export function placeSoldier(scene: THREE.Object3D, soldier: GLTF, at: THREE.Vector3, facing: THREE.Vector3): Soldier {
  const body = cloneSkinned(soldier.scene);
  body.position.copy(at);
  body.rotation.y = Math.atan2(facing.x - at.x, facing.z - at.z) + Math.PI;
  body.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  scene.add(body);
  const mixer = new THREE.AnimationMixer(body);
  const idle = soldier.animations.find((a) => a.name === "Idle");
  if (!idle) throw new Error("no Idle");
  mixer.clipAction(idle).play();
  return { body, mixer };
}

/** Turns the upper body toward a point after the animation has posed it, shared along the spine; hips and feet keep the pose. */
export function aim(body: THREE.Object3D, facing: THREE.Vector3, point: THREE.Vector3): void {
  const toTarget = point.clone().sub(body.position).setY(0);
  const yaw = Math.atan2(facing.z * toTarget.x - facing.x * toTarget.z, facing.x * toTarget.x + facing.z * toTarget.z);
  const up = new THREE.Vector3(0, 1, 0);
  body.updateMatrixWorld(true);
  CHAIN.forEach((name, i) => {
    const bone = body.getObjectByName(`mixamorig${name}`);
    if (!bone?.parent) throw new Error(`no bone ${name}`);
    const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const world = bone.getWorldQuaternion(new THREE.Quaternion());
    const turned = new THREE.Quaternion().setFromAxisAngle(up, yaw * (SHARE[i] ?? 0)).multiply(world);
    bone.quaternion.copy(parent.invert().multiply(turned));
    bone.updateMatrixWorld(true);
  });
}
