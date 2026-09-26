---
name: sfx
description: Generate sound-effect candidates for disc locally with Stable Audio 3 (hits, casts, UI clicks, footsteps, stingers, ambience loops), then trim, loudness-normalize and encode them to Opus with ffmpeg and sanity-check them by the numbers. Use when asked to make, generate or try sounds, SFX or ambience for the game.
---

# Generating SFX for disc

The plan this serves is `docs/design/audio-pipeline.md` (slots, `pnpm audio`, playback). None of that is built yet; this skill covers
making candidates by hand. **The user judges by ear and picks the keepers.** Claude can't hear. It can check length, loudness, peaks
and silence, and it writes good prompts. Never call a sound good. Hand over the files and say what the numbers show.

## The tool
Stable Audio 3, checked out at `/home/lethys/programs/stable-audio-3` (uv project, Python 3.10, torch 2.7.1+cu126; the venv exists).
CLI: `stable-audio` (source `stable_audio_3/cli.py`; `--help` lists every flag).

| Model | Use | Needs |
|---|---|---|
| `small-sfx` | one-shots: hits, impacts, casts, UI, footsteps, creature barks | any GPU, or CPU |
| `medium` | ambience beds, loops, longer stingers, anything tonal | CUDA + flash-attn (see setup) |
| `small-sfx-base` / `medium-base` | only when you need `--negative-prompt` / `--cfg-scale` | 50 steps, cfg ~7 |

### One-time setup (the user's step; check before generating)
The weights are **gated** on Hugging Face (click-through license, then an authenticated download). Claude must never log in, use the
user's HF token, or fetch the weights from a mirror. If the cache check below fails, stop and hand this list to the user:
1. Accept the license on https://huggingface.co/stabilityai/stable-audio-3-small-sfx (and `-medium` for ambience/loops).
2. Download while logged in: `cd ~/programs/stable-audio-3 && uv run --no-sync hf download stabilityai/stable-audio-3-small-sfx`
   (same for `stabilityai/stable-audio-3-medium`). Each repo carries its own T5Gemma text encoder.
3. For `medium` only, install Flash Attention 2 (without it medium outputs a static glitch sound). The venv matches the README's
   example wheel exactly (cu126, torch 2.7, cp310):
   `uv pip install https://github.com/mjun0812/flash-attention-prebuild-wheels/releases/download/v0.7.16/flash_attn-2.6.3+cu126torch2.7-cp310-cp310-linux_x86_64.whl`
   A plain `uv sync` removes it again; use `uv sync --inexact`, and run with `uv run --no-sync`.

Check what's cached (no network):
```bash
ls ~/.cache/huggingface/hub | grep stable-audio-3
cd ~/programs/stable-audio-3 && uv run --no-sync python -c "import flash_attn; print(flash_attn.__version__)"   # medium only
```

## Generate
Candidates live **outside the repo**, in `/home/lethys/projects/all_disc/sfx-candidates/<slot>/` (e.g. `hit/sword-on-shield/`).
Generated audio never goes in git. Name files by slot and seed.

```bash
cd /home/lethys/programs/stable-audio-3 && \
CUDA_VISIBLE_DEVICES=1 HF_HUB_OFFLINE=1 uv run --no-sync stable-audio \
  --model small-sfx \
  -p "TrackType: SFX, a heavy iron sword striking a wooden round shield, a single hard impact with a splintering crack, close mic, dry room" \
  --duration 2 --seed 101 --batch-size 4 \
  -o /home/lethys/projects/all_disc/sfx-candidates/hit/sword-on-shield/s101.wav
```
Status: **not yet run end to end.** The flags come from `cli.py` and the docs, but the first test (2026-09-26) stopped at the gated
download. Once a real run works, delete this line and note anything that differed.

- `CUDA_VISIBLE_DEVICES=1`: ComfyUI may hold GPU0. `HF_HUB_OFFLINE=1`: load from the cache only, so a run never authenticates as
  the user. A cache miss shows up as `LocalEntryNotFoundError`. That is a stop-point (see setup), not something to work around.
  The "flash_attn not installed" lines are harmless for `small-sfx`.
- `--batch-size 4` with one prompt gives four variations (`s101_0.wav` … `s101_3.wav`, 44.1 kHz stereo WAV). Several `-p` values
  make a per-prompt batch (with matching `--duration` values if they differ).
- `--seed`: fixed seeds make candidates reproducible. Record the seed, model and prompt of anything the user keeps. `-1` is random.
- `--steps`: leave at 8 for post-trained models (more doesn't help). Use 50 for `-base` models.
- `--negative-prompt` and `--cfg-scale` **do nothing on post-trained models**. For negatives, switch to `small-sfx-base`:
  `--model small-sfx-base --steps 50 --cfg-scale 7 --negative-prompt "music, speech, voice, melody, reverb tail, low quality"`.
- Durations. The model fills the length it's given, so ask for about what the sound should last, plus a little tail to trim:
  | Kind | `--duration` |
  |---|---|
  | UI click, tick, coin | 0.5–1 |
  | footstep, hit, impact, swing | 1–2 |
  | spell cast, death, summon | 2–4 |
  | victory/defeat stinger (`medium`) | 4–10 |
  | ambience bed or loop (`medium`) | 20–60 |
- A loop needs a seam. Generate it longer than needed, cut it, and crossfade it (`acrossfade`). Check the seam with `check` on the
  looped file. For bar-aligned music loops, use ACE-Step instead (see the pipeline doc).

## Writing prompts
Start with `TrackType: SFX` (the prompting guide says it makes effects more coherent). The training data is Freesound and AudioSparx
metadata, so write like a sound librarian labelling a recording, not like a poet.
- **One sound per prompt.** Name the source, the action and its envelope, then the recording. For example: "a heavy wooden door
  slamming shut, fast decay, low-mid thud, recorded in a stone hall". Don't ask for "a sword hit and a scream". Make two sounds and
  layer them in the game.
- **Physical nouns over mood words.** "Bone snapping, dry crack" works; "an evil sound" doesn't. Dark fantasy comes from the
  materials: iron, bone, leather, stone, wood, chains, fire, wind, crypts, caves. Magic reads as processed natural sources:
  "a low whoosh of fire igniting with a rising shimmer", "a deep sub-bass rumble with crackling ice".
- **Say the space and the processing.** Use "close mic, dry" for game one-shots, because the game adds space itself. Add reverb in
  the prompt only for ambience.
- **No artist, game, film or studio names** (no "like Diablo", no "Hans Zimmer"). Don't invent lore in prompts either. Describe
  the sound, not a named spell or unit from outside the design docs.
- For ambience, name the layers and their density: "wind through a ruined stone keep, distant crows, faint dripping water, no music".
- If a prompt misses twice, change the wording (source, material, verb) before changing seeds.

## Finish (trim, normalize, encode)
`scripts/audio/sfx.sh` wraps ffmpeg:
```bash
S=/home/lethys/projects/all_disc/new_disc/scripts/audio/sfx.sh
$S finish in.wav out.ogg -16          # target LUFS; optional 4th arg bitrate (default 64k)
$S check  in.wav out.ogg ...          # numbers for any audio file
```
`finish` does the following:
1. Trims leading and trailing silence below −50 dBFS, with a 5 ms fade in and a 30 ms fade out.
2. Pass 1 measures EBU R128 integrated loudness and true peak (`loudnorm`). A clip under 0.6 s is measured looped, because R128
   gates on 400 ms blocks and a single short click has no integrated loudness.
3. Pass 2 applies one static gain to the target, capped so the true peak stays under −1.5 dBTP. Opus decoding adds a few tenths
   of a dB, so the result lands at or under −1 dBTP.
4. Encodes 48 kHz Opus in Ogg at 64k.

Targets: SFX **−18 to −14 LUFS** (UI and footsteps quieter, around −18; big impacts and stingers around −14); music and ambience
**−16 LUFS**. Music also needs 96–128k (`$S finish in.wav out.ogg -16 128k`). Percussive hits often end up 1–2 LU under target
because the peak cap wins. That's expected, so don't add a limiter unless the user asks for louder.

## Sanity-check without ears
Run `$S check` on every candidate before handing it over. Flag the file (don't delete it; the user decides) if:
- **duration** is far from what was asked, or it's a one-shot that is still long after finishing (a trailing drone).
- **silence** is still present after finishing: a gap in the middle means two sounds, or a dead patch.
- **loudness** is below −30 LUFS raw (near silent, likely a dud), or the peak sits at 0 dBTP raw (clipping in the generation).
- the LU range is large (above ~10) on a one-shot: probably several events, not one.
- mono content in stereo is fine. Very different channels on a one-shot can mean it wanders, so mention it.

## Handing over
Tell the user the candidate folder, one line per file (prompt, seed, the `check` numbers, anything flagged), and ask them to listen
and pick. Record kept sounds with their provenance (model, seed, prompt, license). Until `assets/audio/` and the slot map exist, put
that in `docs/status.md` or a question in `docs/questions.md`, not in code.

## License
- Weights: **Stability AI Community License** (HF card `license_name: stable-audio-community`; https://stability.ai/license).
  Commercial use is free under $1M/yr annual revenue and the outputs are ours; above that needs an Enterprise license. The HF gate
  also binds the **Gemma Terms of Use** (the T5Gemma text encoder), including their use restrictions.
- Code in `~/programs/stable-audio-3`: MIT (`LICENSE` there).
- Check the current terms before shipping anything; see the audio pipeline doc.
