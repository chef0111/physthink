import { Line } from '@react-three/drei';

interface PendulumProps {
  rodLength?: number;
  bobRadius?: number;
  rodColor?: string;
  bobColor?: string;
}

export function Pendulum({
  rodLength = 2,
  bobRadius = 0.2,
  rodColor = '#aaaaaa',
  bobColor = '#cc4444',
}: PendulumProps) {
  return (
    <group>
      {/* Pivot mount */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#555555" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Rod */}
      <Line
        points={[
          [0, 0, 0],
          [0, -rodLength, 0],
        ]}
        color={rodColor}
        lineWidth={3}
      />
      {/* Bob */}
      <mesh position={[0, -rodLength, 0]}>
        <sphereGeometry args={[bobRadius, 16, 16]} />
        <meshStandardMaterial
          color={bobColor}
          metalness={0.2}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
