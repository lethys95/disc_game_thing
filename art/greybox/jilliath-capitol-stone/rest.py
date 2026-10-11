"""The stone column's last lattice (between the angel's arms, beside her head, at the gable's shoulders), as a mask that
follows the lattice: dark, unsaturated ground in those zones, kept a few pixels clear of anything bright. For the
`jilliath-capitol-stone-rest2` repair, from `jilliath-capitol-stone-rest` d88-2.

    python art/greybox/jilliath-capitol-stone/rest.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

S = 576 / 300
SOURCE = Path("art/candidates/ui/inpaint/jilliath-capitol-stone-rest/jilliath-capitol-stone-rest-d88-2.png")
ZONES = [(100, 300, 205, 410), (60, 600, 108, 700), (192, 600, 242, 700)]

src = Image.open(SOURCE).convert("RGB")
soft = np.asarray(src.filter(ImageFilter.GaussianBlur(4))).astype(float)
lum = soft.mean(axis=2)
sat = soft.max(axis=2) - soft.min(axis=2)
bright = Image.fromarray((((lum > 100) | (sat > 34)) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
h, w = lum.shape
yy, xx = np.mgrid[0:h, 0:w]
zone = np.zeros((h, w), bool)
for x0, y0, x1, y1 in ZONES:
    zone |= (xx >= x0 * S) & (xx < x1 * S) & (yy >= y0 * S) & (yy < y1 * S)
mask = zone & ~(np.asarray(bright) > 0)
Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)).save(Path(__file__).parent / "rest-mask.png")
print("ok")
