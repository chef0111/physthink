import { WorkspaceEditor } from '@/modules/home/workspace/components/workspace-editor';

export default async function WorkspaceEditorPage({ params }: RouteParams) {
  const { id } = await params;

  return <WorkspaceEditor id={id} />;
}
