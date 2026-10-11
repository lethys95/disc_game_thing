"""Jilliath's panel frame: one painted frame used as a nine-slice border (CSS border-image) round every panel left of
the column, so a panel of any size is framed by the same painting at the column's texel density, the corners fixed and
the edges repeated. Values and depth greyboxes, 480 x 320 page px: a moulded border 24 px wide, a running band of
quatrefoils along it, a square boss at each corner, a flat black field inside (the panel's own colour replaces it).

    python art/greybox/jilliath-frame/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
W, H, B = 480, 320, 24

VALUES = dict(bg="#000", face="#34302c", pat="#47413a", roll="#4b453f", lip="#4b453f", boss="#3d3833", stud="#d48a2a", field="#000")
DEPTH = dict(bg="#000", face="#7a7a7a", pat="#929292", roll="#b0b0b0", lip="#a6a6a6", boss="#b8b8b8", stud="#e0e0e0", field="#000")


def quatrefoils(color: str) -> str:
    """A run of small quatrefoils, one every 24 px, for the frame's band."""
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g fill='none' stroke='{color}' stroke-width='1.6'>"
           "<circle cx='12' cy='7.5' r='3.6'/><circle cx='12' cy='16.5' r='3.6'/><circle cx='7.5' cy='12' r='3.6'/><circle cx='16.5' cy='12' r='3.6'/></g></svg>")
    return f"url(\"data:image/svg+xml;utf8,{svg.replace('#', '%23')}\") 0 0 / 24px 24px"


def page(c: dict[str, str]) -> str:
    corners = "".join(
        f'<div class="boss" style="left:{x}px;top:{y}px"></div><div class="stud" style="left:{x + 8}px;top:{y + 8}px"></div>'
        for x in (0, W - B - 8) for y in (0, H - B - 8))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: {c['bg']}; }}
.frame {{ position: absolute; inset: 0; background: {quatrefoils(c['pat'])}, {c['face']}; box-shadow: inset 0 0 0 3px {c['roll']}; }}
.field {{ position: absolute; inset: {B}px; background: {c['field']}; box-shadow: 0 0 0 3px {c['lip']}; }}
.boss {{ position: absolute; width: {B + 8}px; height: {B + 8}px; background: {c['boss']}; box-shadow: inset 0 0 0 2px {c['roll']}; }}
.stud {{ position: absolute; width: {B - 8}px; height: {B - 8}px; background: {c['stud']}; transform: rotate(45deg) scale(0.6); }}
</style></head><body><div class="frame"></div><div class="field"></div>{corners}</body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
