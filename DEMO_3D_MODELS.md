# Demo 3D Models Guide

This guide explains how to implement and test 3D models in the UVA Fashion Archive frontend.

## Current Implementation

### ✅ Enhanced Procedural Demo Garment

I've created an improved `DemoGarment` component that provides a better visual placeholder than simple boxes. It features:

- **Garment-like shape**: Bodice, skirt, sleeves, and neckline detail
- **Realistic materials**: Proper metalness and roughness values
- **Optional rotation**: Can rotate slowly for visual appeal
- **Hanger/stand**: Includes a pedestal base
- **Customizable**: Color, scale, and position props

**Where it's used:**
- `Garment3DViewer` - when no `model3d_url` is provided
- `Backstage3D` - as placeholder garments (with rotation)
- Automatically appears for all garments without 3D models

### ✅ Real GLTF Model Support

The application fully supports GLTF/GLB models. When a garment has a `model3d_url`, it will load and display the actual 3D model.

## Testing Options

### Option 1: Use the Enhanced Demo Garment (Current)

**Status:** ✅ Already implemented and active

The demo garment automatically appears for all garments. You can see it by:
1. Navigate to any garment detail page
2. The 3D viewer will show the enhanced procedural garment
3. Try the Backstage view to see rotating demo garments

**Customize the demo garment:**
Edit `components/garments/DemoGarment.tsx` to adjust:
- Colors
- Shape complexity
- Animation speed
- Scale

### Option 2: Test with a Real GLTF Model (Recommended for Testing)

**Status:** ✅ Ready to use - I've added a demo URL to the first garment

I've added a demo model URL to the first garment in `garments.json`:
```json
"model3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb"
```

**To test:**
1. Navigate to the first garment (UVA Letterman Jacket, 1964)
2. You'll see a 3D duck model (it's just for testing the GLTF loader)
3. This confirms the 3D model loading system works

**To use your own model:**
1. Download a GLB file (recommended format)
2. Place it in `public/models/your-model.glb`
3. Update `garments.json`:
   ```json
   "model3d_url": "/models/your-model.glb"
   ```

### Option 3: Download Free Garment Models

**Best sources for free 3D clothing models:**

1. **Sketchfab** (https://sketchfab.com/)
   - Search for "dress", "jacket", "vintage clothing"
   - Filter by: Downloadable + CC License
   - Download as GLB format

2. **Poly Haven** (https://polyhaven.com/models)
   - Free CC0 models
   - Various categories

3. **glTF Sample Models** (https://github.com/KhronosGroup/glTF-Sample-Models)
   - Test models for GLTF format
   - Good for testing but not garment-specific

4. **TurboSquid** (https://www.turbosquid.com/)
   - Filter by "Free" and "GLB" format
   - Some free clothing models available

## File Structure

```
uvafashion-frontend/
├── public/
│   └── models/              # Place GLB/GLTF files here
│       └── README.md        # Instructions
├── components/
│   └── garments/
│       ├── DemoGarment.tsx  # Enhanced procedural garment
│       ├── Garment3DViewer.tsx
│       └── ...
└── data/
    └── garments.json        # Add model3d_url here
```

## Model Requirements

- **Format:** GLTF 2.0 or GLB (GLB recommended - single file)
- **Size:** Keep under 10MB for web performance
- **Scale:** Models should be roughly 1-2 units tall
- **Textures:** Embedded in GLB or properly referenced in GLTF
- **Origin:** Center at (0,0,0) or we can adjust in code

## Quick Test Checklist

- [x] Enhanced demo garment appears in Garment3DViewer
- [x] Enhanced demo garment appears in Backstage3D (rotating)
- [x] Demo GLTF model loads (duck model on first garment)
- [ ] Add your own GLB model to test
- [ ] Verify lighting and materials look good
- [ ] Test on different devices/browsers

## Customization

### Adjust Demo Garment Appearance

Edit `components/garments/DemoGarment.tsx`:

```tsx
// Change color
<DemoGarment color="#8b5cf6" />  // Purple

// Change scale
<DemoGarment scale={1.5} />  // Larger

// Enable/disable rotation
<DemoGarment rotation={true} />
```

### Adjust 3D Viewer Settings

Edit `components/garments/Garment3DViewer.tsx`:

```tsx
// Camera position
<PerspectiveCamera makeDefault position={[0, 1, 5]} />

// Lighting
<ambientLight intensity={0.5} />
<spotLight intensity={1} />

// Environment preset
<Environment preset="studio" />  // Options: sunset, dawn, night, warehouse
```

## Troubleshooting

**Model doesn't load:**
- Check file path is correct
- Verify file format is GLB or GLTF 2.0
- Check browser console for errors
- Ensure file is in `public/models/` directory

**Model appears too large/small:**
- Adjust scale in the component
- Or normalize the model in Blender/3D software

**Model appears dark:**
- Adjust lighting in `Garment3DViewer.tsx`
- Try different `Environment` presets
- Check if model has embedded materials

**Performance issues:**
- Reduce model polygon count
- Compress textures
- Use GLB format (more efficient than GLTF)

## Next Steps

1. **For immediate testing:** The enhanced demo garment is already working
2. **For real models:** Add a GLB file to `public/models/` and reference it in `garments.json`
3. **For production:** Use photogrammetry models of actual UVA garments

The system is ready to accept real 3D models whenever you have them!

