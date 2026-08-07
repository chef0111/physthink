import { orpc } from '@/lib/orpc';
import { EMPTY_COURSE } from '@/common/constants/states';
import { DataRenderer } from '@/components/data-renderer';
import { NextPagination } from '@/components/ui/next-pagination';
import { queryFetch } from '@/lib/query/helper';
import { getQueryClient } from '@/lib/query/hydration';
import CourseCard from '@/modules/admin/course/components/course-card';
import { GridLayout } from '@/modules/admin/course/layout/grid-layout';

export async function CourseList({
  searchParams,
}: Pick<RouteParams, 'searchParams'>) {
  const { page, pageSize, query, sort, filter } = await searchParams;

  const queryClient = getQueryClient();

  const queryOptions = orpc.course.list.queryOptions({
    input: {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 6,
      query,
      sort,
      filter,
    },
  });

  const result = await queryFetch({
    promise: queryClient.fetchQuery(queryOptions),
    fallbackMessage: 'Failed to get courses',
  });

  const { courses, totalCourses } = result.success
    ? result.data
    : { courses: [], totalCourses: 0 };

  return (
    <>
      <DataRenderer
        data={courses}
        success={result.success}
        error={result.error}
        empty={EMPTY_COURSE}
        render={(courses) => (
          <GridLayout>
            {courses.map((course) => (
              <CourseCard key={course.id} data={course} />
            ))}
          </GridLayout>
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
}
