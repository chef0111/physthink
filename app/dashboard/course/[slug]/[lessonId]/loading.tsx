import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function LessonLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="w-full">
        <Skeleton className="h-8 w-3/4 max-w-100" />
        <Skeleton className="mt-4 h-4 w-40" />
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border shadow-lg">
        <Skeleton className="h-full w-full border" />
      </div>

      <Card className="gap-4 p-4">
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
  );
}
