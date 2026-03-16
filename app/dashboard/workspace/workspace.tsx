import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { WorkspaceListDTO } from '@/app/server/workspace/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, queryFetch } from '@/lib/query/helper';
import { WorkspaceCard } from '@/modules/home/workspace/components/workspace-card';
import {
  EmptyWorkspace,
  ErrorWorkspace,
} from '@/modules/home/workspace/layout/state';
import { NextPagination } from '@/components/ui/next-pagination';

export async function WorkspaceList({
  searchParams,
}: Pick<RouteParams, 'searchParams'>) {
  const { page, pageSize, query, sort } = await searchParams;

  const queryClient = getQueryClient();

  const queryOptions = orpc.workspace.list.queryOptions({
    input: {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 12,
      query,
      sort,
    },
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

  const { data: totalWorkspaces } = resolveData(
    result,
    (data) => data.totalWorkspaces,
    0
  );

  return (
    <>
      <DataRenderer
        data={workspaces}
        success={success}
        error={error}
        renderEmpty={() => <EmptyWorkspace />}
        renderError={() => <ErrorWorkspace message={error?.message} />}
        render={(workspaces) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      />
      <NextPagination
        page={page}
        pageSize={pageSize}
        totalCount={totalWorkspaces}
        className="py-10"
      />
    </>
  );
}
