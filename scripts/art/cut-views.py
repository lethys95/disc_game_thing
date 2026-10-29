# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Tripo views cut by hand, for sheets the splitter (`split-turnaround.py`) can't part: tails or wings running from one
view into the next, or a figure whose colours are close to the background (the Godkin's pale clouds read as background
and its hand came loose). Each view is a region bounded by seams drawn by hand; everything in the region is kept.

    uv run scripts/art/cut-views.py <unit>        writes shots/tripo/<unit>/{front,side,back}.png
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

Point = tuple[int, int]

AVATAR_SEAM_LEFT: list[Point] = [(1040, 0), (1040, 40), (1008, 48), (1008, 292), (912, 308), (912, 560), (902, 575), (902, 780), (894, 790), (894, 832)]
AVATAR_SEAM_RIGHT: list[Point] = [(1172, 0), (1172, 220), (1185, 300), (1205, 420), (1205, 560), (1200, 690), (1210, 832)]

SHEETS: dict[str, tuple[str, list[list[Point]]]] = {
    # Wide gaps between the figures: plain column strips.
    "godkin": ("art/candidates/units/jilliath/angels/godkin-bare-turnaround-1001.png", [
        [(0, 0), (890, 0), (890, 832), (0, 832)],
        [(890, 0), (1180, 0), (1180, 832), (890, 832)],
        [(1180, 0), (2048, 0), (2048, 832), (1180, 832)],
    ]),
    # The front's wingtips stop at the side figure's back; the side's and the back's wingtips cross. Both edges of the
    # sheet clip feathers of their own.
    "avatar-of-vengeance": ("art/candidates/units/jilliath/melee/avatar-streaks-turnaround-1000.png", [
        [(0, 0), *AVATAR_SEAM_LEFT, (0, 832)],
        [*AVATAR_SEAM_RIGHT, *AVATAR_SEAM_LEFT[::-1]],
        [(1172, 0), (2048, 0), (2048, 832), *AVATAR_SEAM_RIGHT[::-1]],
    ]),
}
# A neighbour's stray wisps left inside a region beside a seam: small pieces whose centre lies in these columns.
STRAYS: dict[str, dict[str, list[tuple[int, int]]]] = {"avatar-of-vengeance": {"side": [(0, 960), (1150, 2048)], "back": [(0, 1260)]}}
NAMES = ("front", "side", "back")


def spitter_regions(pixels: np.ndarray, figure: np.ndarray) -> list[np.ndarray]:
    """The sheet draws the side twice and each tail runs under the next figure. The second side view is the one kept:
    its shin is drawn over the first side's tail, so taking that tail away leaves it whole."""
    height, width = figure.shape
    ys, xs = np.mgrid[0:height, 0:width]
    band = Image.new("L", (width, height), 0)
    ImageDraw.Draw(band).polygon([(990, 668), (1050, 695), (1100, 718), (1180, 738), (1330, 752), (1330, 784), (1180, 784), (1100, 774), (1050, 758), (990, 735)], fill=255)
    shin = np.zeros(width, bool)
    shin[1075:1166] = figure[700, 1075:1166]
    first_tail = figure & (np.asarray(band) > 0) & ~shin[None, :]
    back_parts = ((xs >= 1295) & (ys < 400)) | ((xs >= 1500) & (ys < 742)) | ((xs >= 1570) & (ys > 780))
    side = figure & (xs >= 995) & (xs < 1606) & ~first_tail & ~back_parts
    back = figure & (xs >= 1295) & ~((xs < 1606) & (ys > 740) & (ys < 780))
    front = figure & (xs < 705)
    regions = []
    for mask, anchor in ((front, (400, 350)), (side, (400, 1150)), (back, (400, 1720))):
        labels, _ = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
        regions.append(mask & (labels == labels[anchor]))
    return regions


def main() -> None:
    unit = sys.argv[1]
    sheet = "art/candidates/units/neutrals/scaled/spitter-r4-turnaround-1000.png" if unit == "spitter" else SHEETS[unit][0]
    pixels = np.asarray(Image.open(sheet).convert("RGB")).astype(int)
    height, width = pixels.shape[:2]
    bg = np.median(np.concatenate([pixels[:4].reshape(-1, 3), pixels[-4:].reshape(-1, 3)]), axis=0)
    figure = np.abs(pixels - bg).sum(axis=2) > 24
    if unit == "spitter":
        regions = spitter_regions(pixels, figure)
    else:
        regions = []
        for polygon in SHEETS[unit][1]:
            mask = Image.new("L", (width, height), 0)
            ImageDraw.Draw(mask).polygon(polygon, fill=255)
            regions.append(np.asarray(mask) > 0)
    out = Path("shots/tripo") / unit
    out.mkdir(parents=True, exist_ok=True)
    for name, region in zip(NAMES, regions):
        for lo, hi in STRAYS.get(unit, {}).get(name, []):
            labels, _ = ndimage.label(ndimage.binary_dilation(figure & region, iterations=3))
            for i, piece in enumerate(ndimage.find_objects(labels), start=1):
                own = labels == i
                if own.sum() < 3000 and lo <= (piece[1].start + piece[1].stop) / 2 < hi:
                    region = region & ~own
        ys, xs = np.nonzero(figure & region)
        top, bottom, left, right = max(ys.min() - 4, 0), min(ys.max() + 5, height), max(xs.min() - 4, 0), min(xs.max() + 5, width)
        isolated = np.where(region[..., None], pixels, bg).astype(np.uint8)
        crop = Image.fromarray(isolated).crop((left, top, right, bottom))
        side = int(max(crop.size) * 1.12)
        canvas = Image.new("RGB", (side, side), tuple(int(v) for v in bg))
        canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
        canvas.resize((1024, 1024), Image.LANCZOS).save(out / f"{name}.png")
        print(out / f"{name}.png")


if __name__ == "__main__":
    main()
