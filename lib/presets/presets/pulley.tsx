import { Cylinder } from '@react-three/drei';

interface PulleyProps {
  radius?: number;
  thickness?: number;
  grooveDepth?: number;
  color?: string;
}

export function Pulley({
  radius = 0.5,
  thickness = 0.15,
  grooveDepth = 0.05,
  color = '#888888',
}: PulleyProps) {
  return (
    <group>
      {/* Main wheel */}
      <Cylinder
        args={[radius, radius, thickness, 32]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </Cylinder>
      {/* Groove ring (slightly smaller) */}
      <Cylinder
        args={[
          radius - grooveDepth,
          radius - grooveDepth,
          thickness + 0.02,
          32,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#666666" metalness={0.5} roughness={0.3} />
      </Cylinder>
      {/* Axle */}
      <Cylinder
        args={[0.04, 0.04, thickness + 0.1, 8]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.3} />
      </Cylinder>
    </group>
  );
}
