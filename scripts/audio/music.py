"""Music candidates for disc with ACE-Step 1.5, run in ACE-Step's own environment:

    CUDA_VISIBLE_DEVICES=1 ~/boot_launching_applications/acestep/ACE-Step-1.5/.venv/bin/python scripts/audio/music.py [track ...]

Writes to ../music-candidates/<track>/ (outside the repo). The user picks keepers by ear; `sfx.sh` finishes them.
"""

import os
import sys
from dataclasses import dataclass

ACE_ROOT = os.path.expanduser("~/boot_launching_applications/acestep/ACE-Step-1.5")
OUT_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "music-candidates"))
sys.path.insert(0, ACE_ROOT)

from acestep.handler import AceStepHandler  # noqa: E402
from acestep.inference import GenerationConfig, GenerationParams, generate_music  # noqa: E402
from acestep.llm_inference import LLMHandler  # noqa: E402


@dataclass(frozen=True)
class Track:
    caption: str
    bpm: int
    key: str
    duration: float


# Dark fantasy (docs/design/art.md: candlelight, storm-light, furnace-light). Instrumental; no artist names. The first
# takes came out "very upbeat and weird" (user, 2026-09-27): slower tempi, an explicit negative prompt, and the
# caption kept as written (ACE-Step's language model otherwise rewrites it). Faction directions follow the canon
# (factions/*.md) and are provisional.
NEGATIVE = "upbeat, happy, cheerful, bright, pop, dance, EDM, electronic beat, synth, rock drum kit, vocals with words"

TRACKS: dict[str, Track] = {
    "jilliath/map": Track(
        "Slow dark medieval sacred music, grim and severe, cathedral organ drone, low male monastic chant without words, "
        "distant tolling bell, sparse deep drum, mournful, minor key, cinematic, instrumental",
        60,
        "D minor",
        120,
    ),
    "jilliath/battle": Track(
        "Grim holy war music, slow relentless heavy war drums, low male choir chanting without words, cathedral organ, "
        "dark brass, severe and zealous, minor key, cinematic, instrumental",
        84,
        "C minor",
        120,
    ),
    "nexus/map": Track(
        "Slow dark arcane ambient, cold and mysterious, eerie sustained strings, glass harmonica, soft ticking clockwork "
        "percussion, distant rolling thunder, tense and lonely, minor key, cinematic, instrumental",
        60,
        "E minor",
        120,
    ),
    "nexus/battle": Track(
        "Tense dark arcane battle music, taut staccato low strings, metallic anvil and clockwork percussion, crackling "
        "electric tension, ominous low brass swells, minor key, cinematic, instrumental",
        96,
        "F minor",
        120,
    ),
}


def main() -> None:
    names = sys.argv[1:] or list(TRACKS)
    dit = AceStepHandler()
    dit.initialize_service(project_root=ACE_ROOT, config_path="acestep-v15-turbo", device="cuda")
    lm = LLMHandler()
    lm.initialize(checkpoint_dir=os.path.join(ACE_ROOT, "checkpoints"), lm_model_path="acestep-5Hz-lm-1.7B", backend="vllm", device="cuda")
    for name in names:
        track = TRACKS[name]
        params = GenerationParams(
            caption=track.caption,
            lyrics="[Instrumental]",
            instrumental=True,
            bpm=track.bpm,
            keyscale=track.key,
            duration=track.duration,
            shift=3.0,
            use_cot_caption=False,
            lm_negative_prompt=NEGATIVE,
        )
        config = GenerationConfig(batch_size=3, use_random_seed=False, seeds=[11, 23, 37], audio_format="flac")
        out = os.path.join(OUT_ROOT, name)
        os.makedirs(out, exist_ok=True)
        result = generate_music(dit, lm, params, config, save_dir=out)
        if not result.success:
            print(f"{name}: failed: {result.error}")
            continue
        for audio, seed in zip(result.audios, config.seeds or []):
            named = os.path.join(out, f"{name.replace('/', '-')}-seed{seed}.flac")
            os.replace(audio["path"], named)
            print(f"{name}: {named}")


if __name__ == "__main__":
    main()
