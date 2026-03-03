import { cache } from 'react';
import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/ui/sidebar';
import { MarkdownPreview } from '@/components/editor/markdown/preview';
import {
  CourseSidebarHeader,
  CourseSidebarProgress,
  CourseSidebarChapters,
} from '@/modules/home/dashboard/components/course-sidebar';
import { ChartColumnBig, ClockIcon, SchoolIcon } from 'lucide-react';

export const getCourseData = cache(async (slug: string) => {
  const queryClient = getQueryClient();
  const queryOptions = orpc.course.getPublic.queryOptions({ input: { slug } });
  return await queryClient.fetchQuery(queryOptions);
});

export const CourseSidebar = async ({ slug }: { slug: string }) => {
  const course = await getCourseData(slug);

  return (
    <Sidebar
      side="left"
      collapsible="offcanvas"
      className="bg-sidebar top-14 border-l"
    >
      <CourseSidebarHeader course={course} />
      <CourseSidebarProgress course={course} />
      <CourseSidebarChapters course={course} />
    </Sidebar>
  );
};

export const CourseOverview = async ({
  params,
}: Pick<RouteParams, 'params'>) => {
  const { slug } = await params;
  const course = await getCourseData(slug);
  return (
    <section className="mx-auto">
      <div className="relative aspect-21/9 w-full overflow-hidden rounded-xl shadow-lg">
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
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
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
            <SchoolIcon className="text-primary size-4" />
            <span className="text-foreground">{course.category}</span>
          </Badge>
          <Badge className="bg-primary/10 border-primary/30 flex items-center gap-2 rounded-md px-2 py-3">
            <ClockIcon className="text-primary size-4" />
            <span className="text-foreground">
              {course.duration} {course.duration > 1 ? 'hours' : 'hour'}
            </span>
          </Badge>
        </div>

        <Card className="mt-8 p-4">
          <MarkdownPreview content={course.readme} />
        </Card>
      </div>
    </section>
  );
};
