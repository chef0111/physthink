'use client';

import { type UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { ToolStatus } from './tool-status';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          'flex max-w-[85%] min-w-0 flex-col gap-1',
          isUser && 'items-end'
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === 'text' && part.text) {
            return (
              <div
                key={i}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {part.text}
              </div>
            );
          }
          if (part.type === 'reasoning') {
            return <ReasoningBlock key={i} content={part.text} />;
          }
          if (
            'toolCallId' in part &&
            'state' in part &&
            part.state === 'output-available' &&
            'output' in part
          ) {
            const output = part.output as Record<string, unknown>;
            if (output?.action === 'setStatus') {
              return (
                <ToolStatus
                  key={i}
                  status={(output as { status: string }).status}
                />
              );
            }
            return null;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ReasoningBlock({ content }: { content: string }) {
  return (
    <details className="text-muted-foreground w-full text-xs">
      <summary className="cursor-pointer py-1 font-medium select-none">
        Thinking...
      </summary>
      <div className="border-muted mt-1 border-l-2 pl-3 whitespace-pre-wrap">
        {content}
      </div>
    </details>
  );
}
