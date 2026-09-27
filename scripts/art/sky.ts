import { runBatch } from "#scripts/art/batch";

/**
 * A sky for the map (`assets/sky/map.webp`): a wide panorama wrapped around the scene as its background. The map
 * is seen from above, so mostly the horizon band and low sky show. `pnpm tsx scripts/art/sky.ts [seeds…]`
 */
const SKY =
  "A 360 degree equirectangular panorama of a dramatic sky at dusk over a distant horizon of misty blue mountain ranges and dark forests, " +
  "towering clouds lit warm gold from below fading to deep blue-violet above, seamless left and right edges, stylized hand-painted game skybox, no text.";

const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch("art/candidates/sky", [{ id: "map", prompt: SKY, width: 2048, height: 1024 }], seeds.length > 0 ? seeds : [1, 2, 3, 4]);
