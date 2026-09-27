/**
 * Deterministic integer hash noise in [0, 1): the rules' stand-in for randomness (the game is deterministic), so the
 * same seed and inputs always give the same map, the same merchant's wares.
 */
export function noise(seed: number, a: number, b: number): number {
  let h = (seed ^ Math.imul(a, 374761393) ^ Math.imul(b, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** A number for a string id, to seed noise with. */
export function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}
