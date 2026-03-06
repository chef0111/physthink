'use client';

import type { GroupElement } from '@/lib/stores/scene-store';
import { SceneElementRenderer } from '../scene-element';
import { SelectableWrapper } from '../selectable-wrapper';

export function GroupElementRenderer({ element }: { element: GroupElement }) {
  if (element.visible === false) return null;

  return (
    <group>
      {element.children.map((child) => (
        <SelectableWrapper key={child.id} element={child}>
          <SceneElementRenderer element={child} />
        </SelectableWrapper>
      ))}
    </group>
  );
}
