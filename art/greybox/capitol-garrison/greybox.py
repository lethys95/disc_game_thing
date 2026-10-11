"""The Capitol's garrison tab (docs/design/hud-pieces.md, "The Capitol's tabs"): values and depth greyboxes, in rem at
the game's 1080p root size (17.28px), 1236 x 864 page px, the screen left of the column. One wall: the city's tier and
its nodes on two dark panels with a button each; the garrison and a visiting warband as two lancet windows of nine
panes (a squad is a window, as on the map's column); a dark well below them for orders; the graveyard as a tall arched
recess over a tomb chest with a recumbent effigy.

    python art/greybox/capitol-garrison/greybox.py      (writes values.html and depth.html beside it)
"""
import math
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28
W, H = 1236, 864

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", well="#0b0a09", ivory="#e4dccb", glass="#7a2a1e",
              glass_hi="#b07a2a", pane="#0b0a09", figure="#3d3833", inlay="#26221e", mullion="#2a2622")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", well="#0e0e0e", ivory="#bcbcbc", glass="#3a3a3a",
             glass_hi="#444", pane="#1e1e1e", figure="#a6a6a6", inlay="#5a5a5a", mullion="#8e8e8e")

PANE_W, PANE_H, MULLION = 100, 90, 8
GRID_W = 3 * PANE_W + 2 * MULLION
GRID_H = 3 * PANE_H + 2 * MULLION
WINDOWS = (54, 470)
PANES_TOP = 336
FRAME_TOP, GLASS_TOP = 124, 140


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def pointed(w: float, h: float, rise: float) -> str:
    """A clip-path for a pointed arch on a w x h box whose head rises `rise` px (between w/2, round, and 0.87w,
    equilateral): each side an arc centred on the springing line, meeting at the apex at the box's top."""
    radius = (w * w / 4 + rise * rise) / w
    apex = math.acos((w / 2 - radius) / radius)
    left = [(0.0, h)]
    for i in range(17):
        a = math.pi - i * (math.pi - apex) / 16
        left.append((radius * (1 + math.cos(a)), rise - radius * math.sin(a)))
    right = [(w - x, y) for x, y in reversed(left)]
    return "clip-path:polygon(" + ",".join(f"{x / w * 100:.2f}% {y / h * 100:.2f}%" for x, y in left + right) + ")"


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};{extra}"></div>'


def band(y: float, x0: float = 0, x1: float = W) -> str:
    return (f'<div class="band" style="left:{r(x0)};width:{r(x1 - x0)};top:{r(y)}"></div>'
            f'<div class="stud" style="left:{r(x0 + 6)};top:{r(y - 3)}"></div><div class="stud" style="left:{r(x1 - 19)};top:{r(y - 3)}"></div>')


def window(c: dict[str, str], x: float) -> str:
    """A lancet window: tracery glass in its pointed head, nine square panes, a dark label strip and a plate below."""
    frame_x, frame_w = x - 18, GRID_W + 36
    frame_h = PANES_TOP + GRID_H + 14 - FRAME_TOP
    glass_h = PANES_TOP + 4 - GLASS_TOP
    parts = [
        box("frame", frame_x, FRAME_TOP, frame_w, frame_h, pointed(frame_w, frame_h, frame_w * 0.62)),
        box("glass", x, GLASS_TOP, GRID_W, glass_h, pointed(GRID_W, glass_h, GRID_W * 0.62)),
        box("tracery", x + GRID_W / 2 - 28, 192, 56, 56, "border-radius:50%"),
        box("tracery", x + GRID_W * 0.25 - 20, 266, 40, 40, "border-radius:50%"),
        box("tracery", x + GRID_W * 0.75 - 20, 266, 40, 40, "border-radius:50%"),
    ]
    for row in range(3):
        for col in range(3):
            parts.append(box("pane", x + col * (PANE_W + MULLION), PANES_TOP + row * (PANE_H + MULLION), PANE_W, PANE_H))
    parts.append(box("inlay", x, PANES_TOP + GRID_H + 22, GRID_W, 22))
    parts.append(box("plate", x + 24, PANES_TOP + GRID_H + 54, GRID_W - 48, 36))
    return "".join(parts)


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) 0 0 / {r(24)} {r(24)}, "
             f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) {r(12)} {r(12)} / {r(24)} {r(24)}, "
             f"linear-gradient(45deg, transparent 46%, {c['pat']} 47% 53%, transparent 54%) 0 0 / {r(12)} {r(12)}")
    crypt_x, crypt_w = 876, 336
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.wall {{ position: absolute; inset: 0; background: {rings}, {c['face']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 {r(4)} {c['rim']}; }}
.ivory {{ background: {c['ivory']}; box-shadow: 0 0 0 {r(4)} {c['rim']}, 0 0 0 {r(7)} {c['rim_hi']}; }}
.well {{ background: {c['well']}; box-shadow: 0 0 0 {r(4)} {c['rim']}, 0 0 0 {r(7)} {c['rim_hi']}; }}
.inlay {{ background: {c['inlay']}; box-shadow: 0 0 0 {r(3)} {c['rim']}, 0 0 0 {r(5)} {c['rim_hi']}; }}
.frame {{ background: {c['mullion']}; box-shadow: 0 0 0 {r(4)} {c['rim']}, 0 0 0 {r(8)} {c['rim_hi']}; }}
.glass {{ background: linear-gradient(180deg, {c['glass_hi']}, {c['glass']}); }}
.tracery {{ background: {c['mullion']}; box-shadow: 0 0 0 {r(4)} {c['glass_hi']}; }}
.pane {{ background: {c['pane']}; box-shadow: 0 0 0 {r(2)} {c['rim']}; }}
.band {{ position: absolute; height: {r(9)}; background: {c['band']}; box-shadow: inset 0 {r(2)} 0 {c['band_hi']}; }}
.vband {{ position: absolute; width: {r(9)}; background: {c['band']}; box-shadow: inset {r(2)} 0 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(13)}; height: {r(13)}; background: {c['stud']}; transform: rotate(45deg); }}
.figure {{ position: absolute; background: {c['figure']}; }}
</style></head><body><div class="wall">
  <!-- the head: the city's tier and its nodes, each a dark text panel with a rectangular ivory button at its right end -->
  {box("inlay", 24, 18, 572, 74)}{box("ivory", 436, 36, 144, 38)}
  {box("inlay", 640, 18, 572, 74)}{box("ivory", 1052, 36, 144, 38)}
  {band(104)}
  <!-- the garrison and the visiting warband: two lancet windows of nine panes -->
  {window(c, WINDOWS[0])}{window(c, WINDOWS[1])}
  <!-- the orders: a long dark well under both windows -->
  {box("well", 36, 728, 768, 114)}
  <!-- the graveyard: an upright band, a plate, a tall arched recess, a tomb chest with a recumbent effigy at its foot -->
  <div class="vband" style="left:{r(840)};top:{r(104)};height:{r(H - 104)}"></div>
  <div class="stud" style="left:{r(838)};top:{r(98)}"></div>
  {box("plate", crypt_x + 34, 124, crypt_w - 68, 38)}
  {box("frame", crypt_x - 10, 168, crypt_w + 20, 538, pointed(crypt_w + 20, 538, (crypt_w + 20) * 0.62))}
  {box("well", crypt_x, 182, crypt_w, 518, pointed(crypt_w, 518, crypt_w * 0.62))}
  {box("frame", crypt_x - 8, 716, crypt_w + 16, 120)}
  {box("figure", crypt_x + 20, 724, crypt_w - 40, 40, f"border-radius:{r(20)}")}
  {box("figure", crypt_x + 22, 712, 52, 46, "border-radius:50%")}
  {box("figure", crypt_x + 150, 708, 40, 30, f"border-radius:{r(15)}")}
  {box("band", 0, 852, W, 12)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
