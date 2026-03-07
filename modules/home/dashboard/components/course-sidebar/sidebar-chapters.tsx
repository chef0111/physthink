'use client';

import { CoursePreviewDTO } from '@/app/server/course/dto';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { ChevronDown, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export const CourseSidebarChapters = ({
  course,
}: {
  course: CoursePreviewDTO;
}) => {
  const pathname = usePathname();

  return (
    <SidebarContent className="px-4 pt-0 pb-4">
      <SidebarGroup className="p-0">
        <SidebarMenu className="gap-1">
          {course.chapters.map((chapter, index) => (
            <Collapsible
              key={chapter.id}
              defaultOpen={index === 0}
              className="space-y-2"
            >
              <CollapsibleTrigger className="w-full outline-none">
                <div className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg border p-4 transition-colors">
                  <div className="flex items-center gap-3 truncate text-left">
                    <ChevronDown className="text-muted-foreground size-4 transition-transform duration-200 in-data-[state=open]:-rotate-180" />
                    <div className="w-full truncate">
                      <h3
                        className="truncate text-sm font-semibold"
                        title={chapter.title}
                      >
                        {chapter.title}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {chapter.lessons.length} lesson
                        {chapter.lessons.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden data-[state=open]:pb-2">
                <div className="ml-2 flex flex-col gap-2 border-l-2 pr-2 pl-3">
                  {chapter.lessons.map((lesson, lessonIndex) => {
                    const lessonUrl = `/dashboard/course/${course.slug}/${lesson.id}`;
                    const isActive = pathname === lessonUrl;

                    return (
                      <Link
                        key={lesson.id}
                        href={lessonUrl as Route}
                        className={cn(
                          'group/lesson flex items-center gap-3 rounded-md p-3 transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary border-primary/20 border'
                            : 'bg-card border-border hover:bg-muted/50 border'
                        )}
                      >
                        <PlayCircle
                          className={cn(
                            'size-4 shrink-0',
                            isActive
                              ? 'text-primary fill-primary/20'
                              : 'text-muted-foreground group-hover/lesson:text-primary transition-colors'
                          )}
                        />
                        <span
                          className="truncate text-sm font-medium"
                          title={lesson.title}
                        >
                          {lessonIndex + 1}. {lesson.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
};
