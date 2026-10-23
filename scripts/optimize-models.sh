#!/usr/bin/env bash
# Compresses scan GLBs in place for the web: meshopt-compressed, quantized
# geometry (~2.6 MB of raw floats down to well under 1 MB per scan). Textures
# are left byte-for-byte as exported: a lossy re-encode or a downsize
# visibly softens thread and stitch detail when zoomed in on a record.
#
#   scripts/optimize-models.sh                      # every GLB in public/models
#   scripts/optimize-models.sh public/models/x.glb  # just these
#
# Safe to re-run: files already meshopt-compressed are skipped. Originals
# are only in git history afterwards, so keep the pipeline's own exports.
set -euo pipefail

GLTF_TRANSFORM="@gltf-transform/cli@4.5.1"
# Larger than any scan texture, so optimize's default 2048 px resize never runs.
NO_RESIZE=16384

cd "$(dirname "$0")/.."
if [ "$#" -eq 0 ]; then set -- public/models/*.glb; fi

for file in "$@"; do
  # The extension name sits in the GLB's JSON chunk at the start of the file.
  if head -c 4096 "$file" | grep -aq EXT_meshopt_compression; then
    echo "skip  $file (already compressed)"
    continue
  fi
  tmp="$(mktemp --suffix=.glb)"
  npx --yes "$GLTF_TRANSFORM" optimize "$file" "$tmp" \
    --compress meshopt \
    --texture-compress false \
    --texture-size "$NO_RESIZE" \
    --simplify false
  before=$(stat -c %s "$file")
  chmod 644 "$tmp"
  mv "$tmp" "$file"
  echo "done  $file  $((before / 1024)) KB -> $(($(stat -c %s "$file") / 1024)) KB"
done
