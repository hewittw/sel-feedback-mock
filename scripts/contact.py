# Contact sheet: one row per screen (s0 home … s5 done), one column per size. Usage: python3 scripts/contact.py <prefix> <out.jpg> size1 size2 …
import sys
from PIL import Image, ImageDraw
prefix, out, sizes = sys.argv[1], sys.argv[2], sys.argv[3:]
H = 520
rows = []
for s in range(6):
    tiles = []
    for z in sizes:
        im = Image.open(f"{prefix}{s}-{z}.jpeg")
        im = im.crop((0, 0, im.width, min(im.height, int(im.width * 1.6))))
        tiles.append(im.resize((max(1, int(im.width * H / im.height)), H)))
    rows.append(tiles)
W = max(sum(t.width for t in r) + 12 * len(r) for r in rows)
sheet = Image.new("RGB", (W, (H + 12) * 6), "#888")
y = 0
for r in rows:
    x = 0
    for t in r:
        sheet.paste(t, (x, y)); x += t.width + 12
    y += H + 12
sheet.save(out, quality=70)
