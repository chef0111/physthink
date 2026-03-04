'use client';

import { SigmaSquare } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_EQUATION_COMMAND } from '@/components/editor/plugins/equations-plugin';
import { Button } from '@/components/ui/button';

export function EquationToolbarPlugin({ className }: { className?: string }) {
  const [editor] = useLexicalComposerContext();

  return (
    <Button
      type="button"
      onClick={() => {
        editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
          equation: '',
          inline: false,
        });
      }}
      variant={'outline'}
      size={'icon-sm'}
      className={className}
      tabIndex={-1}
      title="Insert Equation Block"
    >
      <SigmaSquare className="size-4" />
    </Button>
  );
}
