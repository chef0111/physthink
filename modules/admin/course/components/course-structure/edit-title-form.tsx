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
import { SaveIcon } from 'lucide-react';
import { useUpdateChapterTitle } from '@/queries/chapter';
import { useUpdateLessonTitle } from '@/queries/lesson';
import { startTransition } from 'react';

type FormData = z.infer<typeof TitleSchema>;

interface EditTitleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'chapter' | 'lesson';
  id: string;
  courseId: string;
  courseSlug: string;
  chapterId?: string; // required when type === 'lesson'
  currentTitle: string;
  onOptimisticUpdate?: (title: string) => void;
}

export function EditTitleForm({
  open,
  onOpenChange,
  type,
  id,
  courseId,
  courseSlug,
  chapterId,
  currentTitle,
  onOptimisticUpdate,
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

  const onSubmit = (data: FormData) => {
    onOpenChange(false);
    startTransition(async () => {
      onOptimisticUpdate?.(data.title);

      try {
        if (type === 'chapter') {
          await updateChapterTitle.mutateAsync({
            id,
            courseId,
            courseSlug,
            title: data.title,
          });
        } else {
          await updateLessonTitle.mutateAsync({
            id,
            courseId,
            courseSlug,
            chapterId: chapterId!,
            title: data.title,
          });
        }
      } catch (error) {
        // Reverted implicitly on error
      }
    });
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
            <Button type="submit" disabled={!form.formState.isDirty}>
              <SaveIcon />
              Save change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
