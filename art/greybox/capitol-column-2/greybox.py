"""The Capitol's right column (docs/design/hud-pieces.md, "The Capitol"): values and depth greyboxes, in rem at the
game's 1080p root size (17.28px), 300 x 864 page px. Disciples II's capital keeps the map's column with its compartments
swapped; this is the map column's sibling: the city's name and purse, four tab niches, three fact plates (dark iron,
so the marble stays at the top), and Back to the map as a seal two figures hold.

    python art/greybox/capitol-column/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", well="#0b0a09", ivory="#e4dccb", lit="#e8c36c",
              figure="#3d3833", seal="#8a2a22", inlay="#26221e")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", well="#0e0e0e", ivory="#bcbcbc", lit="#c4c4c4",
             figure="#a6a6a6", seal="radial-gradient(circle, #f0f0f0, #b8b8b8 75%)", inlay="#5a5a5a")


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};{extra}"></div>'


def band(y: float) -> str:
    return (f'<div class="band" style="top:{r(y)}"></div>'
            f'<div class="stud" style="left:{r(6)};top:{r(y - 3)}"></div><div class="stud" style="right:{r(6)};top:{r(y - 3)}"></div>')


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) 0 0 / {r(24)} {r(24)}, "
             f"radial-gradient(circle, transparent {r(7)}, {c['pat']} {r(8)}, {c['pat']} {r(10)}, transparent {r(11)}) {r(12)} {r(12)} / {r(24)} {r(24)}, "
             f"linear-gradient(45deg, transparent 46%, {c['pat']} 47% 53%, transparent 54%) 0 0 / {r(12)} {r(12)}")
    niches = []
    for i, (x, y) in enumerate([(26, 170), (158, 170), (26, 330), (158, 330)]):
        niches.append(box("well", x, y, 116, 146, f"border-radius:{r(58)} {r(58)} 0 0"))
        niches.append(box("round", x + 28, y + 40, 60, 60, f"background:{c['lit'] if i == 0 else c['ivory']};box-shadow:0 0 0 {r(5)} {c['rim']}, 0 0 0 {r(9)} {c['rim_hi']}"))
    facts = "".join(box("inlay", 18, 520 + i * 40, 264, 30) for i in range(3))
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
</style></head><body><div class="col">
  {box("plate", 18, 14, 264, 44)}
  {band(70)}
  {box("plate", 18, 88, 124, 32)}{box("plate", 158, 88, 124, 32)}
  {band(136)}
  {"".join(niches)}
  {band(502)}
  {facts}
  {band(648)}
  <!-- the foot: Back to the map, a red wax seal in an iron ring; a hooded mason kneeling at its left, a veiled abbess at its right -->
  {box("round", 75, 690, 150, 150, f"background:{c['rim']};box-shadow:0 0 0 {r(5)} {c['rim_hi']}")}
  {box("round", 104, 719, 92, 92, f"background:{c['seal']}")}
  {box("figure", 2, 680, 70, 184, "border-radius:50% 45% 8% 8%")}
  {box("figure", 10, 664, 48, 48, "border-radius:50%")}
  {box("figure", 52, 760, 64, 22, f"border-radius:{r(11)};transform:rotate(-12deg)")}
  {box("figure", 228, 680, 70, 184, "border-radius:45% 50% 8% 8%")}
  {box("figure", 242, 664, 48, 48, "border-radius:50%")}
  {box("figure", 184, 760, 64, 22, f"border-radius:{r(11)};transform:rotate(12deg)")}
  {box("band", 0, 852, 300, 12)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
