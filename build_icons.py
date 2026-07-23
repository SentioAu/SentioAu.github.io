#!/usr/bin/env python3
"""Render PNG app icons from the SentioAurum 'SA' monogram (source: favicon.svg)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent

GOLD_SOFT = (240, 214, 154)
GOLD_STRONG = (202, 160, 74)
INK = (36, 28, 8)


def load_serif(size: int) -> ImageFont.FreeTypeFont:
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def gold_tile(size: int) -> Image.Image:
    tile = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(tile)
    for y in range(size):
        t = y / (size - 1)
        r = round(GOLD_SOFT[0] + (GOLD_STRONG[0] - GOLD_SOFT[0]) * t)
        g = round(GOLD_SOFT[1] + (GOLD_STRONG[1] - GOLD_SOFT[1]) * t)
        b = round(GOLD_SOFT[2] + (GOLD_STRONG[2] - GOLD_SOFT[2]) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    return tile


def monogram(size: int, rounded: bool, pad_ratio: float) -> Image.Image:
    """Gold tile with centered 'SA'. rounded=True => transparent rounded corners."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tile = gold_tile(size).convert("RGBA")

    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1),
                                               radius=round(size * 0.22), fill=255)
        img.paste(tile, (0, 0), mask)
    else:
        img.paste(tile, (0, 0))

    draw = ImageDraw.Draw(img)
    font = load_serif(round(size * (1 - pad_ratio) * 0.62))
    box = draw.textbbox((0, 0), "SA", font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.text((size / 2 - tw / 2 - box[0], size / 2 - th / 2 - box[1]),
              "SA", font=font, fill=(*INK, 255))
    return img


def main() -> None:
    # Maskable/any icons: rounded, transparent margin.
    monogram(192, rounded=True, pad_ratio=0.14).save(ROOT / "icon-192.png", optimize=True)
    monogram(512, rounded=True, pad_ratio=0.14).save(ROOT / "icon-512.png", optimize=True)
    # Apple touch: full-bleed square (iOS applies its own rounding).
    monogram(180, rounded=False, pad_ratio=0.16).save(ROOT / "apple-touch-icon.png", optimize=True)
    print("Wrote icon-192.png, icon-512.png, apple-touch-icon.png")


if __name__ == "__main__":
    main()
