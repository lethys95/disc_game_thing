"""Matches the inpainted extension's tone to the wall's edge (the picks came out lighter and warmer than the painting
beside them): one brightness gain (all channels) that brings the extension's strip by the seam to the painting's strip by the seam,
measured where both are plain masonry (above the knight's niche and in the crypt, not the niche itself), easing from
full at the seam to a third of it at the extension's far edge. Writes assets/ui/jilliath/garrison-wide.webp (the
extension alone, 576 page px).

    python art/greybox/jilliath-garrison-wide/match.py <inpainted crop>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

K = 1728 / 1236
EXT_PX = round(576 * K)
crop = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(float)
rows = np.r_[0:int(270 * K), int(640 * K):crop.shape[0]]
ext_band = crop[rows, EXT_PX - 90:EXT_PX - 10].reshape(-1, 3).mean(axis=0)
wall_band = crop[rows, EXT_PX + 10:EXT_PX + 50].reshape(-1, 3).mean(axis=0)
# brightness only: a per-channel gain tinted the stone green (the wall's edge carries the glass's red)
gain = np.full(3, wall_band.mean() / ext_band.mean())
ramp = np.linspace(1 / 3, 1, EXT_PX)[None, :, None]
ext = crop[:, :EXT_PX] * (1 + (gain[None, None, :] - 1) * ramp)
# The painting's edge stands in shadow beside the knight; the model lit the blocks there. A soft shadow over them,
# above the ledge, carries the painting's shadow across the seam.
from PIL import ImageDraw, ImageFilter
shade = Image.new("L", (EXT_PX, crop.shape[0]), 0)
ImageDraw.Draw(shade).rectangle((EXT_PX - 300, int(150 * K), EXT_PX + 40, int(596 * K)), fill=255)
shade = np.asarray(shade.filter(ImageFilter.GaussianBlur(60))).astype(float)[:, :, None] / 255
ext = ext * (1 - 0.5 * shade)
Image.fromarray(np.clip(ext, 0, 255).astype(np.uint8)).save("assets/ui/jilliath/garrison-wide.webp", quality=90)
print("gain", np.round(gain, 3))
