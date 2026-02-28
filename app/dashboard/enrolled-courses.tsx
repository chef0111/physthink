import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { PublicCourseListDTO } from '@/app/server/course/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, safeFetch } from '@/lib/query/helper';
import CourseCard from '@/modules/home/courses/components/course-card';
import { NextPagination } from '@/components/ui/next-pagination';
import { EmptyEnrolledCourses } from '@/modules/home/courses/layout/empty';

export async function EnrolledCourses({
  searchParams,
}: Pick<RouteParams, 'searchParams'>) {
  const { page, pageSize, query, sort, filter } = await searchParams;

  const queryClient = getQueryClient();

  const queryOptions = orpc.course.listEnrolled.queryOptions({
    input: {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 6,
      query,
      sort,
      filter,
    },
  });

  const result = await safeFetch<PublicCourseListDTO>(
    queryClient.fetchQuery(queryOptions),
    'Failed to fetch enrolled courses'
  );

  const {
    data: enrolledCourses,
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
        data={enrolledCourses}
        success={success}
        error={error}
        renderEmpty={() => (
          <div className="bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed">
            <EmptyEnrolledCourses />
          </div>
        )}
        render={(courses) => (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={`enrolled-${course.id}`}
                data={course}
                href="dashboard/course"
                action="View Course"
              />
            ))}
          </div>
        )}
      />
      <NextPagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCourses}
        className="pt-6"
      />
    </>
  );
}
