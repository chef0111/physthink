'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { useUpdateWorkspace } from '@/queries/workspace';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { ArrowUp, FolderX } from 'lucide-react';
import Link from 'next/link';
import { useSceneStore } from '@/stores/scene-store';
import { useDebounced } from '@/hooks/use-debounced';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { WorkspaceCanvas } from './canvas';
import { WorkspaceToolbar } from './toolbar';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceChat, dbMessagesToAiMessages } from './chat';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { formatBytes } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';

const MAX_SCENE_DATA_SIZE = 2 * 1024 * 1024; // 2MB

export function WorkspaceEditor({ id }: { id: string }) {
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const hydratedRef = useRef<string | null>(null);
  const saveRef = useRef<(sceneData: unknown) => void>(null);
  useUndoRedo();

  const queryClient = useQueryClient();
  const queryOptions = orpc.workspace.get.queryOptions({
    input: { id },
  });
  const { data: workspace, isLoading } = useQuery(queryOptions);

  const updateMutation = useUpdateWorkspace({
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('idle'),
  });

  // Clear store immediately when workspace ID changes
  useEffect(() => {
    hydratedRef.current = null;
    useSceneStore.getState().loadScene(null);
  }, [id]);

  useEffect(() => {
    if (workspace && hydratedRef.current !== id) {
      hydratedRef.current = id;
      useSceneStore.getState().loadScene(workspace.sceneData);
    }
  }, [workspace, id]);

  const saveSceneData = useCallback(
    (sceneData: unknown) => {
      const json = JSON.stringify(sceneData);
      if (json.length > MAX_SCENE_DATA_SIZE) {
        console.warn(
          `Scene data exceeds ${formatBytes(MAX_SCENE_DATA_SIZE)} limit, skipping auto-save`
        );
        return;
      }
      updateMutation.mutate({ id: id, sceneData });
      queryClient.setQueryData(queryOptions.queryKey, (old) => {
        if (old) {
          return { ...old, sceneData };
        }
        return old;
      });
    },
    [id, updateMutation, queryClient, queryOptions.queryKey]
  );

  useEffect(() => {
    saveRef.current = saveSceneData;
  });

  const debouncedSave = useDebounced(saveSceneData, 1500);

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
      {
        equalityFn: (a, b) =>
          a.elements === b.elements && a.sceneSettings === b.sceneSettings,
      }
    );

    return () => {
      unsubscribe();
      debouncedSave.cancel();
      if (hydratedRef.current === id) {
        const state = useSceneStore.getState();
        saveRef.current?.({
          elements: state.elements,
          sceneSettings: state.sceneSettings,
        });
      }
    };
  }, [debouncedSave, id]);

  useEffect(() => {
    if (workspace?.title) {
      setTitle(workspace.title);
    }
  }, [workspace?.title]);

  const handleTitleBlur = useCallback(() => {
    if (title && title !== workspace?.title) {
      updateMutation.mutate({ id: id, title });
    }
  }, [title, workspace?.title, id, updateMutation]);

  if (!workspace && !isLoading) {
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
          isLoading={isLoading}
        />

        <SidebarInset>
          <div className="@container/main flex flex-1">
            <WorkspaceCanvas loading={isLoading} />
          </div>
        </SidebarInset>

        <WorkspaceToolbar />

        <Sidebar
          side="right"
          collapsible="offcanvas"
          className="text-sidebar-foreground top-12 pb-12"
          sidebarColor="bg-background"
          transition={false}
        >
          <SidebarHeader className="border-b p-4">
            <h3 className="text-sm font-semibold">AI Chat</h3>
            <p className="text-muted-foreground text-xs">
              Describe the 3D illustration you want
            </p>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto p-0">
            {workspace ? (
              <WorkspaceChat
                workspaceId={id}
                initialMessages={dbMessagesToAiMessages(workspace.messages)}
              />
            ) : (
              <div className="flex h-full w-full flex-col">
                <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
                  <Loader /> Loading chat...
                </div>

                <div className="border-t p-3">
                  <div className="relative">
                    <Textarea
                      placeholder="Describe the 3D illustration you want..."
                      rows={3}
                      disabled={isLoading}
                      className="resize-none pr-12"
                    />
                    <Button
                      size="icon"
                      className="absolute right-2 bottom-2 size-7"
                      disabled={isLoading}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
}
