import { Text } from '@react-three/drei';

interface WeightBlockProps {
  size?: number;
  mass?: string;
  color?: string;
}

export function WeightBlock({
  size = 0.6,
  mass = 'm',
  color = '#bb6633',
}: WeightBlockProps) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <Text
        position={[0, 0, size / 2 + 0.01]}
        fontSize={size * 0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {mass}
      </Text>
    </group>
  );
}
