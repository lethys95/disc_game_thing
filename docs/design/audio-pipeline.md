# Audio pipeline (research, 2026-09-26; nothing built yet)

The user wants sound and music made locally with open models, like the art. Research by a Claude agent (web and a
read-only look at this machine); license claims carry their sources; recheck them before shipping anything.

## Recommendation
- **Music: ACE-Step 1.5** (turbo; XL-SFT for quality). MIT code and weights, no revenue cap; trained on licensed,
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
1. **Audio slots** (`view/audio-slots.ts`) derived from content: music per context (map per faction, battle,
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
