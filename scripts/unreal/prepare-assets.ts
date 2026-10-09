/**
 * The game's art and models, ready for the Unreal import (`unreal/Scripts/editor/import_assets.py`). Unreal can't
 * read WebP, so the card portraits, grounds and skies are written out as PNG; glb models are imported as they are.
 * The manifest names each file's Unreal asset by the rule the arena looks them up with (`unreal/Source/Disc/
 * Private/AssetNames.cpp`): `-` becomes `_`, textures take `T_`, meshes `SM_`.
 *
 * Usage: pnpm exec tsx scripts/unreal/prepare-assets.ts [out dir, default unreal/Import]
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import sharp from "sharp";

const outDir = process.argv[2] ?? "unreal/Import";

interface Entry {
  readonly source: string;
  readonly folder: string;
  readonly name: string;
  readonly kind: "portrait" | "ground" | "sky" | "model";
}

const assetName = (stem: string) => stem.replaceAll("-", "_");

async function files(dir: string, extension: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith(extension)).map((e) => join(e.parentPath, e.name)).sort();
}

async function textures(dir: string, folder: string, kind: Entry["kind"]): Promise<Entry[]> {
  const target = join(outDir, "textures", kind);
  await mkdir(target, { recursive: true });
  const entries: Entry[] = [];
  for (const file of await files(dir, ".webp")) {
    const stem = basename(file, ".webp");
    const png = join(target, `${stem}.png`);
    await sharp(file).png().toFile(png);
    entries.push({ source: resolve(png), folder, name: `T_${assetName(stem)}`, kind });
  }
  return entries;
}

const models: Entry[] = (await files("assets/models", ".glb")).map((file) => {
  const key = relative("assets/models", file).replace(/\.glb$/, "");
  const slash = key.lastIndexOf("/");
  return { source: resolve(file), folder: `/Game/Models/${key.slice(0, slash)}`, name: `SM_${assetName(key.slice(slash + 1))}`, kind: "model" };
});

const manifest = [
  ...(await textures("assets/art/portrait", "/Game/Art/portrait", "portrait")),
  ...(await textures("assets/ground", "/Game/Ground", "ground")),
  ...(await textures("assets/sky", "/Game/Sky", "sky")),
  ...models,
];
await writeFile(join(outDir, "assets.json"), JSON.stringify(manifest, null, 2));
console.log(`${join(outDir, "assets.json")}: ${manifest.length} assets`);
