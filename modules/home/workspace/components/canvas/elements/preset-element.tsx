'use client';

import type { PresetElement } from '@/stores/scene-store';
import { getPreset } from '@/lib/presets/preset-registry';
import { Text } from '@react-three/drei';

export function PresetElementRenderer({ element }: { element: PresetElement }) {
  if (element.visible === false) return null;

  const preset = getPreset(element.presetId);

  if (!preset) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#ff4444" wireframe />
        </mesh>
        <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ff4444">
          {`Unknown: ${element.presetId}`}
        </Text>
      </group>
    );
  }

  const PresetComponent = preset.component;

  return (
    <group>
      <PresetComponent {...(element.params ?? {})} />
    </group>
  );
}
