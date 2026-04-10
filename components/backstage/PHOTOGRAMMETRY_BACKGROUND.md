# Using 3D Photogrammetry Room as Backstage Background

## Quick Start

To use a 3D photogrammetry scan of a room as the backstage background:

```tsx
<Backstage3D
  backgroundModelUrl="/models/rooms/your-room-scan.glb"
  garmentId={garmentId}
  garmentPositions={[[0, 0.45, -8]]}
/>
```

## How It Works

1. **Loads your 3D room model** (GLTF/GLB format)
2. **Replaces the procedural room** with your photogrammetry scan
3. **Positions garments** on pedestals within the 3D room
4. **Maintains all features** (lighting, interactions, controls)

## Model Requirements

- **Format**: GLTF 2.0 or GLB (GLB recommended)
- **Scale**: Roughly 10-20 units in size
- **Origin**: Center at (0, 0, 0) or adjust positioning in code
- **Textures**: Embedded in GLB or properly referenced

## Positioning

Default positioning:
- **Position**: `[0, 0, -8]` (center, ground level, 8 units back)
- **Scale**: `1` (1:1 scale)
- **Rotation**: None (faces forward)

To adjust, edit the `PhotogrammetryRoom` component in `Backstage3D.tsx`:

```tsx
const roomScale = 1; // Change to 0.5, 2, etc.
const roomPosition: [number, number, number] = [0, 0, -8]; // Adjust X, Y, Z
```

## Example Use Cases

- Museum gallery photogrammetry
- Fashion studio/atelier scan
- Actual backstage area
- Archive or storage room
- Exhibition space

## Tips

- **Optimize**: Keep polygon count reasonable (< 500k triangles)
- **Compress**: Use compressed textures (KTX2, Basis)
- **Test**: Adjust scale/position to fit your garments
- **Lighting**: Your room's baked lighting combines with dynamic lights

