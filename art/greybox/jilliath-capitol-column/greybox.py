"""Jilliath's Capitol column, laid out by job (docs/design/capitol-elements.md): values and depth greyboxes, in rem at
the game's 1080p root size (17.28px), 300 x 864 page px, the boxes where the flat screen puts its parts. The city's
name, gold and mana, the four tabs as rows with an emblem socket each, the screen's subject in the room below them (a
cathedral front carved low in a blind arch), and Back to the map as a plate at the foot. The face carries a blind
arcade of lancets, gothic tracery rather than the interlace the last round's rings were painted as.

    python art/greybox/jilliath-capitol-column/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
REM = 17.28

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3c3732", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", well="#141210", ivory="#e4dccb",
              arch="#211e1b", relief="#403a34", rose="#4a433c")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7a7a7a", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", well="#2a2a2a", ivory="#bcbcbc",
             arch="#3a3a3a", relief="#5c5c5c", rose="#666666")


def r(px: float) -> str:
    return f"{px / REM:.3f}rem"


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};{extra}"></div>'


def band(y: float) -> str:
    return (f'<div class="band" style="top:{r(y)}"></div>'
            f'<div class="stud" style="left:{r(6)};top:{r(y - 2)}"></div><div class="stud" style="right:{r(6)};top:{r(y - 2)}"></div>')


def arcade(color: str) -> str:
    """A blind arcade of narrow pointed lancets, one tile 20 x 56 page px."""
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='20' height='56' viewBox='0 0 20 56'>"
           f"<path d='M3 56 V18 Q3 6 10 2 Q17 6 17 18 V56' fill='none' stroke='{color}' stroke-width='1.6'/></svg>")
    return f"url(\"data:image/svg+xml;utf8,{svg.replace('#', '%23')}\") 0 0 / {r(20)} {r(56)}"


def pointed(x: float, y: float, w: float, h: float, fill: str, rim: str = "", rim_hi: str = "") -> str:
    """A pointed (two-centred) gothic arch, its springing a third of its width below the apex."""
    rise = w * 0.85
    d = f"M0 {h} V{rise} Q0 {rise * 0.3} {w / 2} 0 Q{w} {rise * 0.3} {w} {rise} V{h} Z"
    stroke = (f'<path d="{d}" fill="none" stroke="{rim_hi}" stroke-width="7"/><path d="{d}" fill="none" stroke="{rim}" stroke-width="4"/>'
              if rim else "")
    return (f'<svg class="p" style="left:{r(x)};top:{r(y)};width:{r(w)};height:{r(h)};overflow:visible" viewBox="0 0 {w} {h}">'
            f'{stroke}<path d="{d}" fill="{fill}"/></svg>')


def page(c: dict[str, str]) -> str:
    tabs = []
    for y in (128, 187, 246, 304):
        tabs.append(box("well", 15, y, 269, 51))
        tabs.append(box("round", 26, y + 10, 31, 31, f"background:{c['ivory']};box-shadow:0 0 0 {r(3)} {c['rim']}, 0 0 0 {r(5)} {c['rim_hi']}"))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: {REM}px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.col {{ position: absolute; inset: 0; background: {arcade(c['pat'])}, {c['face']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 {r(4)} {c['rim']}; }}
.well {{ background: {c['well']}; box-shadow: 0 0 0 {r(3)} {c['rim']}, 0 0 0 {r(5)} {c['rim_hi']}; }}
.round {{ border-radius: 50%; }}
.band {{ position: absolute; left: 0; right: 0; height: {r(8)}; background: {c['band']}; box-shadow: inset 0 {r(2)} 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: {r(12)}; height: {r(12)}; background: {c['stud']}; transform: rotate(45deg); }}
.relief {{ background: {c['relief']}; }}
</style></head><body><div class="col">
  {box("plate", 15, 15, 269, 45)}
  {box("plate", 15, 73, 126, 32)}{box("plate", 155, 73, 129, 32)}
  {band(114)}
  {"".join(tabs)}
  {band(368)}
  <!-- the screen's subject: a cathedral's west front carved low in a tall blind arch -->
  {pointed(34, 392, 232, 384, c["arch"], c["rim"], c["rim_hi"])}
  {box("relief", 70, 540, 160, 228)}
  {box("relief", 70, 456, 36, 90, "clip-path:polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)")}
  {box("relief", 194, 456, 36, 90, "clip-path:polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)")}
  {box("relief", 118, 500, 64, 50, "clip-path:polygon(50% 0, 100% 100%, 0 100%)")}
  {box("round", 124, 572, 52, 52, f"background:{c['rose']}")}
  {pointed(128, 690, 44, 78, c["arch"])}
  {band(790)}
  {box("plate", 15, 803, 269, 45)}
  {box("band", 0, 856, 300, 8)}
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
