"""The map column window's glass as an exact mask (art/masks/map-column-glass.png): the glass found by colour inside
the arch, the leads and tracery left out, the nine panes added as measured. A box mask spilled glass over the iron
around the arch (the user, 2026-10-11: "this strange tear in the colors").

    uv run --with scipy --with pillow --with numpy python art/masks/glass_mask.py <source.png> <mask.png> <preview.png>
"""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
from scipy import ndimage
import sys
src, out, preview = sys.argv[1:4]
k = 576/300
o = np.asarray(Image.open(src).convert("RGB")).astype(float)
mx, mn = o.max(-1), o.min(-1)
sat = (mx - mn) / (mx + 1); lum = o.mean(-1)
arch = Image.new("L", (o.shape[1], o.shape[0]), 0); d = ImageDraw.Draw(arch)
x, y, w, h, rise = 27, 213, 246, 266, 64
d.pieslice([x*k, y*k, (x+w)*k, (y+2*rise)*k], 180, 360, fill=255); d.rectangle([x*k, (y+rise)*k, (x+w)*k, (y+h)*k], fill=255)
arch = np.asarray(arch) > 0
lead = ((sat < 0.3) & (lum > 45)) | ~arch
lead = ndimage.binary_closing(lead, iterations=2) | ~arch
regions, n = ndimage.label(~lead)
sizes = ndimage.sum(np.ones_like(lead), regions, range(1, n + 1))
keep = np.isin(regions, [i + 1 for i, s in enumerate(sizes) if s >= 30])
m = ndimage.binary_dilation(ndimage.binary_fill_holes(ndimage.binary_closing(keep, iterations=3) & ~(((sat < 0.3) & (lum > 70)) & ndimage.binary_erosion(lead, iterations=1))), iterations=1) & arch
Image.fromarray(m.astype(np.uint8) * 255).save(out)
ov = Image.fromarray(o.astype(np.uint8)); cy = Image.new("RGB", ov.size, (0,255,255))
Image.composite(Image.blend(ov, cy, 0.5), ov, Image.fromarray(m.astype(np.uint8)*255)).crop((int(10*k), int(190*k), int(290*k), int(500*k))).save(preview)
# The nine panes as measured lead core to lead core (style.css, #mapsquad .pane), inset past half a lead.
panes = Image.fromarray(m.astype(np.uint8) * 255); d = ImageDraw.Draw(panes)
for px, pw in ((47.4, 63.6), (118.2, 64.6), (189, 63.6)):
    for py, ph in ((266.3, 64.5), (336.4, 66), (408.1, 63.9)):
        d.rectangle([(px + 3.2) * k, (py + 3.2) * k, (px + pw - 3.2) * k, (py + ph - 3.2) * k], fill=255)
panes.save(out)
ov = Image.fromarray(o.astype(np.uint8)); cy = Image.new("RGB", ov.size, (0,255,255))
Image.composite(Image.blend(ov, cy, 0.5), ov, panes).crop((int(10*k), int(190*k), int(290*k), int(500*k))).save(preview)
