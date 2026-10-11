"""The accepted Capitol column with its diaper replaced by masonry, to match the garrison wall's round 2 (the user: the
pattern "was already a bit much to look at on the right side"). The mask is the column's dark, unsaturated ground
inside its frame, away from the rose window, the angel, the portal and the plates; the garrison's masonry is laid into
both the source and the depth map at the same block size, so the repaint keeps that scale.

    python art/greybox/jilliath-capitol-stone/make.py      (source.png, depth.png, mask.png beside it)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent
SOURCE = Path("assets/ui/jilliath/capitol-column.webp")
S = 576 / 300


def masonry(size: tuple[int, int], depth: bool) -> Image.Image:
    """The garrison greybox's courses (art/greybox/jilliath-garrison-2), in this painting's pixels."""
    k = 1728 / 1236
    img = Image.new("RGB", size, (110, 110, 110) if depth else (26, 24, 22))
    d = ImageDraw.Draw(img)
    heights = [58, 64, 52, 70, 60, 56]
    y, course = 0, 0
    while y * k < size[1]:
        h = heights[course % len(heights)]
        x = -((course * 37) % 90)
        i = 0
        while x * k < size[0]:
            w = 96 + ((course * 53 + i * 71) % 88)
            shade = ((course * 17 + i * 29) % 9) - 4
            v = (0x6e + shade * 3) if depth else (0x2a + shade * 2)
            d.rectangle(((x + 2) * k, (y + 2) * k, (x + w - 2) * k, (y + h - 2) * k), fill=(v, v, v if depth else v - 3))
            x += w
            i += 1
        y += h
        course += 1
    return img


def main() -> None:
    src = Image.open(SOURCE).convert("RGB")
    a = np.asarray(src).astype(float)
    lum = a.mean(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    region = (xx > 22 * S) & (xx < 278 * S) & (yy > 118 * S) & (np.hypot(xx - 150 * S, yy - 222 * S) > 96 * S)
    # everything that is a thing (pale stone, glass, wood, marble) and a margin round it stays as painted
    # judged blurred, so the lattice's small highlights average out and only real objects stay bright
    soft = np.asarray(src.filter(ImageFilter.GaussianBlur(7))).astype(float)
    thing_px = (soft.mean(axis=2) > 78) | ((soft.max(axis=2) - soft.min(axis=2)) > 30)
    thing = Image.fromarray((thing_px * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))
    protect = np.asarray(thing) > 0
    portal = (xx > 72 * S) & (xx < 228 * S) & (yy > 622 * S)
    ground = region & ~protect & ~portal
    m = Image.fromarray((ground * 255).astype(np.uint8))
    # whole regions: drop specks, then soften the edge
    m = m.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    m.save(OUT / "mask.png")
    stone = masonry(src.size, False)
    Image.composite(stone, src, m).save(OUT / "source.png")
    masonry(src.size, True).save(OUT / "depth.png")
    print("ok")


main()
