#!/usr/bin/env bash
# Renders the extension icons and Chrome Web Store images with headless Google Chrome.
#   icons/icon{16,32,48,128}.png          <- store/src/icon.svg
#   store/assets/screenshot-{1,2,3}.png   (1280x800)
#   store/assets/promo-small.png          (440x280)
#   store/assets/promo-marquee.png        (1400x560)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/store/src"
OUT="$ROOT/store/assets"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT" "$ROOT/icons"

shot() { # <file-or-url> <width> <height> <output> [extra flags...]
  local input="$1" w="$2" h="$3" out="$4"
  shift 4
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --virtual-time-budget=4000 \
    --user-data-dir="$TMP/profile" \
    --window-size="$w,$h" --screenshot="$out" "$@" "$input" >/dev/null 2>&1
  echo "  $(basename "$out") (${w}x${h})"
}

echo "Icons:"
for size in 16 32 48 128; do
  page="$TMP/icon$size.html"
  cat > "$page" <<EOF
<html><body style="margin:0;background:transparent">
<img src="file://$SRC/icon.svg" width="$size" height="$size" style="display:block">
</body></html>
EOF
  shot "$page" "$size" "$size" "$ROOT/icons/icon$size.png" --default-background-color=00000000
done

echo "Store images:"
for n in 1 2 3; do
  shot "file://$SRC/screenshot-$n.html" 1280 800 "$OUT/screenshot-$n.png"
done
shot "file://$SRC/promo-small.html" 440 280 "$OUT/promo-small.png"
shot "file://$SRC/promo-marquee.html" 1400 560 "$OUT/promo-marquee.png"
cp "$ROOT/icons/icon128.png" "$OUT/store-icon-128.png"
cp "$ROOT/icons/icon128.png" "$ROOT/docs/icon128.png"
mkdir -p "$ROOT/docs/images"
cp "$OUT"/screenshot-{1,2,3}.png "$OUT/promo-marquee.png" "$ROOT/docs/images/"

echo "Done."
