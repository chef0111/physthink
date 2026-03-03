import { DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChapterCard } from './chapter-card';
import { LessonCard } from './lesson-card';
import { SortableItem } from './sortable-item';

type LessonItem = {
  id: string;
  title: string;
  content?: string | null;
  thumbnail?: string | null;
  video?: string | null;
  order: number;
};

type ChapterItem = {
  id: string;
  title: string;
  order: number;
  isOpen: boolean;
  lessons: LessonItem[];
};

type ActiveItem =
  | { type: 'chapter'; id: string }
  | { type: 'lesson'; id: string; chapterId: string };

interface CourseStructureContentProps {
  items: ChapterItem[];
  courseId: string;
  courseSlug: string;
  toggleChapter: (chapterId: string) => void;
  onOptimisticCreate?: (
    item:
      | { type: 'chapter'; id: string; title: string }
      | { type: 'lesson'; id: string; chapterId: string; title: string }
  ) => void;
}

export function CourseStructureContent({
  items,
  courseId,
  courseSlug,
  toggleChapter,
  onOptimisticCreate,
}: CourseStructureContentProps) {
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {items.map((item) => (
        <SortableItem key={item.id} id={item.id} data={{ type: 'chapter' }}>
          {(listeners) => (
            <ChapterCard
              data={item}
              onOpenChange={() => toggleChapter(item.id)}
              listeners={listeners}
              courseId={courseId}
              courseSlug={courseSlug}
              onOptimisticCreate={onOptimisticCreate}
            >
              <SortableContext
                items={item.lessons.map((lesson) => lesson.id)}
                strategy={verticalListSortingStrategy}
              >
                {item.lessons.map((lesson) => (
                  <SortableItem
                    key={lesson.id}
                    id={lesson.id}
                    data={{ type: 'lesson', chapterId: item.id }}
                  >
                    {(lessonListeners) => (
                      <LessonCard
                        courseId={courseId}
                        courseSlug={courseSlug}
                        chapterId={item.id}
                        data={lesson}
                        listeners={lessonListeners}
                      />
                    )}
                  </SortableItem>
                ))}
              </SortableContext>
            </ChapterCard>
          )}
        </SortableItem>
      ))}
    </SortableContext>
  );
}

interface DragOverlayProps {
  activeItem: ActiveItem | null;
  activeChapter: ChapterItem | null | undefined;
  activeLesson: LessonItem | null | undefined;
  courseId: string;
  courseSlug: string;
}

export function ContentDragOverlay({
  activeItem,
  activeChapter,
  activeLesson,
  courseId,
  courseSlug,
}: DragOverlayProps) {
  return (
    <DragOverlay dropAnimation={null}>
      {activeChapter && (
        <ChapterCard
          data={activeChapter}
          onOpenChange={() => {}}
          courseId={courseId}
          courseSlug={courseSlug}
        >
          {activeChapter.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              courseId={courseId}
              courseSlug={courseSlug}
              chapterId={activeChapter.id}
              data={lesson}
            />
          ))}
        </ChapterCard>
      )}
      {activeLesson && activeItem?.type === 'lesson' && (
        <LessonCard
          courseId={courseId}
          courseSlug={courseSlug}
          chapterId={activeItem.chapterId}
          data={activeLesson}
        />
      )}
    </DragOverlay>
  );
}
