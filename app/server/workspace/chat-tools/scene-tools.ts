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
  scale: z
    .tuple([
      z.number().min(0.01).max(20),
      z.number().min(0.01).max(20),
      z.number().min(0.01).max(20),
    ])
    .optional()
    .default([1, 1, 1]),
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
  from: z
    .tuple([
      z.number().min(-50).max(50),
      z.number().min(-50).max(50),
      z.number().min(-50).max(50),
    ])
    .optional()
    .default([0, 0, 0]),
  to: z.tuple([
    z.number().min(-50).max(50),
    z.number().min(-50).max(50),
    z.number().min(-50).max(50),
  ]),
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
  presetId: z
    .enum([
      'pulley',
      'spring-body',
      'cart',
      'ramp',
      'pendulum',
      'weight-block',
      'car',
      'truck',
      'plane',
      'train',
      'ship',
    ])
    .describe(
      'Preset ID. Use "truck" for trucks, "car" for cars, "ramp" for inclined planes, etc.'
    ),
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
  fontSize: z.number().min(0.01).max(2).optional(),
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
    description: `Add one element to the scene. See system prompt "Element Rendering Reference" for all types, params, and rendering details.

Quick examples:
  Truck on a hill:  { type: "preset", presetId: "truck", position: [2, 1, 0] }
  Inclined ramp:    { type: "preset", presetId: "ramp", position: [1.5, 0.75, 0], params: { length: 3, height: 1.5 } }
  Ground plane:     { type: "mesh", geometry: "plane", geometryArgs: [20, 20], rotation: [-1.5708, 0, 0], material: { color: "#555555" } }
  Gravity vector:   { type: "vector", from: [2, 2, 0], to: [2, 0, 0], color: "#8B0000", label: "mg", dashed: false }
  Angle label:      { type: "annotation", annotationKind: "label", text: "θ = 30°", position: [1, 0.5, 0] }

ROTATION in RADIANS: 30°=0.5236, 45°=0.7854, 60°=1.0472, 90°=1.5708`,
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

  addElements: tool({
    description: `Add multiple elements in one call. PREFERRED — build the complete scene with one addElements call containing all meshes, presets, vectors, annotations, etc.

Example — truck on a 30° hill with forces:
[
  { type: "preset", presetId: "ramp", position: [1.3, 0.75, 0], params: { length: 3, height: 1.5, depth: 2 } },
  { type: "preset", presetId: "truck", position: [1.6, 1.2, 0], rotation: [0, 0, -0.5236], scale: [0.4, 0.4, 0.4] },
  { type: "mesh", geometry: "plane", geometryArgs: [20, 20], rotation: [-1.5708, 0, 0], material: { color: "#555555" } },
  { type: "vector", from: [1.6, 1.2, 0], to: [1.6, -0.8, 0], color: "#8B0000", label: "W = mg" },
  { type: "vector", from: [1.6, 1.2, 0], to: [0.6, 2.9, 0], color: "#228B22", label: "N", dashed: true },
  { type: "annotation", annotationKind: "label", text: "θ = 30°", position: [0.5, 0.3, 0], color: "#ffcc00" }
]`,
    inputSchema: z.object({
      elements: z
        .array(ElementSchema)
        .min(1)
        .max(50)
        .describe('Array of elements to add to the scene'),
    }),
    execute: async ({ elements }) => {
      return {
        action: 'addElements' as const,
        elements,
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
