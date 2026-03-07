import { Cylinder } from '@react-three/drei';

interface TruckProps {
  cabLength?: number;
  cargoLength?: number;
  bodyHeight?: number;
  bodyDepth?: number;
  cabHeight?: number;
  cargoHeight?: number;
  wheelRadius?: number;
  cabColor?: string;
  cargoColor?: string;
  wheelColor?: string;
}

export function Truck({
  cabLength = 1,
  cargoLength = 2.2,
  bodyHeight = 0.4,
  bodyDepth = 1.1,
  cabHeight = 0.7,
  cargoHeight = 0.9,
  wheelRadius = 0.25,
  cabColor = '#2266aa',
  cargoColor = '#999999',
  wheelColor = '#222222',
}: TruckProps) {
  const totalLength = cabLength + cargoLength;
  const halfTotal = totalLength / 2;
  const halfDepth = bodyDepth / 2;

  const cabCenter = halfTotal - cabLength / 2;
  const cargoCenter = -halfTotal + cargoLength / 2;

  const wheelY = -bodyHeight / 2;

  // Front axle under cab, rear axle under cargo
  const frontWheelX = cabCenter;
  const rearWheelX = cargoCenter - cargoLength * 0.25;

  return (
    <group>
      {/* Cab body */}
      <mesh position={[cabCenter, 0, 0]}>
        <boxGeometry args={[cabLength, bodyHeight, bodyDepth]} />
        <meshStandardMaterial
          color={cabColor}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Cab upper (windshield) */}
      <mesh position={[cabCenter, bodyHeight / 2 + cabHeight / 2, 0]}>
        <boxGeometry args={[cabLength * 0.9, cabHeight, bodyDepth * 0.95]} />
        <meshStandardMaterial
          color="#88bbdd"
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Cargo bed */}
      <mesh position={[cargoCenter, 0, 0]}>
        <boxGeometry args={[cargoLength, bodyHeight, bodyDepth]} />
        <meshStandardMaterial color={cargoColor} roughness={0.6} />
      </mesh>

      {/* Cargo walls */}
      <mesh position={[cargoCenter, bodyHeight / 2 + cargoHeight / 2, 0]}>
        <boxGeometry args={[cargoLength, cargoHeight, bodyDepth]} />
        <meshStandardMaterial
          color={cargoColor}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Wheels — 6 total: 2 front + 4 rear (dual rear axle) */}
      {(
        [
          // Front axle
          [frontWheelX, wheelY, halfDepth],
          [frontWheelX, wheelY, -halfDepth],
          // Rear axle 1
          [rearWheelX, wheelY, halfDepth],
          [rearWheelX, wheelY, -halfDepth],
          // Rear axle 2
          [rearWheelX - wheelRadius * 2.5, wheelY, halfDepth],
          [rearWheelX - wheelRadius * 2.5, wheelY, -halfDepth],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <Cylinder
          key={i}
          args={[wheelRadius, wheelRadius, 0.12, 16]}
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
