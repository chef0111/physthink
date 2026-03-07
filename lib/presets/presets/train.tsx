import { Cylinder } from '@react-three/drei';

interface TrainProps {
  bodyLength?: number;
  bodyHeight?: number;
  bodyDepth?: number;
  cabHeight?: number;
  wheelRadius?: number;
  wheelCount?: number;
  bodyColor?: string;
  cabColor?: string;
  wheelColor?: string;
  chimneyRadius?: number;
}

export function Train({
  bodyLength = 3,
  bodyHeight = 0.6,
  bodyDepth = 1,
  cabHeight = 0.6,
  wheelRadius = 0.25,
  wheelCount = 6,
  bodyColor = '#224433',
  cabColor = '#335544',
  wheelColor = '#333333',
  chimneyRadius = 0.12,
}: TrainProps) {
  const halfLen = bodyLength / 2;
  const halfDepth = bodyDepth / 2;
  const wheelY = -bodyHeight / 2;

  // Evenly space wheels along the body
  const wheelPositions: [number, number, number][] = [];
  const pairs = Math.floor(wheelCount / 2);
  for (let i = 0; i < pairs; i++) {
    const x =
      halfLen -
      wheelRadius -
      0.1 -
      (i * (bodyLength - 2 * wheelRadius - 0.2)) / Math.max(pairs - 1, 1);
    wheelPositions.push([x, wheelY, halfDepth]);
    wheelPositions.push([x, wheelY, -halfDepth]);
  }

  return (
    <group>
      {/* Boiler — horizontal cylinder */}
      <Cylinder
        args={[bodyHeight * 0.7, bodyHeight * 0.7, bodyLength * 0.6, 16]}
        position={[halfLen * 0.25, bodyHeight * 0.2, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.4}
          metalness={0.5}
        />
      </Cylinder>

      {/* Chassis / base */}
      <mesh position={[0, -bodyHeight * 0.15, 0]}>
        <boxGeometry args={[bodyLength, bodyHeight * 0.35, bodyDepth]} />
        <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Cab at the rear */}
      <mesh
        position={[-halfLen + 0.45, bodyHeight / 2 + cabHeight / 2 - 0.15, 0]}
      >
        <boxGeometry args={[0.9, cabHeight, bodyDepth * 0.95]} />
        <meshStandardMaterial
          color={cabColor}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Cab roof */}
      <mesh position={[-halfLen + 0.45, bodyHeight / 2 + cabHeight - 0.1, 0]}>
        <boxGeometry args={[1, 0.06, bodyDepth + 0.1]} />
        <meshStandardMaterial color="#222222" roughness={0.5} />
      </mesh>

      {/* Chimney / smokestack */}
      <Cylinder
        args={[chimneyRadius, chimneyRadius * 0.8, 0.4, 12]}
        position={[halfLen - 0.4, bodyHeight * 0.7 + 0.2, 0]}
      >
        <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.3} />
      </Cylinder>

      {/* Chimney top (wider cap) */}
      <Cylinder
        args={[chimneyRadius * 1.3, chimneyRadius, 0.08, 12]}
        position={[halfLen - 0.4, bodyHeight * 0.7 + 0.42, 0]}
      >
        <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.3} />
      </Cylinder>

      {/* Cowcatcher / front */}
      <mesh
        position={[halfLen + 0.05, -bodyHeight * 0.25, 0]}
        rotation={[0, 0, -0.15]}
      >
        <boxGeometry args={[0.15, bodyHeight * 0.5, bodyDepth * 0.8]} />
        <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <Cylinder
          key={i}
          args={[wheelRadius, wheelRadius, 0.1, 16]}
          position={pos}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={wheelColor}
            metalness={0.5}
            roughness={0.4}
          />
        </Cylinder>
      ))}
    </group>
  );
}
