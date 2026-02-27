'use client';

import { useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { LexicalEditor, $getRoot } from 'lexical';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { editorTheme } from '@/components/editor/themes/editor-theme';
import { TooltipProvider } from '@/components/ui/tooltip';
import { nodes } from '@/components/editor/markdown/nodes';
import { Plugins } from '@/components/editor/markdown/plugins';

export interface FormEditorMethods {
  setValue: (value: string) => void;
  getValue: () => string;
  focus: () => void;
  getEditor: () => LexicalEditor | null;
}

interface FormEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  placeholder?: string;
  className?: string;
}

const editorConfig: InitialConfigType = {
  namespace: 'FormEditor',
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error('Lexical editor error:', error);
  },
};

/**
 * Internal component that handles editor state and provides ref methods.
 * Must be rendered inside LexicalComposer.
 */
function EditorRefPlugin({
  editorRef,
  onChange,
}: {
  editorRef: React.RefObject<FormEditorMethods | null>;
  onChange: (value: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const lastValueRef = useRef<string>('');

  useImperativeHandle(
    editorRef,
    () => ({
      setValue: (value: string) => {
        if (value) {
          try {
            const state = editor.parseEditorState(value);
            editor.setEditorState(state);
          } catch (e) {
            console.error('Failed to parse editor state', e);
          }
        } else {
          editor.update(() => {
            $getRoot().clear();
          });
        }
        lastValueRef.current = value;
      },
      getValue: () => {
        const state = editor.getEditorState();
        return JSON.stringify(state.toJSON());
      },
      focus: () => {
        editor.focus();
      },
      getEditor: () => editor,
    }),
    [editor]
  );

  return (
    <OnChangePlugin
      ignoreSelectionChange={true}
      onChange={(editorState) => {
        const value = JSON.stringify(editorState.toJSON());
        // Only trigger onChange if content actually changed
        if (value !== lastValueRef.current) {
          lastValueRef.current = value;
          onChange(value);
        }
      }}
    />
  );
}

const FormEditor = forwardRef<FormEditorMethods, FormEditorProps>(
  function FormEditor(
    { id, value, onChange, isInvalid = false, className },
    ref
  ) {
    const internalRef = useRef<FormEditorMethods>(null);

    // Forward the internal ref to the external ref
    useImperativeHandle(
      ref,
      () => ({
        setValue: (val: string) => {
          internalRef.current?.setValue(val);
        },
        getValue: () => internalRef.current?.getValue() ?? '',
        focus: () => internalRef.current?.focus(),
        getEditor: () => internalRef.current?.getEditor() ?? null,
      }),
      []
    );

    // Compute initial state synchronously (only on first render)
    const initialEditorState = useMemo(() => {
      if (!value) return null;
      try {
        JSON.parse(value);
        return value;
      } catch {
        return null;
      }
    }, [value]);

    return (
      <div
        aria-invalid={isInvalid}
        aria-label={id}
        className={`group flex w-full flex-col ${className || ''}`}
      >
        <LexicalComposer
          initialConfig={{
            ...editorConfig,
            ...(initialEditorState ? { editorState: initialEditorState } : {}),
          }}
        >
          <TooltipProvider>
            <Plugins />
            <EditorRefPlugin editorRef={internalRef} onChange={onChange} />
          </TooltipProvider>
        </LexicalComposer>
      </div>
    );
  }
);

FormEditor.displayName = 'FormEditor';

export default FormEditor;
