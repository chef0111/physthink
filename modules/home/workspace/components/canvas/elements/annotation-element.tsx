'use client';

import { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { AnnotationElement } from '@/lib/stores/scene-store';

export function AnnotationElementRenderer({
  element,
}: {
  element: AnnotationElement;
}) {
  if (element.visible === false) return null;

  switch (element.annotationKind) {
    case 'label':
      return <LabelAnnotation element={element} />;
    case 'angle-marker':
      return <AngleMarkerAnnotation element={element} />;
    case 'dimension':
      return <DimensionAnnotation element={element} />;
    case 'coordinate-axes':
      return <CoordinateAxesAnnotation element={element} />;
    case 'region':
      return <RegionAnnotation element={element} />;
    default:
      return null;
  }
}

function LabelAnnotation({ element }: { element: AnnotationElement }) {
  const fontSize = Math.min(element.fontSize ?? 0.25, 0.5);

  return (
    <group>
      <Text
        fontSize={fontSize}
        color={element.color ?? '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {element.text ?? ''}
      </Text>
    </group>
  );
}

function AngleMarkerAnnotation({ element }: { element: AnnotationElement }) {
  const arcPoints = useMemo(() => {
    if (!element.vectors || element.vectors.length < 2) return [];
    const v1 = new THREE.Vector3(...element.vectors[0]).normalize();
    const v2 = new THREE.Vector3(...element.vectors[1]).normalize();

    const radius = 0.4;
    const angle = v1.angleTo(v2);
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
    const pts: [number, number, number][] = [];

    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * angle;
      const p = v1.clone().applyAxisAngle(normal, t).multiplyScalar(radius);
      pts.push(p.toArray() as [number, number, number]);
    }
    return pts;
  }, [element.vectors]);

  if (arcPoints.length < 2) return null;

  return (
    <group>
      <Line
        points={arcPoints}
        color={element.color ?? '#ffcc00'}
        lineWidth={2}
      />
      {element.text && (
        <Text
          position={[
            arcPoints[Math.floor(arcPoints.length / 2)][0] * 1.5,
            arcPoints[Math.floor(arcPoints.length / 2)][1] * 1.5,
            arcPoints[Math.floor(arcPoints.length / 2)][2] * 1.5,
          ]}
          fontSize={Math.min(element.fontSize ?? 0.18, 0.3)}
          color={element.color ?? '#ffcc00'}
        >
          {element.text}
        </Text>
      )}
    </group>
  );
}

function DimensionAnnotation({ element }: { element: AnnotationElement }) {
  const { start, end, color = '#cccccc' } = element;
  if (!start || !end) return null;

  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1} />
      {/* End ticks */}
      <mesh position={start}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {element.text && (
        <Text
          position={[
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 + 0.15,
            (start[2] + end[2]) / 2,
          ]}
          fontSize={Math.min(element.fontSize ?? 0.15, 0.3)}
          color={color}
        >
          {element.text}
        </Text>
      )}
    </group>
  );
}

function CoordinateAxesAnnotation({ element }: { element: AnnotationElement }) {
  const axisLength = 1;
  return (
    <group>
      <Line
        points={[
          [0, 0, 0],
          [axisLength, 0, 0],
        ]}
        color="#f73939"
        lineWidth={2}
      />
      <Line
        points={[
          [0, 0, 0],
          [0, axisLength, 0],
        ]}
        color="#2bf739"
        lineWidth={2}
      />
      <Line
        points={[
          [0, 0, 0],
          [0, 0, axisLength],
        ]}
        color="#3982f7"
        lineWidth={2}
      />
      <Text position={[axisLength + 0.1, 0, 0]} fontSize={0.12} color="#f73939">
        x
      </Text>
      <Text position={[0, axisLength + 0.1, 0]} fontSize={0.12} color="#2bf739">
        y
      </Text>
      <Text position={[0, 0, axisLength + 0.1]} fontSize={0.12} color="#3982f7">
        z
      </Text>
    </group>
  );
}

function RegionAnnotation({ element }: { element: AnnotationElement }) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={element.color ?? '#ffcc00'}
          opacity={0.2}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
