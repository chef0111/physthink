'use client';

import { Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { OrbitControls } from '@react-three/drei';
import { useSceneStore } from '@/lib/stores/scene-store';

export function SceneEnvironment() {
  const { gridVisible, axesVisible, backgroundColor } = useSceneStore(
    (s) => s.sceneSettings
  );

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <OrbitControls makeDefault />

      {gridVisible && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#4a4a6a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#6a6a9a"
          fadeDistance={30}
          infiniteGrid
        />
      )}

      {axesVisible && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#f73939', '#2bf739', '#3982f7']}
            labelColor="white"
          />
        </GizmoHelper>
      )}
    </>
  );
}
