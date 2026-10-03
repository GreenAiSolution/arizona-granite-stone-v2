"""V2-only extras on top of tools/build_images.py (which builds the shared photo set).
Run: python3 tools/build_v2.py   (needs Pillow)"""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter
import random

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "assets/orig", ROOT / "assets/img"

def save(im, slug, widths, q=80):
    for w in widths:
        c = im.copy()
        if c.width > w: c = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS)
        c.save(OUT / f"{slug}-{w}.jpg", "JPEG", quality=q, optimize=True, progressive=True)
        c.save(OUT / f"{slug}-{w}.webp", "WEBP", quality=q - 4, method=6)
        print(slug, w, c.size)

# 1. Hero, landscape: a wide band across the waterfall island (desktop). Phones use the portrait build.
hero = ImageOps.exif_transpose(Image.open(SRC / "IMG_8988.jpeg")).convert("RGB")
band = hero.crop((0, 760, 1920, 1960))            # 1920 x 1200
save(band, "hero-wide", [1200, 1600, 1920])

# 2. Step 1 photo, square crop of the bare cabinets
cab = Image.open(OUT / "cabinets-ready-900.jpg").crop((0, 230, 900, 1130))
save(cab, "cabinets-sq", [600, 900])

# 3. Book-match half: the marble run, one half of the "open book" (the page mirrors it in CSS)
half = ImageOps.exif_transpose(Image.open(SRC / "IMG_8988.jpeg")).convert("RGB").crop((150, 1560, 1350, 2340))  # the flat waterfall face, stone only
save(half, "book-half", [700, 1200])

# 4. Granite swatch for the materials panel: Tan Brown granite from the repair photo, clear of the clamp and block
gr = ImageOps.exif_transpose(Image.open(SRC / "IMG_6467.jpeg")).convert("RGB")
save(gr.crop((900, 1950, 1700, 2450)), "swatch-granite-v2", [900])

# 5. Polished-granite grain tile (generated, seamless by construction; drawn at low opacity over the ground)
random.seed(7)
W = 480
tile = Image.new("RGB", (W, W), (10, 10, 11))
px = tile.load()
tones = [(16, 16, 18), (22, 21, 21), (27, 26, 24), (13, 13, 15), (33, 31, 28)]
for _ in range(52000):
    px[random.randrange(W), random.randrange(W)] = random.choice(tones)
for _ in range(700):                                 # quartz flecks
    x, y = random.randrange(W), random.randrange(W)
    px[x, y] = random.choice([(58, 55, 48), (70, 66, 58), (48, 47, 46)])
tile = tile.filter(ImageFilter.GaussianBlur(0.35))
tile.save(OUT / "granite-tile.png", optimize=True)
print("tile", tile.size, (OUT / "granite-tile.png").stat().st_size // 1024, "KB")
