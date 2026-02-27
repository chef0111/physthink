'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useDeleteChapter } from '@/queries/chapter';
import { useDeleteLesson } from '@/queries/lesson';
import { startTransition } from 'react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chapter' | 'lesson';
  id: string;
  courseId: string;
  chapterId?: string; // required when type === 'lesson'
  onOptimisticUpdate?: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  type,
  id,
  courseId,
  chapterId,
  onOptimisticUpdate,
}: DeleteConfirmDialogProps) {
  const deleteChapter = useDeleteChapter(courseId);
  const deleteLesson = useDeleteLesson(courseId);

  const handleConfirm = () => {
    onOpenChange(false);
    startTransition(async () => {
      onOptimisticUpdate?.();

      try {
        if (type === 'chapter') {
          await deleteChapter.mutateAsync({ id, courseId });
        } else {
          await deleteLesson.mutateAsync({
            id,
            courseId,
            chapterId: chapterId!,
          });
        }
      } catch (error) {
        // Reverted implicitly on error
      }
    });
  };

  const isChapter = type === 'chapter';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isChapter ? 'Chapter' : 'Lesson'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isChapter
              ? 'This will permanently delete the chapter and all its lessons. This action cannot be undone.'
              : 'This will permanently delete the lesson. This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
