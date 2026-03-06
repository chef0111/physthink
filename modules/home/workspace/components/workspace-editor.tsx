'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { useUpdateWorkspace } from '@/queries/workspace';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { FolderX } from 'lucide-react';
import Link from 'next/link';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { WorkspaceCanvas } from './canvas';
import { WorkspaceToolbar } from './toolbar';
import { WorkspaceHeader } from './workspace-header';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import Loading from '@/app/loading';
import { formatBytes } from '@/lib/utils';

const MAX_SCENE_DATA_SIZE = 2 * 1024 * 1024; // 2MB

export function WorkspaceEditor() {
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const hydratedRef = useRef(false);
  useUndoRedo();

  const { data: workspace, isLoading } = useQuery(
    orpc.workspace.get.queryOptions({ input: { id: params.id } })
  );

  const updateMutation = useUpdateWorkspace({
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('idle'),
  });

  // Hydrate scene store from DB on first load
  useEffect(() => {
    if (workspace && !hydratedRef.current) {
      hydratedRef.current = true;
      useSceneStore.getState().loadScene(workspace.sceneData);
    }
  }, [workspace]);

  // Auto-save scene changes with debounce
  const debouncedSave = useDebouncedCallback((sceneData: unknown) => {
    const json = JSON.stringify(sceneData);
    if (json.length > MAX_SCENE_DATA_SIZE) {
      console.warn(
        `Scene data exceeds ${formatBytes(MAX_SCENE_DATA_SIZE)} limit, skipping auto-save`
      );
      return;
    }
    updateMutation.mutate({ id: params.id, sceneData });
  }, 1500);

  useEffect(() => {
    const unsubscribe = useSceneStore.subscribe(
      (state) => ({
        elements: state.elements,
        sceneSettings: state.sceneSettings,
      }),
      (slice) => {
        if (hydratedRef.current) {
          debouncedSave(slice);
        }
      },
      { equalityFn: (a, b) => a === b }
    );
    return unsubscribe;
  }, [debouncedSave]);

  useEffect(() => {
    if (workspace?.title) {
      setTitle(workspace.title);
    }
  }, [workspace?.title]);

  const handleTitleBlur = useCallback(() => {
    if (title && title !== workspace?.title) {
      updateMutation.mutate({ id: params.id, title });
    }
  }, [title, workspace?.title, params.id, updateMutation]);

  if (isLoading) {
    return <Loading title="Configuring your workspace..." />;
  }

  if (!workspace) {
    return (
      <Empty className="h-dvh">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderX />
          </EmptyMedia>
          <EmptyTitle>Workspace not found</EmptyTitle>
          <EmptyDescription>
            Workspace maybe broken or removed. Check if the URL is correct.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/workspace">Back to Workspaces</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <SidebarProvider
      hotkey={false}
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 90)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
      breakpoint={1024}
    >
      <div className="flex h-dvh w-full overflow-y-hidden">
        <WorkspaceHeader
          title={title}
          onTitleChange={setTitle}
          onTitleBlur={handleTitleBlur}
          saveStatus={saveStatus}
        />

        <SidebarInset>
          <div className="@container/main flex flex-1">
            <WorkspaceCanvas />
          </div>
        </SidebarInset>

        <WorkspaceToolbar />

        <Sidebar
          side="right"
          collapsible="offcanvas"
          className="bg-background text-sidebar-foreground top-12 pb-12"
          transition={false}
        >
          <SidebarHeader className="border-b p-4">
            <h3 className="text-sm font-semibold">AI Chat</h3>
            <p className="text-muted-foreground text-xs">
              Describe the 3D illustration you want
            </p>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto p-4">
            <p className="text-muted-foreground text-center text-sm">
              AI Chat is coming soon!
            </p>
          </SidebarContent>
          <SidebarFooter className="border-t p-3">
            <Textarea
              placeholder="Describe the 3D illustration you want..."
              rows={3}
              disabled
            />
          </SidebarFooter>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
}
