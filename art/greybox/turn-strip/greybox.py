"""The battle's turn order (docs/design/hud-pieces.md, "The turn order"): values and depth greyboxes, in rem at the
game's 1080p root size (17.28px), 870 x 104 page px. A strip hanging from the top edge's middle, the world showing on
both sides: the acting unit in a large arched niche at its left, the next eleven in a row of small arched niches, small
pendant finials hanging below between them, a cap at each end.

    python art/greybox/turn-strip/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28
W, H, BODY = 870, 104, 82

VALUES = dict(bg="#000", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              rim="#1f1c1a", rim_hi="#4b453f", well="#0b0a09", figure="#3d3833")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             rim="#4a4a4a", rim_hi="#b8b8b8", well="#0e0e0e", figure="#a6a6a6")

BIG = (26, 6, 88, 72)
SMALL_X, SMALL_Y, SMALL_W, SMALL_H, GAP = 138, 16, 56, 60, 10


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};{extra}"></div>'


def pendant(x: float, w: float, h: float) -> str:
    return box("pendant", x - w / 2, BODY - 2, w, h, "clip-path:polygon(0 0,100% 0,62% 55%,50% 100%,38% 55%)")


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent {r(5)}, {c['pat']} {r(6)}, {c['pat']} {r(7.5)}, transparent {r(8.5)}) 0 0 / {r(18)} {r(18)}, "
             f"radial-gradient(circle, transparent {r(5)}, {c['pat']} {r(6)}, {c['pat']} {r(7.5)}, transparent {r(8.5)}) {r(9)} {r(9)} / {r(18)} {r(18)}")
    x, y, w, h = BIG
    parts = [box("well big", x, y, w, h, f"border-radius:{r(w / 2)} {r(w / 2)} {r(6)} {r(6)}")]
    pendants = [pendant(x + w / 2, 30, 24)]
    for i in range(11):
        sx = SMALL_X + i * (SMALL_W + GAP)
        parts.append(box("well", sx, SMALL_Y, SMALL_W, SMALL_H, f"border-radius:{r(SMALL_W / 2)} {r(SMALL_W / 2)} {r(4)} {r(4)}"))
        if i < 10:
            pendants.append(pendant(sx + SMALL_W + GAP / 2, 16, 18))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.strip {{ position: absolute; left: 0; top: 0; width: {r(W)}; height: {r(BODY)}; background: {rings}, {c['face']}; box-shadow: inset 0 {r(-3)} 0 {c['rim_hi']}; }}
.p {{ position: absolute; }}
.well {{ background: {c['well']}; box-shadow: 0 0 0 {r(3)} {c['rim']}, 0 0 0 {r(6)} {c['rim_hi']}; }}
.well.big {{ box-shadow: 0 0 0 {r(4)} {c['rim']}, 0 0 0 {r(9)} {c['rim_hi']}; }}
.vband {{ position: absolute; width: {r(8)}; background: {c['band']}; box-shadow: inset {r(2)} 0 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(11)}; height: {r(11)}; background: {c['stud']}; transform: rotate(45deg); }}
.pendant {{ background: {c['figure']}; }}
.cap {{ position: absolute; top: 0; width: {r(12)}; height: {r(BODY + 10)}; background: {c['band']}; box-shadow: inset {r(2)} 0 0 {c['band_hi']}; border-radius: 0 0 {r(6)} {r(6)}; }}
</style></head><body>
  <div class="strip"></div>
  <div class="cap" style="left:0"></div><div class="cap" style="right:0"></div>
  <div class="vband" style="left:{r(124)};top:0;height:{r(BODY)}"></div>
  <div class="stud" style="left:{r(122.5)};top:{r(BODY - 8)}"></div>
  {"".join(parts)}
  {"".join(pendants)}
</body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
