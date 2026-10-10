"""Composes the wide canvas for inpainting the bar's extensions: the painted bar in the middle, kept as it is, and the
extension's greybox at each end (the right one mirrored). Writes the source and its depth map for
`hud-inpaint.ts battle-bar-wide`.

    uv run --no-project --with pillow python art/greybox/battle-bar-wide/compose.py
"""
from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).parent
BAR = Path("assets/ui/battle/bar.webp")
BAR_DEPTH = Path("art/greybox/battle-bar-duel-dull-nostone/depth.png")
OUT = Path("art/candidates/ui/inpaint/battle-bar-wide-source")


def wide(end: Image.Image, middle: Image.Image) -> Image.Image:
    canvas = Image.new(middle.mode, (middle.width + 2 * end.width, middle.height))
    canvas.paste(end, (0, 0))
    canvas.paste(middle, (end.width, 0))
    canvas.paste(ImageOps.mirror(end), (end.width + middle.width, 0))
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    bar = Image.open(BAR).convert("RGB")
    wide(Image.open(HERE / "values.png").convert("RGB"), bar).save(OUT / "source.png")
    wide(Image.open(HERE / "depth.png").convert("L"), Image.open(BAR_DEPTH).convert("L").resize(bar.size)).save(OUT / "depth.png")
    print(f"compose: {bar.width + 1024}x{bar.height} -> {OUT}")


main()
