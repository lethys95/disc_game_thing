"""The frame for the Capitol's research and spells tabs (docs/design/hud-pieces.md, "The Capitol's tabs"): values and
depth greyboxes, in rem at the game's 1080p root size (17.28px), 1236 x 864 page px, the screen left of the column.
What these tabs hold changes shape (a research tree as long as the branch, a list of spells), so the frame paints
only what stays: a marble title plate at the top and one large dark field the content scrolls in.

    python art/greybox/capitol-tab/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28
W, H = 1236, 864

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", well="#0b0a09", lip="#2a2622")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", well="#0e0e0e", lip="#8e8e8e")


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};{extra}"></div>'


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) 0 0 / {r(24)} {r(24)}, "
             f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) {r(12)} {r(12)} / {r(24)} {r(24)}, "
             f"linear-gradient(45deg, transparent 46%, {c['pat']} 47% 53%, transparent 54%) 0 0 / {r(12)} {r(12)}")
    studs = "".join(f'<div class="stud" style="left:{r(x)};top:{r(y)}"></div>'
                    for x, y in [(26, 76), (1197, 76), (26, 836), (1197, 836)])
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.wall {{ position: absolute; inset: 0; background: {rings}, {c['face']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 {r(4)} {c['rim']}; }}
.well {{ background: {c['well']}; box-shadow: 0 0 0 {r(5)} {c['rim']}, 0 0 0 {r(10)} {c['lip']}, 0 0 0 {r(13)} {c['rim_hi']}; }}
.band {{ position: absolute; height: {r(9)}; background: {c['band']}; box-shadow: inset 0 {r(2)} 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(13)}; height: {r(13)}; background: {c['stud']}; transform: rotate(45deg); }}
</style></head><body><div class="wall">
  {box("plate", 418, 18, 400, 46)}
  <div class="band" style="left:0;width:{r(W)};top:{r(80)}"></div>
  {box("well", 40, 104, 1156, 726)}
  {studs}
  {box("band", 0, 852, W, 12)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
