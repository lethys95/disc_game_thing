"""The battle bar's extensions (the user, 2026-10-10: Warcraft III's way, segments only a wider monitor shows): one
end's greybox, values and depth, 323.5 x 200 page px; the right end is its mirror. Ornament only, no windows.

    python art/greybox/battle-bar-wide/greybox.py      (writes values.html and depth.html beside it)
"""
from pathlib import Path

OUT = Path(__file__).parent
W = 323.5

VALUES = dict(bg="#0b0a0c", face="#34302c", pat="#3f3a35", band="#1f1c1a", band_hi="#4b453f", stud="#d48a2a",
              tracery="#4a443d", deep="#141110", spire="#4f4842", rose="#55504a")
DEPTH = dict(bg="#000", face="#6e6e6e", pat="#7c7c7c", band="#8a8a8a", band_hi="#a0a0a0", stud="#d8d8d8",
             tracery="#a8a8a8", deep="#3a3a3a", spire="#bcbcbc", rose="#b4b4b4")


def page(c: dict[str, str]) -> str:
    rings = (f"radial-gradient(circle, transparent 7px, {c['pat']} 8px, {c['pat']} 10px, transparent 11px) 0 0 / 24px 24px, "
             f"radial-gradient(circle, transparent 7px, {c['pat']} 8px, {c['pat']} 10px, transparent 11px) 12px 12px / 24px 24px, "
             f"linear-gradient(45deg, transparent 46%, {c['pat']} 47% 53%, transparent 54%) 0 0 / 12px 12px")
    # This is the left end: the bar is at its right edge. Two blind lancet arches with a spire between, a rosette in
    # each arch's head, and a band with studs where it meets the bar.
    arch = lambda x: f"""
  <div class="p" style="left:{x}px;top:22px;width:96px;height:166px;border-radius:48px 48px 0 0 / 70px 70px 0 0;background:{c['tracery']}"></div>
  <div class="p" style="left:{x + 8}px;top:32px;width:80px;height:156px;border-radius:40px 40px 0 0 / 60px 60px 0 0;background:{c['deep']}"></div>
  <div class="p" style="left:{x + 18}px;top:44px;width:26px;height:120px;border-radius:13px 13px 0 0;background:{c['tracery']};opacity:.85"></div>
  <div class="p" style="left:{x + 52}px;top:44px;width:26px;height:120px;border-radius:13px 13px 0 0;background:{c['tracery']};opacity:.85"></div>
  <div class="p" style="left:{x + 30}px;top:40px;width:36px;height:36px;border-radius:50%;background:{c['rose']}"></div>"""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html, body {{ margin: 0; width: {W}px; height: 200px; overflow: hidden; background: {c['bg']}; }}
.bar {{ position: absolute; inset: 0; background: {rings}, {c['face']}; box-shadow: inset 0 4px 0 {c['band_hi']}, inset 0 -6px 0 {c['band']}; }}
.p {{ position: absolute; }}
</style></head><body><div class="bar">
  {arch(22)}
  <div class="p" style="left:136px;top:0;width:36px;height:200px;background:{c['face']}"></div>
  <div class="p" style="left:146px;top:4px;width:16px;height:190px;clip-path:polygon(50% 0, 100% 22%, 100% 100%, 0 100%, 0 22%);background:{c['spire']}"></div>
  {arch(184)}
  <div class="p" style="left:{W - 12}px;top:0;width:12px;height:200px;background:{c['band']};box-shadow:inset 2px 0 0 {c['band_hi']}"></div>
  <div class="p" style="left:{W - 14}px;top:-4px;width:14px;height:14px;background:{c['stud']};transform:rotate(45deg)"></div>
  <div class="p" style="left:{W - 14}px;top:190px;width:14px;height:14px;background:{c['stud']};transform:rotate(45deg)"></div>
</div></body></html>"""


(OUT / "values.html").write_text(page(VALUES))
(OUT / "depth.html").write_text(page(DEPTH))
print("ok")
