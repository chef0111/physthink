'use client';

import z from 'zod';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DeleteCourseSchema } from '@/lib/validations';
import { FormInput } from '@/components/form';
import { FieldGroup } from '@/components/ui/field';
import { Loader } from '@/components/ui/loader';
import { Trash2 } from 'lucide-react';
import { useDeleteCourse } from '@/queries/course';
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

type FormData = z.infer<typeof DeleteCourseSchema>;

interface CourseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  slug: string;
}

export function CourseDeleteDialog({
  open,
  onOpenChange,
  id,
  slug,
}: CourseDeleteDialogProps) {
  const deleteCourse = useDeleteCourse();
  const isPending = deleteCourse.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(DeleteCourseSchema) as Resolver<FormData>,
    defaultValues: { slug: '' },
  });

  const enteredSlug = form.watch('slug');
  const isSlugMatch = enteredSlug === slug;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  const onSubmit = (data: FormData) => {
    if (data.slug !== slug) return;
    deleteCourse.mutate(
      { id, slug },
      { onSuccess: () => handleOpenChange(false) }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Course?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the course with all its chapters and
            lessons. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormInput
              control={form.control}
              name="slug"
              description={
                <>
                  Type{' '}
                  <span className="text-foreground font-semibold break-all">
                    {slug}
                  </span>{' '}
                  to confirm
                </>
              }
              placeholder={slug}
              autoComplete="off"
              disabled={isPending}
            />
          </FieldGroup>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !isSlugMatch}
            >
              {isPending ? (
                <>
                  <Loader />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  <span>Delete Course</span>
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
