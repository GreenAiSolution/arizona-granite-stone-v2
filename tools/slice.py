"""Slice the tall screenshots in shots/ into screen-sized pieces."""
from pathlib import Path
from PIL import Image
D = Path(__file__).resolve().parent.parent / "shots"
for p in sorted(D.glob("*-full.png")):
    im = Image.open(p); step = 1200 if im.width > 1000 else 1600
    for n, y in enumerate(range(0, im.height, step), 1):
        im.crop((0, y, im.width, min(im.height, y + step))).save(D / p.name.replace("-full.png", f"-{n:02d}.png"), optimize=True)
