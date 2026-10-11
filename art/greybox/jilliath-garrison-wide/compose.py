"""The garrison wall widened to the left for wide screens (the hud-paint-in skill, "Wider screens"; the user,
2026-10-11: "Can you extend the image please"). An extension of 576 page px (covers 21:9) is sketched in the wall's
greybox language (its masonry courses, the crypt arcade continued at its 108 px rhythm, a blind lancet arcade with no
glass and no figures) and set left of the accepted painting. Only a 1280 px crop is inpainted (the extension and a
strip of the painting for context); the mask covers the extension only, so the painting stays as it is.

    python art/greybox/jilliath-garrison-wide/compose.py     (source.png, depth.png, mask.png beside it)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
WALL = Path("assets/ui/jilliath/garrison.webp")
WALL_DEPTH = Path("art/greybox/jilliath-garrison-3/depth.png")
K = 1728 / 1236
EXT = 576
EXT_PX = round(EXT * K)
CROP = 1280


def pointed(d: ImageDraw.ImageDraw, x0: float, top: float, x1: float, bottom: float, fill: tuple[int, int, int]) -> None:
    """A two-centred pointed arch from x0 to x1 (painting px), apex at top."""
    w = x1 - x0
    spring = top + w * 0.7
    pts = [(x0, bottom), (x0, spring)]
    for i in range(1, 13):
        t = i / 12
        pts.append((x0 + w / 2 * t, spring - (spring - top) * (1 - (1 - t) ** 2)))
    for i in range(1, 13):
        t = i / 12
        pts.append((x0 + w / 2 + w / 2 * t, top + (spring - top) * t ** 2))
    pts += [(x1, spring), (x1, bottom)]
    d.polygon(pts, fill=fill)


def ext_sketch(depth: bool) -> Image.Image:
    img = Image.new("RGB", (EXT_PX, 1216), (110, 110, 110) if depth else (26, 24, 22))
    d = ImageDraw.Draw(img)
    def x(page: float) -> float:
        return (page + EXT) * K
    heights = [58, 64, 52, 70, 60, 56]
    y, course = 0, 0
    while y * K < 1216:
        h = heights[course % len(heights)]
        bx = -EXT - ((course * 37) % 90)
        i = 0
        while bx < 0:
            w = 96 + ((course * 53 + i * 71) % 88)
            shade = ((course * 17 + i * 29) % 9) - 4
            v = (0x6e + shade * 3) if depth else (0x2a + shade * 2)
            d.rectangle((x(bx + 2), (y + 2) * K, x(bx + w - 2), (y + h - 2) * K), fill=(v, v, v if depth else v - 3))
            bx += w
            i += 1
        y += h
        course += 1
    stone = (176, 176, 176) if depth else (142, 135, 123)
    dark = (40, 40, 40) if depth else (28, 25, 23)
    iron = (150, 150, 150) if depth else (38, 34, 31)
    # the ledge over the crypt, continued
    d.rectangle((0, 600 * K, EXT_PX, 640 * K), fill=stone)
    # the crypt arcade, continued at its rhythm (arches at 40 - 108 n)
    for n in range(1, 7):
        ax = 40 - 108 * n
        pointed(d, x(ax - 6), 676 * K, x(ax + 90), 864 * K, stone)
        pointed(d, x(ax), 690 * K, x(ax + 84), 864 * K, dark)
    # a blind lancet arcade in iron: two narrow pointed lancets under one arch, centred in the extension
    cx = -290
    pointed(d, x(cx - 110), 90 * K, x(cx + 110), 560 * K, iron)
    for lx in (cx - 90, cx + 10):
        pointed(d, x(lx), 220 * K, x(lx + 80), 540 * K, dark)
    d.ellipse((x(cx - 34), 150 * K, x(cx + 34), 218 * K), fill=dark)
    return img


def main() -> None:
    wall = Image.open(WALL).convert("RGB")
    wall_depth = Image.open(WALL_DEPTH).convert("RGB").resize(wall.size)
    keep = CROP - EXT_PX
    for name, ext, base in (("source.png", ext_sketch(False), wall), ("depth.png", ext_sketch(True), wall_depth)):
        canvas = Image.new("RGB", (CROP, 1216))
        canvas.paste(ext, (0, 0))
        canvas.paste(base.crop((0, 0, keep, 1216)), (EXT_PX, 0))
        canvas.save(HERE / name)
    mask = Image.new("L", (CROP, 1216), 0)
    ImageDraw.Draw(mask).rectangle((0, 0, EXT_PX + 10, 1216), fill=255)
    mask.filter(ImageFilter.GaussianBlur(6)).save(HERE / "mask.png")
    print(f"extension {EXT_PX} px, crop {CROP} px")


main()
