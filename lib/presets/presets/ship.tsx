import * as THREE from 'three';
import { useMemo } from 'react';

interface ShipProps {
  hullLength?: number;
  hullHeight?: number;
  hullDepth?: number;
  cabinHeight?: number;
  hullColor?: string;
  cabinColor?: string;
  deckColor?: string;
}

export function Ship({
  hullLength = 3.5,
  hullHeight = 0.5,
  hullDepth = 1,
  cabinHeight = 0.5,
  hullColor = '#445566',
  cabinColor = '#dddddd',
  deckColor = '#886644',
}: ShipProps) {
  const halfLen = hullLength / 2;

  const hullGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Side profile of hull — tapered at bow and stern
    shape.moveTo(-halfLen, 0);
    shape.lineTo(-halfLen * 0.85, -hullHeight);
    shape.lineTo(halfLen * 0.85, -hullHeight);
    shape.lineTo(halfLen, 0);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: hullDepth,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -hullDepth / 2);
    return geo;
  }, [halfLen, hullHeight, hullDepth]);

  return (
    <group>
      {/* Hull */}
      <mesh geometry={hullGeometry}>
        <meshStandardMaterial
          color={hullColor}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Deck */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[hullLength * 0.9, 0.04, hullDepth * 0.9]} />
        <meshStandardMaterial color={deckColor} roughness={0.7} />
      </mesh>

      {/* Cabin / bridge — rear third */}
      <mesh position={[-halfLen * 0.5, cabinHeight / 2 + 0.02, 0]}>
        <boxGeometry args={[hullLength * 0.25, cabinHeight, hullDepth * 0.5]} />
        <meshStandardMaterial color={cabinColor} roughness={0.4} />
      </mesh>

      {/* Bridge windows */}
      <mesh
        position={[-halfLen * 0.5, cabinHeight * 0.7 + 0.02, hullDepth * 0.251]}
      >
        <boxGeometry args={[hullLength * 0.2, cabinHeight * 0.3, 0.01]} />
        <meshStandardMaterial
          color="#88bbee"
          roughness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Funnel / smokestack */}
      <mesh position={[-halfLen * 0.35, cabinHeight + 0.2 + 0.02, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.35, 12]} />
        <meshStandardMaterial color="#cc4444" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Bow point */}
      <mesh
        position={[halfLen * 0.95, -hullHeight * 0.15, 0]}
        rotation={[0, 0, 0.2]}
      >
        <boxGeometry
          args={[hullLength * 0.12, hullHeight * 0.3, hullDepth * 0.3]}
        />
        <meshStandardMaterial
          color={hullColor}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}
