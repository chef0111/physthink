import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <Card className="group relative flex flex-col gap-2 border pt-3 pb-0">
      <div className="relative mx-3 aspect-video">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
      <CardContent className="mt-1 flex flex-col gap-0! px-4 pb-0">
        <div>
          <Skeleton className="h-4.5 w-3/4 max-w-64" />
          <Skeleton className="mt-2 h-3.5 w-full max-w-96" />
        </div>

        <div className="mt-5 flex h-full items-end gap-x-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-5.5" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-5.5" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-5.5" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-accent dark:bg-muted/50 border-t p-3!">
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
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
