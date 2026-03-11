import { Suspense } from 'react';
import { WorkspaceEditor } from '@/modules/home/workspace/components/workspace-editor';

export default function WorkspaceEditorPage() {
  return (
    <Suspense>
      <WorkspaceEditor />;
    </Suspense>
  );
}
