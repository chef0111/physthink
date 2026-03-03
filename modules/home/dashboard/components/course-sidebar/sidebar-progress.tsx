import { CoursePreviewDTO } from '@/app/server/course/dto';
import { Progress } from '@/components/ui/progress';

export const CourseSidebarProgress = ({
  course,
}: {
  course: CoursePreviewDTO;
}) => {
  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0
  );

  const completedLessons = 8;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Progress</span>
        <span className="font-semibold">
          {completedLessons}/{totalLessons} lessons
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2 w-full" />
      <span className="text-muted-foreground text-xs">
        {progressPercentage}% complete
      </span>
    </div>
  );
};
