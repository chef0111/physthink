import type { ComponentType } from 'react';

export interface PresetMeta {
  name: string;
  category: 'mechanics' | 'optics' | 'electromagnetism' | 'other';
  component: ComponentType<Record<string, unknown>>;
}

// Registry is mutable to allow lazy registration
export const PRESET_REGISTRY: Record<string, PresetMeta> = {};

export function registerPreset(id: string, meta: PresetMeta) {
  PRESET_REGISTRY[id] = meta;
}

export function getPreset(id: string): PresetMeta | undefined {
  return PRESET_REGISTRY[id];
}

// ── Auto‑register built‑in presets ────────────────────────────

import { Pulley } from './presets/pulley';
import { SpringBody } from './presets/spring-body';
import { Cart } from './presets/cart';
import { Ramp } from './presets/ramp';
import { Pendulum } from './presets/pendulum';
import { WeightBlock } from './presets/weight-block';
import { Car } from './presets/car';
import { Truck } from './presets/truck';
import { Plane } from './presets/plane';
import { Train } from './presets/train';
import { Ship } from './presets/ship';

registerPreset('pulley', {
  name: 'Pulley',
  category: 'mechanics',
  component: Pulley as ComponentType<Record<string, unknown>>,
});

registerPreset('spring-body', {
  name: 'Spring',
  category: 'mechanics',
  component: SpringBody as ComponentType<Record<string, unknown>>,
});

registerPreset('cart', {
  name: 'Cart',
  category: 'mechanics',
  component: Cart as ComponentType<Record<string, unknown>>,
});

registerPreset('ramp', {
  name: 'Ramp',
  category: 'mechanics',
  component: Ramp as ComponentType<Record<string, unknown>>,
});

registerPreset('pendulum', {
  name: 'Pendulum',
  category: 'mechanics',
  component: Pendulum as ComponentType<Record<string, unknown>>,
});

registerPreset('weight-block', {
  name: 'Weight Block',
  category: 'other',
  component: WeightBlock as ComponentType<Record<string, unknown>>,
});

registerPreset('car', {
  name: 'Car',
  category: 'mechanics',
  component: Car as ComponentType<Record<string, unknown>>,
});

registerPreset('truck', {
  name: 'Truck',
  category: 'mechanics',
  component: Truck as ComponentType<Record<string, unknown>>,
});

registerPreset('plane', {
  name: 'Plane',
  category: 'mechanics',
  component: Plane as ComponentType<Record<string, unknown>>,
});

registerPreset('train', {
  name: 'Train',
  category: 'mechanics',
  component: Train as ComponentType<Record<string, unknown>>,
});

registerPreset('ship', {
  name: 'Ship',
  category: 'mechanics',
  component: Ship as ComponentType<Record<string, unknown>>,
});
