'use client';

import { useEffect, useId, useState, useOptimistic } from 'react';
import {
  Active,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  Over,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CourseDTO } from '@/app/server/course/dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useReorderLesson } from '@/queries/lesson';
import { useReorderChapter } from '@/queries/chapter';
import { orpc } from '@/lib/orpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ContentDragOverlay, CourseStructureContent } from './content';
import { CreateItemForm } from './create-item-form';
import { EmptyCourseStructure } from './empty';

interface CourseStructureProps {
  courseId: string;
}

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

export const CourseStructure = ({ courseId }: CourseStructureProps) => {
  const { data } = useSuspenseQuery(
    orpc.course.get.queryOptions({ input: { id: courseId } })
  );
  const [createOpen, setCreateOpen] = useState(false);
  const dndId = useId();

  const buildItems = (
    chapters: CourseDTO['chapters'],
    prev: ChapterItem[] = []
  ): ChapterItem[] =>
    chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.position,
      isOpen: prev.find((item) => item.id === chapter.id)?.isOpen ?? true,
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        thumbnail: lesson.thumbnail,
        video: lesson.video,
        order: lesson.position,
      })),
    }));

  const [items, setItems] = useState<ChapterItem[]>(() =>
    buildItems(data.chapters)
  );
  const [prevChapters, setPrevChapters] = useState(data.chapters);
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

  if (data.chapters !== prevChapters) {
    setPrevChapters(data.chapters);
    setItems((prev) => buildItems(data.chapters, prev));
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reorderChapter = useReorderChapter(data.id);
  const reorderLesson = useReorderLesson(data.id);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as 'chapter' | 'lesson';
    const chapterId = active.data.current?.chapterId as string | undefined;

    if (type === 'chapter') {
      setActiveItem({ type: 'chapter', id: active.id as string });
    } else if (type === 'lesson' && chapterId) {
      setActiveItem({ type: 'lesson', id: active.id as string, chapterId });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as 'chapter' | 'lesson';
    const overType = over.data.current?.type as 'chapter' | 'lesson';

    if (activeType === 'chapter') {
      handleChapterReorder(active, over, overType);
    } else if (activeType === 'lesson' && overType === 'lesson') {
      handleLessonReorder(active, over);
    }
  };

  const handleChapterReorder = (
    active: Active,
    over: Over,
    overType: 'chapter' | 'lesson'
  ) => {
    const targetChapterId =
      overType === 'chapter'
        ? (over.id as string)
        : (over.data.current?.chapterId ?? null);

    if (!targetChapterId) {
      toast.error('Could not determine the chapter');
      return;
    }

    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === targetChapterId);

    if (oldIndex === -1 || newIndex === -1) {
      toast.error('Could not determine the chapter');
      return;
    }

    const reordered = arrayMove(items, oldIndex, newIndex).map(
      (chapter, i) => ({
        ...chapter,
        order: i + 1,
      })
    );

    const prevItems = [...items];
    setItems(reordered);

    toast.promise(
      reorderChapter.mutateAsync({
        courseId: data.id,
        courseSlug: data.slug,
        chapters: reordered.map(({ id, order }) => ({ id, position: order })),
      }),
      {
        error: () => {
          setItems(prevItems);
          return 'Failed to reorder chapters';
        },
      }
    );
  };

  const handleLessonReorder = (active: Active, over: Over) => {
    const chapterId = active.data.current?.chapterId as string;
    const overChapterId = over.data.current?.chapterId as string;

    if (!chapterId || chapterId !== overChapterId) {
      toast.error('Lessons can only be reordered within the same chapter');
      return;
    }

    const chapterIndex = items.findIndex((c) => c.id === chapterId);
    if (chapterIndex === -1) return;

    const chapter = items[chapterIndex];
    const oldIndex = chapter.lessons.findIndex(
      (lesson) => lesson.id === active.id
    );
    const newIndex = chapter.lessons.findIndex(
      (lesson) => lesson.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedLessons = arrayMove(chapter.lessons, oldIndex, newIndex).map(
      (lesson, i) => ({ ...lesson, order: i + 1 })
    );

    const prevItems = [...items];
    setItems((prev) =>
      prev.map((chapter, i) =>
        i === chapterIndex ? { ...chapter, lessons: reorderedLessons } : chapter
      )
    );

    toast.promise(
      reorderLesson.mutateAsync({
        courseId: data.id,
        chapterId,
        courseSlug: data.slug,
        lessons: reorderedLessons.map(({ id, order }) => ({
          id,
          position: order,
        })),
      }),
      {
        error: () => {
          setItems(prevItems);
          return 'Failed to reorder lessons';
        },
      }
    );
  };

  const toggleChapter = (chapterId: string) => {
    setItems((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, isOpen: !chapter.isOpen }
          : chapter
      )
    );
  };

  const activeChapter =
    activeItem?.type === 'chapter'
      ? items.find((chapter) => chapter.id === activeItem.id)
      : null;

  const activeLesson =
    activeItem?.type === 'lesson'
      ? items
          .find((chapter) => chapter.id === activeItem.chapterId)
          ?.lessons.find((lesson) => lesson.id === activeItem.id)
      : null;

  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (
      state,
      action:
        | { type: 'chapter'; id: string; title: string }
        | { type: 'lesson'; id: string; chapterId: string; title: string }
    ) => {
      if (action.type === 'chapter') {
        if (state.some((chapter) => chapter.title === action.title))
          return state;
        return [
          ...state,
          {
            id: action.id,
            title: action.title,
            order: state.length + 1,
            isOpen: true,
            lessons: [],
          },
        ];
      } else {
        return state.map((chapter) =>
          chapter.id === action.chapterId
            ? {
                ...chapter,
                isOpen: true, // ensure it's open if we just added a lesson to it
                lessons: chapter.lessons.some(
                  (lesson) => lesson.title === action.title
                )
                  ? chapter.lessons
                  : [
                      ...chapter.lessons,
                      {
                        id: action.id,
                        title: action.title,
                        order: chapter.lessons.length + 1,
                      },
                    ],
              }
            : chapter
        );
      }
    }
  );

  return (
    <>
      <DndContext
        id={dndId}
        collisionDetection={rectIntersection}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <Card className="rounded-lg pt-0">
          <CardHeader className="flex flex-row items-center justify-between border-b py-4!">
            <CardTitle className="text-lg">Chapters</CardTitle>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> New chapter
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {optimisticItems.length > 0 ? (
              <CourseStructureContent
                items={optimisticItems}
                courseId={data.id}
                courseSlug={data.slug}
                toggleChapter={toggleChapter}
                onOptimisticCreate={addOptimisticItem}
              />
            ) : (
              <EmptyCourseStructure />
            )}
          </CardContent>
        </Card>

        {/* The visual clone that follows the cursor during drag */}
        <ContentDragOverlay
          activeItem={activeItem}
          activeChapter={activeChapter}
          activeLesson={activeLesson}
          courseId={data.id}
          courseSlug={data.slug}
        />
      </DndContext>

      <CreateItemForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        type="chapter"
        courseId={data.id}
        courseSlug={data.slug}
        onOptimisticCreate={addOptimisticItem}
      />
    </>
  );
};
