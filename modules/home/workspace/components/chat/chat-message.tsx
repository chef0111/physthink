'use client';

import { memo } from 'react';
import { type UIMessage } from 'ai';
import { ToolCallCard } from './tool-call-card';
import { ChatMarkdownPreview } from './chat-markdown-preview';
import TextShimmer from '@/components/ui/text-shimmer';

const THOUGHT_DURATION_RE = /^Thought for [\d.]+s$/;

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export const ChatMessage = memo(
  function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // "Thought for Xs" marker emitted by extractReasoningMiddleware
    const thoughtDurationText =
      message.parts
        .filter(
          (p): p is { type: 'text'; text: string } =>
            p.type === 'text' &&
            THOUGHT_DURATION_RE.test((p as { text: string }).text?.trim() ?? '')
        )
        .at(0)
        ?.text?.trim() ?? null;

    const hasTextContent = message.parts.some(
      (p) =>
        p.type === 'text' &&
        (p as { text: string }).text &&
        !THOUGHT_DURATION_RE.test((p as { text: string }).text?.trim() ?? '')
    );

    const isThinking =
      isStreaming && !isUser && !hasTextContent && !thoughtDurationText;

    const thoughtDuration = !isUser && thoughtDurationText !== null;

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
            <TextShimmer duration={1}>Processing...</TextShimmer>
          </div>
        )}
        {thoughtDuration && (
          <div className="text-muted-foreground py-1 text-xs">
            {thoughtDurationText}
          </div>
        )}

        {message.parts.map((part, i) => {
          if (part.type === 'text' && part.text) {
            if (THOUGHT_DURATION_RE.test(part.text.trim())) return null;
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
            return null;
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

            const cardKey =
              'toolCallId' in part ? (part.toolCallId as string) : `tool-${i}`;

            if (part.state === 'output-available') {
              return (
                <ToolCallCard
                  key={cardKey}
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
                  key={cardKey}
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
