# 3D Models Directory

This directory is for storing GLTF/GLB 3D model files for garments.

## Quick Demo Setup

### Option 1: Use Free GLTF Models

1. **Download a free model:**
   - Visit [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
   - Or [Sketchfab](https://sketchfab.com/) - filter by "Downloadable" and "CC" license
   - Or [Poly Haven](https://polyhaven.com/models) - free CC0 models

2. **Recommended for testing:**
   - Download a simple object like a dress, jacket, or clothing item
   - Place the `.glb` or `.gltf` file in this directory
   - Example: `public/models/demo-dress.glb`

3. **Add to a garment:**
   - In `data/garments.json`, add:
     ```json
     "model3d_url": "/models/demo-dress.glb"
     ```

### Option 2: Use Online GLTF Models (for testing)

You can also reference models from CDNs for quick testing:

```json
"model3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb"
```

## File Formats Supported

- `.glb` (binary GLTF) - **Recommended** - single file, faster loading
- `.gltf` (JSON GLTF) - requires separate `.bin` and texture files

## Model Requirements

- **Format:** GLTF 2.0 or GLB
- **Size:** Keep under 10MB for web performance
- **Textures:** Embedded in GLB or referenced in GLTF
- **Scale:** Models should be roughly 1-2 units tall (will be auto-scaled)

## Optimizing Scans (do this for every new model)

Run `npm run optimize-models` after adding a GLB here (or
`scripts/optimize-models.sh public/models/<file>.glb` for one file). It
meshopt-compresses the geometry in place, roughly halving each scan, and
leaves the texture byte-for-byte untouched so no scan detail is lost.
Already-compressed files are skipped, so it is safe to re-run.

Compressed files need a meshopt decoder: the site viewers get it from drei's
`useGLTF`, and the AR viewer (`<model-viewer>`) from the self-hosted
`/vendor/meshopt_decoder-0.22.0.js` (see `lib/loadModelViewer.ts`). Avoid Draco:
its decoder is fetched from Google's CDN, which the site's CSP blocks.

## Testing Your Model

1. Add the `model3d_url` to a garment in `garments.json`
2. Navigate to that garment's detail page
3. The 3D viewer will automatically load and display the model
4. Use orbit controls to rotate and zoom

## Current Demo

The application uses an enhanced procedural `DemoGarment` component when no `model3d_url` is provided. This provides a better visual placeholder than simple boxes.

