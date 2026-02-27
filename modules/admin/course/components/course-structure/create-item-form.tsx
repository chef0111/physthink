'use client';

import z from 'zod';
import { useEffect, startTransition } from 'react';
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
import { useCreateChapter } from '@/queries/chapter';
import { useCreateLesson } from '@/queries/lesson';

type FormData = z.infer<typeof TitleSchema>;

interface EditTitleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chapter' | 'lesson';
  courseId: string;
  chapterId?: string; // required when type === 'lesson'
  onOptimisticCreate?: (
    item:
      | { type: 'chapter'; id: string; title: string }
      | { type: 'lesson'; id: string; chapterId: string; title: string }
  ) => void;
}

export function CreateItemForm({
  open,
  onOpenChange,
  type,
  courseId,
  chapterId,
  onOptimisticCreate,
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

  const onSubmit = (data: FormData) => {
    onOpenChange(false);
    startTransition(async () => {
      const optimisticId = `optimistic-${Date.now()}`;
      if (type === 'chapter') {
        onOptimisticCreate?.({
          type: 'chapter',
          id: optimisticId,
          title: data.title,
        });
        try {
          await createChapter.mutateAsync({ courseId, title: data.title });
        } catch (error) {
          // Reverted implicitly on error
        }
      } else {
        onOptimisticCreate?.({
          type: 'lesson',
          id: optimisticId,
          chapterId: chapterId!,
          title: data.title,
        });
        try {
          await createLesson.mutateAsync({
            courseId,
            chapterId: chapterId!,
            title: data.title,
          });
        } catch (error) {
          // Reverted implicitly on error
        }
      }
    });
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
            <Button type="submit" disabled={!form.formState.isDirty}>
              <span>Save change</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
