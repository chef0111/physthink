# Three.js Materials

## MeshStandardMaterial (default)

PBR material with metalness/roughness workflow. Properties:

- `color`: Hex string (e.g. `"#ff0000"`, `"red"`)
- `opacity`: 0-1, set `transparent: true` if opacity < 1
- `metalness`: 0-1, how metallic the surface looks (0 = dielectric, 1 = full metal)
- `roughness`: 0-1, how rough the surface is (0 = mirror, 1 = fully diffuse)
- `wireframe`: boolean, render as wireframe mesh

## Common Color Conventions for Physics

- Forces/gravity: `"#8B0000"` (dark red) for weight/gravity, `"#FF0000"` (red) for net force
- Normal force: `"#228B22"` (forest green)
- Friction: `"#FF8C00"` (dark orange)
- Tension: `"#1E90FF"` (dodger blue)
- Applied force: `"#8B008B"` (dark magenta/purple)
- Velocity: `"#00CED1"` (dark turquoise/cyan)
- Acceleration: `"#FFD700"` (gold/yellow)
- Surfaces: `"#D3D3D3"` (light gray) or `"#A9A9A9"` (dark gray)
- Objects: Various distinct colors for identification
- Transparent/ghost: opacity 0.3-0.5 for hidden surfaces or reference planes

## Tips

- For glass/water: low opacity (0.3), low roughness (0.1), color `"#87CEEB"`
- For metal objects: metalness 0.8-1.0, roughness 0.2-0.4
- For rubber/matte: metalness 0, roughness 0.8-1.0
- For wireframe overlays: set wireframe=true, useful for showing internal structure
