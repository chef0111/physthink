import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GridLayout } from './grid-layout';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

export const CourseListSkeleton = () => {
  return (
    <GridLayout>
      {Array.from({ length: 6 }).map((_, index) => (
        <CourseSkeleton key={index} />
      ))}
    </GridLayout>
  );
};

export const CourseSkeleton = () => {
  return (
    <Card className="group relative flex flex-col border pt-3 pb-4">
      <div className="relative mx-3">
        <Skeleton className="h-72 w-full rounded-md sm:h-54 md:h-64" />
      </div>
      <CardContent className="flex h-36 flex-col gap-0! px-4">
        <div>
          <Skeleton className="h-5 w-64 max-w-full" />
          <Skeleton className="mt-2 h-4 w-88 max-w-full" />
        </div>

        <div className="mb-4 flex h-full items-end gap-x-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-6" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-14" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-10" />
          </div>
        </div>

        <Skeleton className="h-32 w-full rounded-md" />
      </CardContent>
    </Card>
  );
};

export const CourseStructureSkeleton = () => {
  return (
    <Card className="rounded-lg pt-0">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4!">
        <CardTitle className="text-lg">Chapters</CardTitle>
        <Button>
          <PlusIcon /> New chapter
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChapterCardSkeleton />
        <ChapterCardSkeleton />
      </CardContent>
    </Card>
  );
};

export const ChapterCardSkeleton = () => {
  return (
    <Card className="rounded-lg py-0">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex h-8 w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7.5 rounded-md" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-1.75">
            <Skeleton className="size-7.5 rounded-md" />
            <Skeleton className="size-7.5 rounded-md" />
            <Skeleton className="size-7.5 rounded-md" />
          </div>
        </div>
      </div>
      <CardContent className="px-4 pb-4">
        <div className="flex w-full flex-col gap-2 pb-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-md" />
      </CardContent>
    </Card>
  );
};
