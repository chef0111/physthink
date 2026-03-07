'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { type UIMessage } from 'ai';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { ToolCallCard } from './tool-call-card';
import { ChatMarkdownPreview } from './chat-markdown-preview';
import TextShimmer from '@/components/ui/text-shimmer';

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export const ChatMessage = memo(
  function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // Check if the assistant message has any visible text content yet
    const hasTextContent = message.parts.some(
      (p) => p.type === 'text' && p.text
    );
    const isThinking = isStreaming && !isUser && !hasTextContent;

    if (isUser) {
      return (
        <div className="flex justify-end gap-3">
          <div className="flex max-w-[85%] min-w-0 flex-col items-end gap-1">
            {message.parts.map((part, i) =>
              part.type === 'text' && part.text ? (
                <div
                  key={i}
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {part.text}
                </div>
              ) : null
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {isThinking && (
          <div className="text-muted-foreground py-1 text-sm">
            <TextShimmer duration={1.5}>Thinking...</TextShimmer>
          </div>
        )}
        {message.parts.map((part, i) => {
          if (part.type === 'text' && part.text) {
            const isLastPart = i === message.parts.length - 1;
            if (isStreaming && isLastPart) {
              return (
                <div
                  key={i}
                  className="text-foreground text-sm whitespace-pre-wrap"
                >
                  {part.text}
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom" />
                </div>
              );
            }
            return <ChatMarkdownPreview key={i} content={part.text} />;
          }
          if (part.type === 'reasoning') {
            return (
              <ReasoningBlock
                key={i}
                content={part.text}
                isActive={isStreaming && i === message.parts.length - 1}
              />
            );
          }
          if ('toolCallId' in part && 'state' in part) {
            const toolName =
              typeof part.type === 'string' && part.type.startsWith('tool-')
                ? part.type.slice(5)
                : 'toolName' in part
                  ? (part as { toolName: string }).toolName
                  : 'unknownTool';
            const output =
              'output' in part
                ? (part.output as Record<string, unknown>)
                : undefined;
            const input =
              'input' in part
                ? (part.input as Record<string, unknown>)
                : undefined;

            if (part.state === 'output-available') {
              return (
                <ToolCallCard
                  key={i}
                  toolName={toolName}
                  status="complete"
                  args={input}
                  output={output}
                />
              );
            }
            // Tool call in progress (streaming/pending)
            if (
              part.state === 'input-streaming' ||
              part.state === 'input-available'
            ) {
              return (
                <ToolCallCard
                  key={i}
                  toolName={toolName}
                  status={
                    part.state === 'input-streaming' ? 'streaming' : 'pending'
                  }
                  args={input}
                />
              );
            }
            return null;
          }
          return null;
        })}
      </div>
    );
  },

  function areEqual(prev: ChatMessageProps, next: ChatMessageProps) {
    if (prev.message.id !== next.message.id) return false;
    if (prev.isStreaming !== next.isStreaming) return false;
    if (prev.message.parts.length !== next.message.parts.length) return false;
    // If still streaming, always re-render (text is being appended)
    if (next.isStreaming) return false;
    return true;
  }
);

const ReasoningBlock = memo(function ReasoningBlock({
  content,
  isActive,
}: {
  content: string;
  isActive?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayContent, setDisplayContent] = useState(content);

  const debouncedSetContent = useDebouncedCallback(
    (text: string) => setDisplayContent(text),
    300
  );

  useEffect(() => {
    if (isActive) {
      debouncedSetContent(content);
    } else {
      setDisplayContent(content);
    }
  }, [content, isActive, debouncedSetContent]);

  const lines = useMemo(() => displayContent.split('\n'), [displayContent]);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 16,
    overscan: 10,
  });

  // Auto-scroll to bottom during active reasoning
  useEffect(() => {
    if (isActive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayContent, isActive]);

  return (
    <details className="text-muted-foreground w-full text-xs" open={isActive}>
      <summary className="cursor-pointer py-1 font-medium select-none">
        {isActive ? (
          <TextShimmer duration={1.5} className="text-xs">
            Thinking...
          </TextShimmer>
        ) : (
          'Thought process'
        )}
      </summary>
      <div
        ref={scrollRef}
        className="border-muted mt-1 max-h-64 overflow-y-auto border-l-2 pl-3"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.index}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {lines[virtualItem.index] || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
});
