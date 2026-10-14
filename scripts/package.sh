#!/usr/bin/env bash
# Builds the zip to upload to the Chrome Web Store: dist/the-proxy-magician-<version>.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json | head -1)"
OUT="dist/the-proxy-magician-$VERSION.zip"

for f in icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png; do
  [ -f "$f" ] || { echo "Missing $f - run scripts/render-assets.sh first." >&2; exit 1; }
done

mkdir -p dist
rm -f "$OUT"
zip -q -r -X "$OUT" manifest.json src icons -x '*.DS_Store'

echo "Created $OUT"
unzip -l "$OUT"
