'use client';

import z from 'zod';
import { Activity, useRef, useState } from 'react';
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
import { PlusIcon, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import slugify from 'slugify';
import { FormEditorMethods } from '@/components/editor/markdown/form-editor';
import {
  courseCategories,
  courseLevels,
  courseStatus,
} from '@/common/constants';
import { SelectGroup, SelectItem } from '@/components/ui/select';
import { FileUploader } from './file-uploader';

type FormData = z.infer<typeof CourseSchema>;

export function CreateCourseForm() {
  const editorRef = useRef<FormEditorMethods>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(CourseSchema) as Resolver<FormData>,
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
      duration: 1,
      level: 'Beginner',
      category: '',
      readme: '### Hello World 🚀',
      slug: '',
      status: 'Draft',
    },
  });

  const [customCategory, setCustomCategory] = useState(false);

  const handleCategoryChange = (value: string) => {
    if (value === 'Others') {
      setCustomCategory(true);
      form.setValue('category', '', { shouldValidate: false });
    }
  };

  const onSubmit = (data: FormData) => {
    alert(`Form submitted: ${JSON.stringify(data, null, 2)}`);
    form.reset();
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
            />
          )}
        </FormFileInput>

        <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Activity mode={customCategory ? 'hidden' : 'visible'}>
            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              className="w-full"
              placeholder="Select a Category"
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
          </Activity>
          <Activity mode={customCategory ? 'visible' : 'hidden'}>
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
                  form.setValue('category', '', { shouldValidate: true });
                }}
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
        </FieldGroup>

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
