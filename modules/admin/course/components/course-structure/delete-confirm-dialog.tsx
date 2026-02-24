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
import { Loader } from '@/components/ui/loader';
import { Trash2 } from 'lucide-react';
import { useDeleteChapter } from '@/queries/chapter';
import { useDeleteLesson } from '@/queries/lesson';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chapter' | 'lesson';
  id: string;
  courseId: string;
  chapterId?: string; // required when type === 'lesson'
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  type,
  id,
  courseId,
  chapterId,
}: DeleteConfirmDialogProps) {
  const deleteChapter = useDeleteChapter(courseId);
  const deleteLesson = useDeleteLesson(courseId);

  const mutation = type === 'chapter' ? deleteChapter : deleteLesson;
  const isPending = mutation.isPending;

  const handleConfirm = () => {
    if (type === 'chapter') {
      deleteChapter.mutate(
        { id, courseId },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      deleteLesson.mutate(
        { id, courseId, chapterId: chapterId! },
        { onSuccess: () => onOpenChange(false) }
      );
    }
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
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Loader />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                <span>Delete</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
