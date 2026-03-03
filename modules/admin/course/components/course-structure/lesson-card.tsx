'use client';

import { useState, useOptimistic } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DraggableSyntheticListeners } from '@dnd-kit/core';
import { EditIcon, FileText, GripVertical, Trash2 } from 'lucide-react';
import { Route } from 'next';
import Link from 'next/link';
import { EditTitleForm } from './edit-title-form';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

interface LessonCardProps {
  courseId: string;
  courseSlug: string;
  chapterId: string;
  data: Lesson;
  listeners?: DraggableSyntheticListeners;
}

export const LessonCard = ({
  courseId,
  courseSlug,
  chapterId,
  data,
  listeners,
}: LessonCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [optimisticTitle, setOptimisticTitle] = useOptimistic(data.title);
  const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(false);

  if (optimisticDeleted) return null;

  return (
    <>
      <Card className="no-focus hover:bg-muted/80 dark:hover:bg-muted w-full cursor-default flex-row items-center justify-between rounded-lg border-none p-2 ring-0">
        <div className="flex w-full items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hover:bg-card! dark:hover:bg-card/50! cursor-grab opacity-60 hover:opacity-100 active:cursor-grabbing"
            {...listeners}
          >
            <GripVertical className="size-4" />
            <span className="sr-only">Drag to reorder</span>
          </Button>
          <Link
            href={`/admin/courses/${courseId}/lesson/${data.id}` as Route}
            className="group/link flex w-full items-center gap-2"
          >
            <FileText className="size-4" />
            <p className="line-clamp-1 w-full truncate font-medium underline-offset-4 group-hover/link:underline">
              {optimisticTitle}
            </p>
          </Link>
        </div>
        <div className="flex items-center gap-1">
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
      </Card>

      <EditTitleForm
        open={editOpen}
        onOpenChange={setEditOpen}
        type="lesson"
        id={data.id}
        courseId={courseId}
        courseSlug={courseSlug}
        chapterId={chapterId}
        currentTitle={optimisticTitle}
        onOptimisticUpdate={setOptimisticTitle}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="lesson"
        id={data.id}
        courseId={courseId}
        courseSlug={courseSlug}
        chapterId={chapterId}
        onOptimisticUpdate={() => setOptimisticDeleted(true)}
      />
    </>
  );
};
