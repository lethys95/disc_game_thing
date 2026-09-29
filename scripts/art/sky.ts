import { runBatch } from "#scripts/art/batch";

/**
 * A sky for the map (`assets/sky/map.webp`): a wide panorama wrapped around the scene as its background. The map
 * is seen from above, so mostly the horizon band and low sky show. `pnpm tsx scripts/art/sky.ts [seeds…]`
 */
// The user's gothic style (2026-09-29; `design/art.md`); the golden-sunset sky before was Claude's.
const SKY =
  "A 360 degree equirectangular panorama of a brooding overcast sky over a distant horizon of misty dark mountain ranges and dark forests, " +
  "heavy layered grey clouds with a few pale breaks of cold light, muted and desaturated, seamless left and right edges, no text. " +
  "Dark gothic fantasy in the manner of Disciples II's art, grim and serious, not cartoonish.";

const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
await runBatch("art/candidates/sky", [{ id: "map", prompt: SKY, width: 2048, height: 1024 }], seeds.length > 0 ? seeds : [1, 2, 3, 4]);
