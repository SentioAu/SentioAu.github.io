#!/usr/bin/env python3
"""Render og-image.png — the SentioAurum studio social preview (1200x630)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT_PATH = ROOT / "og-image.png"

WIDTH, HEIGHT = 1200, 630

INK_TOP = (12, 13, 16)
INK_BOTTOM = (20, 18, 12)
GOLD = (226, 184, 98)
GOLD_SOFT = (240, 214, 154)
GOLD_STRONG = (202, 160, 74)
TEXT = (243, 239, 231)
MUTED = (167, 162, 144)


def gradient_background() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = img.load()
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        r = round(INK_TOP[0] + (INK_BOTTOM[0] - INK_TOP[0]) * t)
        g = round(INK_TOP[1] + (INK_BOTTOM[1] - INK_TOP[1]) * t)
        b = round(INK_TOP[2] + (INK_BOTTOM[2] - INK_TOP[2]) * t)
        for x in range(WIDTH):
            pixels[x, y] = (r, g, b)
    return img


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def main() -> None:
    img = gradient_background().convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Framing panel.
    draw.rounded_rectangle((80, 84, 1120, 546), radius=26,
                           fill=(255, 255, 255, 6),
                           outline=(*GOLD, 70), width=1)

    # Monogram tile.
    draw.rounded_rectangle((140, 150, 226, 236), radius=18, fill=(*GOLD, 235))
    mono_font = load_font(44, bold=True)
    mb = draw.textbbox((0, 0), "SA", font=mono_font)
    draw.text((183 - (mb[2] - mb[0]) / 2, 193 - (mb[3] - mb[1]) / 2 - mb[1]),
              "SA", font=mono_font, fill=(36, 28, 8, 255))

    eyebrow_font = load_font(24, bold=True)
    headline_font = load_font(58, bold=True)
    url_font = load_font(28)

    draw.text((248, 168), "SENTIOAURUM", font=eyebrow_font, fill=(*GOLD, 255))
    draw.text((248, 200), "Independent digital studio", font=url_font, fill=(*MUTED, 255))

    draw.text((140, 300), "One studio, a network of", font=headline_font, fill=(*TEXT, 255))
    draw.text((140, 372), "useful web tools.", font=headline_font, fill=(*GOLD_SOFT, 255))

    # Accent underline.
    accent = Image.new("RGBA", (360, 8), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accent)
    for x in range(360):
        t = x / 359
        r = round(GOLD_STRONG[0] + (GOLD_SOFT[0] - GOLD_STRONG[0]) * t)
        g = round(GOLD_STRONG[1] + (GOLD_SOFT[1] - GOLD_STRONG[1]) * t)
        b = round(GOLD_STRONG[2] + (GOLD_SOFT[2] - GOLD_STRONG[2]) * t)
        accent_draw.line([(x, 0), (x, 7)], fill=(r, g, b, 255))
    accent_mask = Image.new("L", accent.size, 0)
    ImageDraw.Draw(accent_mask).rounded_rectangle((0, 0, 360, 8), radius=4, fill=255)
    overlay.paste(accent, (140, 452), accent_mask)

    draw.text((140, 486), "empirecalc · alhasebah · morsecodegenerator · espressofit",
              font=url_font, fill=(*MUTED, 255))

    composed = Image.alpha_composite(img, overlay).convert("RGB")
    composed.save(OUT_PATH, "PNG", optimize=True)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
