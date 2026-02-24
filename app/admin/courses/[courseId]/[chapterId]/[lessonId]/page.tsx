import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { ArrowLeft } from 'lucide-react';
import { Route } from 'next';
import Link from 'next/link';

export default async function LessonPage({ params }: RouteParams) {
  const { lessonId, chapterId, courseId } = await params;
  const queryClient = getQueryClient();

  const queryOptions = orpc.lesson.get.queryOptions({
    input: { id: lessonId },
  });

  const lesson = await queryClient.fetchQuery(queryOptions);

  return (
    <div>
      <Button variant="outline" size="icon" asChild>
        <Link href={`/admin/courses/${courseId}/edit?tab=structure` as Route}>
          <ArrowLeft />
          <span className="sr-only">Go back</span>
        </Link>
      </Button>
    </div>
  );
}
