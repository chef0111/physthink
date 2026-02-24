import { Button } from '@/components/ui/button';
import { CourseTabs } from '@/modules/admin/course/components/course-tabs';
import { CourseForm } from '@/modules/admin/course/components/course-form';
import { CourseStructure } from '@/modules/admin/course/components/course-structure';
import { orpc } from '@/lib/orpc';
import { getQueryClient, HydrateClient } from '@/lib/query/hydration';
import { ArrowLeft } from 'lucide-react';
import { Route } from 'next';
import Link from 'next/link';

export default async function EditCourse({ params }: RouteParams) {
  const { courseId } = await params;
  const queryClient = getQueryClient();

  const queryOptions = orpc.course.get.queryOptions({
    input: { id: courseId },
  });

  const course = await queryClient.fetchQuery(queryOptions);

  return (
    <HydrateClient client={queryClient}>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          Edit Course:{' '}
          <Link
            href={`/courses/${course.slug}` as Route}
            className="text-primary underline-offset-4 hover:underline"
          >
            {course.title}
          </Link>
        </h1>
      </div>

      <CourseTabs
        basic={<CourseForm course={course} isEdit />}
        structure={<CourseStructure courseId={courseId} />}
      />
    </HydrateClient>
  );
}
