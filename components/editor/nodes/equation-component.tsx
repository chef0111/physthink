'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode,
} from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import katex from 'katex';

import 'katex/dist/katex.min.css';
import { ChevronDown } from 'lucide-react';
import { $isEquationNode } from './equation-node';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { EQUATION_CATEGORIES } from '@/common/constants/equation';

function SnippetPopover({ onSelect }: { onSelect: (val: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-6 gap-1 px-2 text-xs"
        >
          Snippets <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-90 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Tabs defaultValue="Math" className="w-full">
          <TabsList className="bg-muted/50 w-full justify-start rounded-none border-b">
            {EQUATION_CATEGORIES.map((category) => (
              <TabsTrigger key={category.name} value={category.name}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {EQUATION_CATEGORIES.map((category) => (
            <TabsContent key={category.name} value={category.name}>
              <ScrollArea className="h-50 w-full px-2">
                <div className="grid grid-cols-5 gap-2 pb-4">
                  {category.items.map((item) => (
                    <Button
                      key={item.name}
                      variant="outline"
                      className="hover:bg-muted/50 flex h-12 flex-col items-center justify-center p-1"
                      onClick={() => {
                        onSelect(item.value);
                        setOpen(false);
                      }}
                      title={item.name}
                    >
                      <span className="pointer-events-none text-sm">
                        <LatexRenderer
                          equation={item.render}
                          inline={true}
                          onDoubleClick={() => {}}
                        />
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

type EquationComponentProps = {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
};

function LatexRenderer({
  equation,
  inline,
  onDoubleClick,
}: {
  equation: string;
  inline: boolean;
  onDoubleClick: () => void;
}) {
  const latexElementRef = useRef<HTMLSpanElement | HTMLDivElement>(null);

  useEffect(() => {
    const latexElement = latexElementRef.current;
    if (latexElement !== null) {
      katex.render(equation, latexElement, {
        displayMode: !inline,
        errorColor: '#cc0000',
        output: 'html',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      });
    }
  }, [equation, inline]);

  if (inline) {
    return (
      <span
        role="button"
        tabIndex={-1}
        onDoubleClick={onDoubleClick}
        ref={latexElementRef as React.RefObject<HTMLSpanElement>}
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      onDoubleClick={onDoubleClick}
      ref={latexElementRef as React.RefObject<HTMLDivElement>}
    />
  );
}

export default function EquationComponent({
  equation,
  inline,
  nodeKey,
}: EquationComponentProps) {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [equationValue, setEquationValue] = useState(equation);
  const [showEquationEditor, setShowEquationEditor] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const onHide = useCallback(
    (restoreSelection?: boolean) => {
      setShowEquationEditor(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isEquationNode(node)) {
          node.setEquation(equationValue);
          if (restoreSelection) {
            node.selectNext(0, 0);
          }
        }
      });
    },
    [editor, equationValue, nodeKey]
  );

  useEffect(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);

  useEffect(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      return mergeRegister(
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem !== activeElement) {
              onHide();
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem === activeElement) {
              onHide(false);

              editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (node && $isEquationNode(node)) {
                  if (inline) {
                    node.selectNext(0, 0);
                  } else {
                    let nextSibling = node.getNextSibling();
                    if (!nextSibling) {
                      const newParagraph = $createParagraphNode();
                      node.insertAfter(newParagraph);
                      nextSibling = newParagraph;
                    }
                    nextSibling.selectStart();
                  }
                }
              });

              return true;
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    } else {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (
          $isNodeSelection(selection) &&
          selection.has(nodeKey) &&
          selection.getNodes().length === 1
        ) {
          setShowEquationEditor(true);
        }
      });

      return editor.registerUpdateListener(({ editorState }) => {
        const isSelected = editorState.read(() => {
          const selection = $getSelection();
          return (
            $isNodeSelection(selection) &&
            selection.has(nodeKey) &&
            selection.getNodes().length === 1
          );
        });
        if (isSelected) {
          setShowEquationEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEquationEditor, isEditable]);

  return (
    <>
      {showEquationEditor && isEditable ? (
        inline ? (
          <span className="border-primary/50 bg-muted/30 inline-flex min-w-16 rounded-md border px-1 py-0.5">
            <span className="text-muted-foreground mr-1 select-none">$</span>
            <input
              className="w-full min-w-10 bg-transparent font-mono text-sm ring-0 outline-none"
              value={equationValue}
              onChange={(e) => setEquationValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') return;
                if (e.key === 'Backspace' && equationValue.length === 0) {
                  e.preventDefault();
                  editor.update(() => {
                    const node = $getNodeByKey(nodeKey);
                    if (node) node.remove();
                  });
                  return;
                }
                e.stopPropagation();
              }}
              autoFocus
              ref={inputRef as React.RefObject<HTMLInputElement>}
            />
            <span className="text-muted-foreground ml-1 select-none">$</span>
          </span>
        ) : (
          <div className="border-primary/50 bg-muted/30 focus-within:bg-muted/50 my-2 flex w-full flex-col rounded-md border p-2 transition-colors">
            <div className="flex w-full">
              <span className="text-muted-foreground mr-2 select-none">$$</span>
              <textarea
                className="min-h-20 w-full resize-y bg-transparent font-mono text-sm ring-0 outline-none"
                value={equationValue}
                onChange={(e) => setEquationValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') return;
                  if (e.key === 'Backspace' && equationValue.length === 0) {
                    e.preventDefault();
                    editor.update(() => {
                      const node = $getNodeByKey(nodeKey);
                      if (node) node.remove();
                    });
                    return;
                  }
                  e.stopPropagation();
                }}
                autoFocus
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              />
              <span className="text-muted-foreground ml-2 self-end select-none">
                $$
              </span>
            </div>
            <div className="border-border/50 mt-2 flex w-full items-center justify-between border-t px-2 pt-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                Powered by KaTeX.{' | '}
                <a
                  href="https://katex.org/docs/supported.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Syntax guide
                </a>
              </span>
              <SnippetPopover
                onSelect={(val) => {
                  setEquationValue(
                    (prev) => prev + (prev.length > 0 ? ' ' : '') + val
                  );
                  inputRef.current?.focus();
                }}
              />
            </div>
          </div>
        )
      ) : (
        <ErrorBoundary
          onError={(e) => editor._onError(e as Error)}
          fallback={null}
        >
          <span
            className={cn(
              inline
                ? 'inline-block px-1'
                : 'my-2 block min-h-10 w-full overflow-x-auto py-2 text-center',
              isEditable &&
                'hover:bg-muted/50 cursor-pointer rounded-md transition-colors'
            )}
          >
            <LatexRenderer
              equation={
                equationValue.trim() === ''
                  ? '\\textcolor{gray}{\\text{Double click to edit equation}}'
                  : equationValue
              }
              inline={inline}
              onDoubleClick={() => {
                if (isEditable) {
                  setShowEquationEditor(true);
                }
              }}
            />
          </span>
        </ErrorBoundary>
      )}
    </>
  );
}
