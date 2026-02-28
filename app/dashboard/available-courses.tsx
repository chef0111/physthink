import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { PublicCourseListDTO } from '@/app/server/course/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, safeFetch } from '@/lib/query/helper';
import CourseCard from '@/modules/home/courses/components/course-card';

export async function AvailableCourses() {
  const queryClient = getQueryClient();

  const queryOptions = orpc.course.listPublic.queryOptions({
    input: { filter: 'unregistered', pageSize: 4 },
  });

  const result = await safeFetch<PublicCourseListDTO>(
    queryClient.fetchQuery(queryOptions),
    'Failed to fetch available courses'
  );

  const {
    data: publicCourses,
    success,
    error,
  } = resolveData(result, (data) => data.courses, []);

  return (
    <>
      <DataRenderer
        data={publicCourses}
        success={success}
        error={error}
        renderEmpty={() => (
          <div className="text-muted-foreground py-8 text-center">
            No new available courses at the moment.
          </div>
        )}
        render={(courses) => (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard
                key={`public-${course.id}`}
                data={course}
                renderFooter={false}
              />
            ))}
          </div>
        )}
      />
    </>
  );
}
