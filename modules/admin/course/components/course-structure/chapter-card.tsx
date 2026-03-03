'use client';

import { useState, useOptimistic } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DraggableSyntheticListeners } from '@dnd-kit/core';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  EditIcon,
  GripVertical,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { EditTitleForm } from './edit-title-form';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { cn } from '@/lib/utils';
import { CreateItemForm } from './create-item-form';

interface ChapterCardProps {
  onOpenChange: () => void;
  data: Chapter & { isOpen: boolean; lessons: { id: string; title: string }[] };
  children?: React.ReactNode;
  listeners?: DraggableSyntheticListeners;
  courseId: string;
  courseSlug: string;
  onOptimisticCreate?: (
    item:
      | { type: 'chapter'; id: string; title: string }
      | { type: 'lesson'; id: string; chapterId: string; title: string }
  ) => void;
}

export const ChapterCard = ({
  data,
  onOpenChange,
  children,
  listeners,
  courseId,
  courseSlug,
  onOptimisticCreate,
}: ChapterCardProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [optimisticTitle, setOptimisticTitle] = useOptimistic(data.title);
  const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(false);

  if (optimisticDeleted) return null;

  return (
    <>
      <Card className="cursor-default rounded-lg py-0">
        <Collapsible open={data.isOpen} onOpenChange={onOpenChange}>
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-grab opacity-60 hover:opacity-100 active:cursor-grabbing"
                  {...listeners}
                >
                  <GripVertical className="size-4" />
                  <span className="sr-only">Drag to reorder</span>
                </Button>
                <p className="w-full font-medium tracking-wide">
                  {optimisticTitle}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-60 hover:opacity-100"
                  >
                    {data.isOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="hover:text-primary hover:bg-primary/10!"
                  onClick={() => setEditOpen(true)}
                >
                  <EditIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="hover:bg-destructive/10! hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="px-4 pb-4">
            <CollapsibleContent
              className={cn(
                'flex flex-col gap-1',
                data.isOpen && data.lessons.length > 0 ? 'pt-4' : 'pt-0'
              )}
            >
              {children}
            </CollapsibleContent>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-4 w-full text-base"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="mr-1" />
              Add Lesson
            </Button>
          </CardContent>
        </Collapsible>
      </Card>

      <CreateItemForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        type="lesson"
        courseId={courseId}
        courseSlug={courseSlug}
        chapterId={data.id}
        onOptimisticCreate={onOptimisticCreate}
      />
      <EditTitleForm
        open={editOpen}
        onOpenChange={setEditOpen}
        type="chapter"
        id={data.id}
        courseId={courseId}
        courseSlug={courseSlug}
        currentTitle={optimisticTitle}
        onOptimisticUpdate={setOptimisticTitle}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="chapter"
        id={data.id}
        courseId={courseId}
        courseSlug={courseSlug}
        onOptimisticUpdate={() => setOptimisticDeleted(true)}
      />
    </>
  );
};
