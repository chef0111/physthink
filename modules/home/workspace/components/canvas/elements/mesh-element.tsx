'use client';

import { useMemo } from 'react';
import type { MeshElement } from '@/stores/scene-store';

const geometryMap = {
  box: (args?: number[]) => (
    <boxGeometry args={(args as [number, number, number]) ?? [1, 1, 1]} />
  ),
  sphere: (args?: number[]) => (
    <sphereGeometry
      args={(args as [number, number, number]) ?? [0.5, 32, 32]}
    />
  ),
  cylinder: (args?: number[]) => (
    <cylinderGeometry
      args={(args as [number, number, number, number]) ?? [0.5, 0.5, 1, 32]}
    />
  ),
  cone: (args?: number[]) => (
    <coneGeometry args={(args as [number, number, number]) ?? [0.5, 1, 32]} />
  ),
  capsule: (args?: number[]) => (
    <capsuleGeometry
      args={(args as [number, number, number, number]) ?? [0.3, 0.6, 8, 16]}
    />
  ),
  torus: (args?: number[]) => (
    <torusGeometry
      args={(args as [number, number, number, number]) ?? [0.5, 0.15, 16, 48]}
    />
  ),
  plane: (args?: number[]) => (
    <planeGeometry args={(args as [number, number]) ?? [2, 2]} />
  ),
};

export function MeshElementRenderer({ element }: { element: MeshElement }) {
  const material = element.material;

  const geometryNode = useMemo(() => {
    const factory = geometryMap[element.geometry];
    return factory ? factory(element.geometryArgs) : <boxGeometry />;
  }, [element.geometry, element.geometryArgs]);

  if (element.visible === false) return null;

  return (
    <mesh castShadow receiveShadow>
      {geometryNode}
      <meshStandardMaterial
        color={material?.color ?? '#6c8ebf'}
        opacity={material?.opacity ?? 1}
        transparent={(material?.opacity ?? 1) < 1}
        wireframe={material?.wireframe ?? false}
        metalness={material?.metalness ?? 0.1}
        roughness={material?.roughness ?? 0.6}
      />
    </mesh>
  );
}
