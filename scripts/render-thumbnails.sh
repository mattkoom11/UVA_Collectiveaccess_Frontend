#!/usr/bin/env bash
# Renders a front-on collection-card thumbnail for every garment in
# data/garments.json that has a web_preview GLB, and points the garment's
# thumbnailUrl at it (public/thumbnails/<id>.webp, 600x800, transparent).
#
#   scripts/render-thumbnails.sh                  # every garment with a model
#   scripts/render-thumbnails.sh dr-2026-118 ...  # just these ids
#
# Re-run for a garment after its model3d_rotationY changes (e.g. after
# /admin/orientation), since the facing is baked into the image.
#
# Needs Blender and the garment-capture-pipeline repo (render_thumbnail.py),
# found at $GARMENT_PIPELINE or ../garment-capture-pipeline. The GLBs here
# are meshopt-compressed, which Fedora's Blender can't decode, so each is
# dequantized to a temporary copy first.
set -euo pipefail

cd "$(dirname "$0")/.."
PIPELINE="${GARMENT_PIPELINE:-../garment-capture-pipeline}"
RENDER="$PIPELINE/render_thumbnail.py"
GLTF_TRANSFORM="@gltf-transform/cli@4.5.1"
[ -f "$RENDER" ] || { echo "render_thumbnail.py not found at $RENDER" >&2; exit 1; }
command -v blender >/dev/null || { echo "blender not on PATH" >&2; exit 1; }
command -v magick >/dev/null || { echo "ImageMagick (magick) not on PATH" >&2; exit 1; }

mkdir -p public/thumbnails
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# id <TAB> preview model path <TAB> rotationY, for the requested ids (or all).
node -e '
  const d = require("./data/garments.json");
  const want = new Set(process.argv.slice(1));
  for (const g of d) {
    if (want.size && !want.has(g.id)) continue;
    const m = (g.models || []).find((m) => m.role === "web_preview")?.url ?? g.model3d_url;
    if (!m || !m.startsWith("/models/")) continue;
    console.log([g.id, "public" + m, g.model3d_rotationY ?? 0].join("\t"));
  }
' "$@" > "$tmp/list.tsv"

done_ids=()
while IFS=$'\t' read -r id glb rot; do
  plain="$tmp/$id.glb"
  png="$tmp/$id.png"
  npx --yes "$GLTF_TRANSFORM" dequantize "$glb" "$plain" >/dev/null 2>&1
  blender --background --python "$RENDER" -- --glb "$plain" --rotation-y "$rot" --out "$png" >/dev/null 2>&1 \
    || { echo "FAIL  $id (blender)" >&2; continue; }
  [ -f "$png" ] || { echo "FAIL  $id (no output)" >&2; continue; }
  magick "$png" -quality 85 -define webp:alpha-quality=90 "public/thumbnails/$id.webp"
  echo "done  $id  rotationY=$rot  $(($(stat -c %s "public/thumbnails/$id.webp") / 1024)) KB"
  done_ids+=("$id")
done < "$tmp/list.tsv"

# Point each rendered garment's thumbnailUrl at its file.
[ "${#done_ids[@]}" -gt 0 ] && node -e '
  const fs = require("fs");
  const p = "data/garments.json";
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  const ids = new Set(process.argv.slice(1));
  for (const g of d) if (ids.has(g.id)) g.thumbnailUrl = `/thumbnails/${g.id}.webp`;
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
' "${done_ids[@]}"
echo "rendered ${#done_ids[@]} thumbnail(s)"
