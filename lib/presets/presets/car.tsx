import { Cylinder } from '@react-three/drei';

interface CarProps {
  bodyLength?: number;
  bodyHeight?: number;
  bodyDepth?: number;
  cabinHeight?: number;
  wheelRadius?: number;
  bodyColor?: string;
  cabinColor?: string;
  wheelColor?: string;
}

export function Car({
  bodyLength = 2.4,
  bodyHeight = 0.35,
  bodyDepth = 1,
  cabinHeight = 0.4,
  wheelRadius = 0.2,
  bodyColor = '#cc3333',
  cabinColor = '#88ccee',
  wheelColor = '#222222',
}: CarProps) {
  const halfLen = bodyLength / 2;
  const halfDepth = bodyDepth / 2;
  const cabinLength = bodyLength * 0.45;
  const cabinOffset = -bodyLength * 0.05;

  const wheelX = halfLen - wheelRadius - 0.15;
  const wheelY = -bodyHeight / 2;

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[bodyLength, bodyHeight, bodyDepth]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Cabin */}
      <mesh position={[cabinOffset, bodyHeight / 2 + cabinHeight / 2, 0]}>
        <boxGeometry args={[cabinLength, cabinHeight, bodyDepth * 0.9]} />
        <meshStandardMaterial
          color={cabinColor}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Hood slope — front wedge */}
      <mesh
        position={[halfLen * 0.55, bodyHeight / 2 + cabinHeight * 0.25, 0]}
        rotation={[0, 0, -0.3]}
      >
        <boxGeometry
          args={[bodyLength * 0.25, cabinHeight * 0.15, bodyDepth * 0.85]}
        />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Wheels */}
      {(
        [
          [wheelX, wheelY, halfDepth],
          [wheelX, wheelY, -halfDepth],
          [-wheelX, wheelY, halfDepth],
          [-wheelX, wheelY, -halfDepth],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <Cylinder
          key={i}
          args={[wheelRadius, wheelRadius, 0.1, 16]}
          position={pos}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={wheelColor}
            metalness={0.4}
            roughness={0.5}
          />
        </Cylinder>
      ))}
    </group>
  );
}
