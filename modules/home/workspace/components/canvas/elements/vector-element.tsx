'use client';

import { useMemo } from 'react';
import { Line, Cone, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { VectorElement } from '@/stores/scene-store';

export function VectorElementRenderer({ element }: { element: VectorElement }) {
  const {
    from,
    to,
    color = '#f73939',
    headSize = 0.08,
    dashed = false,
  } = element;

  const { dir, length, midpoint, headPosition, headRotation, clampedTo } =
    useMemo(() => {
      const fromVec = new THREE.Vector3(...from);
      const toVec = new THREE.Vector3(...to);
      const direction = toVec.clone().sub(fromVec);
      let len = direction.length();
      const dirNorm = direction.clone().normalize();

      const MAX_VECTOR_LENGTH = 15;
      if (len > MAX_VECTOR_LENGTH) {
        len = MAX_VECTOR_LENGTH;
        toVec.copy(fromVec).add(dirNorm.clone().multiplyScalar(len));
      }

      // Head sits at the tip
      const headPos = toVec
        .clone()
        .sub(dirNorm.clone().multiplyScalar(headSize));

      // Rotate cone from default +Y to match direction
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNorm);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      const mid = fromVec.clone().add(toVec).multiplyScalar(0.5);

      return {
        dir: dirNorm,
        length: len,
        midpoint: mid.toArray() as [number, number, number],
        headPosition: headPos.toArray() as [number, number, number],
        headRotation: [euler.x, euler.y, euler.z] as [number, number, number],
        clampedTo: toVec.toArray() as [number, number, number],
      };
    }, [from, to, headSize]);

  if (element.visible === false || length < 0.001) return null;

  const shaftEnd = new THREE.Vector3(...clampedTo)
    .sub(dir.clone().multiplyScalar(headSize * 2))
    .toArray() as [number, number, number];

  return (
    <group>
      <Line
        points={[from, shaftEnd]}
        color={color}
        lineWidth={2}
        dashed={dashed}
        dashSize={0.1}
        gapSize={0.05}
      />
      <Cone
        args={[headSize * 0.5, headSize * 1.5, 8]}
        position={headPosition}
        rotation={headRotation}
      >
        <meshStandardMaterial color={color} />
      </Cone>
      {element.label && (
        <Text
          position={midpoint}
          fontSize={0.12}
          color={color}
          anchorX="center"
          anchorY="bottom"
        >
          {element.label}
        </Text>
      )}
    </group>
  );
}
