"""The warband's right column for the leader's and the structures' screens (docs/design/hud-pieces.md, "The warband
column"): values and depth greyboxes, in rem at the game's 1080p root size (17.28px), 300 x 864 page px. The map and
Capitol columns' sibling: the leader's name, the purse and the warband's count; the warband as a lancet window of nine
panes; three fact plates (dark iron); Back to the map as a seal two figures hold, a standard-bearer and a pilgrim.

    python art/greybox/warband-column/greybox.py      (writes values.html and depth.html beside it)
"""
import math
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", well="#0b0a09", ivory="#e4dccb", lit="#e8c36c",
              figure="#3d3833", seal="#8a2a22", inlay="#26221e", glass="#7a2a1e", glass_hi="#b07a2a", mullion="#2a2622",
              pane="#0b0a09")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", well="#0e0e0e", ivory="#bcbcbc", lit="#c4c4c4",
             figure="#a6a6a6", seal="radial-gradient(circle, #f0f0f0, #b8b8b8 75%)", inlay="#5a5a5a", glass="#3a3a3a",
             glass_hi="#444", mullion="#8e8e8e", pane="#1e1e1e")

PANE, MULLION = 76, 8
GRID = 3 * PANE + 2 * MULLION
GRID_X, PANES_TOP = (300 - GRID) / 2, 272


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def pointed(w: float, h: float, rise: float) -> str:
    """A clip-path for a pointed arch on a w x h box whose head rises `rise` px: each side an arc centred on the
    springing line, meeting at the apex at the box's top."""
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


def band(y: float) -> str:
    return (f'<div class="band" style="top:{r(y)}"></div>'
            f'<div class="stud" style="left:{r(6)};top:{r(y - 3)}"></div><div class="stud" style="right:{r(6)};top:{r(y - 3)}"></div>')


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) 0 0 / {r(24)} {r(24)}, "
             f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) {r(12)} {r(12)} / {r(24)} {r(24)}, "
             f"linear-gradient(45deg, transparent 46%, {c['pat']} 47% 53%, transparent 54%) 0 0 / {r(12)} {r(12)}")
    frame_w, frame_h = GRID + 32, PANES_TOP + GRID + 12 - 150
    glass_h = PANES_TOP + 4 - 164
    window = [
        box("frame", GRID_X - 16, 150, frame_w, frame_h, pointed(frame_w, frame_h, frame_w * 0.62)),
        box("glass", GRID_X, 164, GRID, glass_h, pointed(GRID, glass_h, GRID * 0.62)),
        box("tracery", 150 - 20, 196, 40, 40, "border-radius:50%"),
        box("tracery", GRID_X + GRID * 0.25 - 14, 238, 28, 28, "border-radius:50%"),
        box("tracery", GRID_X + GRID * 0.75 - 14, 238, 28, 28, "border-radius:50%"),
    ]
    for row in range(3):
        for col in range(3):
            window.append(box("pane", GRID_X + col * (PANE + MULLION), PANES_TOP + row * (PANE + MULLION), PANE, PANE))
    facts = "".join(box("inlay", 18, 552 + i * 36, 264, 28) for i in range(3))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.col {{ position: absolute; inset: 0; background: {rings}, {c['face']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 {r(4)} {c['rim']}; }}
.well {{ background: {c['well']}; box-shadow: 0 0 0 {r(4)} {c['rim']}, 0 0 0 {r(7)} {c['rim_hi']}; }}
.round {{ border-radius: 50%; }}
.inlay {{ background: {c['inlay']}; box-shadow: 0 0 0 {r(3)} {c['rim']}, 0 0 0 {r(5)} {c['rim_hi']}; }}
.band {{ position: absolute; left: 0; right: 0; height: {r(9)}; background: {c['band']}; box-shadow: inset 0 {r(2)} 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(13)}; height: {r(13)}; background: {c['stud']}; transform: rotate(45deg); }}
.figure {{ position: absolute; background: {c['figure']}; }}
.frame {{ background: {c['mullion']}; }}
.glass {{ background: linear-gradient(180deg, {c['glass_hi']}, {c['glass']}); }}
.tracery {{ background: {c['mullion']}; box-shadow: 0 0 0 {r(3)} {c['glass_hi']}; }}
.pane {{ background: {c['pane']}; box-shadow: 0 0 0 {r(2)} {c['rim']}; }}
</style></head><body><div class="col">
  {box("plate", 18, 14, 264, 44)}
  {band(70)}
  {box("plate", 18, 88, 124, 32)}{box("plate", 158, 88, 124, 32)}
  {band(136)}
  {"".join(window)}
  {band(538)}
  {facts}
  {band(670)}
  <!-- the foot: Back to the map, a red wax seal in an iron ring; a kneeling standard-bearer at its left, a kneeling pilgrim with a staff at its right -->
  {box("round", 75, 690, 150, 150, f"background:{c['rim']};box-shadow:0 0 0 {r(5)} {c['rim_hi']}")}
  {box("round", 104, 719, 92, 92, f"background:{c['seal']}")}
  {box("figure", 2, 680, 70, 184, "border-radius:50% 45% 8% 8%")}
  {box("figure", 10, 664, 48, 48, "border-radius:50%")}
  {box("figure", 52, 760, 64, 22, f"border-radius:{r(11)};transform:rotate(-12deg)")}
  {box("figure", 228, 680, 70, 184, "border-radius:45% 50% 8% 8%")}
  {box("figure", 242, 664, 48, 48, "border-radius:50%")}
  {box("figure", 184, 760, 64, 22, f"border-radius:{r(11)};transform:rotate(12deg)")}
  {box("figure", 22, 640, 8, 120, "transform:rotate(-8deg)")}
  {box("figure", 272, 650, 7, 200, "transform:rotate(6deg)")}
  {box("band", 0, 852, 300, 12)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
