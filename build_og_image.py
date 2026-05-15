#!/usr/bin/env python3
"""Render og-image.png from the same design as og-image.svg."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT_PATH = ROOT / "og-image.png"

WIDTH, HEIGHT = 1200, 630


def gradient_background() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT))
    top = (10, 15, 26)
    bottom = (19, 36, 66)
    pixels = img.load()
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        r = round(top[0] + (bottom[0] - top[0]) * t)
        g = round(top[1] + (bottom[1] - top[1]) * t)
        b = round(top[2] + (bottom[2] - top[2]) * t)
        for x in range(WIDTH):
            pixels[x, y] = (r, g, b)
    return img


def load_font(size: int, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    candidates = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans-{'Bold' if weight == 'Bold' else 'Sans' if weight == 'Regular' else weight}.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if weight == "Bold" else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if weight == "Bold" else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def main() -> None:
    img = gradient_background().convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rounded_rectangle((80, 84, 1120, 546), radius=26,
                            fill=(255, 255, 255, 8),
                            outline=(156, 195, 255, 80), width=1)

    eyebrow_font = load_font(24, "Bold")
    headline_font = load_font(62, "Bold")
    url_font = load_font(28, "Regular")

    draw.text((140, 200), "SENTIOAURUM", font=eyebrow_font, fill=(156, 195, 255, 255), spacing=2)
    draw.text((140, 250), "Premium Domains", font=headline_font, fill=(236, 242, 255, 255))
    draw.text((140, 322), "& Digital Ventures", font=headline_font, fill=(236, 242, 255, 255))

    accent = Image.new("RGBA", (380, 8), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accent)
    for x in range(380):
        t = x / 379
        r = round(156 + (109 - 156) * t)
        g = round(195 + (163 - 195) * t)
        b = round(255 + (255 - 255) * t)
        accent_draw.line([(x, 0), (x, 7)], fill=(r, g, b, 255))
    accent_mask = Image.new("L", accent.size, 0)
    ImageDraw.Draw(accent_mask).rounded_rectangle((0, 0, 380, 8), radius=4, fill=255)
    overlay.paste(accent, (140, 412), accent_mask)

    draw.text((140, 460), "sentioaurum.com", font=url_font, fill=(167, 182, 216, 255))

    composed = Image.alpha_composite(img, overlay).convert("RGB")
    composed.save(OUT_PATH, "PNG", optimize=True)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
