"""Jilliath's garrison wall, round 2 (the user: the diaper "all over the place [...] looks like a fence actually, not
like gothic architecture"; hud-pieces.md, "Surfaces, read from Disciples II and III"): the ground is large weathered
masonry in shadow, irregular courses, no lattice; iron only for the windows' frames and bands with amber studs at the
seams. The rest as round 1.

Round 1: Jilliath's garrison wall (the judged greybox's garrison tab, docs/design/capitol-elements.md), after the Capitol
column's lessons (hud-paint-in, "What the Capitol column taught"). Exact only where the player reads or presses: the
two squad grids' 18 panes and their header plates, measured from the flat screen at 1080p (1236 x 864 page px). Each
grid is the lower part of a lancet window of red and amber glass, so an empty place shows lit glass. Loose masses for
the rest: the windows' traceried heads, a pale stone guardian in a niche at each side, a low crypt arcade along the foot
(where the fallen lie), and on the right the growth panel as a tall parchment hung on turned wooden rollers.

    python art/greybox/jilliath-garrison-2/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
W, H = 1236, 864
GRIDS = [(110, 264), (435, 264)]
CELL, GAP, INSET = 86, 7, 9

VALUES = dict(bg="#0b0a0c", face="#2a2724", pat="#1a1816", stud="#d48a2a", plate="#d8d0c1", rim="#1f1c1a", rim_hi="#4b453f",
              glass="#8a2a1e", glass_hi="#c08a30", lead="#1e1b19", stone="#8e877b", niche="#1c1917", parch="#c9b48c",
              wood="#6a4a2c", iron="#262220")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#5a5a5a", stud="#d8d8d8", plate="#a8a8a8", rim="#4a4a4a", rim_hi="#b8b8b8",
             glass="#383838", glass_hi="#404040", lead="#9a9a9a", stone="#b4b4b4", niche="#2a2a2a", parch="#a0a0a0",
             wood="#bcbcbc", iron="#8a8a8a")


def box(cls: str, x: float, y: float, w: float, h: float, extra: str = "") -> str:
    return f'<div class="p {cls}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;{extra}"></div>'


def svg(d: str, fill: str, blur: float = 0) -> str:
    style = f"filter:blur({blur}px)" if blur else ""
    return f'<svg class="p" style="left:0;top:0;width:{W}px;height:{H}px;{style}" viewBox="0 0 {W} {H}"><path d="{d}" fill="{fill}"/></svg>'


def lancet(x0: float, x1: float, top: float, bottom: float) -> str:
    """A pointed lancet outline from `top` (its apex) to `bottom`."""
    w = x1 - x0
    spring = top + w * 0.62
    mid = (x0 + x1) / 2
    return (f"M{x0} {bottom} V{spring} C{x0} {spring - w * 0.35} {mid - w * 0.14} {top + w * 0.14} {mid} {top} "
            f"C{mid + w * 0.14} {top + w * 0.14} {x1} {spring - w * 0.35} {x1} {spring} V{bottom} Z")


def masonry(c: dict[str, str], depth: bool) -> str:
    """Irregular courses of large dressed blocks, each a slightly different value, mortar recessed. Deterministic."""
    out = []
    y, course = 0, 0
    heights = [58, 64, 52, 70, 60, 56]
    while y < H:
        h = heights[course % len(heights)]
        x = -((course * 37) % 90)
        k = 0
        while x < W:
            w = 96 + ((course * 53 + k * 71) % 88)
            shade = ((course * 17 + k * 29) % 9) - 4
            base = 0x6e if depth else 0x2a
            v = max(0, min(255, base + shade * (3 if depth else 2)))
            col = f"#{v:02x}{v:02x}{max(0, v - (0 if depth else 3)):02x}"
            out.append(f'<div class="p" style="left:{x + 2}px;top:{y + 2}px;width:{w - 4}px;height:{h - 4}px;background:{col}"></div>')
            x += w
            k += 1
        y += h
        course += 1
    return "".join(out)


def page(c: dict[str, str]) -> str:
    parts = []
    for gx, gy in GRIDS:
        x0, x1 = gx - 14, gx + 290 + 14
        parts.append(svg(lancet(x0 - 8, x1 + 8, 70, 612), c["rim_hi"]))
        parts.append(svg(lancet(x0, x1, 82, 604), c["rim"]))
        parts.append(svg(lancet(x0 + 8, x1 - 8, 94, 596), c["glass"]))
        head = f"M{gx + 145} 108 L{gx + 145} 214 M{gx + 40} 200 Q{gx + 145} 120 {gx + 250} 200"
        parts.append(f'<svg class="p" style="left:0;top:0;width:{W}px;height:{H}px;filter:blur(1.5px)" viewBox="0 0 {W} {H}">'
                     f'<path d="{head}" fill="none" stroke="{c["lead"]}" stroke-width="7"/>'
                     f'<circle cx="{gx + 145}" cy="160" r="34" fill="{c["glass_hi"]}" stroke="{c["lead"]}" stroke-width="6"/></svg>')
        parts.append(box("lead", gx, gy - 6, 290, 324))
        for row in range(3):
            for col in range(3):
                parts.append(box("pane", gx + INSET + col * (CELL + GAP), gy + INSET + row * (CELL + GAP), CELL, CELL))
        parts.append(box("plate", gx, 225, 290, 33))
        for sx, sy in ((gx - 26, 236), (gx + 304, 236), (gx - 26, 600), (gx + 304, 600)):
            parts.append(box("stud", sx, sy, 12, 12))
    # the guardians in their niches, outside each window
    for nx in (14, 744):
        parts.append(svg(lancet(nx, nx + 80, 300, 612), c["niche"], 2))
    parts.append(svg("M54 330 Q70 330 72 352 Q74 368 64 376 Q86 392 88 450 L94 600 L18 600 L22 450 Q24 392 46 376 "
                     "Q36 368 38 352 Q40 330 54 330 Z M24 400 H44 V560 H24 Z", c["stone"], 3))
    parts.append(svg("M784 330 Q800 330 802 352 Q804 368 794 376 Q816 392 818 450 L824 600 L748 600 L752 450 Q754 392 "
                     "776 376 Q766 368 768 352 Q770 330 784 330 Z M812 320 H818 V600 H812 Z", c["stone"], 3))
    # the crypt along the foot: a low arcade of small dark arches
    for i in range(7):
        ax = 40 + i * 108
        parts.append(svg(lancet(ax, ax + 84, 690, 852), c["niche"], 2))
        parts.append(svg(lancet(ax - 6, ax + 90, 682, 690) + " ", c["stone"], 2))
    # the growth panel: a tall parchment on turned wooden rollers hung from two iron hooks
    parts.append(box("hook", 870, 6, 10, 24) + box("hook", 1164, 6, 10, 24))
    parts.append(box("wood", 818, 22, 408, 22, "border-radius:11px;filter:blur(1px)"))
    parts.append(box("parch", 832, 34, 380, 798))
    parts.append(box("wood", 818, 824, 408, 22, "border-radius:11px;filter:blur(1px)"))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: {c['bg']}; }}
.wall {{ position: absolute; inset: 0; background: {c['pat']}; }}
.stud {{ position: absolute; width: 12px; height: 12px; background: {c['stud']}; transform: rotate(45deg); }}
.p {{ position: absolute; }}
.plate {{ background: {c['plate']}; box-shadow: 0 0 0 4px {c['rim']}; }}
.lead {{ background: {c['lead']}; }}
.pane {{ background: linear-gradient(180deg, {c['glass_hi']}, {c['glass']}); }}
.parch {{ background: {c['parch']}; }}
.wood {{ background: {c['wood']}; }}
.hook {{ background: {c['iron']}; }}
</style></head><body><div class="wall"></div>{masonry(c, c is DEPTH)}{"".join(parts)}</body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
