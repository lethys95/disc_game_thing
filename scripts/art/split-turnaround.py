# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Split a turnaround sheet into its views, each a square image on the sheet's own background.

The views are the large connected shapes that differ from the background (a T-pose's arm can reach past a
neighbouring view's columns without touching it, so columns alone can't separate them); small detached bits (loose
cloth, a dangling strap) join the nearest view, and specks drop. Views are named left to right: front, side, back
(with four, the second side is side-2); any other count is numbered.

    uv run scripts/art/split-turnaround.py <sheet.png> <out-dir> <name>
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# A sheet sometimes draws the side twice (front, side, side, back).
LABELS: dict[int, tuple[str, ...]] = {3: ("front", "side", "back"), 4: ("front", "side", "side-2", "back")}
THRESHOLD = 30
DILATE = 2
MAIN_SHARE = 0.25
SPECK = 40
PADDING = 1.12
SIZE = 1024


@dataclass(frozen=True)
class View:
    """A view's bounding box and the connected regions (labels) that belong to it."""

    box: Box
    labels: frozenset[int]


@dataclass(frozen=True)
class Box:
    top: int
    left: int
    bottom: int
    right: int

    @staticmethod
    def of(slices: tuple[slice, slice]) -> Box:
        rows, cols = slices
        return Box(rows.start, cols.start, rows.stop, cols.stop)

    @property
    def centre(self) -> float:
        return (self.left + self.right) / 2

    def union(self, other: Box) -> Box:
        return Box(min(self.top, other.top), min(self.left, other.left), max(self.bottom, other.bottom), max(self.right, other.right))


def background(pixels: np.ndarray) -> np.ndarray:
    edges = np.concatenate([pixels[:8].reshape(-1, 3), pixels[-8:].reshape(-1, 3)])
    return np.median(edges, axis=0)


def views(foreground: np.ndarray) -> tuple[np.ndarray, list[View]]:
    labels, count = ndimage.label(ndimage.binary_dilation(foreground, iterations=DILATE))
    if count == 0:
        return labels, []
    sizes = ndimage.sum(foreground, labels, range(1, count + 1))
    largest = float(sizes.max())
    boxes = ndimage.find_objects(labels)
    main = [View(Box.of(boxes[i]), frozenset({i + 1})) for i in range(count) if sizes[i] >= largest * MAIN_SHARE]
    for i in range(count):
        if sizes[i] >= largest * MAIN_SHARE or sizes[i] < SPECK:
            continue
        bit = Box.of(boxes[i])
        k = min(range(len(main)), key=lambda j: abs(main[j].box.centre - bit.centre))
        main[k] = View(main[k].box.union(bit), main[k].labels | {i + 1})
    return labels, sorted(main, key=lambda view: view.box.centre)


def split(sheet: Path, out_dir: Path, name: str) -> list[Path]:
    image = Image.open(sheet).convert("RGB")
    pixels = np.asarray(image).astype(int)
    bg = background(pixels)
    foreground = np.abs(pixels - bg).sum(axis=2) > THRESHOLD
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    labels, found = views(foreground)
    names = LABELS.get(len(found), tuple(f"view-{i + 1}" for i in range(len(found))))
    for view, label in zip(found, names):
        # Only this view's own pixels: a neighbour's arm can reach into its box.
        own = np.isin(labels, list(view.labels))
        isolated = np.where(own[..., None], pixels, bg).astype(np.uint8)
        box = view.box
        crop = Image.fromarray(isolated).crop((box.left, box.top, box.right, box.bottom))
        side = int(max(crop.size) * PADDING)
        canvas = Image.new("RGB", (side, side), tuple(int(v) for v in bg))
        canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
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
