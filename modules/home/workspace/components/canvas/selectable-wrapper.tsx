'use client';

import {
  memo,
  useRef,
  useEffect,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '@/lib/stores/scene-store';
import type { SceneElement, Vec3 } from '@/lib/stores/scene-store';
import type { Object3D } from 'three';

export const SelectableWrapper = memo(function SelectableWrapper({
  element,
  children,
}: {
  element: SceneElement;
  children: ReactNode;
}) {
  const selectedId = useSceneStore((s) => s.selectedId);
  const setSelected = useSceneStore((s) => s.setSelected);
  const updateElement = useSceneStore((s) => s.updateElement);
  const groupRef = useRef<Object3D>(null);

  const isSelected = selectedId === element.id;

  return (
    <>
      <group
        ref={groupRef}
        position={element.position}
        rotation={element.rotation}
        scale={element.scale}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(element.id);
        }}
      >
        {children}
      </group>
      {isSelected && groupRef.current && (
        <ActiveTransformControls
          object={groupRef.current}
          elementId={element.id}
          updateElement={updateElement}
        />
      )}
    </>
  );
});

/** Disables OrbitControls while dragging the transform gizmo */
function ActiveTransformControls({
  object,
  elementId,
  updateElement,
}: {
  object: Object3D;
  elementId: string;
  updateElement: (id: string, updates: Partial<SceneElement>) => void;
}) {
  const transformRef = useRef<ComponentRef<typeof TransformControls>>(null);
  const { controls } = useThree();

  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;

    type DragEvent = { value: boolean };
    const onDraggingChanged = (event: DragEvent) => {
      if (controls && 'enabled' in controls) {
        (controls as { enabled: boolean }).enabled = !event.value;
      }
    };

    const obj = tc as unknown as {
      addEventListener(type: string, listener: (e: DragEvent) => void): void;
      removeEventListener(type: string, listener: (e: DragEvent) => void): void;
    };
    obj.addEventListener('dragging-changed', onDraggingChanged);
    return () => {
      obj.removeEventListener('dragging-changed', onDraggingChanged);
    };
  }, [controls]);

  return (
    <TransformControls
      ref={transformRef}
      object={object}
      onObjectChange={() => {
        const pos = object.position;
        const rot = object.rotation;
        const scl = object.scale;
        updateElement(elementId, {
          position: [pos.x, pos.y, pos.z] as Vec3,
          rotation: [rot.x, rot.y, rot.z] as Vec3,
          scale: [scl.x, scl.y, scl.z] as Vec3,
        });
      }}
    />
  );
}
