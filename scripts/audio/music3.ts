import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MUSIC3, music3 } from "#scripts/art/comfy";

/**
 * Music candidates with MiniMax Music 3 in the local ComfyUI, on the second GPU (the user, 2026-10-05: it replaces
 * ACE-Step, "it's not very good"). Takes land outside the repo in `../music-candidates/minimax/<track>/`, each with
 * its caption, lyrics and seed in the folder's manifest; the user picks by ear, `scripts/audio/sfx.sh finish` turns a
 * keeper into `assets/audio/music/<faction>/<slot>.ogg`.
 *
 *     pnpm exec tsx scripts/audio/music3.ts <track…> [seed…]
 *
 * Captions follow MiniMax's own format (its music-caption-rewriter skill): three headings, Global Metadata, Vocal
 * Details and a section-by-section Arrangement, about 300 words. The first round's one-paragraph captions were
 * "better than ACE-Step" but not good (the user). The model is trained on songs: an instrumental needs a whole song
 * form in the lyrics with `[Instrumental]` in every section, or it stops after a few seconds; the *choir* takes give
 * it wordless vowels to sing instead. Faction directions are Claude's, provisional (factions/*.md).
 */

const OUT = "../music-candidates/minimax";
const SECONDS = 150;

const form = (sections: readonly string[], line: string) => sections.map((s) => `[${s}]\n${line}`).join("\n\n");
const SONG = ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"];
const INSTRUMENTAL = form(SONG, "[Instrumental]");
const VOWELS = form(SONG, "Ah... ah...\nOh... oh...");

interface Track {
  readonly caption: string;
  readonly lyrics: string;
}

const JILLIATH_BATTLE_GLOBAL = `Global Metadata
Basic Attributes: bpm is 84. key is C, and scale is minor. Dark Cinematic Orchestral / Medieval Sacred War Music.
Global Emotional Progression: The piece opens in grim, tense stillness and hardens into a relentless, zealous march. It never turns triumphant or bright: the climax is severe and merciless, a holy army that will not stop, before it falls back to a single drum.
Application Scenarios & Imagery: Battle music for a grim, dark fantasy strategy game: a fanatical inquisition marching through smoke and firelight, scorched banners, iron and blood.
Sonics & Production Profile: A large, cold cathedral space with long natural reverb. Heavy low end from war drums and low brass; dark, narrow upper range; wide dynamics from a sparse opening to a dense, oppressive climax.`;

const JILLIATH_BATTLE_ARRANGEMENT = `Arrangement
Instrument Lifecycle Description (Primary/Secondary Layering):
Primary: Low brass (trombones, tuba, horns in their low register) carries a short, stern minor-key motif from the first Verse to the end.
Secondary: A cathedral pipe organ holds dark sustained chords under every section and swells in each Chorus. Low strings play a driving staccato ostinato from the first Verse; high strings stay out until the Bridge, where they hold one tense, dissonant note.
Groove & Foundation Progression: The Intro is a lone, slow war drum. Massive war drums and timpani lock into a heavy, marching pattern in the Verse and double in force in each Chorus. The Bridge drops to the lone drum and organ, then the last Chorus brings everything back at its heaviest. The Outro strips down to the lone drum and a fading organ chord.
Embellishments, Textures & Spatial FX: Clanging iron and anvil hits on the downbeats of the Chorus, a distant tolling bell in the Intro and Outro, deep low impacts at each section change.`;

const JILLIATH_MAP = `Global Metadata
Basic Attributes: bpm is 60. key is D, and scale is minor. Dark Ambient Sacred Music / Medieval.
Global Emotional Progression: Calm, severe and watchful from start to end; a slow, mournful devotion with no climax and no release.
Application Scenarios & Imagery: Background music for the map screen of a grim, dark fantasy strategy game: a cold cathedral at dusk, candlelight, an empire of zealots waiting.
Sonics & Production Profile: A vast stone hall with very long reverb; soft, dark and even, nothing sharp, so it can play for a long time unnoticed.
Vocal Details
Instrumental: no lead vocals and no words. A wordless low male choir holds soft, distant sustained vowels as a texture in the Chorus sections only.
Arrangement
Instrument Lifecycle Description (Primary/Secondary Layering):
Primary: A cathedral pipe organ plays a slow, mournful melody in its middle register, present throughout.
Secondary: Low strings hold long drones under the organ; a solo cello answers the organ in each Verse. The wordless choir enters softly in each Chorus and leaves after it.
Groove & Foundation Progression: No drum kit. A deep, soft frame drum marks every other bar from the first Verse. The Bridge thins to organ and a single held cello note; the last Chorus is the fullest, still quiet.
Embellishments, Textures & Spatial FX: A distant tolling bell every few bars, faint wind through stone, soft candle-crackle in the Intro and Outro.`;

const NEXUS_BATTLE = `Global Metadata
Basic Attributes: bpm is 96. key is F, and scale is minor. Dark Cinematic Orchestral / Arcane Industrial.
Global Emotional Progression: The piece opens in cold, mechanical tension and builds into a driving, relentless fight, climaxing in a crackling surge of arcane power before snapping back to ticking machinery.
Application Scenarios & Imagery: Battle music for a grim, dark fantasy strategy game: sorcerers of a cold arcane order with stone and brass golems, storm-light, lightning arcing between machines.
Sonics & Production Profile: Tight and close rather than cavernous; hard, metallic transients, a dry low end, crackling electric textures panned wide.
Vocal Details
Instrumental: no vocals at any point. The lead melodic role is carried by low brass and a staccato string section.
Arrangement
Instrument Lifecycle Description (Primary/Secondary Layering):
Primary: Taut staccato low strings play a restless, mechanical ostinato from the first Verse to the end.
Secondary: Low brass swells answer the strings in each Chorus. A glass harmonica plays a cold, eerie line in the Intro and Bridge.
Groove & Foundation Progression: The Intro is ticking clockwork percussion alone. Metallic anvil and gear-like percussion lock into a driving pattern in the Verse; heavy drums join in each Chorus. The Bridge drops to clockwork and harmonica, then the last Chorus is the fullest. The Outro returns to ticking alone and stops abruptly.
Embellishments, Textures & Spatial FX: Crackling electric arcs and short static bursts at section changes, distant rolling thunder under the Bridge, metallic scrapes as risers.`;

const NEXUS_MAP = `Global Metadata
Basic Attributes: bpm is 60. key is E, and scale is minor. Dark Ambient / Arcane.
Global Emotional Progression: Cold, mysterious and lonely throughout, with a slow sense of something vast at work; no climax.
Application Scenarios & Imagery: Background music for the map screen of a grim, dark fantasy strategy game: a cold arcane tower in a storm, brass instruments ticking, faint lightning far off.
Sonics & Production Profile: Wide and airy, soft and even, nothing sharp, so it can play for a long time unnoticed.
Vocal Details
Instrumental: no vocals at any point. A glass harmonica carries the slow lead melody.
Arrangement
Instrument Lifecycle Description (Primary/Secondary Layering):
Primary: A glass harmonica plays a slow, eerie melody, present from the first Verse to the Outro.
Secondary: Sustained, cold strings hold long chords throughout; a celesta adds sparse high notes in each Chorus.
Groove & Foundation Progression: No drums. Soft ticking clockwork keeps a slow pulse from the first Verse. The Bridge thins to strings and ticking; the last Chorus is the fullest, still quiet.
Embellishments, Textures & Spatial FX: Distant rolling thunder every so often, faint electric hum, soft wind.`;

const TRACKS: Readonly<Record<string, Track>> = {
  "jilliath/battle": {
    caption: `${JILLIATH_BATTLE_GLOBAL}
Vocal Details
Instrumental: no vocals and no words at any point. The lead melodic role is carried by the low brass, with the organ underneath.
${JILLIATH_BATTLE_ARRANGEMENT}`,
    lyrics: INSTRUMENTAL,
  },
  "jilliath/battle-choir": {
    caption: `${JILLIATH_BATTLE_GLOBAL}
Vocal Details
Vocal Gender & Timbre: A large male choir only, no solo singer: deep, dark basses and baritones, severe and unified.
Vocal Style: Wordless vowels only, no words: low, chant-like held notes in the Verses and forceful, sustained block chords in each Chorus, like monks turned to war.
Vocal FX: Long cathedral reverb; no effects beyond that.
${JILLIATH_BATTLE_ARRANGEMENT}`,
    lyrics: VOWELS,
  },
  "jilliath/map": { caption: JILLIATH_MAP, lyrics: INSTRUMENTAL },
  "nexus/battle": { caption: NEXUS_BATTLE, lyrics: INSTRUMENTAL },
  "nexus/map": { caption: NEXUS_MAP, lyrics: INSTRUMENTAL },
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
if (tracks.length === 0) throw new Error(`name a track: ${Object.keys(TRACKS).join(", ")}`);

for (const name of tracks) {
  const track = TRACKS[name];
  if (!track) continue;
  const dir = `${OUT}/${name}`;
  await mkdir(dir, { recursive: true });
  let takes = await readFile(`${dir}/manifest.json`, "utf8").then((text): Take[] => JSON.parse(text), () => []);
  for (const seed of seeds.length > 0 ? seeds : [1000]) {
    // Named by the caption's round, so a new round never overwrites an earlier take.
    const file = `r2-${seed}.flac`;
    const started = Date.now();
    await writeFile(`${dir}/${file}`, await music3({ caption: track.caption, lyrics: track.lyrics, seed, seconds: SECONDS }, `disc/${name.replace("/", "-")}`));
    console.log(`${dir}/${file} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    takes = [...takes.filter((t) => t.file !== file), { file, track: name, seed, caption: track.caption, lyrics: track.lyrics, seconds: SECONDS, model: MUSIC3.diffusionModel }];
    await writeFile(`${dir}/manifest.json`, JSON.stringify(takes, null, 2));
  }
}
