#!/usr/bin/env bash
#
# Build and serve the example using Auspice as a imperative rendering function
# in a plain static HTML page
#
#   1. builds the self-contained ESM embed bundle
#   2. copies the built JS into this directory
#   3. fetches the Ebola dataset JSON if it isn't already present
#   4. serves this directory with `npx serve`
#
# Run from anywhere, e.g.  ./examples/embed/run.sh
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # examples/embed
ROOT="$(cd "$HERE/../.." && pwd)"                       # repo root

echo "[1/4] Building embed bundle (un-minified, for readable debugging)..."
( cd "$ROOT" && EMBED_MINIFY=false npm run build:embed )

echo "[2/4] Copying auspice.js into $HERE ..."
cp "$ROOT/embed-dist/auspice.js" "$HERE/auspice.js"

echo "[3/4] Ensuring ebola.json is present..."
if [ ! -f "$HERE/ebola.json" ]; then
  curl -H "Accept: application/json" --compressed \
    'https://next.nextstrain.org/ebola/ebov-2013@2026-10-27' \
    -o "$HERE/ebola.json"
else
  echo "      ebola.json already present — skipping fetch."
fi

echo "[4/4] Serving $HERE ..."
npx serve "$HERE"
