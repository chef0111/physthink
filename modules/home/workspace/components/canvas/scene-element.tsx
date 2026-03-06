'use client';

import type { SceneElement } from '@/lib/stores/scene-store';
import { MeshElementRenderer } from './elements/mesh-element';
import { VectorElementRenderer } from './elements/vector-element';
import { ConnectorElementRenderer } from './elements/connector-element';
import { CurveElementRenderer } from './elements/curve-element';
import { PresetElementRenderer } from './elements/preset-element';
import { AnnotationElementRenderer } from './elements/annotation-element';
import { LightElementRenderer } from './elements/light-element';
import { GroupElementRenderer } from './elements/group-element';
import { CustomElementRenderer } from './elements/custom-element';

export function SceneElementRenderer({ element }: { element: SceneElement }) {
  switch (element.type) {
    case 'mesh':
      return <MeshElementRenderer element={element} />;
    case 'vector':
      return <VectorElementRenderer element={element} />;
    case 'connector':
      return <ConnectorElementRenderer element={element} />;
    case 'curve':
      return <CurveElementRenderer element={element} />;
    case 'preset':
      return <PresetElementRenderer element={element} />;
    case 'annotation':
      return <AnnotationElementRenderer element={element} />;
    case 'light':
      return <LightElementRenderer element={element} />;
    case 'group':
      return <GroupElementRenderer element={element} />;
    case 'custom':
      return <CustomElementRenderer element={element} />;
    default:
      return null;
  }
}
