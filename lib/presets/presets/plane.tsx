import * as THREE from 'three';
import { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';

interface PlaneProps {
  fuselageLength?: number;
  fuselageRadius?: number;
  wingSpan?: number;
  wingChord?: number;
  tailHeight?: number;
  bodyColor?: string;
  wingColor?: string;
}

export function Plane({
  fuselageLength = 3.5,
  fuselageRadius = 0.25,
  wingSpan = 3.2,
  wingChord = 0.6,
  tailHeight = 0.6,
  bodyColor = '#dddddd',
  wingColor = '#cccccc',
}: PlaneProps) {
  const halfLen = fuselageLength / 2;

  const noseGeometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(fuselageRadius, fuselageRadius * 3, 16);
    geo.rotateZ(-Math.PI / 2);
    return geo;
  }, [fuselageRadius]);

  return (
    <group>
      {/* Fuselage */}
      <Cylinder
        args={[fuselageRadius, fuselageRadius, fuselageLength, 16]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.3}
          metalness={0.4}
        />
      </Cylinder>

      {/* Nose cone */}
      <mesh
        geometry={noseGeometry}
        position={[halfLen + fuselageRadius * 1.2, 0, 0]}
      >
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Main wings */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[wingChord, 0.04, wingSpan]} />
        <meshStandardMaterial
          color={wingColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Horizontal tail stabilizer */}
      <mesh position={[-halfLen + 0.3, 0, 0]}>
        <boxGeometry args={[wingChord * 0.5, 0.03, wingSpan * 0.35]} />
        <meshStandardMaterial
          color={wingColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Vertical tail fin */}
      <mesh position={[-halfLen + 0.3, tailHeight / 2, 0]}>
        <boxGeometry args={[wingChord * 0.5, tailHeight, 0.03]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}
