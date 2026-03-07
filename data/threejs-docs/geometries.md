# Three.js Geometries

## BoxGeometry

Creates a rectangular cuboid. Args: `[width, height, depth]`. Default: `[1, 1, 1]`.
Use for: blocks, walls, floors, platforms, buildings, crates, books.
Example geometryArgs: `[2, 1, 0.5]` creates a flat wide box.

## SphereGeometry

Creates a sphere. Args: `[radius, widthSegments, heightSegments]`. Default: `[1, 32, 16]`.
Use for: balls, planets, atoms, point charges, bob of a pendulum.
Example geometryArgs: `[0.5, 32, 16]` creates a small sphere.

## CylinderGeometry

Creates a cylinder. Args: `[radiusTop, radiusBottom, height, radialSegments]`. Default: `[1, 1, 1, 32]`.
Use for: pillars, rods, axles, pistons, wheels (flat cylinder), pulleys.
Set `radiusTop=0` for a cone shape. Example: `[0.5, 0.5, 3, 32]` for a tall rod.

## ConeGeometry

Creates a cone. Args: `[radius, height, radialSegments]`. Default: `[1, 1, 32]`.
Use for: arrowheads, funnels, pointed objects, pyramids (with low segments).

## CapsuleGeometry

Creates a capsule (cylinder with hemispherical caps). Args: `[radius, length, capSegments, radialSegments]`.
Use for: pills, rounded bars, character shapes, smooth connectors.

## TorusGeometry

Creates a donut/ring shape. Args: `[radius, tubeRadius, radialSegments, tubularSegments]`. Default: `[1, 0.4, 16, 100]`.
Use for: rings, wheels, orbits (thin torus), coils (combined with rotation).

## PlaneGeometry

Creates a flat rectangular surface. Args: `[width, height]`. Default: `[1, 1]`.
Use for: floors, walls, inclined surfaces, screens, mirrors, whiteboard backgrounds.
Note: Planes are one-sided by default. Set `material.side = DoubleSide` if needed.
For an inclined surface, rotate the plane around the Z-axis by the incline angle.
