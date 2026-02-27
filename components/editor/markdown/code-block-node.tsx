import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { JSX, Suspense } from 'react';

import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
  CodeBlockSelect,
  CodeBlockSelectContent,
  CodeBlockSelectItem,
  CodeBlockSelectTrigger,
  CodeBlockSelectValue,
} from '@/components/code-block';

export type SerializedCodeBlockNode = Spread<
  {
    language: string;
    code: string;
  },
  SerializedLexicalNode
>;

export class CodeBlockNode extends DecoratorNode<JSX.Element> {
  __language: string;
  __code: string;

  static getType(): string {
    return 'code'; // Override 'code' from @lexical/code
  }

  static clone(node: CodeBlockNode): CodeBlockNode {
    return new CodeBlockNode(node.__language, node.__code, node.__key);
  }

  static importJSON(serializedNode: any): CodeBlockNode {
    const language = serializedNode.language || 'text';
    let codeStr = '';

    if (serializedNode.children && Array.isArray(serializedNode.children)) {
      codeStr = serializedNode.children
        .map((child: any) => {
          if (child.type === 'linebreak') {
            return '\n';
          }
          if (child.type === 'tab') {
            return '\t';
          }
          return child.text || '';
        })
        .join('');
    } else {
      codeStr = serializedNode.code || '';
    }

    return new CodeBlockNode(language, codeStr);
  }

  exportJSON(): SerializedCodeBlockNode {
    return {
      language: this.__language,
      code: this.__code,
      type: 'code',
      version: 1,
    };
  }

  constructor(language: string, code: string, key?: NodeKey) {
    super(key);
    this.__language = language;
    this.__code = code;
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    const data = [
      {
        language: this.__language || 'text',
        filename: `code.${this.__language}`,
        code: this.__code,
      },
    ];

    return (
      <div className="my-4">
        <CodeBlock defaultValue={data[0]?.language} data={data}>
          <CodeBlockHeader>
            <CodeBlockFiles>
              {(item) => (
                <div
                  key={item.language}
                  className="px-2 text-xs font-medium opacity-70"
                >
                  {item.language}
                </div>
              )}
            </CodeBlockFiles>
            <CodeBlockCopyButton />
          </CodeBlockHeader>
          <CodeBlockBody>
            {(item) => (
              <CodeBlockItem key={item.language} value={item.language}>
                <Suspense fallback={<div>Loading...</div>}>
                  <CodeBlockContent language={item.language as any}>
                    {item.code}
                  </CodeBlockContent>
                </Suspense>
              </CodeBlockItem>
            )}
          </CodeBlockBody>
        </CodeBlock>
      </div>
    );
  }
}

export function $createCodeBlockNode(
  language: string,
  code: string
): CodeBlockNode {
  return new CodeBlockNode(language, code);
}

export function $isCodeBlockNode(
  node: LexicalNode | null | undefined
): node is CodeBlockNode {
  return node instanceof CodeBlockNode;
}
