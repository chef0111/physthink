import 'server-only';

/**
 * Comprehensive element and preset reference derived from the actual
 * renderer source code. Injected into the system prompt so the LLM
 * knows exactly what properties each element type accepts and how
 * presets are constructed.
 */
export const ELEMENT_REFERENCE = `
## Element Rendering Reference (from source code)

Every element has base fields: position:[x,y,z], rotation:[x,y,z] (radians), scale:[sx,sy,sz], label?:string, visible?:boolean.

### mesh
Renders a Three.js mesh with standard material.
geometry: "box"|"sphere"|"cylinder"|"cone"|"capsule"|"torus"|"plane"
geometryArgs: number[] — maps directly to Three.js geometry constructor:
  box: [width, height, depth] (default [1,1,1])
  sphere: [radius, widthSegs, heightSegs] (default [0.5, 32, 32])
  cylinder: [radiusTop, radiusBottom, height, radialSegs] (default [0.5, 0.5, 1, 32])
  cone: [radius, height, radialSegs] (default [0.5, 1, 32])
  capsule: [radius, length, capSegs, radialSegs] (default [0.3, 0.6, 8, 16])
  torus: [radius, tube, radialSegs, tubularSegs] (default [0.5, 0.15, 16, 48])
  plane: [width, height] (default [2, 2])
material?: { color?: string (default "#6c8ebf"), opacity?: number (default 1), wireframe?: boolean, metalness?: number (default 0.1), roughness?: number (default 0.6) }

### vector
Renders an arrow: Line shaft + Cone arrowhead, with optional label at midpoint.
from: [x,y,z] (default [0,0,0]) — start point
to: [x,y,z] — end point
color?: string (default "#f73939")
headSize?: number (default 0.08)
dashed?: boolean (default false) — dashed line
label?: string — rendered at midpoint, fontSize 0.2

### connector
Renders connections between two 3D points.
connector: "spring"|"rope"|"rod"|"wire"
  spring: coiled helix path (tapered at ends)
  rope: catenary (sagging) curve
  rod/wire: straight line
start: [x,y,z], end: [x,y,z]
coils?: number (default 8, for spring)
thickness?: number (default 2, line width)
color?: string (default "#aaaaaa")

### curve
Renders a smooth CatmullRom spline through control points.
points: [x,y,z][] (min 2)
closed?: boolean (default false)
color?: string (default "#66bb6a")
lineWidth?: number (default 2)
dashed?: boolean

### annotation
annotationKind: "label"|"angle-marker"|"dimension"|"coordinate-axes"|"region"

label: Renders text. text?: string, color?: string (default "#ffffff"), fontSize?: number (default 0.25, max 0.5)
angle-marker: Arc between two direction vectors. vectors: [[x,y,z],[x,y,z]] — two direction vectors from origin. text?: string (label at arc midpoint), color?: string (default "#ffcc00")
dimension: Line with endpoint dots and text. start: [x,y,z], end: [x,y,z], text?: string, color?: string (default "#cccccc")
coordinate-axes: Draws local XYZ axes (length 1 each, red/green/blue)
region: Semi-transparent plane (1x1, colored)

### light
lightType: "ambient"|"directional"|"point"|"spot"
color?: string (default "#ffffff"), intensity?: number (default 1)

### preset
Renders a detailed, pre-built 3D model. ALWAYS use presets for real-world objects instead of building from boxes.
presetId: one of the IDs below
params?: Record<string, unknown> — passed as props to the preset component

#### Preset: "truck"
3D truck with cab, windshield, cargo bed, cargo walls, 6 wheels (2 front + 4 rear dual axle).
params: {
  cabLength?: number (default 1),
  cargoLength?: number (default 2.2),
  bodyHeight?: number (default 0.4),
  bodyDepth?: number (default 1.1),
  cabHeight?: number (default 0.7),
  cargoHeight?: number (default 0.9),
  wheelRadius?: number (default 0.25),
  cabColor?: string (default "#2266aa"),
  cargoColor?: string (default "#999999"),
  wheelColor?: string (default "#222222"),
}
Total length ≈ cabLength + cargoLength. Center of model is at origin. Wheels sit at bottom.

#### Preset: "car"
4-wheel car with body, glass cabin, hood slope.
params: {
  bodyLength?: number (default 2.4),
  bodyHeight?: number (default 0.35),
  bodyDepth?: number (default 1),
  cabinHeight?: number (default 0.4),
  wheelRadius?: number (default 0.2),
  bodyColor?: string (default "#cc3333"),
  cabinColor?: string (default "#88ccee"),
  wheelColor?: string (default "#222222"),
}

#### Preset: "cart"
Simple lab cart with flat body and wheels.
params: {
  bodyLength?: number (default 2),
  bodyHeight?: number (default 0.4),
  bodyDepth?: number (default 0.8),
  wheelRadius?: number (default 0.2),
  wheelCount?: number (default 4),
  bodyColor?: string (default "#4488bb"),
  wheelColor?: string (default "#333333"),
}

#### Preset: "ramp"
Triangle wedge (extruded right triangle). NOT rotated — the triangle shape IS the slope.
params: {
  length?: number (default 3) — horizontal base,
  height?: number (default 1.5) — vertical rise,
  depth?: number (default 1) — extrusion depth (z-axis),
  color?: string (default "#8b7355"),
}
The ramp geometry is centered. Incline angle = atan(height/length).
DO NOT apply rotation to create the slope — the geometry itself is already a triangle.

#### Preset: "pulley"
Pulley wheel with groove and axle.
params: {
  radius?: number (default 0.5),
  thickness?: number (default 0.15),
  grooveDepth?: number (default 0.05),
  color?: string (default "#888888"),
}

#### Preset: "pendulum"
Rod hanging from pivot mount with spherical bob at bottom.
params: {
  rodLength?: number (default 2),
  bobRadius?: number (default 0.2),
  rodColor?: string (default "#aaaaaa"),
  bobColor?: string (default "#cc4444"),
}
Pivot at origin, bob at [0, -rodLength, 0]. Rotate the element to set swing angle.

#### Preset: "spring-body"
Coiled spring rendered as a helix (tapered at ends).
params: {
  length?: number (default 2),
  radius?: number (default 0.15),
  coils?: number (default 8),
  color?: string (default "#cc8844"),
}
Vertical by default, centered at origin.

#### Preset: "weight-block"
Cube with mass label on front face.
params: {
  size?: number (default 0.6),
  mass?: string (default "m") — label text,
  color?: string (default "#bb6633"),
}

#### Preset: "plane" (airplane)
Airplane with cylindrical fuselage, nose cone, wings, tail stabilizer, vertical fin.
params: {
  fuselageLength?: number (default 3.5),
  fuselageRadius?: number (default 0.25),
  wingSpan?: number (default 3.2),
  wingChord?: number (default 0.6),
  tailHeight?: number (default 0.6),
  bodyColor?: string (default "#dddddd"),
  wingColor?: string (default "#cccccc"),
}

#### Preset: "train"
Steam locomotive with boiler cylinder, chassis, rear cab, chimney, cowcatcher.
params: {
  bodyLength?: number (default 3),
  bodyHeight?: number (default 0.6),
  bodyDepth?: number (default 1),
  cabHeight?: number (default 0.6),
  wheelRadius?: number (default 0.25),
  wheelCount?: number (default 6),
  bodyColor?: string (default "#224433"),
  cabColor?: string (default "#335544"),
  wheelColor?: string (default "#333333"),
  chimneyRadius?: number (default 0.12),
}

#### Preset: "ship"
Ship with tapered hull (extruded trapezoid), deck, rear cabin with windows, smokestack, bow.
params: {
  hullLength?: number (default 3.5),
  hullHeight?: number (default 0.5),
  hullDepth?: number (default 1),
  cabinHeight?: number (default 0.5),
  hullColor?: string (default "#445566"),
  cabinColor?: string (default "#dddddd"),
  deckColor?: string (default "#886644"),
}
`;
