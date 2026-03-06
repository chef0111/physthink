'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc, client } from '@/lib/orpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Box, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { WorkspaceCard } from './workspace-card';
import { Loader } from '@/components/ui/loader';
import { Skeleton } from '@/components/ui/skeleton';

export function WorkspaceList() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    orpc.workspace.list.queryOptions({ input: { page: 1, pageSize: 50 } })
  );

  const createMutation = useMutation({
    mutationFn: (input: { title?: string }) => client.workspace.create(input),
    onSuccess: (workspace) => {
      router.push(`/dashboard/workspace/${workspace.id}`);
    },
    onSettled: () => setIsCreating(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { id: string }) => client.workspace.delete(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.workspace.list.queryOptions({
          input: { page: 1, pageSize: 50 },
        }).queryKey,
      });
    },
  });

  const handleCreate = () => {
    setIsCreating(true);
    createMutation.mutate({});
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const workspaces = data?.workspaces ?? [];

  if (isLoading) {
    return <WorkspaceListSkeleton />;
  }

  if (workspaces.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-16">
            <Box className="size-10" />
          </EmptyMedia>
          <EmptyTitle>No workspaces yet</EmptyTitle>
          <EmptyDescription>
            Create your first 3D illustration workspace
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? <Loader /> : <Plus className="size-4" />}
            New Workspace
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          New Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function WorkspaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-1/3 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
