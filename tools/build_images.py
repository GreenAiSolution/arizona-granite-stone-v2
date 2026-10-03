"""Resize the client's original photos (assets/orig) into web sizes (assets/img).
Run: python3 tools/build_images.py   (needs Pillow)"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageEnhance
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "assets/orig", ROOT / "assets/img"
OUT.mkdir(parents=True, exist_ok=True)

def load(name, crop=None):
    im = ImageOps.exif_transpose(Image.open(SRC / name)).convert("RGB")
    if crop: im = im.crop(crop)
    return im

def save(im, slug, widths, q=78):
    for w in widths:
        c = im.copy()
        if c.width > w: c = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS)
        jpg = OUT / f"{slug}-{w}.jpg"
        c.save(jpg, "JPEG", quality=q, optimize=True, progressive=True)
        c.save(OUT / f"{slug}-{w}.webp", "WEBP", quality=q - 4, method=6)
        print(jpg.name, c.size, jpg.stat().st_size // 1024, "KB")

# slug: (file, crop box or None, widths)
PHOTOS = {
    "waterfall-marble":  ("IMG_8988.jpeg", None, [800, 1200, 1600]),
    "quartz-island":     ("9f3396bc-944e-4504-acfa-ba191acde254.jpeg", None, [600, 900, 1200]),
    "marble-island":     ("blob-81cefaa.png", (250, 0, 1750, 2000), [600, 900, 1500]),
    "quartz-veined":     ("IMG_6508.jpeg", None, [600, 900, 1600]),
    "marble-run":        ("IMG_9865.jpeg", (0, 1450, 1920, 2560), [600, 900, 1600]),  # cropped: no worker in frame
    "granite-island":    ("CC98062C-950C-4BAA-AFF5-93185CA18854.jpeg", None, [600, 900, 1600]),
    "black-granite":     ("2212FA54-6C00-4D34-A1C7-94AB4338E9D2.jpeg", None, [600, 900, 1600]),
    "black-granite-bar": ("A2E39515-9092-439A-9DA3-9F8BEAD2D8FC.jpeg", None, [600, 900, 1600]),
    "quartz-top":        ("IMG_6449.jpeg", (0, 440, 1920, 2560), [600, 900, 1600]),  # cropped: no family photos
    "seam-repair":       ("IMG_6467.jpeg", None, [600, 900, 1600]),
    "cabinets-ready":    ("IMG_6442.jpeg", None, [600, 900, 1600]),
    "sink-in-shop":      ("IMG_6601.jpeg", None, [600, 900, 1600]),
    "quartz-closeup":    ("IMG_6508.jpeg", (300, 1150, 1500, 2050), [600, 900]),  # step 2: the stone itself, 4:3
}
for slug, (f, crop, ws) in PHOTOS.items():
    save(load(f, crop), slug, ws)

# Real slab swatches cropped from their own jobs (material cards). 16:10, at least 800px wide so
# they stay crisp on Retina. The marble photo has a blue cast from the window; neutralise it.
def neutralise(im, strength=0.85):
    """Gray-world white balance: scale each channel so the crop's mean is neutral."""
    stat = [sum(ch) / len(ch) for ch in (im.split()[i].getdata() for i in range(3))]
    g = sum(stat) / 3
    gains = [1 + strength * (g / m - 1) for m in stat]
    return im.point([min(255, round(i * gains[c])) for c in range(3) for i in range(256)])

SWATCH = {
    "swatch-marble":  ("IMG_8988.jpeg", (480, 1540, 1760, 2340), True),
    "swatch-quartz":  ("IMG_6508.jpeg", (600, 1150, 1400, 1650), True),  # the island top, clear of the cooktop; room light is greenish
    "swatch-granite": ("IMG_6467.jpeg", (1050, 1420, 1890, 1945), False),
}
for slug, (f, crop, wb) in SWATCH.items():
    im = load(f, crop)
    if wb: im = ImageEnhance.Brightness(neutralise(im)).enhance(1.06)
    save(im, slug, [900])

# Logo: knock out the white background outside the badge (flood from corners)
logo = Image.open(SRC / "IMG_9046.jpeg").convert("RGB")
mask = Image.new("L", logo.size, 255)
work = logo.copy()
for xy in [(0, 0), (logo.width - 1, 0), (0, logo.height - 1), (logo.width - 1, logo.height - 1)]:
    ImageDraw.floodfill(work, xy, (255, 0, 255), thresh=60)
px, mp = work.load(), mask.load()
for y in range(logo.height):
    for x in range(logo.width):
        if px[x, y] == (255, 0, 255): mp[x, y] = 0
rgba = logo.copy(); rgba.putalpha(mask)
rgba = rgba.crop(rgba.getbbox())
for w in (160, 320, 640):
    c = rgba.resize((w, round(rgba.height * w / rgba.width)), Image.LANCZOS)
    c.save(OUT / f"logo-{w}.png", optimize=True)
    c.save(OUT / f"logo-{w}.webp", "WEBP", quality=88, method=6)
# square icons
sq = max(rgba.size); icon = Image.new("RGBA", (sq, sq), (0, 0, 0, 0))
icon.paste(rgba, ((sq - rgba.width) // 2, (sq - rgba.height) // 2), rgba)
icon.resize((180, 180), Image.LANCZOS).save(ROOT / "apple-touch-icon.png", optimize=True)
icon.resize((64, 64), Image.LANCZOS).save(ROOT / "favicon.png", optimize=True)

# Open Graph card 1200x630: waterfall photo + badge
hero = load("IMG_8988.jpeg")
og = hero.resize((1200, round(hero.height * 1200 / hero.width)), Image.LANCZOS)
top = int(og.height * 0.42); og = og.crop((0, top, 1200, top + 630))
shade = Image.new("RGBA", og.size, (0, 0, 0, 0)); d = ImageDraw.Draw(shade)
for x in range(620):
    d.line([(x, 0), (x, 630)], fill=(20, 18, 16, int(225 * (1 - x / 620) ** 1.1)))
og = Image.alpha_composite(og.convert("RGBA"), shade)
b = rgba.resize((380, round(rgba.height * 380 / rgba.width)), Image.LANCZOS)
og.alpha_composite(b, (60, (630 - b.height) // 2))
og.convert("RGB").save(ROOT / "assets/og.jpg", quality=82, optimize=True)
print("done")
