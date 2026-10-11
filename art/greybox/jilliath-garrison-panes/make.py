"""The garrison wall's squad windows back to three by three (every seed of `jilliath-garrison` split each pane into
smaller leaded pieces, so an empty place no longer read as one place). Writes, at the painting's size: source.png
(seed 2 with the value greybox's nine panes laid into each grid), mask.png (the two grids) for the
`jilliath-garrison-panes` repair; its depth is the wall's own depth greybox.

    python art/greybox/jilliath-garrison-panes/make.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent
SEED = Path("art/candidates/ui/paint-in/jilliath-garrison/jilliath-garrison-2.png")
VALUES = Path("art/greybox/jilliath-garrison/values.png")
S = 1728 / 1236
GRIDS = [(110, 264), (435, 264)]


def main() -> None:
    seed = Image.open(SEED).convert("RGB")
    values = Image.open(VALUES).convert("RGB").resize(seed.size)
    mask = Image.new("L", seed.size, 0)
    d = ImageDraw.Draw(mask)
    for gx, gy in GRIDS:
        d.rectangle((gx * S, (gy - 2) * S, (gx + 290) * S, (gy + 300) * S), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    mask.save(OUT / "mask.png")
    Image.composite(values, seed, mask).save(OUT / "source.png")
    print("ok")


main()
