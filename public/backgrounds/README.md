# Backstage Background Images

This directory is for storing background images that can be used in the 3D backstage scene.

## Usage

To add a custom background image to the backstage:

1. Place your image file in this directory (e.g., `public/backgrounds/fashion-backdrop.jpg`)
2. Pass the image URL to the `Backstage3D` component:

```tsx
<Backstage3D
  backgroundImageUrl="/backgrounds/fashion-backdrop.jpg"
  garmentId={garmentId}
  garmentPositions={[[0, 0.45, -8]]}
/>
```

## Image Requirements

- **Format**: JPG, PNG, or WebP
- **Recommended Size**: 1920x1080 or 2048x1024 (16:9 or 2:1 aspect ratio)
- **File Size**: Keep under 2MB for web performance
- **Style**: Dark, fashion/editorial aesthetic works best

## Default Behavior

If no `backgroundImageUrl` is provided, the backstage will use a procedurally generated gradient backdrop with subtle decorative patterns.

## Examples

- Fashion runway backdrop
- Textile/fabric patterns
- Vintage fashion photography
- Abstract fashion-inspired designs
- Museum/gallery style backgrounds

