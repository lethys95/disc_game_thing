# /// script
# requires-python = ">=3.11"
# dependencies = ["ultralytics", "pillow"]
# ///
"""Where a portrait card's bust and icon are cut: found, not guessed.

A pose model (YOLO11 pose, run locally) finds the figure's face and shoulders on each card; one rule frames them all, so
every icon sits on its head and every bust on its head and shoulders. Hand-estimated crops kept missing heads (the user,
2026-10-09: "a lot of the portraits are misaligned […] this manual nudging is very prone to having faults"). Prints, per
card, the `crops` to paste into `picked` in `scripts/art/portraits.ts`. A figure the model doesn't see as a person (the
Godkin's sky silhouette) is reported, and framed by hand.

    uv run scripts/art/portrait-frames.py <card.png…>
"""

import math
import sys
from pathlib import Path

from ultralytics import YOLO

# The icon: the head and a little of the shoulders. The bust: head and shoulders, down to the chest.
ICON_UP, ICON_SIDE, ICON_MIN_SHOULDERS = 0.25, 2.1, 1.2
BUST_DOWN, BUST_SHOULDERS, BUST_MIN_NECK = 0.9, 2.6, 4.2
SEEN = 0.3

model = YOLO("yolo11m-pose.pt")
for card in sys.argv[1:]:
    result = model(card, verbose=False)[0]
    if result.keypoints is None or len(result.boxes) == 0:
        print(f"{Path(card).name}: no figure found; frame it by hand")
        continue
    points = result.keypoints.data[int(result.boxes.conf.argmax())].tolist()
    face = [p for p in points[:5] if p[2] > SEEN]
    left, right = points[5], points[6]
    if not face or left[2] <= SEEN or right[2] <= SEEN:
        print(f"{Path(card).name}: face or shoulders not found; frame it by hand")
        continue
    height, width = result.orig_shape
    hx, hy = sum(p[0] for p in face) / len(face), sum(p[1] for p in face) / len(face)
    sx, sy = (left[0] + right[0]) / 2, (left[1] + right[1]) / 2
    shoulders = math.hypot(left[0] - right[0], left[1] - right[1])
    neck = max(1.0, sy - hy)
    icon = (hx + ICON_UP * (sx - hx), hy + ICON_UP * (sy - hy), max(ICON_SIDE * neck, ICON_MIN_SHOULDERS * shoulders))
    bust = (hx + BUST_DOWN * (sx - hx), hy + BUST_DOWN * (sy - hy), max(BUST_SHOULDERS * shoulders, BUST_MIN_NECK * neck))
    crop = lambda c: f'{{ from: "card", size: {c[2] / width:.3f}, x: {c[0] / width:.3f}, y: {c[1] / height:.3f} }}'
    print(f"{Path(card).name}: crops: {{ bust: {crop(bust)}, icon: {crop(icon)} }},")
