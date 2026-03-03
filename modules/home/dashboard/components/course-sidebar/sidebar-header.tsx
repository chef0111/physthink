import { CoursePreviewDTO } from '@/app/server/course/dto';
import { SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';
import { PlayIcon } from 'lucide-react';
import Link from 'next/link';

export const CourseSidebarHeader = ({
  course,
}: {
  course: CoursePreviewDTO;
}) => {
  return (
    <Link href={`/dashboard/course/${course.slug}`}>
      <SidebarHeader className="border-sidebar-border hover:bg-muted/50 flex-row items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <PlayIcon className="text-primary size-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="truncate text-sm font-semibold">
              {course.title}
            </span>
            <span className="text-muted-foreground text-xs">
              {course.category}
            </span>
          </div>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
    </Link>
  );
};
