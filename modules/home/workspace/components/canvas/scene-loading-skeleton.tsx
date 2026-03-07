'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshBasicMaterial } from 'three';

/**
 * Pulsing wireframe cube that appears in the canvas while
 * the AI is generating scene elements.
 */
export function SceneLoadingSkeleton() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.5;
    const mat = meshRef.current.material as MeshBasicMaterial;
    mat.opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial
        color="#888"
        wireframe
        transparent
        opacity={0.2}
        depthWrite={false}
      />
    </mesh>
  );
}
