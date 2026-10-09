"""Cuts a UI piece out of its flat grey background and saves it with transparency.

    uv run --no-project --with pillow python scripts/art/ui_cut.py <in.png> <out.webp>

The background is flood-filled from the image's edges (so grey inside the piece survives), the edge softened, and
the result cropped to the piece.
"""

import sys
from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageFilter

BACKGROUND_TOLERANCE = 38
"""How far from the sampled background color a pixel may be and still count as background."""


@dataclass
class Options:
    source: str
    target: str


def parse_options(argv: list[str]) -> Options:
    args = argv[1:]
    if len(args) < 2:
        raise SystemExit(__doc__)
    return Options(source=args[0], target=args[1])


def flood_mask(probe: Image.Image, marker: tuple[int, int, int]) -> Image.Image:
    mask = Image.new("L", probe.size, 0)
    mask.putdata([255 if pixel == marker else 0 for pixel in probe.get_flattened_data()])
    return mask


def background_mask(image: Image.Image) -> Image.Image:
    """White where the flood from the four corners reaches."""
    probe = image.convert("RGB").copy()
    marker = (255, 0, 255)
    width, height = probe.size
    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(probe, corner, marker, thresh=BACKGROUND_TOLERANCE)
    return flood_mask(probe, marker)


def main() -> None:
    options = parse_options(sys.argv)
    image = Image.open(options.source).convert("RGBA")
    background = background_mask(image).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    alpha = Image.eval(background, lambda value: 255 - value)
    image.putalpha(alpha)
    image = image.crop(alpha.getbbox())
    image.save(options.target, quality=90)
    print(f"ui_cut: {image.size[0]}x{image.size[1]} -> {options.target}")


main()
