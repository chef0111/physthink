import { useMemo } from 'react';
import { Line } from '@react-three/drei';

interface SpringBodyProps {
  length?: number;
  radius?: number;
  coils?: number;
  color?: string;
}

export function SpringBody({
  length = 2,
  radius = 0.15,
  coils = 8,
  color = '#cc8844',
}: SpringBodyProps) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = coils * 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * coils * Math.PI * 2;
      const taper = Math.min(t * 4, 1, (1 - t) * 4);
      pts.push([
        Math.cos(angle) * radius * taper,
        t * length - length / 2,
        Math.sin(angle) * radius * taper,
      ]);
    }
    return pts;
  }, [length, radius, coils]);

  return (
    <group>
      <Line points={points} color={color} lineWidth={3} />
      {/* End caps */}
      <mesh position={[0, -length / 2, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
