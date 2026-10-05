# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow"]
# ///
"""Split a turnaround sheet into its views, each a square image on the sheet's own background.

The views are found as runs of columns that differ from the background; runs closer than a small gap merge (thin
twigs, loose cloth), and narrow specks drop. Views are named in order: front, side, back, and any extra as view-4.

    uv run scripts/art/split-turnaround.py <sheet.png> <out-dir> <name>
"""

import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

LABELS = ("front", "side", "back")
THRESHOLD = 30
MERGE_GAP = 25
MIN_WIDTH = 60
PADDING = 1.12
SIZE = 1024


@dataclass(frozen=True)
class Run:
    start: int
    end: int


def background(pixels: np.ndarray) -> np.ndarray:
    edges = np.concatenate([pixels[:8].reshape(-1, 3), pixels[-8:].reshape(-1, 3)])
    return np.median(edges, axis=0)


def view_columns(foreground: np.ndarray) -> list[Run]:
    used = foreground.sum(axis=0) > 3
    runs: list[Run] = []
    start: int | None = None
    for x, on in enumerate(used):
        if on and start is None:
            start = x
        if not on and start is not None:
            runs.append(Run(start, x))
            start = None
    if start is not None:
        runs.append(Run(start, len(used)))
    merged: list[Run] = []
    for run in runs:
        if merged and run.start - merged[-1].end < MERGE_GAP:
            merged[-1] = Run(merged[-1].start, run.end)
        else:
            merged.append(run)
    return [run for run in merged if run.end - run.start > MIN_WIDTH]


def split(sheet: Path, out_dir: Path, name: str) -> list[Path]:
    image = Image.open(sheet).convert("RGB")
    pixels = np.asarray(image).astype(int)
    bg = background(pixels)
    foreground = np.abs(pixels - bg).sum(axis=2) > THRESHOLD
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for index, run in enumerate(view_columns(foreground)):
        rows = np.where(foreground[:, run.start : run.end].sum(axis=1) > 0)[0]
        crop = image.crop((run.start, int(rows.min()), run.end, int(rows.max()) + 1))
        side = int(max(crop.size) * PADDING)
        canvas = Image.new("RGB", (side, side), tuple(int(v) for v in bg))
        canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
        label = LABELS[index] if index < len(LABELS) else f"view-{index + 1}"
        target = out_dir / f"{name}-{label}.png"
        canvas.resize((SIZE, SIZE), Image.LANCZOS).save(target)
        written.append(target)
    return written


def main() -> None:
    sheet, out_dir, name = sys.argv[1:4]
    for path in split(Path(sheet), Path(out_dir), name):
        print(path)


if __name__ == "__main__":
    main()
