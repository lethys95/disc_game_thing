"""The duel battle bar, its portrait arches widened, authored in rem.

The page is the bar at 1080p-equivalent size (1536 x 200 CSS px); its root font size is the game's there (16px at
800px tall, scaled: 17.28px at 864), so every length below is the bar's own rem in the game.
"""
from pathlib import Path

W = 1536 / 17.28  # the bar's width in rem, 88.889


def m(x: float, w: float) -> float:
    return W - x - w


VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f", well="#0b0a09", ivory="#e4dccb", inlay="#26221e",
              figure="#3d3833", red="radial-gradient(circle at 42% 38%, #b03028, #6a1410 45%, #2a0605)")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8", well="#0e0e0e", ivory="#bcbcbc", inlay="#5a5a5a",
             figure="#a6a6a6", red="radial-gradient(circle at 50% 50%, #e4e4e4, #a4a4a4 55%, #6a6a6a)")


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{x:.3f}rem;top:{y:.3f}rem;width:{w:.3f}rem;height:{h:.3f}rem;{extra}"></div>'


def end(c: dict[str, str], right: bool) -> str:
    at = (lambda x, w: m(x, w)) if right else (lambda x, w: x)
    flip = -1 if right else 1
    return "".join([
        box("round", at(2.2, 9.2), 0.7, 9.2, 9.2, f"background:{c['rim']};box-shadow:0 0 0 0.35rem {c['rim_hi']}"),
        box("round", at(3.0, 7.6), 1.5, 7.6, 7.6, f"background:{c['red']}"),
        box("figure", at(-0.35, 4.6), 1.4, 4.6, 10.2, "border-radius:50% 45% 6% 6%"),
        box("figure", at(0.25, 3.3), 0.35, 3.3, 3.3, "border-radius:50%"),
        box("figure", at(2.3, 7.2), 6.8, 7.2, 1.6, f"border-radius:0.8rem;transform:rotate({-14 * flip}deg)"),
        box("figure", at(2.8, 6.2), 0.45, 6.2, 1.4, f"border-radius:0.7rem;transform:rotate({10 * flip}deg)"),
        box("ledge", at(-0.35, 5.8), 10.88, 5.8, 0.7),
    ])


def card(right: bool) -> str:
    at = (lambda x, w: m(x, w)) if right else (lambda x, w: x)
    stats = "".join(box("inlay", at(19.8 + (i % 2) * 5.8, 4.6), 3.6 + (i // 2) * 2.2, 4.6, 1.5) for i in range(4))
    return "".join([
        box("well", at(12.2, 6.9), 1.0, 6.9, 9.6, "border-radius:3.45rem 3.45rem 0 0"),
        box("plate", at(19.8, 10.4), 1.0, 10.4, 2.0),
        stats,
        box("inlay", at(19.8, 10.4), 8.1, 10.4, 2.55),
    ])


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent 0.4rem, {c['pat']} 0.46rem, {c['pat']} 0.58rem, transparent 0.64rem) 0 0 / 1.39rem 1.39rem, "
             f"radial-gradient(circle, transparent 0.4rem, {c['pat']} 0.46rem, {c['pat']} 0.58rem, transparent 0.64rem) 0.695rem 0.695rem / 1.39rem 1.39rem, "
             f"linear-gradient(45deg, transparent 46%, {c['pat']} 47% 53%, transparent 54%) 0 0 / 0.695rem 0.695rem")
    centre = W / 2
    small = "".join(box("round", centre + d - 1.15, 1.7, 2.3, 2.3, f"background:{c['ivory']};box-shadow:0 0 0 0.29rem {c['rim']}, 0 0 0 0.52rem {c['rim_hi']}") for d in (-8.1, -4.4, 4.4, 8.1))
    sockets = "".join(box("well", centre - 11.685 + i * 3.47, 6.1, 2.55, 2.55) for i in range(7))
    band = lambda x: f'<div class="vband" style="left:{x:.3f}rem"></div><div class="stud" style="left:{x - 0.12:.3f}rem;top:-0.23rem"></div><div class="stud" style="left:{x - 0.12:.3f}rem;top:10.88rem"></div>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html {{ font-size: 17.28px; }}
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: {c['bg']}; }}
.bar {{ position: absolute; inset: 0; background: {rings}, {c['face']}; box-shadow: inset 0 0.23rem 0 {c['band_hi']}, inset 0 -0.35rem 0 {c['band']}; }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 0.23rem {c['rim']}; }}
.well {{ background: {c['well']}; box-shadow: 0 0 0 0.23rem {c['rim']}, 0 0 0 0.4rem {c['rim_hi']}; }}
.inlay {{ background: {c['inlay']}; box-shadow: 0 0 0 0.17rem {c['rim']}, 0 0 0 0.29rem {c['rim_hi']}; }}
.round {{ border-radius: 50%; }}
.vband {{ position: absolute; top: 0; bottom: 0; width: 0.58rem; background: {c['band']}; box-shadow: inset 0.12rem 0 0 {c['band_hi']}; }}
.stud {{ position: absolute; width: 0.81rem; height: 0.81rem; background: {c['stud']}; transform: rotate(45deg); }}
.figure {{ position: absolute; background: {c['figure']}; }}
.ledge {{ position: absolute; background: {c['band_hi']}; }}
</style></head><body><div class="bar">
  {end(c, False)}{card(False)}
  {band(31.1)}
  {box("round plate", centre - 2.025, 0.8, 4.05, 4.05, f"box-shadow:0 0 0 0.29rem {c['rim']}, 0 0 0 0.52rem {c['rim_hi']}")}
  {small}
  {sockets}
  {band(W - 31.1 - 0.58)}
  {card(True)}{end(c, True)}
</div></body></html>"""


for name in ("battle-bar-duel-dull", "battle-bar-duel-dull-nostone"):
    out = Path("/home/lethys/projects/all_disc/new_disc/art/greybox") / name
    out.mkdir(exist_ok=True)
    (out / "values.html").write_text(page(VALUES))
    (out / "depth.html").write_text(page(DEPTH))
print("ok")
