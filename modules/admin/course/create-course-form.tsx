'use client';

import z from 'zod';
import { Activity, useCallback, useRef, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CourseSchema } from '@/lib/validations';
import { FieldGroup } from '@/components/ui/field';
import { FormInput, FormNumberInput } from '@/components/form/form-input';
import { Button } from '@/components/ui/button';
import { PlusIcon, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import slugify from 'slugify';
import { FormSelect, FormTextarea } from '@/components/form';
import { FormEditorMethods } from '@/components/editor/markdown/form-editor';
import { FormMarkdown } from '@/components/form/form-markdown';
import {
  courseCategories,
  courseLevels,
  courseStatus,
} from '@/common/constants';
import { SelectGroup, SelectItem } from '@/components/ui/select';

type FormData = z.infer<typeof CourseSchema>;

export function CreateCourseForm() {
  const editorRef = useRef<FormEditorMethods>(null);
  const [editorKey, setEditorKey] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(CourseSchema) as Resolver<FormData>,
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
      duration: 1,
      level: 'Beginner',
      category: '',
      readme: '',
      slug: '',
      status: 'Draft',
    },
  });

  const selectedCategory = useWatch({
    control: form.control,
    name: 'category',
  });

  const handleEditorReset = useCallback(
    () => setEditorKey((prev) => prev + 1),
    []
  );

  const onSubmit = (data: FormData) => {
    alert(`Form submitted: ${JSON.stringify(data, null, 2)}`);
  };

  const generateSlug = () => {
    const title = form.getValues('title');
    const slug = slugify(title, { lower: true, strict: true });
    form.setValue('slug', slug, { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="px-4">
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
            Generate Slug <Sparkles />
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

        <FormInput
          name="thumbnail"
          control={form.control}
          label="Thumbnail"
          placeholder="Thumbnail URL"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Activity mode={selectedCategory === 'Others' ? 'hidden' : 'visible'}>
            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              className="w-full"
              placeholder="Select a Category"
            >
              <SelectGroup>
                {courseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </FormSelect>
          </Activity>
          <Activity mode={selectedCategory === 'Others' ? 'visible' : 'hidden'}>
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
                onClick={() =>
                  form.setValue('category', '', { shouldValidate: true })
                }
                title="Back to category select"
              >
                <Undo2 />
              </Button>
            </FormInput>
          </Activity>

          <FormSelect
            control={form.control}
            name="level"
            label="Level"
            className="w-full"
            placeholder="Select a Level"
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
          >
            <SelectGroup>
              {courseStatus.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </FormSelect>
        </div>

        <div className="flex w-full items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => form.reset()}
          >
            Reset <RotateCcw />
          </Button>
          <Button type="submit" size="lg">
            Create Course <PlusIcon />
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
