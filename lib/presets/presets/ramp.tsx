import * as THREE from 'three';
import { useMemo } from 'react';

interface RampProps {
  length?: number;
  height?: number;
  depth?: number;
  color?: string;
}

export function Ramp({
  length = 3,
  height = 1.5,
  depth = 1,
  color = '#8b7355',
}: RampProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(0, height);
    shape.closePath();

    const extrudeSettings = {
      depth,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, [length, height, depth]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}
