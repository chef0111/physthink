import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { DataRenderer } from '@/components/data-renderer';
import { queryFetch } from '@/lib/query/helper';
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

  const result = await queryFetch({
    promise: queryClient.fetchQuery(queryOptions),
    fallbackMessage: 'Failed to get workspaces',
  });

  const { workspaces, totalWorkspaces } = result.success
    ? result.data
    : { workspaces: [], totalWorkspaces: 0 };

  return (
    <>
      <DataRenderer
        data={workspaces}
        success={result.success}
        error={result.error}
        renderEmpty={() => <EmptyWorkspace />}
        renderError={(message) => <ErrorWorkspace message={message} />}
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
