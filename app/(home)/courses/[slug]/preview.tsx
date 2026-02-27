import { orpc } from '@/lib/orpc';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getQueryClient } from '@/lib/query/hydration';
import { MarkdownPreview } from '@/components/editor/markdown/preview';
import { ContentPreview } from '@/modules/home/courses/components/content-preview';
import { EnrollCard } from '@/modules/home/courses/components/enroll-card';
import { ChartColumnBig, Clock, School } from 'lucide-react';
import Image from 'next/image';

export const Preview = async ({ params }: Pick<RouteParams, 'params'>) => {
  const { slug } = await params;
  const queryClient = getQueryClient();
  const queryOptions = orpc.course.getPublic.queryOptions({ input: { slug } });

  const course = await queryClient.fetchQuery(queryOptions);
  const chaptersCount = course.chapters.length;
  const lessonsCount = course.chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  );

  return (
    <>
      <div className="order-1 lg:col-span-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
          <Image
            src={course.thumbnail}
            alt="Course thumbnail"
            className="object-cover"
            fill
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20" />
        </div>

        <div className="mt-8 space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground line-clamp-2 text-lg leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-primary/10 border-primary/30 flex items-center gap-2 rounded-md px-2 py-3">
              <ChartColumnBig className="text-primary size-4" />
              <span className="text-foreground">{course.level}</span>
            </Badge>
            <Badge className="bg-primary/10 border-primary/30 flex items-center gap-2 rounded-md px-2 py-3">
              <School className="text-primary size-4" />
              <span className="text-foreground">{course.category}</span>
            </Badge>
            <Badge className="bg-primary/10 border-primary/30 flex items-center gap-2 rounded-md px-2 py-3">
              <Clock className="text-primary size-4" />
              <span className="text-foreground">
                {course.duration} {course.duration > 1 ? 'hours' : 'hour'}
              </span>
            </Badge>
          </div>

          <Card className="mt-8 p-4">
            <MarkdownPreview content={course.readme} />
          </Card>

          <div className="mt-12 space-y-6">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Course Content
              </h2>
              <span>
                {chaptersCount} {chaptersCount > 1 ? 'Chapters' : 'Chapter'} |{' '}
                {lessonsCount} {lessonsCount > 1 ? 'Lessons' : 'Lesson'}
              </span>
            </div>

            <ContentPreview course={course} />
          </div>
        </div>
      </div>

      <EnrollCard course={course} />
    </>
  );
};
