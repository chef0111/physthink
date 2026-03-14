import { ChevronDown } from 'lucide-react';
import { CalendarSkeleton } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FilterSelectFallback,
  SortSelectFallback,
} from '@/components/filter/fallback';

export const WelcomeBannerFallback = () => {
  return (
    <div className="flex flex-col items-start max-lg:w-full sm:flex-row sm:items-center lg:flex-col lg:items-start">
      <div className="my-auto flex h-fit flex-col gap-3 max-lg:w-full">
        <Skeleton className="h-5.5 w-48" />
        <Skeleton className="mb-8 h-4.5 w-2/3 max-sm:mb-4" />
      </div>
      <div className="mx-auto flex w-full flex-col gap-4 sm:w-fit">
        <Skeleton className="h-4 w-20 max-lg:hidden" />
        <CalendarSkeleton className="ring-border/20 mb-0 rounded-lg border ring-3 max-lg:hidden" />
      </div>
      <Card className="mt-4 flex w-full flex-col gap-2 space-y-2 p-4 sm:w-fit lg:w-full">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </Card>
    </div>
  );
};

export const CourseFilterFallback = () => {
  return (
    <>
      <SortSelectFallback
        className="max-sm:w-full"
        containerClassName="max-sm:w-full"
      />
      <FilterSelectFallback
        className="max-sm:w-full"
        containerClassName="max-sm:w-full"
      />
    </>
  );
};

export const CourseOverviewSkeleton = () => {
  return (
    <section className="w-full">
      <div className="relative aspect-21/9 w-full overflow-hidden rounded-xl shadow-lg">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="mt-8 space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-7.5 w-3/4" />
          <Skeleton className="mt-2 h-6 w-full" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>

        <Card className="mt-8 gap-4 p-4">
          <Skeleton className="h-7.5 w-1/3" />
          {Array.from({ length: 3 }).map((_, index) => (
            <CardContent key={index} className="flex flex-col gap-2 p-0">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          ))}
        </Card>
      </div>
    </section>
  );
};

export function CourseSidebarSkeleton() {
  return (
    <Sidebar
      side="left"
      collapsible="offcanvas"
      className="bg-sidebar top-14 border-l"
      mobileWidth="md"
    >
      {/* Header Skeleton */}
      <div className="border-sidebar-border flex items-center gap-3 border-b p-4">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex w-full flex-col gap-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>

      {/* Progress Skeleton */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4.5 w-16" />
          <Skeleton className="h-4.5 w-12" />
        </div>
        <Skeleton className="mt-px h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Chapters Skeleton */}
      <SidebarChaptersSkeleton />
    </Sidebar>
  );
}

export const SidebarChaptersSkeleton = () => {
  return (
    <SidebarContent className="px-4 pt-0 pb-18">
      <SidebarGroup className="p-0">
        <SidebarMenu className="gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Collapsible
              key={index}
              defaultOpen={index === 0}
              className="space-y-2"
            >
              <CollapsibleTrigger className="w-full outline-none" disabled>
                <div className="bg-muted/50 flex w-full items-center justify-between rounded-lg border p-4 transition-colors">
                  <div className="flex w-full items-center gap-3 text-left">
                    <ChevronDown className="text-muted-foreground size-5 transition-transform duration-200 in-data-[state=open]:-rotate-180" />
                    <div className="w-full space-y-2">
                      <Skeleton className="h-4.5 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="data-[state=open]:pb-2">
                <div className="ml-2 flex flex-col gap-2 border-l-2 pr-2 pl-3">
                  {Array.from({ length: 6 }).map((_, lessonIndex) => {
                    return (
                      <Card
                        key={lessonIndex}
                        className="group flex-row items-center gap-3 rounded-md p-3 transition-colors"
                      >
                        <Skeleton className="size-5 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-full" />
                      </Card>
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
