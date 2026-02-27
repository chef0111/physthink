import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { PublicCourseListDTO } from '@/app/server/course/dto';
import { DataRenderer } from '@/components/data-renderer';
import { NextPagination } from '@/components/ui/next-pagination';
import { resolveData, safeFetch } from '@/lib/query/helper';
import CourseCard from '@/modules/home/courses/components/course-card';
import { EmptyCourseList } from '@/modules/home/courses/layout/empty';

export async function CourseList({
  searchParams,
}: Pick<RouteParams, 'searchParams'>) {
  const { page, pageSize, query, sort, filter } = await searchParams;

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

  const result = await safeFetch<PublicCourseListDTO>(
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
}
