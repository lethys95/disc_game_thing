"""Cuts a UI piece out of its flat grey background and saves it with transparency.

    uv run --no-project --with pillow python scripts/art/ui_cut.py <in.png> <out.webp> [--hollow] [--holes]

The background is flood-filled from the image's edges (so grey inside the piece survives), the edge softened, and
the result cropped to the piece. `--hollow` also clears the flat center of a frame or plaque and prints how thick
the border is, as a share of each side: the numbers CSS `border-image-slice` needs. `--holes` also clears the
background seen through openings in the piece (pierced tracery), for dark pieces with no grey of their own.
"""

import sys
from dataclasses import dataclass

from PIL import Image, ImageChops, ImageDraw, ImageFilter

BACKGROUND_TOLERANCE = 38
"""How far from the sampled background color a pixel may be and still count as background."""


@dataclass
class Options:
    source: str
    target: str
    hollow: bool
    holes: bool


def parse_options(argv: list[str]) -> Options:
    args = [a for a in argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        raise SystemExit(__doc__)
    return Options(source=args[0], target=args[1], hollow="--hollow" in argv, holes="--holes" in argv)


HOLE_STEP = 6
"""The spacing of the grid `--holes` floods from: openings narrower than this are missed."""

HOLE_TOLERANCE = 12
"""Tighter than the outside's: inside the piece, lit stone can come close to the background's grey."""


def near(pixel: tuple[int, int, int], color: tuple[int, int, int], tolerance: int) -> bool:
    return max(abs(a - b) for a, b in zip(pixel, color)) <= tolerance


def flood_mask(probe: Image.Image, marker: tuple[int, int, int]) -> Image.Image:
    mask = Image.new("L", probe.size, 0)
    mask.putdata([255 if pixel == marker else 0 for pixel in probe.get_flattened_data()])
    return mask


def background_mask(image: Image.Image, holes: bool) -> Image.Image:
    """White where the flood from the four corners reaches (and, with `holes`, any enclosed patch of the same grey)."""
    probe = image.convert("RGB").copy()
    marker = (255, 0, 255)
    width, height = probe.size
    background = probe.getpixel((0, 0))
    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(probe, corner, marker, thresh=BACKGROUND_TOLERANCE)
    outside = flood_mask(probe, marker)
    if not holes:
        return outside
    hole_marker = (0, 255, 0)
    for seed in [(x, y) for y in range(0, height, HOLE_STEP) for x in range(0, width, HOLE_STEP)]:
        pixel = probe.getpixel(seed)
        if pixel not in (marker, hole_marker) and near(pixel, background, HOLE_TOLERANCE):
            ImageDraw.floodfill(probe, seed, hole_marker, thresh=HOLE_TOLERANCE)
    # An opening rather than a lit fleck on the stone: whatever survives an erosion.
    openings = flood_mask(probe, hole_marker).filter(ImageFilter.MinFilter(HOLE_STEP + 1)).filter(ImageFilter.MaxFilter(HOLE_STEP + 1))
    return ImageChops.lighter(outside, openings)


def hollow_center(image: Image.Image) -> tuple[Image.Image, tuple[float, float, float, float]]:
    """Clears the flat center by flooding from the middle; returns the border's thickness per side, as shares.

    Only the flooded pixels are cleared, not their bounding box, so a figure reaching into the center survives.
    """
    probe = image.convert("RGB").copy()
    marker = (0, 255, 255)
    width, height = probe.size
    ImageDraw.floodfill(probe, (width // 2, height // 2), marker, thresh=BACKGROUND_TOLERANCE)
    flooded = flood_mask(probe, marker)
    left, top, right, bottom = flooded.getbbox() or (0, 0, width, height)
    soft = flooded.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    image.putalpha(ImageChops.subtract(image.getchannel("A"), soft))
    return image, (top / height, (width - right) / width, (height - bottom) / height, left / width)


def main() -> None:
    options = parse_options(sys.argv)
    image = Image.open(options.source).convert("RGBA")
    background = background_mask(image, options.holes).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    alpha = Image.eval(background, lambda value: 255 - value)
    image.putalpha(alpha)
    image = image.crop(alpha.getbbox())
    if options.hollow:
        image, (top, right, bottom, left) = hollow_center(image)
        print(f"ui_cut: border slice top {top:.1%} right {right:.1%} bottom {bottom:.1%} left {left:.1%}")
    image.save(options.target, quality=90)
    print(f"ui_cut: {image.size[0]}x{image.size[1]} -> {options.target}")


main()
