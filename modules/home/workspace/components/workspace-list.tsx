import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { WorkspaceListDTO } from '@/app/server/workspace/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, queryFetch } from '@/lib/query/helper';
import { WorkspaceCard } from './workspace-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Box } from 'lucide-react';

export async function WorkspaceList() {
  const queryClient = getQueryClient();

  const queryOptions = orpc.workspace.list.queryOptions({
    input: { page: 1, pageSize: 50 },
  });

  const result = await queryFetch<WorkspaceListDTO>(
    queryClient.fetchQuery(queryOptions),
    'Failed to get workspaces'
  );

  const {
    data: workspaces,
    success,
    error,
  } = resolveData(result, (data) => data.workspaces, []);

  return (
    <DataRenderer
      data={workspaces}
      success={success}
      error={error}
      renderEmpty={() => (
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
        </Empty>
      )}
      render={(workspaces) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    />
  );
}

export function WorkspaceListSkeleton() {
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
