'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshBasicMaterial } from 'three';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FilterInputFallback,
  SortSelectFallback,
} from '@/components/filter/fallback';

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

export function WorkspaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="gap-2 p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Skeleton className="size-5" />
              <Skeleton className="h-5 w-2/3" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
          <CardFooter className="justify-end p-0">
            <Skeleton className="size-9 rounded-md p-0" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function WorkspaceFilterFallback() {
  return (
    <>
      <FilterInputFallback placeholder="Search workspace..." />
      <SortSelectFallback
        className="min-h-10 w-full sm:w-auto"
        containerClassName="w-full sm:w-auto"
      />
    </>
  );
}
