'use client';

import z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TitleSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormInput } from '@/components/form';
import { FieldGroup } from '@/components/ui/field';
import { Loader } from '@/components/ui/loader';
import { SaveIcon } from 'lucide-react';
import { useUpdateChapterTitle } from '@/queries/chapter';
import { useUpdateLessonTitle } from '@/queries/lesson';

type FormData = z.infer<typeof TitleSchema>;

interface EditTitleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chapter' | 'lesson';
  id: string;
  courseId: string;
  chapterId?: string; // required when type === 'lesson'
  currentTitle: string;
}

export function EditTitleForm({
  open,
  onOpenChange,
  type,
  id,
  courseId,
  chapterId,
  currentTitle,
}: EditTitleFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(TitleSchema),
    defaultValues: { title: currentTitle },
  });

  useEffect(() => {
    if (open) {
      form.reset({ title: currentTitle });
    }
  }, [open, currentTitle, form]);

  const updateChapterTitle = useUpdateChapterTitle(courseId);
  const updateLessonTitle = useUpdateLessonTitle(courseId);

  const mutation = type === 'chapter' ? updateChapterTitle : updateLessonTitle;
  const isPending = mutation.isPending;

  const onSubmit = (data: FormData) => {
    if (type === 'chapter') {
      updateChapterTitle.mutate(
        { id, courseId, title: data.title },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      updateLessonTitle.mutate(
        { id, courseId, chapterId: chapterId!, title: data.title },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const label = type === 'chapter' ? 'Chapter Title' : 'Lesson Title';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormInput
              control={form.control}
              name="title"
              label={label}
              placeholder={`Enter ${type} title`}
            />
          </FieldGroup>
          <DialogFooter className="mt-6" showCloseButton>
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending ? (
                <>
                  <Loader />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SaveIcon />
                  <span>Save</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
