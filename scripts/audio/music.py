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


# Dark fantasy (docs/design/art.md: candlelight, storm-light, furnace-light). Instrumental; no artist names.
TRACKS: dict[str, Track] = {
    "map": Track(
        "Dark fantasy orchestral ambient for a strategy map, slow and brooding, low strings drone, distant wordless choir, "
        "sparse war drums far away, solo cello motif, somber medieval mood, instrumental, loopable",
        70,
        "D minor",
        90,
    ),
    "battle": Track(
        "Dark fantasy battle music, tense and driving, war drums and taiko, low brass stabs, staccato strings, ominous "
        "wordless choir, medieval, instrumental, loopable",
        120,
        "C minor",
        90,
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
        params = GenerationParams(caption=track.caption, lyrics="[Instrumental]", instrumental=True, bpm=track.bpm, keyscale=track.key, duration=track.duration, shift=3.0)
        config = GenerationConfig(batch_size=2, use_random_seed=False, seeds=[11, 23], audio_format="flac")
        out = os.path.join(OUT_ROOT, name)
        os.makedirs(out, exist_ok=True)
        result = generate_music(dit, lm, params, config, save_dir=out)
        if not result.success:
            print(f"{name}: failed: {result.error}")
            continue
        for audio in result.audios:
            print(f"{name}: {audio['path']}")


if __name__ == "__main__":
    main()
