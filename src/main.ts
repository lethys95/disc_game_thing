import * as THREE from "three";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1d22);
scene.add(new THREE.HemisphereLight(0xdde6ff, 0x302820, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(4, 8, 3);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 7, 7);
camera.lookAt(0, 0, 0);

const hex = new THREE.CylinderGeometry(0.95, 0.95, 0.25, 6);
for (let q = -2; q <= 2; q++) {
  for (let r = -2; r <= 2; r++) {
    if (Math.abs(q + r) > 2) continue;
    const tile = new THREE.Mesh(hex, new THREE.MeshStandardMaterial({ color: (q + r) % 2 ? 0x4f7a4a : 0x6b8f5a }));
    tile.position.set(Math.sqrt(3) * (q + r / 2), 0, 1.5 * r);
    scene.add(tile);
  }
}

document.getElementById("hud")!.textContent = "disc — scaffold";

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => renderer.render(scene, camera));
document.body.dataset.ready = "true";
