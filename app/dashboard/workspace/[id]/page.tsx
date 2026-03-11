// import { Suspense } from 'react';
// import Loading from '@/components/ui/loading';
import { WorkspaceEditor } from '@/modules/home/workspace/components/workspace-editor';

export default function WorkspaceEditorPage() {
  return (
    // <Suspense fallback={<Loading title="Loading workspace..." />}>
    <WorkspaceEditor />
    // </Suspense>
  );
}
