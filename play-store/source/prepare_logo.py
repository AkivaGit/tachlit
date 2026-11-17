"""Cut the Tachlit logo out of its white background (white -> transparent)
and save a full version (wordmark + tagline) and a wordmark-only version."""
import sys
import numpy as np
from PIL import Image

src, out_dir = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)

# "Colour to alpha" against white: the most-coloured channel decides opacity,
# then the colour is un-blended so edges stay smooth on any background.
alpha = (255 - rgb.min(axis=2)) / 255.0
alpha[alpha < 0.06] = 0                      # drop near-white JPEG noise
safe = np.where(alpha > 0, alpha, 1)[..., None]
color = 255 - (255 - rgb) / safe
rgba = np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8)

ink = alpha > 0.25
rows = np.where(ink.any(axis=1))[0]
cols = np.where(ink.any(axis=0))[0]
top, bottom, left, right = rows[0], rows[-1], cols[0], cols[-1]
Image.fromarray(rgba).crop((left, top, right + 1, bottom + 1)).save(f"{out_dir}/logo_full.png")

# Wordmark only: stop at the first empty row band above the tagline.
row_has_ink = ink[top:bottom + 1].any(axis=1)
gap = None
for y in range(len(row_has_ink) - 1, 0, -1):          # walk up from the bottom
    if not row_has_ink[y] and row_has_ink[y - 1] and y > len(row_has_ink) * 0.6:
        gap = y
        break
word_bottom = top + (gap if gap else len(row_has_ink))
wm = ink[top:word_bottom]
wcols = np.where(wm.any(axis=0))[0]
Image.fromarray(rgba).crop((wcols[0], top, wcols[-1] + 1, word_bottom)).save(f"{out_dir}/logo_wordmark.png")
print("full", (right - left + 1, bottom - top + 1), "wordmark", (wcols[-1] - wcols[0] + 1, word_bottom - top))
