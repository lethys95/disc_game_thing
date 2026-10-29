# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Flag split Tripo views that look broken: a straight cut down the figure's outline (a limb or a wing cropped where a
neighbouring view began) or a loose piece apart from the figure (a neighbour's tail). Units with a model are skipped.
A flag is a lead, not a verdict: a flat sleeve or a cloud of loose wisps (the Godkin) can trip it; look at the view.

    uv run scripts/art/check-views.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

VIEWS = ("front", "side", "side-2", "back")
STRAIGHT = 25


def problems(view: Path) -> list[str]:
    pixels = np.asarray(Image.open(view).convert("RGB")).astype(int)
    bg = np.median(np.concatenate([pixels[:6].reshape(-1, 3), pixels[-6:].reshape(-1, 3)]), axis=0)
    figure = np.abs(pixels - bg).sum(axis=2) > 40
    xs = np.nonzero(figure)[1]
    if len(xs) == 0:
        return ["empty"]
    found = [f"{side} edge cut straight ({run} px)" for side, run in (("left", figure[:, xs.min()].sum()), ("right", figure[:, xs.max()].sum())) if run > STRAIGHT]
    labels, count = ndimage.label(ndimage.binary_dilation(figure, iterations=3))
    sizes = ndimage.sum(figure, labels, range(1, count + 1))
    loose = [int(size) for size in sizes if 150 < size < sizes.max() * 0.2]
    if loose:
        found.append(f"loose pieces {loose}")
    return found


def main() -> None:
    modelled = {path.stem for path in Path("assets/models/units").glob("*.glb")}
    for folder in sorted(p for p in Path("shots/tripo").iterdir() if p.is_dir() and not p.name.startswith(".") and p.name not in modelled):
        for view in sorted(folder.glob("*.png")):
            if view.stem in VIEWS and (found := problems(view)):
                print(f"{folder.name}/{view.name}: {'; '.join(found)}")


if __name__ == "__main__":
    main()
