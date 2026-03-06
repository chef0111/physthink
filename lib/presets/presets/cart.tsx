import { Cylinder } from '@react-three/drei';

interface CartProps {
  bodyLength?: number;
  bodyHeight?: number;
  bodyDepth?: number;
  wheelRadius?: number;
  wheelCount?: number;
  bodyColor?: string;
  wheelColor?: string;
}

export function Cart({
  bodyLength = 2,
  bodyHeight = 0.4,
  bodyDepth = 0.8,
  wheelRadius = 0.2,
  wheelCount = 4,
  bodyColor = '#4488bb',
  wheelColor = '#333333',
}: CartProps) {
  const wheelPositions: [number, number, number][] = [];
  const halfLen = bodyLength / 2 - wheelRadius;
  const halfDepth = bodyDepth / 2;

  if (wheelCount >= 2) {
    wheelPositions.push([-halfLen, -bodyHeight / 2, halfDepth]);
    wheelPositions.push([-halfLen, -bodyHeight / 2, -halfDepth]);
  }
  if (wheelCount >= 4) {
    wheelPositions.push([halfLen, -bodyHeight / 2, halfDepth]);
    wheelPositions.push([halfLen, -bodyHeight / 2, -halfDepth]);
  }

  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[bodyLength, bodyHeight, bodyDepth]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <Cylinder
          key={i}
          args={[wheelRadius, wheelRadius, 0.08, 16]}
          position={pos}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={wheelColor}
            metalness={0.3}
            roughness={0.5}
          />
        </Cylinder>
      ))}
    </group>
  );
}
