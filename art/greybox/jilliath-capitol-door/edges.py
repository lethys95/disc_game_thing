"""The two strips beside the portal where round 4's low iron arch survived the door repaint, as a mask for the
`jilliath-capitol-door-edges` repair (white is repainted), at the painting's size.

    python art/greybox/jilliath-capitol-door/edges.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

S = 576 / 300
mask = Image.new("L", (576, 1664), 0)
d = ImageDraw.Draw(mask)
for x0, x1 in ((24, 64), (234, 278)):
    d.rectangle((x0 * S, 680 * S, x1 * S, 864 * S), fill=255)
mask.filter(ImageFilter.GaussianBlur(5)).save(Path(__file__).parent / "edges-mask.png")
print("ok")
