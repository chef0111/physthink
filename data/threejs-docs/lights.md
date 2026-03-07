# Three.js Lights

## AmbientLight

Uniform light that illuminates all objects equally. No shadows.
Properties: `color`, `intensity`. Default intensity: 0.5.
Use for: base illumination so objects aren't completely dark. Every scene should have one.

## DirectionalLight

Parallel light rays from a fixed direction (like sunlight). Can cast shadows.
Properties: `color`, `intensity`, `position` (determines light direction).
Default intensity: 1. Position like `[5, 10, 5]` gives natural top-right lighting.
Use for: main light source, sun simulation, dramatic shadows.

## PointLight

Emits light in all directions from a single point (like a light bulb).
Properties: `color`, `intensity`, `position`, `distance` (falloff range), `decay`.
Use for: lamps, glowing objects, explosions, local illumination.

## SpotLight

Emits light in a cone from a point toward a target.
Properties: `color`, `intensity`, `position`, `angle` (cone angle), `penumbra`, `distance`.
Use for: flashlights, spotlights, focused lighting on specific objects.

## Recommended Scene Lighting Setup

1. One `AmbientLight` with intensity 0.4-0.6 (base illumination)
2. One `DirectionalLight` with intensity 0.8-1.0 from `[5, 10, 7]` (main light)
3. Optionally a second dimmer `DirectionalLight` from opposite side for fill
   The default scene already includes basic lighting, so additional lights are only needed for emphasis.
