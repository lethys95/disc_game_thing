"""Jilliath's Capitol column, round 4 (the user, on round 3: "That works better. Try a rendition where the background
stuff are not those pill shaped things, and have the person in the middle be a hot angel with widespread wings,
reaching up as if channeling the orbs at the window"). Round 3's exact parts (plates, the four round tab buttons on the
rose window, the leave button) at the same places; the face a diamond diaper instead of the lancet arcade; the saint
and the pinnacles replaced by an angel of pale stone, wings spread across the column, both arms raised to the window.

    python art/greybox/jilliath-capitol-column-4/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3c3732", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", ivory="#e4dccb", glass="#8a2a1e", glass_hi="#c08a30",
              lead="#2a2622", mass="#433d36", arch="#262220", angel="#8e877b", glow="#d8a24a")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7a7a7a", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", ivory="#c4c4c4", glass="#383838", glass_hi="#404040",
             lead="#8e8e8e", mass="#9a9a9a", arch="#505050", angel="#b4b4b4", glow="#6e6e6e")

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


def diaper(color: str) -> str:
    """A gothic diaper: a diamond lattice with a small quatrefoil in each diamond, one tile 28 x 28 page px."""
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g fill='none' stroke='{color}' stroke-width='1.4'>"
           "<path d='M14 0 L28 14 L14 28 L0 14 Z'/><circle cx='14' cy='11' r='2.4'/><circle cx='14' cy='17' r='2.4'/>"
           "<circle cx='11' cy='14' r='2.4'/><circle cx='17' cy='14' r='2.4'/></g></svg>")
    return f"url(\"data:image/svg+xml;utf8,{svg.replace('#', '%23')}\") 0 0 / {r(28)} {r(28)}"


def page(c: dict[str, str]) -> str:
    great_arch = "M0 340 V250 Q8 140 150 116 Q292 140 300 250 V340 H284 V252 Q276 158 150 134 Q24 158 16 252 V340 Z"
    angel = ("M150 352 Q168 352 170 374 Q172 392 160 400 Q190 418 192 480 L200 620 L100 620 L108 480 "
             "Q110 418 140 400 Q128 392 130 374 Q132 352 150 352 Z")
    arms = ("M138 408 Q118 370 134 318 L144 320 Q132 368 148 404 Z "
            "M162 408 Q182 370 166 318 L156 320 Q168 368 152 404 Z")
    wing_l = "M136 420 Q90 360 8 300 Q4 360 20 430 Q40 500 104 540 Q118 480 136 440 Z"
    wing_r = "M164 420 Q210 360 292 300 Q296 360 280 430 Q260 500 196 540 Q182 480 164 440 Z"
    altar = "M70 620 H230 V680 H70 Z"
    columns = "M78 680 H100 V864 H78 Z M200 680 H222 V864 H200 Z"
    low_arch = "M30 864 V760 Q40 690 150 676 Q260 690 270 760 V864 H252 V762 Q244 708 150 694 Q56 708 48 762 V864 Z"
    rose = "".join(box("lead", 150 - 1.5, 147, 3, 150, f"transform:rotate({a}deg);transform-origin:50% 50%") for a in (0, 45, 90, 135))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.col {{ position: absolute; inset: 0; background: {diaper(c['pat'])}, {c['face']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 {r(4)} {c['rim']}; }}
.round {{ border-radius: 50%; }}
.band {{ position: absolute; left: 0; right: 0; height: {r(8)}; background: {c['band']}; box-shadow: inset 0 {r(2)} 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(12)}; height: {r(12)}; background: {c['stud']}; transform: rotate(45deg); }}
.rose {{ border-radius: 50%; background: radial-gradient(circle, {c['glass_hi']} 0 35%, {c['glass']} 70%); box-shadow: 0 0 0 {r(6)} {c['rim']}, 0 0 0 {r(10)} {c['rim_hi']}; }}
.lead {{ background: {c['lead']}; }}
.glowing {{ border-radius: 50%; background: radial-gradient(ellipse, {c['glow']}, transparent 70%); filter: blur(4px); }}
</style></head><body><div class="col">
  {box("plate", 15, 15, 269, 45)}
  {box("plate", 15, 73, 126, 32)}{box("plate", 155, 73, 129, 32)}
  <div class="band" style="top:{r(112)}"></div>
  {shape(c, great_arch, c['arch'], 2)}
  {box("rose", 75, 147, 150, 150)}
  {rose}
  {"".join(socket(c, x, y) for x, y in TABS)}
  {shape(c, wing_l, c['angel'], 4)}{shape(c, wing_r, c['angel'], 4)}
  {box("glowing", 120, 296, 60, 40)}
  {shape(c, angel, c['angel'], 3)}{shape(c, arms, c['angel'], 2.5)}
  {shape(c, altar, c['mass'], 2)}{shape(c, columns, c['mass'], 2)}
  {shape(c, low_arch, c['arch'], 2)}
  {socket(c, *LEAVE)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
