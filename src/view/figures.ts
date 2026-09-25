import * as THREE from "three";
import type { Faction, Side } from "#rules/types";
import { UNITS } from "#rules/units";

/** Placeholder statues until real art exists: silhouette by unit, material by side, accent by faction. */

export interface Palette {
  readonly body: THREE.Color;
  readonly trim: THREE.Color;
  readonly accent: THREE.Color;
}

/** Faction accents from the art notes: the mana colour is the only saturated colour on a unit. */
const ACCENTS: Readonly<Record<Faction, THREE.Color>> = {
  jilliath: new THREE.Color(0xc0281c),
  nexus: new THREE.Color(0x2fd8d0),
  neutral: new THREE.Color(0xa87a3a),
};

export const PALETTES: readonly [Palette, Palette] = [
  { body: new THREE.Color(0xb8ad98), trim: new THREE.Color(0x6e6252), accent: new THREE.Color(0xc0281c) },
  { body: new THREE.Color(0x3a3634), trim: new THREE.Color(0x1c1a19), accent: new THREE.Color(0xc0281c) },
];

interface Parts {
  readonly body: THREE.MeshStandardMaterial;
  readonly trim: THREE.MeshStandardMaterial;
  readonly glow: THREE.MeshStandardMaterial;
}

function materials(palette: Palette, accent: THREE.Color, fire: boolean): Parts {
  const glowColor = fire ? new THREE.Color(0xff6a1a) : accent;
  return {
    body: new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.85, metalness: 0.1 }),
    trim: new THREE.MeshStandardMaterial({ color: palette.trim, roughness: 0.5, metalness: 0.6 }),
    glow: new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 2.2,
      roughness: 0.4,
    }),
  };
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** A bell-shaped robe: the base silhouette every figure shares. */
function robe(height: number, width: number, material: THREE.Material): THREE.Mesh {
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(width, 0),
    new THREE.Vector2(width * 0.82, height * 0.25),
    new THREE.Vector2(width * 0.55, height * 0.7),
    new THREE.Vector2(width * 0.62, height * 0.86),
    new THREE.Vector2(width * 0.3, height),
    new THREE.Vector2(0, height),
  ];
  return mesh(new THREE.LatheGeometry(profile, 10), material);
}

function hood(y: number, size: number, material: THREE.Material): THREE.Mesh {
  return mesh(new THREE.ConeGeometry(size, size * 2.1, 7), material, 0, y + size * 0.9, 0);
}

function helm(y: number, size: number, material: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(size * 0.8, size, size * 1.6, 8), material, 0, y + size * 0.8, 0));
  g.add(mesh(new THREE.ConeGeometry(size * 0.8, size * 0.9, 8), material, 0, y + size * 2.05, 0));
  return g;
}

function eyes(y: number, material: THREE.Material): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(0.06, 0.035, 0.18), material, 0.19, y, 0);
}

function halo(y: number, radius: number, material: THREE.Material): THREE.Mesh {
  const m = mesh(new THREE.TorusGeometry(radius, 0.025, 6, 32), material, -0.12, y, 0);
  m.rotation.y = Math.PI / 2;
  return m;
}

function blade(length: number, material: THREE.Material, z: number): THREE.Mesh {
  const m = mesh(new THREE.BoxGeometry(0.05, length, 0.1), material, 0.3, 0.5 + length / 2, z);
  m.rotation.z = -0.35;
  return m;
}

function shield(material: THREE.Material): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(0.08, 0.6, 0.42), material, 0.36, 0.75, 0.14);
}

function wings(y: number, span: number, material: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const w = mesh(new THREE.BoxGeometry(0.04, span * 0.9, span * 0.45), material, -0.2, y, side * span * 0.3);
    w.rotation.x = side * 0.55;
    g.add(w);
  }
  return g;
}

function flail(material: THREE.Material, glow: THREE.Material, heads: number): THREE.Group {
  const g = new THREE.Group();
  const haft = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), material, 0.32, 0.8, -0.2);
  haft.rotation.z = -0.5;
  g.add(haft);
  for (let i = 0; i < heads; i++) {
    const offset = (i - (heads - 1) / 2) * 0.13;
    g.add(mesh(new THREE.IcosahedronGeometry(0.075, 0), glow, 0.62, 0.62 - Math.abs(offset) * 0.6, -0.2 + offset));
  }
  return g;
}

function hookBlade(material: THREE.Material): THREE.Mesh {
  const m = mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12, Math.PI * 1.2), material, 0.3, 1.25, 0.25);
  m.rotation.y = Math.PI / 2;
  return m;
}

function staff(material: THREE.Material, orb: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.3, 6), material, 0.3, 0.75, -0.18);
  g.add(pole, mesh(new THREE.IcosahedronGeometry(0.09, 0), orb, 0.3, 1.45, -0.18));
  return g;
}

function bow(material: THREE.Material): THREE.Mesh {
  const m = mesh(new THREE.TorusGeometry(0.4, 0.02, 5, 16, Math.PI), material, 0.32, 0.85, 0);
  m.rotation.set(0, Math.PI / 2, Math.PI / 2);
  return m;
}

function axe(material: THREE.Material, edge: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const haft = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), material, 0.3, 0.8, -0.2);
  haft.rotation.z = -0.3;
  g.add(haft, mesh(new THREE.BoxGeometry(0.05, 0.22, 0.2), edge, 0.42, 1.15, -0.2));
  return g;
}

/** Custodian: a blocky golem; its shield shows as glowing plates. */
function golem(m: Parts): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), m.trim, 0, 0.18, 0));
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.6, 0.56), m.body, 0, 0.65, 0));
  g.add(mesh(new THREE.BoxGeometry(0.28, 0.24, 0.28), m.trim, 0.04, 1.08, 0));
  for (const z of [-0.4, 0.4]) {
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), m.trim, 0.05, 0.55, z));
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), m.body, 0.1, 0.22, z));
  }
  g.add(mesh(new THREE.BoxGeometry(0.04, 0.4, 0.4), m.glow, 0.33, 0.7, 0));
  g.add(eyes(1.1, m.glow));
  return g;
}

/** Builds a unit's figure facing +x, standing on y = 0. */
export function buildFigure(defId: string, side: Side): THREE.Group {
  const def = UNITS[defId];
  const m = materials(PALETTES[side], ACCENTS[def?.faction ?? "neutral"], def?.damageType === "fire");
  const g = new THREE.Group();
  const scale = 1.15 + (def?.tier ?? 1) * 0.08;
  const height = 1.1;
  const top = height;

  if (defId === "custodian") {
    g.add(golem(m));
    g.scale.setScalar(scale);
    return g;
  }
  g.add(robe(height, 0.34, m.body));
  switch (defId) {
    case "congregant":
      g.add(hood(top - 0.1, 0.17, m.body));
      g.add(eyes(top + 0.05, m.glow));
      break;
    case "paladin":
      g.add(helm(top - 0.05, 0.15, m.trim));
      g.add(shield(m.trim));
      g.add(blade(0.5, m.trim, -0.2));
      g.add(eyes(top + 0.12, m.glow));
      break;
    case "templar":
    case "immortal":
      g.add(helm(top - 0.05, 0.16, m.trim));
      g.add(shield(m.trim));
      g.add(blade(0.6, m.trim, -0.2));
      g.add(eyes(top + 0.12, m.glow));
      g.add(halo(top + 0.3, defId === "immortal" ? 0.34 : 0.26, m.glow));
      if (defId === "immortal") g.add(wings(top - 0.15, 1.1, m.body));
      break;
    case "zealot":
    case "fanatic":
    case "chosen":
      g.add(hood(top - 0.1, 0.18, m.trim));
      g.add(eyes(top + 0.05, m.glow));
      g.add(blade(0.8, m.glow, -0.18));
      if (defId !== "zealot") g.add(blade(0.8, m.glow, 0.18));
      if (defId === "chosen") g.add(halo(top + 0.35, 0.3, m.glow));
      break;
    case "avatar_of_vengeance":
      g.add(hood(top - 0.1, 0.2, m.trim));
      g.add(eyes(top + 0.05, m.glow));
      g.add(blade(1.0, m.glow, -0.2));
      g.add(blade(1.0, m.glow, 0.2));
      g.add(halo(top + 0.4, 0.42, m.glow));
      g.add(wings(top - 0.1, 1.5, m.trim));
      break;
    case "punisher":
    case "torturer":
      g.add(helm(top - 0.05, 0.15, m.trim));
      g.add(eyes(top + 0.12, m.glow));
      g.add(flail(m.trim, m.glow, defId === "torturer" ? 3 : 2));
      if (defId === "torturer") g.add(hookBlade(m.trim));
      break;
    case "arcane_engineer":
      g.add(helm(top - 0.05, 0.14, m.trim));
      g.add(eyes(top + 0.1, m.glow));
      g.add(staff(m.trim, m.glow));
      break;
    case "apprentice":
      g.add(hood(top - 0.1, 0.17, m.body));
      g.add(eyes(top + 0.05, m.glow));
      g.add(mesh(new THREE.IcosahedronGeometry(0.1, 0), m.glow, 0.38, 1.0, 0.15));
      break;
    case "brigand":
      g.add(hood(top - 0.1, 0.17, m.trim));
      g.add(blade(0.45, m.trim, -0.2));
      break;
    case "marauder":
      g.add(helm(top - 0.05, 0.15, m.trim));
      g.add(axe(m.trim, m.glow));
      break;
    case "bandit":
      g.add(hood(top - 0.1, 0.16, m.trim));
      g.add(bow(m.trim));
      break;
    case "hedge_mage":
      g.add(hood(top - 0.1, 0.18, m.body));
      g.add(staff(m.trim, m.glow));
      break;
    case "capitol_guardian":
      g.add(helm(top - 0.05, 0.2, m.trim));
      g.add(shield(m.trim));
      g.add(blade(0.9, m.trim, -0.2));
      g.add(eyes(top + 0.14, m.glow));
      g.add(wings(top - 0.1, 1.3, m.trim));
      break;
    default:
      g.add(hood(top - 0.1, 0.17, m.body));
  }
  g.scale.setScalar(scale);
  return g;
}
