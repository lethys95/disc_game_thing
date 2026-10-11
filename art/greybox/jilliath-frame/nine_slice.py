"""Jilliath's frame painting into a seamless nine-slice (assets/ui/jilliath/frame.webp). The painted edges don't repeat
cleanly end to end, so the asset is rebuilt from the top-left corner mirrored to the other three, with each corner's
inner edge at a point where the quatrefoil run is symmetric, and edge pieces cut to whole repeats of the run (about
47.5 px). The CSS slices it at 80 (top and bottom) and 87 (left and right).

    python art/greybox/jilliath-frame/nine_slice.py art/candidates/ui/paint-in/jilliath-frame/jilliath-frame-4.png
"""
import sys

import numpy as np
from PIL import Image

CORNER_W, CORNER_H = 87, 80


def repeat_length(profile: np.ndarray, start: int, low: int, high: int) -> int:
    return min(range(low, high), key=lambda n: np.abs(profile[start:start + 40] - profile[start + n:start + n + 40]).mean())


def main(source: str) -> None:
    painting = np.asarray(Image.open(source).convert("RGB"))
    grey = painting.mean(axis=2)
    height, width = grey.shape
    top = repeat_length(grey[6:58, :].mean(axis=0), CORNER_W, 440, 500)
    side = repeat_length(grey[:, 6:58].mean(axis=1), CORNER_H, 360, 440)
    corner = painting[:CORNER_H, :CORNER_W]
    top_edge = painting[:CORNER_H, CORNER_W:CORNER_W + top]
    side_edge = painting[CORNER_H:CORNER_H + side, :CORNER_W]
    out = np.zeros((CORNER_H * 2 + side, CORNER_W * 2 + top, 3), np.uint8)
    out[:, :] = painting[height // 2, width // 2]
    out[:CORNER_H, :CORNER_W] = corner
    out[:CORNER_H, CORNER_W:CORNER_W + top] = top_edge
    out[:CORNER_H, CORNER_W + top:] = corner[:, ::-1]
    out[CORNER_H:CORNER_H + side, :CORNER_W] = side_edge
    out[CORNER_H:CORNER_H + side, CORNER_W + top:] = side_edge[:, ::-1]
    out[CORNER_H + side:, :CORNER_W] = corner[::-1]
    out[CORNER_H + side:, CORNER_W:CORNER_W + top] = top_edge[::-1]
    out[CORNER_H + side:, CORNER_W + top:] = corner[::-1, ::-1]
    Image.fromarray(out).save("assets/ui/jilliath/frame.webp", quality=92)
    print(f"assets/ui/jilliath/frame.webp: edges {top} and {side} px")


main(sys.argv[1])
