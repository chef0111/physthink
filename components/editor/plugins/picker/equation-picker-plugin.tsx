import { SigmaSquare } from 'lucide-react';
import { INSERT_EQUATION_COMMAND } from '@/components/editor/plugins/equations-plugin';
import { ComponentPickerOption } from '@/components/editor/plugins/picker/component-picker-option';

export function EquationPickerPlugin() {
  return new ComponentPickerOption('Equation', {
    icon: <SigmaSquare className="size-4" />,
    keywords: ['equation', 'math', 'latex', 'formula'],
    onSelect: (_, editor) => {
      editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
        equation: '',
        inline: false,
      });
    },
  });
}
