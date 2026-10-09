# Audio pipeline (research 2026-09-26; sound effects built 2026-09-27)

The user wants sound and music made locally with open models, like the art. Research by a Claude agent (web and a
read-only look at this machine); license claims carry their sources; recheck them before shipping anything.

## Recommendation
- **Music: Suno, made by the user** (2026-10-05). No local model is good enough: MiniMax Music 3 was tried and dropped (the note below), ACE-Step's tracks stay only as placeholders.
- *(Earlier pick)* **Music: ACE-Step 1.5** (turbo; XL-SFT for quality). MIT code and weights, no revenue cap; trained on licensed,
  royalty-free and synthetic data (https://github.com/ace-step/ACE-Step-1.5). Fast (<10 s per song on a 3090),
  ~4 GB VRAM (XL ~20 GB). BPM, key and time signature are controllable, so loop points can be bar-aligned;
  instrumental works; repaint/extend. Native in ComfyUI 0.37. **Already installed** as a standalone app
  (`~/boot_launching_applications/acestep/ACE-Step-1.5`, ~36 GB checkpoints, HTTP API on port 8001).
- **Sound effects: Stable Audio 3** (Small SFX for one-shots; Medium for ambience, stingers, loops). Stability AI
  Community License: free commercial use under $1M/yr revenue, outputs owned by us, Enterprise license above
  (https://stability.ai/license). The only permissive open model found that is trained for SFX. Native in ComfyUI
  0.37. **Needs downloading:** ~13–17 GB (Comfy-Org repacks: medium 9.2 GB, small SFX 2.3 GB, text encoder 1.2 GB,
  optional prompt expander ~4 GB). The disk is 91% full (328 GB free).

## License traps (don't use)
YuE2 weights CC BY-NC; MMAudio weights CC BY-NC; Woosh non-commercial; MusicGen CC BY-NC, AudioLDM 2 CC BY-NC-SA
(from memory, unchecked); MiniMax Music 3 allows commercial use but requires showing "MiniMax-Music3" prominently
in the game's UI.

## Local machine
2× RTX 3090 Ti (24 GB each), 123 GB RAM, ComfyUI 0.37 at 127.0.0.1:8188 with every native audio node (and Opus/MP3
save, trim, concat, LUFS normalize). ffmpeg with libopus, `loudnorm`, `ebur128`, `acrossfade`.

## How it would fit (mirrors the art pipeline)
1. **Audio slots** (built as `view/sound-slots.ts`, with `sound.ts` and `sound-cues.ts`) derived from content: music per context (map per faction, battle,
   victory/defeat stingers), SFX per ability tags and damage type (hit, cast, by element), UI clicks, footsteps.
   Each slot falls back along a chain (`sfx/cast/fire` → `sfx/cast/default`); nothing at the end means silence.
2. **`pnpm audio report | generate | accept`**: report what's filled; generate candidates through ComfyUI
   (`scripts/art/comfy.ts`) with prompt templates per slot kind; accept runs ffmpeg (trim, two-pass loudnorm to about
   −16 LUFS music / −18…−14 SFX, −1 dBTP, fades; loops cut on bars and crossfaded) into `assets/audio/<key>.ogg`
   with provenance (model, seed, prompt, license).
3. **Playback:** Opus in Ogg (96–128k music, ~64k SFX); WebAudio buses (master/music/sfx) with volume settings in
   the Settings page; music streamed with crossfades between map and battle.
4. **The user's ears are the gate**, as the user's eyes are for art. Claude can check duration, loudness and loop
   seams automatically, not whether it sounds good.

## Built (2026-09-27)
Generated SFX weren't good enough (the user's test); the first pass comes from the Sonniss GDC library instead.
- **Slots** (`src/view/sound-slots.ts`, like art's): derived from content: `ability/<id>` (its use), `hit/<id>` (what it does to a target), `death/<unit>`, `spell/<map spell>`, plus fixed ones (`ui/click`, `map/march`, `stinger/victory`, `ambience/map`…). Each has a fallback chain to family sounds (`hit/_spell`, `ability/_attack`, `death/_nexus`, `death/_default`), so one file covers a family until a specific one exists. A file at `assets/audio/<key>.ogg` fills a slot; `pnpm audio` reports what each slot plays. `assets/audio/SOURCES.md` records each file's source (a test checks every listed slot has its file).
- **Cues:** `src/view/sound-cues.ts` maps battle and map events to slots by event and tag (a spell's cast and hit, a melee swing and hit, shields, heals, deaths, fleeing, marches, captures, purchases, victory and defeat), never by ability id.
- **Playback:** WebAudio, opened on the first click or key; master and effects volume in Settings → Sound.
- **Making one:** `scripts/audio/sfx.sh take <library.wav> assets/audio/<slot>.ogg <seconds> [lufs]` cuts the first sound of a library recording to length, trims, normalizes and encodes Opus. The first pass was picked by filename and checked by the numbers only; the user picks keepers by ear.
- **Music (2026-09-27):** `scripts/audio/music.py` generates candidates with ACE-Step 1.5 in its own environment (`CUDA_VISIBLE_DEVICES=1 ~/boot_launching_applications/acestep/ACE-Step-1.5/.venv/bin/python scripts/audio/music.py [map battle]`; its API server's port 8001 is taken by another service, so it runs in-process). Takes land in `../music-candidates/<track>/`; one is finished (`sfx.sh finish … -20 96k`, fades at both ends) into `assets/audio/music/<track>.ogg`. Playback loops one track at a time, crossfading, by faction (user's idea, 2026-09-27): on the map your faction's `music/<faction>/map`, in battle the attacker's `battle-<n>` tracks in rotation; its own volume in Settings. The first takes were "very upbeat and weird" (user); the second round asks for slower tempi, keeps the caption as written (ACE-Step's language model otherwise rewrites it) and adds a negative prompt. Licensing options beyond ACE-Step: `music-sources.md`.
- **Ambience:** a looping bed under the music (`ambience/map`, wind in trees), on the map only, at the effects volume.
- Placeholders are fine for now (user, 2026-09-27): the point is the system; final sounds and music wait for a style direction (and, for final AI music, likely Suno, `music-sources.md`).

- **Music, MiniMax Music 3 (2026-10-05):** the user's new local music model, replacing ACE-Step ("it's not very
  good"; `scripts/audio/music.py` removed, its tracks stay in the game until replaced).
  - **Setup:** it runs in the local ComfyUI on the second GPU, through ComfyUI's own nodes and its "Text to Music
    (MiniMax Music 3)" blueprint. The model files are Comfy-Org's repacks, about 14 GB, in `models/diffusion_models`,
    `text_encoders` and `vae`. Free ComfyUI's image models first.
  - **Generating:** `pnpm exec tsx scripts/audio/music3.ts <track…> [seed…] [--lyrics=sections]` writes to
    `../music-candidates/minimax/<track>/` with a manifest. About 2–2.5 minutes for a 2-minute take.
  - **Instrumentals:** the model is made for songs with lyrics. Asking for an instrumental with `[Instrumental]`
    alone, or with empty lyrics, ends the take after 16–65 s. A whole song form with `[Instrumental]` in every
    section fills the length.
  - **Licence:** the "MiniMax-Music3 Community License", not open source. A commercial product must show
    "MiniMax-Music3" prominently, and needs MiniMax's written permission above $20M yearly revenue. It doesn't
    clearly grant ownership of outputs. Fine for placeholders; weigh it before shipping a track.
- **MiniMax Music 3, round one (2026-10-05):** the user: "I wouldn't call them good, but they're better than
  acestep […] it might be a prompting issue […] Suno is still king here."
  - MiniMax's own prompt guide (the music-caption-rewriter skill in its GitHub repo) asks for a structured caption of
    about 250–450 words under three headings: Global Metadata (genre, BPM, key, emotional progression, scenario,
    production), Vocal Details, and a section-by-section Arrangement. Round one used one paragraph.
  - All 1,000 of its reference templates have vocals, so instrumentals are outside what it was mostly trained on.
  - Round two: structured captions; a song form with no words for instrumentals; a wordless-choir variant (vowels
    only) for the Jilliath battle.
- **MiniMax Music 3, round two, and the verdict (2026-10-05):** the user: "we almost can't use any of the minimax
  ones. There's vocals in pretty much all of them. I'd go as far as to say the nexus ones in ace-step were actually
  better. I wouldn't use any of these […] [Suno is] night and day."
  - **Dropped:** `scripts/audio/music3.ts` and its ComfyUI graph are removed (git keeps them). The model files are
    still in ComfyUI, about 14 GB, the user's to delete.
  - **Music is the user's, from Suno:** the Grove's seven battle tracks, and Jilliath's battle theme
    (`inquisition_combat_theme`, more to come). ACE-Step's Nexus tracks and Jilliath map stay as placeholders.
  - **Quality:** "a very significant amount of quality was lost when you converted to ogg." That was the listening
    pages: dynamic loudnorm plus Opus at 128 kb/s. The game's tracks now use a static gain and Opus at 256 kb/s
    (`scripts/audio/music-take.sh`). The Grove's seven were re-encoded from the user's WAVs in
    `~/Music/theme_music/`, which is where the source WAVs live, outside the repo.
