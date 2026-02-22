import { CoursesListDTO } from '@/app/server/course/dto';
import { EMPTY_COURSE } from '@/common/constants/states';
import { DataRenderer } from '@/components/data-renderer';
import { orpc } from '@/lib/orpc';
import { resolveData, safeFetch } from '@/lib/query/helper';
import { getQueryClient } from '@/lib/query/hydration';
import CourseCard from '@/modules/admin/course/course-card';
import { GridLayout } from './grid-layout';

export async function CourseList({
  searchParams,
}: Pick<RouteParams, 'searchParams'>) {
  const { page, pageSize, query, sort, filter } = await searchParams;

  const queryClient = getQueryClient();

  const queryOptions = orpc.course.list.queryOptions({
    input: {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      query,
      sort,
      filter,
    },
  });

  const result = await safeFetch<CoursesListDTO>(
    queryClient.fetchQuery(queryOptions),
    'Failed to get courses'
  );

  const {
    data: courses,
    success,
    error,
  } = resolveData(result, (data) => data.courses, []);

  return (
    <DataRenderer
      data={courses}
      success={success}
      error={error}
      empty={EMPTY_COURSE}
      render={(courses) => (
        <GridLayout>
          {courses.map((course) => (
            <CourseCard key={course.id} data={course} />
          ))}
        </GridLayout>
      )}
    />
  );
}
