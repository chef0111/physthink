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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormInput } from '@/components/form';
import { FieldGroup } from '@/components/ui/field';
import { Loader } from '@/components/ui/loader';
import { useCreateChapter } from '@/queries/chapter';
import { useCreateLesson } from '@/queries/lesson';

type FormData = z.infer<typeof TitleSchema>;

interface EditTitleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chapter' | 'lesson';
  courseId: string;
  chapterId?: string; // required when type === 'lesson'
}

export function CreateItemForm({
  open,
  onOpenChange,
  type,
  courseId,
  chapterId,
}: EditTitleFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(TitleSchema),
    defaultValues: {
      title: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const createChapter = useCreateChapter(courseId);
  const createLesson = useCreateLesson(courseId);

  const mutation = type === 'chapter' ? createChapter : createLesson;
  const isPending = mutation.isPending;

  const onSubmit = (data: FormData) => {
    if (type === 'chapter') {
      createChapter.mutate(
        { courseId, title: data.title },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createLesson.mutate(
        { courseId, chapterId: chapterId!, title: data.title },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const label = type === 'chapter' ? 'Chapter title' : 'Lesson title';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new {label}</DialogTitle>
          <DialogDescription>
            Provide a title for the new {type}. You can change it later.
          </DialogDescription>
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
                <span>Save change</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
