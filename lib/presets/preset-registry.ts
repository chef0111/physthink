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
