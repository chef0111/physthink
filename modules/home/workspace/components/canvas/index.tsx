'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneStore } from '@/lib/stores/scene-store';
import { SceneElementRenderer } from './scene-element';
import { SceneEnvironment } from './scene-environment';
import { SelectableWrapper } from './selectable-wrapper';

export function WorkspaceCanvas() {
  const elements = useSceneStore((s) => s.elements);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="h-full w-full transition-[width] duration-200 ease-linear"
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => useSceneStore.getState().setSelected(null)}
      >
        <SceneEnvironment />
        {elements.map((element) => (
          <SelectableWrapper key={element.id} element={element}>
            <SceneElementRenderer element={element} />
          </SelectableWrapper>
        ))}
      </Canvas>
    </div>
  );
}
