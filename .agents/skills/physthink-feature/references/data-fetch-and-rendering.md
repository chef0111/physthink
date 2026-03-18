# Data Fetch and Rendering Pattern

## Why this pattern exists

This codebase keeps data fetching and state resolution in server components, then centralizes empty/error/success rendering through a reusable DataRenderer component.

## Canonical flow

1. Build oRPC query options.
2. Execute through `queryClient.fetchQuery(...)`.
3. Wrap with `queryFetch(...)` for standardized result shape.
4. Extract data via `resolveData(...)` with defaults.
5. Render using `DataRenderer`.
6. Add pagination using `NextPagination` where applicable.

## Code example: server fetch + state resolution + rendering

Source: `app/(home)/courses/courses.tsx`

```tsx
const queryClient = getQueryClient();

const queryOptions = orpc.course.listPublic.queryOptions({
  input: {
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 10,
    query,
    sort,
    filter,
  },
});

const result = await queryFetch<PublicCourseListDTO>(
  queryClient.fetchQuery(queryOptions),
  'Failed to get courses'
);

const {
  data: courses,
  success,
  error,
} = resolveData(result, (data) => data.courses, []);

const { data: totalCourses } = resolveData(
  result,
  (data) => data.totalCourses,
  0
);

return (
  <>
    <DataRenderer
      data={courses}
      success={success}
      error={error}
      renderEmpty={() => <EmptyCourseList />}
      render={(courses) => (
        <div className="grid grid-cols-1 gap-6 max-sm:pt-24 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} data={course} />
          ))}
        </div>
      )}
    />
    <NextPagination
      page={page}
      pageSize={pageSize}
      totalCount={totalCourses}
      className="py-10"
    />
  </>
);
```

## Code example: parallel fetches in a single server container

Source: `app/dashboard/courses.tsx`

```tsx
const [enrolledResult, availableResult] = await Promise.all([
  queryFetch<PublicCourseListDTO>(
    queryClient.fetchQuery(enrolledOptions),
    'Failed to fetch enrolled courses'
  ),
  queryFetch<PublicCourseListDTO>(
    queryClient.fetchQuery(availableOptions),
    'Failed to fetch available courses'
  ),
]);
```

## Code example: reusable view-state abstraction

Source: `components/data-renderer/index.tsx`

```tsx
export function DataRenderer<T>({
  success,
  error,
  data,
  empty = DEFAULT_EMPTY,
  errorState = DEFAULT_ERROR,
  renderEmpty,
  renderError,
  render,
}: DataRendererProps<T>) {
  if (!success) {
    if (renderError) return <>{renderError(error?.message)}</>;
    return <DefaultErrorState config={errorState} message={error?.message} />;
  }

  if (!data || data.length === 0) {
    if (renderEmpty) return <>{renderEmpty()}</>;
    return <DefaultEmptyState config={empty} />;
  }

  return <>{render(data)}</>;
}
```

## File-backed examples

- `app/(home)/courses/courses.tsx`
  - Uses `getQueryClient`, `queryFetch`, `resolveData`, and `DataRenderer` for public course list.
- `app/dashboard/courses.tsx`
  - Runs parallel fetches (`Promise.all`) for enrolled/public sets, resolves each result, renders each via `DataRenderer`.
- `components/data-renderer/index.tsx`
  - Encodes the default success/error/empty branching contract.
- `components/data-renderer/default-states.tsx`
  - Provides shared default empty/error visual states.
- `app/(home)/courses/page.tsx`
  - Wraps filter/list server fragments in `Suspense` with explicit skeleton/fallback boundaries.

## Implementation notes

- Do not duplicate ad-hoc empty/error blocks in page-level components if `DataRenderer` can express it.
- Prefer `renderEmpty`/`renderError` overrides for feature-specific UX.
- Keep list defaults explicit in `resolveData(..., fallback)` to prevent undefined array handling downstream.
- Keep fetch-state utilities (`queryFetch`, `resolveData`) in shared helpers (`lib/query/helper.ts`) instead of duplicating try/catch in components.
