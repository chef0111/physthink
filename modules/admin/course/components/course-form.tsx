'use client';

import z from 'zod';
import { useCallback, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CourseSchema } from '@/lib/validations';
import { FieldGroup } from '@/components/ui/field';
import {
  FormInput,
  FormFileInput,
  FormNumberInput,
  FormSelect,
  FormTextarea,
  FormMarkdown,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { PlusIcon, RotateCcw, SaveIcon, Sparkles, Undo2 } from 'lucide-react';
import { useCreateCourse, useUpdateCourse } from '@/queries/course';
import slugify from 'slugify';
import { FormEditorMethods } from '@/components/editor/markdown/form-editor';
import {
  courseCategories,
  courseLevels,
  courseStatus,
} from '@/common/constants';
import { SelectGroup, SelectItem } from '@/components/ui/select';
import { FileUploader } from './file-uploader';
import { Loader } from '@/components/ui/loader';
import { CourseDTO } from '@/app/server/course/dto';

type FormData = z.infer<typeof CourseSchema>;

interface CourseFormProps {
  course?: CourseDTO | null;
  isEdit?: boolean;
}

export function CourseForm({ course, isEdit = false }: CourseFormProps) {
  const editorRef = useRef<FormEditorMethods>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [resetUploader, setResetUploader] = useState(false);

  const isCustomCategory =
    !!course?.category &&
    !(courseCategories as ReadonlyArray<string>).includes(course.category);
  const [customCategory, setCustomCategory] = useState(isCustomCategory);

  const form = useForm<FormData>({
    resolver: zodResolver(CourseSchema) as Resolver<FormData>,
    defaultValues: {
      title: course?.title ?? '',
      description: course?.description ?? '',
      thumbnail: course?.thumbnail ?? '',
      duration: course?.duration ?? 1,
      level: course?.level ?? 'Beginner',
      category: course?.category ?? '',
      readme: course?.readme ?? '### Hello World 🚀',
      slug: course?.slug ?? '',
      status: course?.status ?? 'Draft',
    },
  });

  const generateSlug = () => {
    const title = form.getValues('title');
    const slug = slugify(title, { lower: true, strict: true });
    form.setValue('slug', slug, { shouldValidate: true });
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'Others') {
      setCustomCategory(true);
      form.setValue('category', '', { shouldValidate: false });
    }
  };

  const handleFormReset = useCallback(
    () =>
      form.reset(
        isEdit && course
          ? {
              title: course.title,
              description: course.description,
              thumbnail: course.thumbnail,
              duration: course.duration,
              level: course.level,
              category: course.category,
              readme: course.readme,
              slug: course.slug,
              status: course.status,
            }
          : undefined
      ),
    [form, isEdit, course]
  );
  const handleEditorReset = useCallback(
    () => setEditorKey((prev) => prev + 1),
    []
  );

  const resetForm = () => {
    handleFormReset();
    handleEditorReset();
    setResetUploader(true);
  };

  const createCourse = useCreateCourse({ onReset: resetForm });
  const updateCourse = useUpdateCourse(course?.id ?? '');

  const mutation = isEdit ? updateCourse : createCourse;
  const isPending = mutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit && course?.id) {
      updateCourse.mutate({ ...data, id: course.id });
    } else {
      createCourse.mutate(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FormInput
          control={form.control}
          name="title"
          label="Course Title"
          placeholder="Enter course title"
        />
        <FormInput
          control={form.control}
          name="slug"
          label="Course Slug"
          placeholder="Enter course slug"
          itemClassName="items-center w-full gap-2"
        >
          <Button type="button" className="w-fit" onClick={generateSlug}>
            <Sparkles /> Generate Slug
          </Button>
        </FormInput>

        <FormTextarea
          control={form.control}
          name="description"
          label="Course Description"
          placeholder="Enter course description"
          className="min-h-30 resize-none"
        />

        <FormMarkdown
          control={form.control}
          editorRef={editorRef}
          editorKey={editorKey}
          name="readme"
          label="Course Readme"
          description="Detailed information about the course, curriculum, requirements, etc."
          className="h-99 border-2"
        />

        <FormFileInput
          control={form.control}
          name="thumbnail"
          label="Thumbnail"
        >
          {({ value, onChange }) => (
            <FileUploader
              maxSize={3 * 1024 * 1024}
              endpoint="imageUploader"
              value={value}
              onChange={onChange}
              reset={resetUploader}
            />
          )}
        </FormFileInput>

        <FieldGroup className="grid grid-cols-1 items-baseline gap-4 md:grid-cols-2">
          {customCategory ? (
            <FormInput
              control={form.control}
              name="category"
              label="Category"
              placeholder="Enter a category"
              className="w-full"
              itemClassName="items-center gap-2"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  setCustomCategory(false);
                  form.setValue('category', '');
                }}
                title="Back to category select"
              >
                <Undo2 />
              </Button>
            </FormInput>
          ) : (
            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              className="w-full"
              placeholder="Select a Category"
              position="popper"
              onValueChange={handleCategoryChange}
            >
              <SelectGroup>
                {courseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </FormSelect>
          )}

          <FormSelect
            control={form.control}
            name="level"
            label="Level"
            className="w-full"
            placeholder="Select a Level"
            position="popper"
          >
            <SelectGroup>
              {courseLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectGroup>
          </FormSelect>

          <FormNumberInput
            control={form.control}
            name="duration"
            label="Duration (hours)"
            placeholder="Enter course duration"
            className="w-full"
            min={1}
            max={500}
            step={1}
          />

          <FormSelect
            control={form.control}
            name="status"
            label="Status"
            className="w-full"
            placeholder="Select a Status"
            position="popper"
          >
            <SelectGroup>
              {courseStatus.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </FormSelect>
        </FieldGroup>

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
                <span>{isEdit ? 'Saving...' : 'Creating...'}</span>
              </>
            ) : isEdit ? (
              <>
                <SaveIcon />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <PlusIcon />
                <span>Create Course</span>
              </>
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
