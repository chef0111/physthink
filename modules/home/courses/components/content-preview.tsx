import { CoursePreviewDTO } from '@/app/server/course/dto';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, PlayIcon } from 'lucide-react';

interface ContentPreviewProps {
  course: CoursePreviewDTO;
}

export const ContentPreview = ({ course }: ContentPreviewProps) => {
  return (
    <div className="space-y-4 pb-10">
      {course.chapters.map((chapter, index) => (
        <Collapsible key={chapter.id} defaultOpen={index === 0}>
          <Card className="gap-0 overflow-hidden border-2 p-0 transition-all duration-200 hover:shadow-md">
            <CollapsibleTrigger>
              <CardContent className="hover:bg-muted/50 p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full text-base font-bold">
                      {index + 1}
                    </Badge>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{chapter.title}</h3>
                      <p className="text-muted-foreground mt-1">
                        {chapter.lessons.length} lesson
                        {chapter.lessons.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="text-muted-foreground rounded-sm text-xs"
                    >
                      {chapter.lessons.length} lesson
                      {chapter.lessons.length > 1 ? 's' : ''}
                    </Badge>
                    <ChevronDown className="text-muted-foreground size-5" />
                  </div>
                </div>
              </CardContent>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="bg-muted/30 border-t">
                <div className="space-y-1 p-4">
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="hover:bg-muted group flex items-center gap-2 rounded-lg p-2 transition-colors"
                    >
                      <div className="bg-background border-primary/30 flex size-8 items-center justify-center rounded-full border-2">
                        <PlayIcon className="text-primary size-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-muted-foreground text-xs">
                          Lesson {lessonIndex + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
};
