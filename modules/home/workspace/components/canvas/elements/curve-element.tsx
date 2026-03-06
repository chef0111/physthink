'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { CurveElement } from '@/lib/stores/scene-store';

export function CurveElementRenderer({ element }: { element: CurveElement }) {
  const {
    points,
    closed = false,
    color = '#66bb6a',
    lineWidth = 2,
    dashed = false,
  } = element;

  const { smoothPoints, curvePath } = useMemo(() => {
    if (points.length < 2) return { smoothPoints: [], curvePath: null };

    const vectors = points.map((p) => new THREE.Vector3(...p));

    // Two points = straight line, no spline needed
    if (points.length === 2) {
      return {
        smoothPoints: points,
        curvePath: new THREE.LineCurve3(vectors[0], vectors[1]),
      };
    }

    const curve = new THREE.CatmullRomCurve3(vectors, closed);
    const interpolated = curve
      .getPoints(points.length * 16)
      .map((p) => [p.x, p.y, p.z] as [number, number, number]);

    return { smoothPoints: interpolated, curvePath: curve };
  }, [points, closed]);

  if (element.visible === false || smoothPoints.length < 2) return null;

  return (
    <group>
      <Line
        points={smoothPoints}
        color={color}
        lineWidth={lineWidth}
        dashed={dashed}
        dashSize={0.1}
        gapSize={0.05}
      />
      {/* Invisible tube for click hit detection */}
      {curvePath && (
        <mesh>
          <tubeGeometry args={[curvePath, 64, 0.08, 8, closed]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
