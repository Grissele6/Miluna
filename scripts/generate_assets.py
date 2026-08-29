"""Generate Miluna app icons and splash screen.

Produces:
- assets/icon.png            1024x1024 app icon (crescent + spark on black)
- assets/adaptive-icon.png   1024x1024 foreground for Android adaptive icon (safe area centered)
- assets/splash.png          1284x2778 splash (portrait, centered logo)
- assets/favicon.png         48x48 favicon
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import random

BLACK = (5, 3, 20, 255)           # deep space background
PURPLE = (155, 89, 232, 255)      # protagonist purple
PURPLE_SOFT = (192, 132, 245, 255)
DEEP_BLUE = (46, 51, 130, 255)    # support deep blue
STAR = (240, 232, 255, 255)


def draw_starfield(img: Image.Image, seed: int = 7, density: float = 0.0004) -> None:
    """Sprinkle small stars across the image (in place)."""
    random.seed(seed)
    w, h = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    n_stars = int(w * h * density)
    for _ in range(n_stars):
        x = random.randint(0, w - 1)
        y = random.randint(0, h - 1)
        r = random.choice([0, 0, 0, 1, 1, 2])
        alpha = random.randint(90, 230)
        color = (STAR[0], STAR[1], STAR[2], alpha)
        if r == 0:
            draw.point((x, y), fill=color)
        else:
            draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def draw_crescent(img: Image.Image, cx: int, cy: int, radius: int) -> None:
    """Draw a purple crescent moon centered at (cx, cy)."""
    # Full moon disc
    moon = Image.new("RGBA", img.size, (0, 0, 0, 0))
    md = ImageDraw.Draw(moon)
    md.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=PURPLE)
    # Cut-out disc, slightly offset to create crescent
    offset = int(radius * 0.35)
    cut = Image.new("RGBA", img.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cut)
    cd.ellipse(
        (cx - radius + offset, cy - radius, cx + radius + offset, cy + radius),
        fill=(0, 0, 0, 255),
    )
    # Subtract cut from moon (alpha)
    moon_alpha = moon.split()[3]
    cut_alpha = cut.split()[3]
    new_alpha = Image.eval(cut_alpha, lambda v: 255 - v)
    from PIL import ImageChops
    final_alpha = ImageChops.multiply(moon_alpha, new_alpha)
    moon.putalpha(final_alpha)
    # Soft glow
    glow = moon.filter(ImageFilter.GaussianBlur(radius * 0.08))
    img.alpha_composite(glow)
    img.alpha_composite(moon)


def draw_spark(img: Image.Image, cx: int, cy: int, size: int) -> None:
    """Draw a small 4-point sparkle."""
    d = ImageDraw.Draw(img, "RGBA")
    # Vertical
    d.polygon(
        [(cx, cy - size), (cx + size // 4, cy), (cx, cy + size), (cx - size // 4, cy)],
        fill=STAR,
    )
    # Horizontal
    d.polygon(
        [(cx - size, cy), (cx, cy - size // 4), (cx + size, cy), (cx, cy + size // 4)],
        fill=STAR,
    )
    # Center
    d.ellipse((cx - size // 5, cy - size // 5, cx + size // 5, cy + size // 5), fill=STAR)


def make_icon(path: str, size: int = 1024, background: bool = True) -> None:
    img = Image.new("RGBA", (size, size), BLACK if background else (0, 0, 0, 0))
    if background:
        draw_starfield(img, seed=11, density=0.0006)
    # Crescent
    cx, cy = size // 2, size // 2
    radius = int(size * 0.30)
    draw_crescent(img, cx, cy, radius)
    # Spark near the tip
    sx = cx + int(radius * 0.55)
    sy = cy - int(radius * 0.55)
    draw_spark(img, sx, sy, int(size * 0.06))
    img.save(path, "PNG")


def make_adaptive_foreground(path: str, size: int = 1024) -> None:
    """Foreground for Android adaptive icon.

    The system may crop up to ~33% around the edges; keep art inside the
    inner 66% safe area."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size // 2, size // 2
    radius = int(size * 0.22)  # smaller so it stays inside safe area
    draw_crescent(img, cx, cy, radius)
    sx = cx + int(radius * 0.55)
    sy = cy - int(radius * 0.55)
    draw_spark(img, sx, sy, int(size * 0.045))
    img.save(path, "PNG")


def make_splash(path: str, w: int = 1284, h: int = 2778) -> None:
    img = Image.new("RGBA", (w, h), BLACK)
    draw_starfield(img, seed=23, density=0.0004)
    cx, cy = w // 2, h // 2
    radius = int(min(w, h) * 0.18)
    draw_crescent(img, cx, cy, radius)
    sx = cx + int(radius * 0.55)
    sy = cy - int(radius * 0.55)
    draw_spark(img, sx, sy, int(min(w, h) * 0.035))
    img.save(path, "PNG")


def make_favicon(path: str, size: int = 48) -> None:
    img = Image.new("RGBA", (size, size), BLACK)
    cx, cy = size // 2, size // 2
    radius = int(size * 0.32)
    draw_crescent(img, cx, cy, radius)
    img.save(path, "PNG")


if __name__ == "__main__":
    import os
    base = os.path.join(os.path.dirname(__file__), "..", "assets")
    base = os.path.abspath(base)
    os.makedirs(base, exist_ok=True)
    make_icon(os.path.join(base, "icon.png"))
    make_adaptive_foreground(os.path.join(base, "adaptive-icon.png"))
    make_splash(os.path.join(base, "splash.png"))
    make_favicon(os.path.join(base, "favicon.png"))
    print("Assets generated at", base)
