"""Jilliath's Capitol column, round 3, after the user's sketch (2026-10-11: round 2 "definitely more functional, but
[...] very very boring still. Everything is very square", and the greyboxes too specific). Only what the player reads or
presses is drawn exactly: the name and purse plates, four round tab buttons set in a ring round a rose window of red
and amber glass under a great pointed arch, and a round leave button at the foot. Everything else is loose, soft
masses for the model to make its own: gothic pinnacles at both sides, a veiled saint standing on an altar between two
columns, one hand raised to the ring, a staff in the other.

    python art/greybox/jilliath-capitol-column-3/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3c3732", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", ivory="#e4dccb", glass="#8a2a1e", glass_hi="#c08a30",
              lead="#2a2622", mass="#433d36", arch="#262220")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7a7a7a", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", ivory="#c4c4c4", glass="#383838", glass_hi="#404040",
             lead="#8e8e8e", mass="#9a9a9a", arch="#505050")

# The buttons: the tab ring (top, left, right, bottom, in the tabs' order) and the leave button, page px centre and size.
TABS = [(150, 150), (80, 222), (220, 222), (150, 294)]
BUTTON = 46
LEAVE = (150, 812)


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};{extra}"></div>'


def socket(c: dict[str, str], cx: float, cy: float) -> str:
    return box("round", cx - BUTTON / 2, cy - BUTTON / 2, BUTTON, BUTTON,
               f"background:{c['ivory']};box-shadow:0 0 0 {r(5)} {c['rim']}, 0 0 0 {r(8)} {c['rim_hi']}")


def shape(c: dict[str, str], d: str, fill: str, blur: float = 2.5) -> str:
    """A loose mass drawn as an SVG path over the whole page, softened so the model reads it as a mass, not an edge."""
    return (f'<svg class="p" style="left:0;top:0;width:{r(300)};height:{r(864)};filter:blur({blur}px)" viewBox="0 0 300 864">'
            f'<path d="{d}" fill="{fill}"/></svg>')


def arcade(color: str) -> str:
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='20' height='56' viewBox='0 0 20 56'>"
           f"<path d='M3 56 V18 Q3 6 10 2 Q17 6 17 18 V56' fill='none' stroke='{color}' stroke-width='1.6'/></svg>")
    return f"url(\"data:image/svg+xml;utf8,{svg.replace('#', '%23')}\") 0 0 / {r(20)} {r(56)}"


def page(c: dict[str, str]) -> str:
    great_arch = "M0 340 V250 Q8 140 150 116 Q292 140 300 250 V340 H284 V252 Q276 158 150 134 Q24 158 16 252 V340 Z"
    pinnacle_l = "M22 520 L30 330 L46 250 L62 330 L70 520 Z"
    pinnacle_r = "M230 520 L238 330 L254 250 L270 330 L278 520 Z"
    saint = ("M150 338 Q170 338 172 362 Q174 382 162 392 Q196 412 198 480 L206 620 L94 620 L102 480 "
             "Q104 412 138 392 Q126 382 128 362 Q130 338 150 338 Z")
    arm = "M186 420 Q204 380 172 326 L180 322 Q216 376 196 424 Z"
    staff = "M112 380 L118 380 L118 700 L112 700 Z"
    altar = "M70 620 H230 V680 H70 Z"
    columns = "M78 680 H100 V864 H78 Z M200 680 H222 V864 H200 Z"
    low_arch = "M30 864 V760 Q40 690 150 676 Q260 690 270 760 V864 H252 V762 Q244 708 150 694 Q56 708 48 762 V864 Z"
    rose = "".join(box("lead", 150 - 1.5, 147, 3, 150, f"transform:rotate({a}deg);transform-origin:50% 50%") for a in (0, 45, 90, 135))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.col {{ position: absolute; inset: 0; background: {arcade(c['pat'])}, {c['face']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 {r(4)} {c['rim']}; }}
.round {{ border-radius: 50%; }}
.band {{ position: absolute; left: 0; right: 0; height: {r(8)}; background: {c['band']}; box-shadow: inset 0 {r(2)} 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(12)}; height: {r(12)}; background: {c['stud']}; transform: rotate(45deg); }}
.rose {{ border-radius: 50%; background: radial-gradient(circle, {c['glass_hi']} 0 35%, {c['glass']} 70%); box-shadow: 0 0 0 {r(6)} {c['rim']}, 0 0 0 {r(10)} {c['rim_hi']}; }}
.lead {{ background: {c['lead']}; }}
</style></head><body><div class="col">
  {box("plate", 15, 15, 269, 45)}
  {box("plate", 15, 73, 126, 32)}{box("plate", 155, 73, 129, 32)}
  <div class="band" style="top:{r(112)}"></div>
  {shape(c, great_arch, c['arch'], 2)}
  {shape(c, pinnacle_l, c['mass'])}{shape(c, pinnacle_r, c['mass'])}
  {box("rose", 75, 147, 150, 150)}
  {rose}
  {"".join(socket(c, x, y) for x, y in TABS)}
  {shape(c, saint, c['mass'], 3)}{shape(c, arm, c['mass'], 3)}{shape(c, staff, c['mass'], 2)}
  {shape(c, altar, c['mass'], 2)}{shape(c, columns, c['mass'], 2)}
  {shape(c, low_arch, c['arch'], 2)}
  {socket(c, *LEAVE)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
