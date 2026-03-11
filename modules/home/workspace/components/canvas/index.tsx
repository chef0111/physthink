'use client';

import { Activity, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneStore } from '@/stores/scene-store';
import { SceneElementRenderer } from './scene-element';
import { SceneEnvironment } from './scene-environment';
import { SelectableWrapper } from './selectable-wrapper';
import { SceneLoadingSkeleton } from '../../layout/loading';
import { div } from 'three/src/nodes/math/OperatorNode.js';

export function WorkspaceCanvas({ loading }: { loading?: boolean }) {
  const elements = useSceneStore((s) => s.elements);
  const sceneLoading = useSceneStore((s) => s.sceneLoading);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        flat
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => useSceneStore.getState().setSelected(null)}
      >
        <SceneEnvironment />
        {(sceneLoading || loading) && <SceneLoadingSkeleton />}
        <Activity mode={sceneLoading || loading ? 'hidden' : 'visible'}>
          {elements.map((element) => (
            <SelectableWrapper key={element.id} element={element}>
              <SceneElementRenderer element={element} />
            </SelectableWrapper>
          ))}
        </Activity>
      </Canvas>
    </div>
  );
}
