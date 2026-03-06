import { PRESET_REGISTRY } from '@/lib/presets/preset-registry';
import {
  MousePointer2,
  Box,
  Circle,
  Cylinder,
  Triangle,
  Maximize2,
  ArrowRight,
  Link2,
  Minus,
  Spline,
  Type,
  Axis3D,
  Package,
} from 'lucide-react';

const presetButtons: ToolButton[] = Object.entries(PRESET_REGISTRY).map(
  ([presetId, preset]) => ({
    id: `preset-${presetId}`,
    icon: Package,
    label: preset.name,
    tool: 'add-preset' as ActiveTool,
    subTool: presetId,
  })
);

export const toolGroups: ToolGroup[] = [
  {
    id: 'select',
    buttons: [
      {
        id: 'select',
        icon: MousePointer2,
        label: 'Select',
        shortcut: 'V',
        tool: 'select',
      },
    ],
  },
  {
    id: 'primitives',
    expandable: true,
    buttons: [
      {
        id: 'box',
        icon: Box,
        label: 'Box',
        tool: 'add-primitive',
        subTool: 'box',
      },
      {
        id: 'sphere',
        icon: Circle,
        label: 'Sphere',
        tool: 'add-primitive',
        subTool: 'sphere',
      },
      {
        id: 'cylinder',
        icon: Cylinder,
        label: 'Cylinder',
        tool: 'add-primitive',
        subTool: 'cylinder',
      },
      {
        id: 'cone',
        icon: Triangle,
        label: 'Cone',
        tool: 'add-primitive',
        subTool: 'cone',
      },
      {
        id: 'plane',
        icon: Maximize2,
        label: 'Plane',
        tool: 'add-primitive',
        subTool: 'plane',
      },
    ],
  },
  {
    id: 'vector',
    buttons: [
      {
        id: 'vector',
        icon: ArrowRight,
        label: 'Vector',
        shortcut: 'A',
        tool: 'add-vector',
      },
    ],
  },
  {
    id: 'connectors',
    expandable: true,
    buttons: [
      {
        id: 'spring',
        icon: Link2,
        label: 'Spring',
        tool: 'add-connector',
        subTool: 'spring',
      },
      {
        id: 'rope',
        icon: Minus,
        label: 'Rope',
        tool: 'add-connector',
        subTool: 'rope',
      },
      {
        id: 'rod',
        icon: Minus,
        label: 'Rod',
        tool: 'add-connector',
        subTool: 'rod',
      },
    ],
  },
  {
    id: 'curve',
    buttons: [
      {
        id: 'curve',
        icon: Spline,
        label: 'Curve',
        shortcut: 'C',
        tool: 'add-curve',
      },
    ],
  },
  ...(presetButtons.length > 0
    ? [
        {
          id: 'presets',
          expandable: true,
          buttons: presetButtons,
        },
      ]
    : []),
  {
    id: 'annotations',
    expandable: true,
    buttons: [
      {
        id: 'label',
        icon: Type,
        label: 'Label',
        tool: 'add-annotation',
        subTool: 'label',
      },
      {
        id: 'dimension',
        icon: Minus,
        label: 'Dimension',
        tool: 'add-annotation',
        subTool: 'dimension',
      },
      {
        id: 'axes',
        icon: Axis3D,
        label: 'Axes',
        tool: 'add-annotation',
        subTool: 'coordinate-axes',
      },
    ],
  },
];
