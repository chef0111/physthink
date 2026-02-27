'use client';

import { useMemo } from 'react';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@/components/editor/editor-ui/content-editable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { nodes } from '@/components/editor/markdown/nodes';
import { editorTheme } from '@/components/editor/themes/editor-theme';
import { AutoLinkPlugin } from '@/components/editor/plugins/auto-link-plugin';
import { LinkPlugin } from '@/components/editor/plugins/link-plugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CodeBlockNode } from './code-block-node';
import { CodeNode } from '@lexical/code';

export interface MarkdownPreviewProps {
  content?: string | null;
  className?: string;
}

const previewNodes = nodes.map((n) => (n === CodeNode ? CodeBlockNode : n));

const editorConfig: InitialConfigType = {
  namespace: 'MarkdownPreview',
  theme: editorTheme,
  nodes: previewNodes,
  editable: false,
  onError: (error: Error) => {
    console.error('Lexical preview error:', error);
  },
};

export const MarkdownPreview = ({
  content,
  className = '',
}: MarkdownPreviewProps) => {
  const initialEditorState = useMemo(() => {
    if (!content) return null;
    try {
      JSON.parse(content);
      return content;
    } catch {
      return null;
    }
  }, [content]);

  if (!initialEditorState) {
    return null;
  }

  return (
    <div className={`lexical-preview relative ${className}`}>
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: initialEditorState,
        }}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="ContentEditable__root" placeholder="" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <CheckListPlugin />
        <AutoLinkPlugin />
        <LinkPlugin />
        <TablePlugin />
      </LexicalComposer>
    </div>
  );
};
