# 3D Photogrammetry Room Models for Backstage

This guide explains how to use a 3D photogrammetry scan of a room as the background for the backstage scene.

## Overview

Instead of using a 2D image or procedural room, you can use a full 3D photogrammetry model of a room (like a museum gallery, fashion studio, or backstage area) as the environment.

## How It Works

When you provide a `backgroundModelUrl`, the component will:
1. Load the 3D room model (GLTF/GLB format)
2. Replace the procedural room geometry with your photogrammetry scan
3. Position garments on pedestals within the 3D room
4. Maintain all lighting and interaction features

## Usage

### Step 1: Prepare Your 3D Room Model

1. **Format**: GLTF 2.0 or GLB (GLB recommended - single file)
2. **Scale**: Model should be roughly 10-20 units in size
3. **Origin**: Center the room at (0, 0, 0) or we'll adjust positioning
4. **Textures**: Embed textures in GLB or reference them properly in GLTF

### Step 2: Place Model in Public Directory

```
public/
  └── models/
      └── rooms/
          └── backstage-room.glb
```

### Step 3: Use in Component

```tsx
<Backstage3D
  backgroundModelUrl="/models/rooms/backstage-room.glb"
  garmentId={garmentId}
  garmentPositions={[[0, 0.45, -8]]}
/>
```

## Positioning & Scaling

The room model will be:
- **Positioned** at `[0, 0, -8]` (center, ground level, 8 units back)
- **Scaled** to 1:1 by default
- **Rotated** to face forward (no rotation by default)

### Adjusting Position/Scale

If your room model needs adjustment, you can modify the `PhotogrammetryRoom` component in `Backstage3D.tsx`:

```tsx
const roomScale = 1; // Adjust scale (e.g., 0.5 for half size, 2 for double)
const roomPosition: [number, number, number] = [0, 0, -8]; // Adjust position
```

## Garment Positioning

Garments are positioned relative to the room:
- Default position: `[0, 0.45, -8]` (center, slightly above ground)
- Adjust `garmentPositions` to place garments where you want in the room
- Pedestals are still added automatically

## Lighting Considerations

The backstage lighting will work with your room model:
- Spotlights on garments
- Ambient fill light
- Room model receives shadows
- You may want to adjust lighting intensity based on your room's materials

## Example Use Cases

1. **Museum Gallery**: Photogrammetry scan of an actual museum gallery
2. **Fashion Studio**: 3D scan of a designer's studio or atelier
3. **Backstage Area**: Actual fashion show backstage area
4. **Archive Room**: Museum storage or archive room
5. **Exhibition Space**: Gallery or exhibition space

## Tips

- **Optimize your model**: Keep polygon count reasonable (< 500k triangles)
- **Compress textures**: Use compressed texture formats (KTX2, Basis)
- **Test positioning**: You may need to adjust scale/position to fit garments properly
- **Lighting**: Your room's baked lighting will combine with dynamic lights
- **Performance**: Large room models may impact performance - optimize as needed

## Troubleshooting

**Room appears too large/small:**
- Adjust `roomScale` in `PhotogrammetryRoom` component

**Room in wrong position:**
- Adjust `roomPosition` in `PhotogrammetryRoom` component
- Or adjust `garmentPositions` to match your room layout

**Room appears dark:**
- Increase ambient light intensity in `BackstageLighting`
- Or adjust your room model's materials/emissive properties

**Performance issues:**
- Reduce polygon count in your room model
- Use LOD (Level of Detail) versions
- Compress textures more aggressively

## Combining with 2D Background

Note: If you provide both `backgroundModelUrl` and `backgroundImageUrl`, the 3D model takes precedence and the 2D image is ignored.

