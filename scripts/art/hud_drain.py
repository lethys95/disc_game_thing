"""Writes the drained copy of a painted HUD piece: its red glass emptied, everything else exactly as it was.

    uv run --no-project --with pillow python scripts/art/hud_drain.py <in.png> <out.png> [--ends 0.16]

A health globe drains by showing this copy above the health level, clipped to the globe. Red-hued, saturated pixels
(the glass) are darkened and greyed; iron, figures and rims are unsaturated and unchanged, so a figure in front of the
glass is never cut by the level.
"""

import sys
from dataclasses import dataclass

from PIL import Image

RED_HUES = (22, 232)
"""PIL's hue runs 0-255: red is below the first and above the second."""
SATURATED = 90


@dataclass
class Options:
    source: str
    target: str
    ends: float


def parse_options(argv: list[str]) -> Options:
    args = argv[1:]
    if len(args) < 2:
        raise SystemExit(__doc__)
    ends = float(args[args.index("--ends") + 1]) if "--ends" in args else 0.16
    return Options(source=args[0], target=args[1], ends=ends)


def main() -> None:
    options = parse_options(sys.argv)
    hsv = Image.open(options.source).convert("RGB").convert("HSV")
    width, height = hsv.size
    pixels = hsv.load()
    # Only the piece's two ends hold globes; amber studs and red glass elsewhere stay lit.
    columns = list(range(0, int(width * options.ends))) + list(range(int(width * (1 - options.ends)), width))
    for y in range(height):
        for x in columns:
            hue, saturation, value = pixels[x, y]
            if (hue < RED_HUES[0] or hue > RED_HUES[1]) and saturation > SATURATED:
                k = min(1.0, (saturation - SATURATED) / 80)
                pixels[x, y] = (hue, int(saturation * (1 - 0.6 * k)), int(value * (1 - 0.78 * k)))
    hsv.convert("RGB").save(options.target)
    print(f"hud_drain: {width}x{height} -> {options.target}")


main()
