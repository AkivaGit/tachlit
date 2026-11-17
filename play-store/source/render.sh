#!/bin/sh
# Re-render the Google Play graphics from icon.html / feature.html.
# Needs Google Chrome and Python with Pillow + numpy (pip install Pillow numpy).
set -e
cd "$(dirname "$0")"
PY=${PY:-python3}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
$PY prepare_logo.py ../../app/src/main/res/drawable/tachlit_logo1.png .
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --no-first-run --no-default-browser-check --user-data-dir=/tmp/chrome-shot \
  --window-size="$2" --screenshot="$3" "file://$PWD/$1" 2>/dev/null; }
shot icon.html 512,512 /tmp/raw_icon.png
shot feature.html 1024,500 /tmp/raw_feature.png
$PY -c '
from PIL import Image
Image.open("/tmp/raw_icon.png").convert("RGBA").save("../icon-512.png", optimize=True)
Image.open("/tmp/raw_feature.png").convert("RGB").save("../feature-graphic-1024x500.png", optimize=True)'
echo "Done: play-store/icon-512.png, play-store/feature-graphic-1024x500.png"
