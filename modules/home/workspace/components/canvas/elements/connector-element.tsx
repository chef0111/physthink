'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ConnectorElement } from '@/stores/scene-store';

function generateSpringPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  coils: number,
  radius: number
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const dir = end.clone().sub(start);
  const length = dir.length();
  const norm = dir.clone().normalize();

  // Find perpendicular vectors
  const up =
    Math.abs(norm.y) < 0.99
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
  const perp1 = new THREE.Vector3().crossVectors(norm, up).normalize();
  const perp2 = new THREE.Vector3().crossVectors(norm, perp1).normalize();

  const segments = coils * 16;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * coils * Math.PI * 2;
    // Taper at ends
    const taper = Math.min(t * 4, 1, (1 - t) * 4);
    const p = start
      .clone()
      .add(dir.clone().multiplyScalar(t))
      .add(perp1.clone().multiplyScalar(Math.cos(angle) * radius * taper))
      .add(perp2.clone().multiplyScalar(Math.sin(angle) * radius * taper));
    points.push(p.toArray() as [number, number, number]);
  }
  return points;
}

export function ConnectorElementRenderer({
  element,
}: {
  element: ConnectorElement;
}) {
  const {
    connector,
    start,
    end,
    coils = 8,
    thickness = 2,
    color = '#aaaaaa',
  } = element;

  const points = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);

    switch (connector) {
      case 'spring':
        return generateSpringPoints(s, e, coils, 0.15);
      case 'rope': {
        // Simple catenary approximation
        const mid = s.clone().add(e).multiplyScalar(0.5);
        const sag = s.distanceTo(e) * 0.15;
        mid.y -= sag;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const p = new THREE.Vector3();
          // Quadratic bezier for catenary approximation
          p.lerpVectors(s, mid, t * 2 > 1 ? 1 : t * 2);
          if (t > 0.5) {
            p.lerpVectors(mid, e, (t - 0.5) * 2);
          }
          pts.push(p.toArray() as [number, number, number]);
        }
        return pts;
      }
      case 'rod':
      case 'wire':
      default:
        return [
          s.toArray() as [number, number, number],
          e.toArray() as [number, number, number],
        ];
    }
  }, [connector, start, end, coils]);

  const hitCurve = useMemo(() => {
    if (points.length < 2) return null;
    const vectors = points.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors);
  }, [points]);

  if (element.visible === false) return null;

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={connector === 'rod' ? thickness * 2 : thickness}
      />
      {/* Invisible tube for click hit detection */}
      {hitCurve && (
        <mesh>
          <tubeGeometry args={[hitCurve, 64, 0.08, 8, false]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
