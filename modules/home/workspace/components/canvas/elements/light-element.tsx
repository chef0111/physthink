'use client';

import type { LightElement } from '@/stores/scene-store';

export function LightElementRenderer({ element }: { element: LightElement }) {
  if (element.visible === false) return null;

  const { lightType, color = '#ffffff', intensity = 1 } = element;

  switch (lightType) {
    case 'ambient':
      return <ambientLight color={color} intensity={intensity} />;
    case 'directional':
      return (
        <directionalLight color={color} intensity={intensity} castShadow />
      );
    case 'point':
      return <pointLight color={color} intensity={intensity} castShadow />;
    case 'spot':
      return (
        <spotLight
          color={color}
          intensity={intensity}
          castShadow
          angle={Math.PI / 6}
          penumbra={0.5}
        />
      );
    default:
      return null;
  }
}
