import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import Link from 'next/link';
import { Route } from 'next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { LessonForm } from '@/modules/admin/lesson/components/lesson-form';

export default async function LessonPage({ params }: RouteParams) {
  const { lessonId, courseId } = await params;
  const queryClient = getQueryClient();

  const lessonQueryOptions = orpc.lesson.get.queryOptions({
    input: { id: lessonId },
  });

  const slugQueryOptions = orpc.course.getSlug.queryOptions({
    input: { id: courseId },
  });

  const [lesson, course] = await Promise.all([
    queryClient.fetchQuery(lessonQueryOptions),
    queryClient.fetchQuery(slugQueryOptions),
  ]);

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" title="Go back" asChild>
          <Link href={`/admin/courses/${courseId}/edit?tab=structure` as Route}>
            <ArrowLeft />
            <span className="sr-only">Go back</span>
          </Link>
        </Button>

        <h1 className="text-2xl font-bold">{lesson.title}</h1>
      </div>

      <Card>
        <CardContent className="space-y-8 px-8">
          <CardHeader className="px-0">
            <CardTitle className="text-xl">Lesson Configuration</CardTitle>
            <CardDescription>
              Configure the structure and content of this lesson
            </CardDescription>
          </CardHeader>
          <LessonForm
            lesson={lesson}
            courseId={courseId}
            courseSlug={course.slug}
          />
        </CardContent>
      </Card>
    </>
  );
}
