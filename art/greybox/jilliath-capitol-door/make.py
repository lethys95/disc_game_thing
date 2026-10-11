"""Round 4's base again, tighter (the user, 2026-10-11, on the first base: the background pattern came back "about 4
times bigger" and the spires were "visibly ejecting themselves out in a different dimension"; and the find: "the portal
having a door, means we don't even need an exit button. We just need to show the door"). The mask now follows the new
shapes only, so the quatrefoil diaper around them stays as round 4 painted it; no pinnacles. Under her feet a corbel of
leaves on the peak of a crocketed gable, under it a stone portal holding a closed oak door: the door is the way out.

    python art/greybox/jilliath-capitol-door/make.py      (source.png, depth.png and mask.png beside it)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent
SEED = Path("art/candidates/ui/paint-in/jilliath-capitol-column-4/jilliath-capitol-column-4-4.png")
S = 576 / 300


def p(*xy: float) -> list[tuple[float, float]]:
    return [(xy[i] * S, xy[i + 1] * S) for i in range(0, len(xy), 2)]


def pointed(x0: float, y0: float, x1: float, y1: float) -> list[tuple[float, float]]:
    w = x1 - x0
    spring = y0 + w * 0.6
    pts = [(x0, y1), (x0, spring)]
    for i in range(1, 13):
        t = i / 12
        pts.append((x0 + w / 2 * t, spring - (spring - y0) * (1 - (1 - t) ** 2)))
    for i in range(1, 13):
        t = i / 12
        pts.append((x0 + w / 2 + w / 2 * t, y0 + (spring - y0) * t ** 2))
    pts += [(x1, spring), (x1, y1)]
    return [(x * S, y * S) for x, y in pts]


def shapes(d: ImageDraw.ImageDraw, c: dict[str, tuple[int, int, int] | int]) -> None:
    d.polygon(pointed(84, 690, 216, 864), fill=c["stone"])
    d.polygon(pointed(98, 712, 202, 864), fill=c["step"])
    d.polygon(pointed(112, 734, 188, 864), fill=c["door"])
    for x in (130, 150, 170):
        d.line(p(x, 760, x, 864), fill=c["plank"], width=int(2 * S))
    for y in (782, 830):
        d.rectangle(p(114, y, 186, y + 5), fill=c["hinge"])
    d.ellipse(p(160, 800, 172, 812), outline=c["hinge"], width=int(2 * S))
    d.polygon(p(78, 704, 150, 634, 222, 704), fill=c["stone"])
    for k in range(6):
        t = (k + 1) / 7
        for x, y in ((78 + 72 * t, 704 - 70 * t), (222 - 72 * t, 704 - 70 * t)):
            d.ellipse(p(x - 4, y - 7, x + 4, y + 1), fill=c["crocket"])
    d.ellipse(p(122, 630, 178, 664), fill=c["stone"])


def diaper(d: ImageDraw.ImageDraw, colour: tuple[int, int, int], box: tuple[float, float, float, float]) -> None:
    """Round 4's greybox diaper at its scale and phase (a diamond and a quatrefoil every 28 page px), so a repainted
    patch keeps the pattern's size."""
    x0, y0, x1, y1 = box
    for j in range(int(y0 // 28) - 1, int(y1 // 28) + 2):
        for i in range(int(x0 // 28) - 1, int(x1 // 28) + 2):
            cx, cy = i * 28 + 14, j * 28 + 14
            d.line(p(cx, cy - 14, cx + 14, cy, cx, cy + 14, cx - 14, cy, cx, cy - 14), fill=colour, width=int(1.6 * S))
            for dx, dy in ((0, -3), (0, 3), (-3, 0), (3, 0)):
                d.ellipse(p(cx + dx - 2.4, cy + dy - 2.4, cx + dx + 2.4, cy + dy + 2.4), outline=colour, width=int(1.4 * S))


def main() -> None:
    seed = Image.open(SEED).convert("RGB")
    w, h = seed.size
    mask = Image.new("L", (w, h), 0)
    shapes(ImageDraw.Draw(mask), dict(stone=255, step=255, door=255, plank=255, hinge=255, crocket=255))
    # the stool round 4 painted, which the shapes don't all cover
    ImageDraw.Draw(mask).rectangle(p(58, 640, 242, 864), fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(5))
    mask.save(OUT / "mask.png")
    sketch = seed.copy()
    # the stool's place goes back to the dark iron face before the new shapes are drawn over it
    ImageDraw.Draw(sketch).rectangle(p(50, 636, 250, 864), fill=(40, 36, 33))
    diaper(ImageDraw.Draw(sketch), (70, 63, 56), (50, 636, 250, 864))
    shapes(ImageDraw.Draw(sketch), dict(stone=(150, 142, 128), step=(122, 115, 103), door=(62, 40, 26), plank=(40, 26, 17), hinge=(22, 20, 19), crocket=(170, 162, 148)))
    Image.composite(sketch, seed, mask).save(OUT / "source.png")
    depth = Image.new("RGB", (w, h), (110, 110, 110))
    diaper(ImageDraw.Draw(depth), (150, 150, 150), (0, 0, 300, 864))
    shapes(ImageDraw.Draw(depth), dict(stone=(180, 180, 180), step=(140, 140, 140), door=(70, 70, 70), plank=(60, 60, 60), hinge=(84, 84, 84), crocket=(200, 200, 200)))
    depth.save(OUT / "depth.png")
    print("ok")


main()
