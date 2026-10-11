"""The ground under round 4's angel (the user, 2026-10-11: "It looks like she's standing on a stool [...] we can't just
have a bunch of nothing there. Maybe that's where those spires can be?"), as an inpaint of seed 4: a pale stone corbel
of foliage under her feet crowning a steep crocketed gable, a deep pointed portal under it framing the leave button
(the way out as a doorway), slender pinnacles rising beside her robes, each tied to the portal by a small flying
buttress. Writes, at the painting's size: source.png (seed 4 with a value sketch in the repainted part), depth.png and
mask.png (white is repainted; the angel and the leave button stay as painted).

    python art/greybox/jilliath-capitol-base/make.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent
SEED = Path("art/candidates/ui/paint-in/jilliath-capitol-column-4/jilliath-capitol-column-4-4.png")
S = 576 / 300
BUTTON = (153, 805, 26)  # the leave button's centre and a radius with its socket, page px


def p(*xy: float) -> list[tuple[float, float]]:
    return [(xy[i] * S, xy[i + 1] * S) for i in range(0, len(xy), 2)]


def pointed(x0: float, y0: float, x1: float, y1: float) -> list[tuple[float, float]]:
    """A pointed arch's outline: sides from y1 up to its springing, two arcs to the apex."""
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


def draw(img: Image.Image, colours: dict[str, int | tuple[int, int, int]]) -> None:
    d = ImageDraw.Draw(img)
    c = colours
    # pinnacles beside her robes: a square shaft, a crocketed spire, a finial
    for x in (34, 230):
        d.rectangle(p(x, 640, x + 36, 864), fill=c["iron"])
        d.polygon(p(x + 18, 548, x + 34, 640, x + 2, 640), fill=c["iron"])
        for k in range(5):
            y = 566 + k * 15
            d.ellipse(p(x + 18 - 9 + k * 1.5 - 4, y - 3, x + 18 - 9 + k * 1.5 + 2, y + 3), fill=c["crocket"])
            d.ellipse(p(x + 18 + 9 - k * 1.5 - 2, y - 3, x + 18 + 9 - k * 1.5 + 4, y + 3), fill=c["crocket"])
        d.ellipse(p(x + 14, 540, x + 22, 550), fill=c["crocket"])
    # flying buttresses from each pinnacle to the portal
    for x0, x1, flip in ((70, 104, 1), (230, 202, -1)):
        pts = []
        for i in range(13):
            t = i / 12
            pts.append(((x0 + (x1 - x0) * t) * S, (690 + 40 * t - 26 * 4 * t * (1 - t)) * S))
        under = [(x * S, y * S) for x, y in ((x1, 744), (x0, 712))]
        d.polygon(pts + under, fill=c["iron"])
    # the portal: a deep pointed doorway framing the leave button
    d.polygon(pointed(100, 700, 206, 864), fill=c["stone"])
    d.polygon(pointed(112, 724, 194, 864), fill=c["deep"])
    # the gable over it, crocketed, its finial carrying the corbel
    d.polygon(p(92, 712, 153, 640, 214, 712), fill=c["stone"])
    for k in range(6):
        t = (k + 1) / 7
        for x, y in ((92 + 61 * t, 712 - 72 * t), (214 - 61 * t, 712 - 72 * t)):
            d.ellipse(p(x - 4, y - 7, x + 4, y + 1), fill=c["crocket"])
    # the corbel under her feet: a cushion of foliage
    d.polygon(p(112, 646, 194, 646, 176, 676, 130, 676), fill=c["stone"])
    d.ellipse(p(124, 652, 182, 690), fill=c["stone"])
    # the leave button in the portal
    bx, by, br = BUTTON
    d.ellipse(p(bx - br, by - br, bx + br, by + br), fill=c["socket"])
    d.ellipse(p(bx - 18, by - 18, bx + 18, by + 18), fill=c["button"])


def main() -> None:
    seed = Image.open(SEED).convert("RGB")
    W, H = seed.size
    mask = Image.new("L", (W, H), 0)
    m = ImageDraw.Draw(mask)
    m.rectangle(p(14, 640, 286, 862), fill=255)
    m.rectangle(p(14, 530, 98, 640), fill=255)
    m.rectangle(p(202, 530, 286, 640), fill=255)
    bx, by, br = BUTTON
    m.ellipse(p(bx - 21, by - 21, bx + 21, by + 21), fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(6))
    mask.save(OUT / "mask.png")
    sketch = seed.copy()
    draw(sketch, dict(iron=(58, 52, 46), crocket=(84, 76, 66), stone=(150, 142, 128), deep=(14, 12, 11), socket=(30, 27, 24), button=(220, 212, 198)))
    Image.composite(sketch, seed, mask).save(OUT / "source.png")
    depth = Image.new("RGB", (W, H), (110, 110, 110))
    draw(depth, dict(iron=(160, 160, 160), crocket=(196, 196, 196), stone=(176, 176, 176), deep=(36, 36, 36), socket=(150, 150, 150), button=(200, 200, 200)))
    depth.save(OUT / "depth.png")
    print("ok")


main()
