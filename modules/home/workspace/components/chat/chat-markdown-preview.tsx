'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { type BundledLanguage, codeToHtml } from 'shiki';
import { preprocessMath } from '@/lib/utils';

import 'katex/dist/katex.min.css';

interface ChatMarkdownPreviewProps {
  content: string;
}

const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const lang = className?.replace('language-', '') as BundledLanguage;

  useEffect(() => {
    if (!lang || highlighted) return;
    let cancelled = false;
    codeToHtml(code, {
      lang,
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
    }).then((html) => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = html;
      setHighlighted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, highlighted]);

  return (
    <div
      ref={ref}
      className="my-2 overflow-x-auto rounded-md bg-(--shiki-dark-bg,#1e1e1e) p-3 text-xs"
    >
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  code({ className, children, ...props }) {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return (
      <code className="bg-muted rounded px-1 py-0.5 text-[0.85em]" {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="border-border w-full border-collapse border text-sm">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border-border bg-muted border px-3 py-1.5 text-left text-xs font-medium">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-border border px-3 py-1.5 text-sm">{children}</td>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-primary bg-primary/10 text-foreground mt-2 border-l-2 pl-4 italic">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="border-border my-4" />;
  },
};

export const ChatMarkdownPreview = ({ content }: ChatMarkdownPreviewProps) => {
  return (
    <div className="chat-markdown-preview text-foreground prose prose-sm dark:prose-invert max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {preprocessMath(content)}
      </ReactMarkdown>
    </div>
  );
};
