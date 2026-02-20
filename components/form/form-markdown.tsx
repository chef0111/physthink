import { ReactNode, RefObject } from 'react';
import dynamic from 'next/dynamic';

import EditorFallback from '@/components/editor/markdown/editor-fallback';
import type { FormEditorMethods } from '@/components/editor/markdown/form-editor';
import { FormBase, FormControlFn } from './form-base';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';

const FormEditorComponent = dynamic(
  () => import('@/components/editor/markdown/form-editor'),
  {
    ssr: false,
    loading: () => <EditorFallback />,
  }
);

interface EditorProps {
  editorRef?: RefObject<FormEditorMethods | null>;
  editorKey?: number;
  field: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    'aria-invalid': boolean;
  };
  className?: string;
  children?: ReactNode;
}

function Editor({
  editorRef,
  editorKey,
  field,
  children,
  className,
}: EditorProps) {
  const fieldChange = useDebouncedCallback(field.onChange, 300);

  return (
    <>
      <FormEditorComponent
        key={editorKey}
        ref={editorRef}
        id={field.id}
        value={field.value ?? ''}
        onChange={fieldChange}
        isInvalid={field['aria-invalid']}
        className={cn('rounded-md border', className)}
      />
      {children}
    </>
  );
}

export const FormMarkdown: FormControlFn<{
  editorRef?: RefObject<FormEditorMethods | null>;
  editorKey?: number;
  children?: ReactNode;
  className?: string;
}> = ({ editorRef, editorKey, children, className, ...props }) => {
  return (
    <FormBase {...props}>
      {(field) => (
        <Editor
          editorRef={editorRef}
          editorKey={editorKey}
          field={field}
          className={className}
        >
          {children}
        </Editor>
      )}
    </FormBase>
  );
};
