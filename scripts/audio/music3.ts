import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MUSIC3, music3 } from "#scripts/art/comfy";

/**
 * Music candidates with MiniMax Music 3 in the local ComfyUI, on the second GPU (the user, 2026-10-05: it replaces
 * ACE-Step, "it's not very good"). Takes land outside the repo in `../music-candidates/minimax/<track>/`, each with
 * its caption, lyrics and seed in the folder's manifest; the user picks by ear, `scripts/audio/sfx.sh finish` turns a
 * keeper into `assets/audio/music/<faction>/<slot>.ogg`.
 *
 *     pnpm exec tsx scripts/audio/music3.ts <track…> [seed…] [--lyrics=<variant>]
 *
 * Faction directions follow the earlier, darker round (factions/*.md; provisional). The model is built for songs with
 * lyrics; whether it makes good instrumentals is what the first round tests, with two ways of asking for no vocals.
 */

const OUT = "../music-candidates/minimax";
const SECONDS = 120;

/**
 * Ways of asking for an instrumental; the model card mentions an `[Instrumental]` section tag. With the tag alone the
 * first take ended after 26 s of the 120 asked for: *sections* lays out a whole song's form with no words in it.
 */
const LYRICS: Readonly<Record<string, string>> = {
  tag: "[Instrumental]",
  empty: "",
  sections: ["[Intro]", "[Instrumental]", "", "[Verse]", "[Instrumental]", "", "[Chorus]", "[Instrumental]", "", "[Bridge]", "[Instrumental]", "", "[Chorus]", "[Instrumental]", "", "[Outro]", "[Instrumental]"].join("\n"),
};

const TRACKS: Readonly<Record<string, string>> = {
  "jilliath/battle":
    "Dark medieval holy-war battle music for a grim fantasy strategy game. Instrumental only, no singing and no words. " +
    "Slow, relentless heavy war drums and timpani, low brass, cathedral organ, a wordless low male choir as a pad. Minor key, about 84 BPM. " +
    "Opens on a tense drum ostinato, builds to a severe, zealous full climax, then falls back to the drums.",
  "jilliath/map":
    "Slow dark medieval sacred music for the map screen of a grim fantasy strategy game. Instrumental only, no singing and no words. " +
    "Cathedral organ drone, a distant tolling bell, sparse deep drum, mournful low strings. Minor key, about 60 BPM. Calm, severe and steady from start to end.",
  "nexus/battle":
    "Tense dark arcane battle music for a grim fantasy strategy game. Instrumental only, no singing and no words. " +
    "Taut staccato low strings, metallic anvil and clockwork percussion, crackling electric tension, ominous low brass swells. Minor key, about 96 BPM. " +
    "Restless and driving, rising to a cold, mechanical climax.",
  "nexus/map":
    "Slow dark arcane ambient music for the map screen of a grim fantasy strategy game. Instrumental only, no singing and no words. " +
    "Eerie sustained strings, glass harmonica, soft ticking clockwork percussion, distant rolling thunder. Minor key, about 60 BPM. Cold, mysterious and lonely throughout.",
};

interface Take {
  readonly file: string;
  readonly track: string;
  readonly seed: number;
  readonly caption: string;
  readonly lyrics: string;
  readonly seconds: number;
  readonly model: string;
}

const args = process.argv.slice(2);
const tracks = args.filter((a) => a in TRACKS);
const seeds = args.map(Number).filter((n) => Number.isInteger(n));
const variant = args.find((a) => a.startsWith("--lyrics="))?.slice("--lyrics=".length) ?? "tag";
const lyrics = LYRICS[variant];
if (lyrics === undefined) throw new Error(`unknown lyrics variant "${variant}"; known: ${Object.keys(LYRICS).join(", ")}`);
if (tracks.length === 0) throw new Error(`name a track: ${Object.keys(TRACKS).join(", ")}`);

for (const track of tracks) {
  const caption = TRACKS[track] ?? "";
  const dir = `${OUT}/${track}`;
  await mkdir(dir, { recursive: true });
  const earlier = await readFile(`${dir}/manifest.json`, "utf8").then((text): Take[] => JSON.parse(text), () => []);
  for (const seed of seeds.length > 0 ? seeds : [1000]) {
    const file = `${seed}-${variant}.flac`;
    const started = Date.now();
    await writeFile(`${dir}/${file}`, await music3({ caption, lyrics, seed, seconds: SECONDS }, `disc/${track.replace("/", "-")}`));
    console.log(`${dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    const take: Take = { file, track, seed, caption, lyrics, seconds: SECONDS, model: MUSIC3.diffusionModel };
    earlier.splice(0, earlier.length, ...earlier.filter((t) => t.file !== file), take);
    await writeFile(`${dir}/manifest.json`, JSON.stringify(earlier, null, 2));
  }
}
