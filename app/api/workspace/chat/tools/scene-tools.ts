import { tool } from 'ai';
import { z } from 'zod';

const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

const MaterialSchema = z
  .object({
    color: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    wireframe: z.boolean().optional(),
    metalness: z.number().min(0).max(1).optional(),
    roughness: z.number().min(0).max(1).optional(),
  })
  .optional();

const BaseElementFields = {
  position: Vec3Schema.optional().default([0, 0, 0]),
  rotation: Vec3Schema.optional().default([0, 0, 0]),
  scale: Vec3Schema.optional().default([1, 1, 1]),
  label: z.string().optional(),
  visible: z.boolean().optional().default(true),
};

const MeshSchema = z.object({
  type: z.literal('mesh'),
  geometry: z.enum([
    'box',
    'sphere',
    'cylinder',
    'cone',
    'capsule',
    'torus',
    'plane',
  ]),
  material: MaterialSchema,
  geometryArgs: z.array(z.number()).optional(),
  ...BaseElementFields,
});

const VectorSchema = z.object({
  type: z.literal('vector'),
  from: Vec3Schema.optional().default([0, 0, 0]),
  to: Vec3Schema,
  color: z.string().optional(),
  headSize: z.number().optional(),
  dashed: z.boolean().optional(),
  ...BaseElementFields,
});

const ConnectorSchema = z.object({
  type: z.literal('connector'),
  connector: z.enum(['spring', 'rope', 'rod', 'wire']),
  start: Vec3Schema,
  end: Vec3Schema,
  startId: z.string().optional(),
  endId: z.string().optional(),
  coils: z.number().optional(),
  segments: z.number().optional(),
  thickness: z.number().optional(),
  color: z.string().optional(),
  ...BaseElementFields,
});

const CurveSchema = z.object({
  type: z.literal('curve'),
  points: z.array(Vec3Schema).min(2),
  closed: z.boolean().optional(),
  color: z.string().optional(),
  lineWidth: z.number().optional(),
  dashed: z.boolean().optional(),
  ...BaseElementFields,
});

const PresetSchema = z.object({
  type: z.literal('preset'),
  presetId: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
  ...BaseElementFields,
});

const AnnotationSchema = z.object({
  type: z.literal('annotation'),
  annotationKind: z.enum([
    'label',
    'angle-marker',
    'dimension',
    'coordinate-axes',
    'region',
  ]),
  text: z.string().optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  vectors: z.tuple([Vec3Schema, Vec3Schema]).optional(),
  start: Vec3Schema.optional(),
  end: Vec3Schema.optional(),
  ...BaseElementFields,
});

const LightSchema = z.object({
  type: z.literal('light'),
  lightType: z.enum(['ambient', 'directional', 'point', 'spot']),
  color: z.string().optional(),
  intensity: z.number().optional(),
  ...BaseElementFields,
});

const ElementSchema = z.discriminatedUnion('type', [
  MeshSchema,
  VectorSchema,
  ConnectorSchema,
  CurveSchema,
  PresetSchema,
  AnnotationSchema,
  LightSchema,
]);

export const sceneTools = {
  addElement: tool({
    description: `Add a new element to the physics illustration.

GEOMETRY TYPES:
- mesh: 3D object shapes — geometry options: box, sphere, cylinder, cone, capsule, torus, plane
- vector: arrow for forces/velocities/accelerations — specify from & to points
- connector: spring, rope, rod, wire between two 3D points
- curve: trajectory path through an array of 3D points
- preset: pulley, pendulum, cart, ramp, spring, weight-block (with params)
- annotation: label, angle-marker, dimension, coordinate-axes, region
- light: ambient, directional, point, spot

GEOMETRY ARGS (geometryArgs array, maps to Three.js constructor arguments):
- box:      [width, height, depth]                    default [1, 1, 1]
- sphere:   [radius, widthSegments, heightSegments]   default [0.5, 32, 32]
- cylinder: [radiusTop, radiusBottom, height, segs]   default [0.5, 0.5, 1, 32]
- cone:     [radius, height, radialSegments]           default [0.5, 1, 32]
- plane:    [width, height]                           default [2, 2]
- capsule:  [radius, length, capSegs, radialSegs]     default [0.5, 1, 4, 8]
- torus:    [radius, tube, radialSegs, tubularSegs]   default [0.5, 0.2, 16, 100]

ROTATION (Euler angles in RADIANS — NOT degrees):
- 30° = 0.5236 rad,  45° = 0.7854 rad,  60° = 1.0472 rad,  90° = 1.5708 rad
- Inclined plane at angle θ: rotation = [0, 0, -θ_radians]  (negative Z tilts right edge up)

INCLINED PLANE PLACEMENT:
- Ramp of length L at angle θ centred so base is at y=0: position = [L·cos(θ)/2, L·sin(θ)/2, 0]
- 30° ramp L=6: position ≈ [2.598, 1.5, 0], rotation = [0, 0, -0.5236], geometryArgs = [6, 0.1]
- Object at distance d along slope (box half-height hH): x = d·cos(θ) − hH·sin(θ), y = d·sin(θ) + hH·cos(θ)

FORCE VECTORS on incline at angle θ, object centre (ox, oy):
- Gravity (down):         from=[ox,oy,0], to=[ox, oy−magnitude, 0]
- Normal (⊥ to incline):  direction [−sin(θ), cos(θ), 0]
- Friction (up slope):    direction [cos(θ), sin(θ), 0]
- mg·sinθ component (down slope, dashed): direction [−cos(θ), −sin(θ), 0]

Position force vectors at the centre of mass of the object they act on.`,
    inputSchema: z.object({
      element: ElementSchema.describe('The element to add to the scene'),
    }),
    execute: async ({ element }) => {
      return {
        action: 'addElement' as const,
        element,
      };
    },
  }),

  editElement: tool({
    description:
      'Edit an existing element in the illustration. Use this to reposition objects, adjust force vector directions/magnitudes, change colors, update labels, or modify any property. Provide the element ID and the properties to update.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the element to edit'),
      updates: z
        .record(z.string(), z.unknown())
        .describe('Properties to update on the element'),
    }),
    execute: async ({ id, updates }) => {
      return {
        action: 'editElement' as const,
        id,
        updates,
      };
    },
  }),

  removeElement: tool({
    description:
      'Remove an element from the illustration by its ID. Use when the student asks to simplify the scene, remove a force, or clear specific objects.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the element to remove'),
    }),
    execute: async ({ id }) => {
      return {
        action: 'removeElement' as const,
        id,
      };
    },
  }),

  setSceneSettings: tool({
    description:
      'Update scene settings. Show grid for spatial reference, show axes when discussing coordinate decomposition or component analysis, or change background color for contrast.',
    inputSchema: z.object({
      gridVisible: z.boolean().optional(),
      axesVisible: z.boolean().optional(),
      backgroundColor: z.string().optional(),
    }),
    execute: async (settings) => {
      return {
        action: 'setSceneSettings' as const,
        settings,
      };
    },
  }),

  setStatus: tool({
    description:
      'Set a user-visible status label during multi-step operations. Use this to inform the student what you are doing, e.g. "Analyzing the problem...", "Building the inclined plane...", "Adding force vectors...", "Labeling angles and variables...".',
    inputSchema: z.object({
      status: z.string().describe('The status label to display to the user'),
    }),
    execute: async ({ status }) => {
      return {
        action: 'setStatus' as const,
        status,
      };
    },
  }),
};
