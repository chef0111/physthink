'use client';

import z from 'zod';
import { useCallback, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LessonSchema } from '@/lib/validations';
import { FieldGroup } from '@/components/ui/field';
import { FormInput, FormFileInput, FormMarkdown } from '@/components/form';
import { Button } from '@/components/ui/button';
import { RotateCcw, SaveIcon } from 'lucide-react';
import { FormEditorMethods } from '@/components/editor/markdown/form-editor';
import { MediaUploader } from '@/components/media-uploader';
import { Loader } from '@/components/ui/loader';
import { LessonDTO } from '@/app/server/lesson/dto';
import { useUpdateLesson } from '@/queries/lesson';
import { imageTypes, videoTypes } from '@/common/constants';

type FormData = z.infer<typeof LessonSchema>;

interface LessonFormProps {
  lesson?: LessonDTO | null;
  courseId?: string;
}

export function LessonForm({ lesson, courseId }: LessonFormProps) {
  const editorRef = useRef<FormEditorMethods>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [uploaderResetKey, setUploaderResetKey] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(LessonSchema) as Resolver<FormData>,
    defaultValues: {
      title: lesson?.title ?? '',
      content: lesson?.content ?? '',
      thumbnail: lesson?.thumbnail ?? undefined,
      video: lesson?.video ?? undefined,
    },
  });

  const handleFormReset = useCallback(
    () =>
      form.reset({
        title: lesson?.title,
        content: lesson?.content,
        thumbnail: lesson?.thumbnail,
        video: lesson?.video,
      }),
    [form, lesson]
  );
  const handleEditorReset = useCallback(
    () => setEditorKey((prev) => prev + 1),
    []
  );

  const resetForm = () => {
    handleFormReset();
    handleEditorReset();
    setUploaderResetKey((k) => k + 1);
  };

  const updateLesson = useUpdateLesson(lesson?.id ?? '');
  const isPending = updateLesson.isPending;

  const onSubmit = (data: FormData) => {
    if (lesson && courseId) {
      updateLesson.mutate({ id: lesson.id, courseId, ...data });
    } else return;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FormInput
          control={form.control}
          name="title"
          label="Lesson Title"
          placeholder="Enter lesson title"
        />

        <FormMarkdown
          control={form.control}
          editorRef={editorRef}
          editorKey={editorKey}
          name="content"
          label="Lesson Content"
          description="Detailed content of the lesson"
          className="h-99 border-2"
        />

        <FormFileInput
          control={form.control}
          name="thumbnail"
          label="Lesson Thumbnail"
        >
          {({ value, onChange }) => (
            <MediaUploader
              type="image"
              accept={imageTypes}
              maxSize={3 * 1024 * 1024}
              endpoint="mediaUploader"
              value={value}
              onChange={onChange}
              resetKey={uploaderResetKey}
            />
          )}
        </FormFileInput>

        <FormFileInput control={form.control} name="video" label="Lesson Video">
          {({ value, onChange }) => (
            <MediaUploader
              type="video"
              accept={videoTypes}
              maxSize={25 * 1024 * 1024}
              endpoint="mediaUploader"
              value={value}
              onChange={onChange}
              resetKey={uploaderResetKey}
            />
          )}
        </FormFileInput>

        <div className="flex w-full items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isPending || !form.formState.isDirty}
            onClick={resetForm}
          >
            <RotateCcw /> Reset
          </Button>
          <Button
            type="submit"
            size="lg"
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
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
